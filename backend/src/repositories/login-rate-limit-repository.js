function createLoginRateLimitRepository(db) {
  const findStatement = db.prepare(`
    SELECT id, login_identifier, ip_address, failed_count, window_started_at, last_failed_at
    FROM login_rate_limits
    WHERE login_identifier = ? AND ip_address = ?
    LIMIT 1
  `);
  const insertStatement = db.prepare(`
    INSERT INTO login_rate_limits (login_identifier, ip_address, failed_count, window_started_at, last_failed_at)
    VALUES (@login_identifier, @ip_address, @failed_count, @window_started_at, @last_failed_at)
  `);
  const updateStatement = db.prepare(`
    UPDATE login_rate_limits
    SET failed_count = @failed_count, window_started_at = @window_started_at, last_failed_at = @last_failed_at
    WHERE id = @id
  `);
  const deleteStatement = db.prepare(`
    DELETE FROM login_rate_limits
    WHERE login_identifier = ? AND ip_address = ?
  `);

  return {
    clear(loginIdentifier, ipAddress) {
      deleteStatement.run(loginIdentifier, ipAddress);
    },
    find(loginIdentifier, ipAddress) {
      return findStatement.get(loginIdentifier, ipAddress) || null;
    },
    save(record) {
      if (record.id) {
        updateStatement.run(record);
        return record.id;
      }

      const result = insertStatement.run(record);
      return result.lastInsertRowid;
    }
  };
}

module.exports = {
  createLoginRateLimitRepository
};
