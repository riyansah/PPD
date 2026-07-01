const { loadEnvFile, createEnv } = require("./config/env");
const { createLogger } = require("./utils/logger");
const { createDatabaseConnection } = require("./db/client");
const { runMigrations } = require("./db/migrate");
const { createApp } = require("./app");

loadEnvFile();

const env = createEnv();
const logger = createLogger({ level: env.logLevel });

runMigrations({ databasePath: env.databasePath, logger });

const db = createDatabaseConnection(env.databasePath);
const app = createApp({ env, db, logger });

const server = app.listen(env.port, () => {
  logger.info("server_started", {
    port: env.port,
    environment: env.nodeEnv,
    database_path: env.databasePath
  });
});

function shutdown(signal) {
  logger.info("server_stopping", { signal });
  server.close(() => {
    if (app.locals.jobs && app.locals.jobs.routineReconciliation) {
      app.locals.jobs.routineReconciliation.stop();
    }
    db.close();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
