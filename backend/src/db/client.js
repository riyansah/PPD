const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

function ensureDatabaseDirectory(databasePath) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
}

function createDatabaseConnection(databasePath) {
  ensureDatabaseDirectory(databasePath);
  const db = new Database(databasePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

module.exports = {
  createDatabaseConnection,
  ensureDatabaseDirectory
};
