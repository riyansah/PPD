const crypto = require("node:crypto");
const { AppError } = require("../errors/app-error");
const { createUtcIso } = require("../utils/time");
const { hashPassword, verifyPassword } = require("../utils/passwords");
const {
  normalizeLoginIdentifier,
  validateLoginInput,
  validatePasswordChangeInput,
  validateSetupInput
} = require("../utils/auth-validation");

function addSeconds(date, seconds) {
  return new Date(date.getTime() + seconds * 1000);
}

function createValidationError(errors) {
  const error = new AppError("Validation failed.", {
    statusCode: 422,
    code: "VALIDATION_ERROR"
  });
  error.details = errors;
  return error;
}

function createAuthService({
  env,
  db,
  logger,
  userRepository,
  sessionRepository,
  loginRateLimitRepository
}) {
  function toSafeUser(user) {
    return {
      id: Number(user.id),
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      theme: user.theme,
      timezone: user.timezone,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }

  function assertSingleUserNotConfigured() {
    if (userRepository.countUsers() > 0) {
      throw new AppError("Initial account has already been created.", {
        statusCode: 409,
        code: "ACCOUNT_SETUP_ALREADY_COMPLETED"
      });
    }
  }

  async function setupInitialAccount(input) {
    const username = normalizeLoginIdentifier(input.username);
    const email = normalizeLoginIdentifier(input.email);
    const displayName = String(input.displayName || "").trim();
    const password = input.password;
    const validationErrors = validateSetupInput({
      username,
      email,
      displayName,
      password
    });

    if (validationErrors.length > 0) {
      throw createValidationError(validationErrors);
    }

    assertSingleUserNotConfigured();

    const now = createUtcIso();
    const passwordHash = await hashPassword(password);
    const createUserTransaction = db.transaction(() => {
      const userId = userRepository.createUser({
        username,
        email,
        password_hash: passwordHash,
        display_name: displayName,
        theme: "system",
        timezone: "Asia/Jakarta",
        created_at: now,
        updated_at: now
      });

      db.prepare(`
        INSERT INTO settings (
          user_id,
          theme,
          browser_notifications_enabled,
          in_app_notifications_enabled,
          reminder_minutes_before,
          created_at,
          updated_at
        ) VALUES (?, ?, 0, 1, 15, ?, ?)
      `).run(userId, "system", now, now);

      return userId;
    });

    const userId = createUserTransaction();
    const user = userRepository.findById(userId);
    logger.info("initial_account_created", {
      user_id: Number(userId),
      username
    });
    return toSafeUser(user);
  }

  function getClientIp(request) {
    const forwardedHeader = request.headers["x-forwarded-for"];
    if (typeof forwardedHeader === "string" && forwardedHeader.trim()) {
      return forwardedHeader.split(",")[0].trim();
    }

    return request.socket.remoteAddress || "unknown";
  }

  function getRateLimitState(loginIdentifier, ipAddress, now) {
    const record = loginRateLimitRepository.find(loginIdentifier, ipAddress);
    if (!record) {
      return {
        record: null,
        blocked: false
      };
    }

    const windowMs = env.loginRateLimitWindowMinutes * 60 * 1000;
    const windowStart = new Date(record.window_started_at).getTime();
    const nowMs = now.getTime();

    if (Number.isNaN(windowStart) || nowMs - windowStart >= windowMs) {
      loginRateLimitRepository.clear(loginIdentifier, ipAddress);
      return {
        record: null,
        blocked: false
      };
    }

    return {
      record,
      blocked: record.failed_count >= env.loginRateLimitMaxAttempts,
      retryAt: new Date(windowStart + windowMs).toISOString()
    };
  }

  function recordFailedLogin(loginIdentifier, ipAddress, nowIso) {
    const now = new Date(nowIso);
    const state = getRateLimitState(loginIdentifier, ipAddress, now);

    if (!state.record) {
      loginRateLimitRepository.save({
        login_identifier: loginIdentifier,
        ip_address: ipAddress,
        failed_count: 1,
        window_started_at: nowIso,
        last_failed_at: nowIso
      });
      return;
    }

    loginRateLimitRepository.save({
      id: state.record.id,
      login_identifier: loginIdentifier,
      ip_address: ipAddress,
      failed_count: state.record.failed_count + 1,
      window_started_at: state.record.window_started_at,
      last_failed_at: nowIso
    });
  }

  function buildSessionTimestamps(now = new Date()) {
    return {
      createdAt: createUtcIso(now),
      lastSeenAt: createUtcIso(now),
      expiresAt: createUtcIso(addSeconds(now, env.sessionAbsoluteTtlSeconds)),
      idleExpiresAt: createUtcIso(addSeconds(now, env.sessionIdleTtlSeconds))
    };
  }

  function createSessionForUser({ userId, request }) {
    const now = new Date();
    const sessionId = crypto.randomUUID();
    const timestamps = buildSessionTimestamps(now);

    sessionRepository.createSession({
      id: sessionId,
      user_id: userId,
      ip_address: getClientIp(request),
      user_agent: String(request.headers["user-agent"] || "").slice(0, 512),
      created_at: timestamps.createdAt,
      last_seen_at: timestamps.lastSeenAt,
      expires_at: timestamps.expiresAt,
      idle_expires_at: timestamps.idleExpiresAt
    });

    return {
      id: sessionId,
      expires_at: timestamps.expiresAt,
      idle_expires_at: timestamps.idleExpiresAt
    };
  }

  async function login({ login, password, request, currentSessionId }) {
    const validationErrors = validateLoginInput({ login, password });
    if (validationErrors.length > 0) {
      throw createValidationError(validationErrors);
    }

    const loginIdentifier = normalizeLoginIdentifier(login);
    const ipAddress = getClientIp(request);
    const now = new Date();
    const rateLimitState = getRateLimitState(loginIdentifier, ipAddress, now);

    if (rateLimitState.blocked) {
      logger.warn("login_rate_limited", {
        request_id: request.requestId,
        login_identifier: loginIdentifier,
        ip_address: ipAddress
      });
      const error = new AppError("Too many login attempts. Please try again later.", {
        statusCode: 429,
        code: "RATE_LIMITED"
      });
      error.meta = {
        retry_at: rateLimitState.retryAt
      };
      throw error;
    }

    const user = userRepository.findByLogin(loginIdentifier);
    const passwordMatches = user ? await verifyPassword(password, user.password_hash) : false;

    if (!user || !passwordMatches) {
      const nowIso = createUtcIso(now);
      recordFailedLogin(loginIdentifier, ipAddress, nowIso);
      logger.warn("login_failed", {
        request_id: request.requestId,
        login_identifier: loginIdentifier,
        ip_address: ipAddress
      });
      throw new AppError("Invalid login credentials.", {
        statusCode: 401,
        code: "INVALID_CREDENTIALS"
      });
    }

    loginRateLimitRepository.clear(loginIdentifier, ipAddress);
    const loginTimestamp = createUtcIso(now);
    userRepository.touchLastLogin(user.id, loginTimestamp);

    if (currentSessionId) {
      sessionRepository.deleteSession(currentSessionId);
    }

    const session = createSessionForUser({
      userId: user.id,
      request
    });

    logger.info("login_succeeded", {
      request_id: request.requestId,
      user_id: Number(user.id),
      ip_address: ipAddress
    });

    return {
      user: toSafeUser({
        ...user,
        last_login_at: loginTimestamp,
        updated_at: loginTimestamp
      }),
      session
    };
  }

  function logout(sessionId) {
    if (sessionId) {
      sessionRepository.deleteSession(sessionId);
    }
  }

  async function changePassword({
    userId,
    currentSessionId,
    currentPassword,
    newPassword,
    confirmPassword,
    request
  }) {
    const validationErrors = validatePasswordChangeInput({
      currentPassword,
      newPassword,
      confirmPassword
    });

    if (validationErrors.length > 0) {
      throw createValidationError(validationErrors);
    }

    const userRecord = db
      .prepare("SELECT id, password_hash FROM users WHERE id = ? LIMIT 1")
      .get(userId);

    if (!userRecord || !(await verifyPassword(currentPassword, userRecord.password_hash))) {
      throw new AppError("Current password is incorrect.", {
        statusCode: 401,
        code: "INVALID_CURRENT_PASSWORD"
      });
    }

    const newHash = await hashPassword(newPassword);
    const updatedAt = createUtcIso();

    const transaction = db.transaction(() => {
      userRepository.updatePassword(userId, newHash, updatedAt);
      if (currentSessionId) {
        sessionRepository.deleteOtherSessionsForUser(userId, currentSessionId);
      } else {
        sessionRepository.deleteSessionsForUser(userId);
      }
    });

    transaction();
    logger.info("password_changed", {
      request_id: request.requestId,
      user_id: Number(userId)
    });
  }

  return {
    changePassword,
    login,
    logout,
    setupInitialAccount,
    toSafeUser
  };
}

module.exports = {
  createAuthService
};
