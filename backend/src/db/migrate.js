const fs = require("node:fs");
const path = require("node:path");
const { loadEnvFile, createEnv } = require("../config/env");
const { createDatabaseConnection } = require("./client");
const { createLogger } = require("../utils/logger");

const migrationsDir = path.resolve(__dirname, "migrations");

function listMigrationFiles() {
  return fs
    .readdirSync(migrationsDir)
    .filter((entry) => entry.endsWith(".sql"))
    .sort();
}

function runMigrations({ databasePath, logger = createLogger() }) {
  const db = createDatabaseConnection(databasePath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = new Set(
    db.prepare("SELECT name FROM schema_migrations ORDER BY id ASC").all().map((row) => row.name)
  );

  const files = listMigrationFiles();
  const inserted = db.prepare(
    "INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)"
  );

  const migrate = db.transaction(() => {
    for (const file of files) {
      if (applied.has(file)) {
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      db.exec(sql);
      inserted.run(file, new Date().toISOString());
      logger.info("migration_applied", { migration: file, database_path: databasePath });
    }
  });

  migrate();

  const appliedMigrations = db
    .prepare("SELECT name, applied_at FROM schema_migrations ORDER BY id ASC")
    .all();

  db.close();
  return appliedMigrations;
}

if (require.main === module) {
  loadEnvFile();
  const env = createEnv();
  const logger = createLogger({ level: env.logLevel });
  const results = runMigrations({ databasePath: env.databasePath, logger });
  logger.info("migration_run_completed", {
    database_path: env.databasePath,
    applied_count: results.length
  });
}

module.exports = {
  listMigrationFiles,
  runMigrations
};
