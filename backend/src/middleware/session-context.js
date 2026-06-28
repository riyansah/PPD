const { parseCookies } = require("../utils/cookies");
const { createUtcIso } = require("../utils/time");

function createSessionContextMiddleware({ env, sessionRepository, userRepository }) {
  return function sessionContextMiddleware(req, res, next) {
    sessionRepository.deleteExpiredSessions(createUtcIso());

    const cookies = parseCookies(req.headers.cookie || "");
    const sessionId = cookies[env.sessionCookieName];

    req.sessionContext = {
      sessionId: sessionId || null,
      session: null,
      user: null
    };

    if (!sessionId) {
      next();
      return;
    }

    const session = sessionRepository.findSession(sessionId);
    if (!session) {
      next();
      return;
    }

    const now = new Date();
    const nowIso = createUtcIso(now);

    if (session.expires_at <= nowIso || session.idle_expires_at <= nowIso) {
      sessionRepository.deleteSession(sessionId);
      next();
      return;
    }

    const idleExpiresAt = createUtcIso(
      new Date(now.getTime() + env.sessionIdleTtlSeconds * 1000)
    );
    sessionRepository.touchSession(sessionId, nowIso, idleExpiresAt);

    const user = userRepository.findById(session.user_id);
    if (!user) {
      sessionRepository.deleteSession(sessionId);
      next();
      return;
    }

    req.sessionContext = {
      sessionId,
      session: {
        id: session.id,
        user_id: Number(session.user_id),
        created_at: session.created_at,
        expires_at: session.expires_at,
        idle_expires_at: idleExpiresAt
      },
      user
    };

    next();
  };
}

module.exports = {
  createSessionContextMiddleware
};
