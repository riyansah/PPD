function createSessionRepository(db) {
  const insertStatement = db.prepare(`
    INSERT INTO sessions (id, user_id, ip_address, user_agent, created_at, last_seen_at, expires_at, idle_expires_at)
    VALUES (@id, @user_id, @ip_address, @user_agent, @created_at, @last_seen_at, @expires_at, @idle_expires_at)
  `);
  const findStatement = db.prepare(`
    SELECT id, user_id, ip_address, user_agent, created_at, last_seen_at, expires_at, idle_expires_at
    FROM sessions
    WHERE id = ?
    LIMIT 1
  `);
  const updateTouchStatement = db.prepare(`
    UPDATE sessions
    SET last_seen_at = ?, idle_expires_at = ?
    WHERE id = ?
  `);
  const deleteStatement = db.prepare("DELETE FROM sessions WHERE id = ?");
  const deleteByUserStatement = db.prepare("DELETE FROM sessions WHERE user_id = ?");
  const deleteOtherUserSessionsStatement = db.prepare(
    "DELETE FROM sessions WHERE user_id = ? AND id != ?"
  );
  const deleteExpiredStatement = db.prepare(`
    DELETE FROM sessions
    WHERE expires_at <= ? OR idle_expires_at <= ?
  `);

  return {
    createSession(input) {
      insertStatement.run(input);
    },
    deleteExpiredSessions(nowIso) {
      deleteExpiredStatement.run(nowIso, nowIso);
    },
    deleteOtherSessionsForUser(userId, currentSessionId) {
      deleteOtherUserSessionsStatement.run(userId, currentSessionId);
    },
    deleteSession(sessionId) {
      deleteStatement.run(sessionId);
    },
    deleteSessionsForUser(userId) {
      deleteByUserStatement.run(userId);
    },
    findSession(sessionId) {
      return findStatement.get(sessionId) || null;
    },
    touchSession(sessionId, lastSeenAt, idleExpiresAt) {
      updateTouchStatement.run(lastSeenAt, idleExpiresAt, sessionId);
    }
  };
}

module.exports = {
  createSessionRepository
};
