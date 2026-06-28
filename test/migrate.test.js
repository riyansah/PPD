const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const { createDatabaseConnection } = require("../backend/src/db/client");
const { runMigrations } = require("../backend/src/db/migrate");
const { createLogger } = require("../backend/src/utils/logger");

test("runMigrations creates the initial schema from an empty database", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ppd-migrate-"));
  const databasePath = path.join(tempDir, "test.sqlite");

  runMigrations({
    databasePath,
    logger: createLogger({ level: "error" })
  });

  const db = createDatabaseConnection(databasePath);
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name ASC")
    .all()
    .map((row) => row.name);

  assert.ok(tables.includes("users"));
  assert.ok(tables.includes("tasks"));
  assert.ok(tables.includes("activities"));
  assert.ok(tables.includes("routines"));
  assert.ok(tables.includes("routine_histories"));
  assert.ok(tables.includes("notifications"));
  assert.ok(tables.includes("settings"));
  assert.ok(tables.includes("schema_migrations"));

  db.close();
});
