const fs = require("node:fs");
const path = require("node:path");
const { resolveFromRoot } = require("./paths");

function parseEnvFile(content) {
  const values = {};

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith(") && value.endsWith("))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function loadEnvFile(filePath = resolveFromRoot(".env")) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const values = parseEnvFile(fs.readFileSync(filePath, "utf8"));

  for (const [key, value] of Object.entries(values)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return values;
}

function toAbsolutePath(inputPath) {
  if (!inputPath) {
    return inputPath;
  }

  if (path.isAbsolute(inputPath)) {
    return inputPath;
  }

  return resolveFromRoot(inputPath);
}

function createEnv(overrides = {}) {
  const raw = {
    nodeEnv: overrides.nodeEnv || process.env.NODE_ENV || "development",
    port: overrides.port || process.env.PORT || "3000",
    appName: overrides.appName || process.env.APP_NAME || "Personal Productivity Dashboard",
    timezone: overrides.timezone || process.env.APP_TIMEZONE || "Asia/Jakarta",
    logLevel: overrides.logLevel || process.env.LOG_LEVEL || "info",
    databasePath: overrides.databasePath || process.env.DATABASE_PATH || "backend/data/app.sqlite",
    backupDir: overrides.backupDir || process.env.BACKUP_DIR || "backend/data/backups",
    sessionCookieName:
      overrides.sessionCookieName || process.env.SESSION_COOKIE_NAME || "ppd_sid",
    sessionAbsoluteTtlSeconds:
      overrides.sessionAbsoluteTtlSeconds ||
      process.env.SESSION_ABSOLUTE_TTL_SECONDS ||
      "604800",
    sessionIdleTtlSeconds:
      overrides.sessionIdleTtlSeconds || process.env.SESSION_IDLE_TTL_SECONDS || "86400",
    loginRateLimitMaxAttempts:
      overrides.loginRateLimitMaxAttempts ||
      process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS ||
      "5",
    loginRateLimitWindowMinutes:
      overrides.loginRateLimitWindowMinutes ||
      process.env.LOGIN_RATE_LIMIT_WINDOW_MINUTES ||
      "15",
    setupUsername: overrides.setupUsername || process.env.SETUP_USERNAME || "",
    setupEmail: overrides.setupEmail || process.env.SETUP_EMAIL || "",
    setupDisplayName: overrides.setupDisplayName || process.env.SETUP_DISPLAY_NAME || "",
    setupPassword: overrides.setupPassword || process.env.SETUP_PASSWORD || ""
  };

  const env = {
    nodeEnv: raw.nodeEnv,
    isProduction: raw.nodeEnv === "production",
    port: Number(raw.port),
    appName: raw.appName,
    timezone: raw.timezone,
    logLevel: raw.logLevel,
    databasePath: toAbsolutePath(raw.databasePath),
    backupDir: toAbsolutePath(raw.backupDir),
    sessionCookieName: raw.sessionCookieName,
    sessionAbsoluteTtlSeconds: Number(raw.sessionAbsoluteTtlSeconds),
    sessionIdleTtlSeconds: Number(raw.sessionIdleTtlSeconds),
    loginRateLimitMaxAttempts: Number(raw.loginRateLimitMaxAttempts),
    loginRateLimitWindowMinutes: Number(raw.loginRateLimitWindowMinutes),
    setupUsername: raw.setupUsername,
    setupEmail: raw.setupEmail,
    setupDisplayName: raw.setupDisplayName,
    setupPassword: raw.setupPassword
  };

  if (!Number.isInteger(env.port) || env.port <= 0) {
    throw new Error(`Invalid PORT value: ${raw.port}`);
  }

  if (env.timezone !== "Asia/Jakarta") {
    throw new Error(`Unsupported APP_TIMEZONE value: ${env.timezone}`);
  }

  if (!env.sessionCookieName) {
    throw new Error("SESSION_COOKIE_NAME must not be empty.");
  }

  if (!Number.isInteger(env.sessionAbsoluteTtlSeconds) || env.sessionAbsoluteTtlSeconds <= 0) {
    throw new Error(
      `Invalid SESSION_ABSOLUTE_TTL_SECONDS value: ${raw.sessionAbsoluteTtlSeconds}`
    );
  }

  if (!Number.isInteger(env.sessionIdleTtlSeconds) || env.sessionIdleTtlSeconds <= 0) {
    throw new Error(`Invalid SESSION_IDLE_TTL_SECONDS value: ${raw.sessionIdleTtlSeconds}`);
  }

  if (
    !Number.isInteger(env.loginRateLimitMaxAttempts) ||
    env.loginRateLimitMaxAttempts <= 0
  ) {
    throw new Error(
      `Invalid LOGIN_RATE_LIMIT_MAX_ATTEMPTS value: ${raw.loginRateLimitMaxAttempts}`
    );
  }

  if (
    !Number.isInteger(env.loginRateLimitWindowMinutes) ||
    env.loginRateLimitWindowMinutes <= 0
  ) {
    throw new Error(
      `Invalid LOGIN_RATE_LIMIT_WINDOW_MINUTES value: ${raw.loginRateLimitWindowMinutes}`
    );
  }

  return env;
}

module.exports = {
  createEnv,
  loadEnvFile,
  parseEnvFile
};
