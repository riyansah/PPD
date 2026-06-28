function createUserRepository(db) {
  const findByLoginStatement = db.prepare(`
    SELECT id, username, email, password_hash, display_name, theme, timezone, last_login_at, created_at, updated_at
    FROM users
    WHERE username = ? OR email = ?
    LIMIT 1
  `);
  const createStatement = db.prepare(`
    INSERT INTO users (username, email, password_hash, display_name, theme, timezone, created_at, updated_at)
    VALUES (@username, @email, @password_hash, @display_name, @theme, @timezone, @created_at, @updated_at)
  `);
  const findByIdStatement = db.prepare(`
    SELECT id, username, email, display_name, theme, timezone, last_login_at, created_at, updated_at
    FROM users
    WHERE id = ?
    LIMIT 1
  `);
  const countStatement = db.prepare("SELECT COUNT(*) AS count FROM users");
  const updateLastLoginStatement = db.prepare(`
    UPDATE users
    SET last_login_at = ?, updated_at = ?
    WHERE id = ?
  `);
  const updatePasswordStatement = db.prepare(`
    UPDATE users
    SET password_hash = ?, updated_at = ?
    WHERE id = ?
  `);

  return {
    countUsers() {
      return countStatement.get().count;
    },
    createUser(input) {
      const result = createStatement.run(input);
      return result.lastInsertRowid;
    },
    findById(id) {
      return findByIdStatement.get(id) || null;
    },
    findByLogin(loginIdentifier) {
      return findByLoginStatement.get(loginIdentifier, loginIdentifier) || null;
    },
    touchLastLogin(userId, timestamp) {
      updateLastLoginStatement.run(timestamp, timestamp, userId);
    },
    updatePassword(userId, passwordHash, timestamp) {
      updatePasswordStatement.run(passwordHash, timestamp, userId);
    }
  };
}

module.exports = {
  createUserRepository
};
