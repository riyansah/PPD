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
      (value.startsWith("'") && value.endsWith("'"))
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
    backupDir: overrides.backupDir || process.env.BACKUP_DIR || "backend/data/backups"
  };

  const env = {
    nodeEnv: raw.nodeEnv,
    isProduction: raw.nodeEnv === "production",
    port: Number(raw.port),
    appName: raw.appName,
    timezone: raw.timezone,
    logLevel: raw.logLevel,
    databasePath: toAbsolutePath(raw.databasePath),
    backupDir: toAbsolutePath(raw.backupDir)
  };

  if (!Number.isInteger(env.port) || env.port <= 0) {
    throw new Error(`Invalid PORT value: ${raw.port}`);
  }

  if (env.timezone !== "Asia/Jakarta") {
    throw new Error(`Unsupported APP_TIMEZONE value: ${env.timezone}`);
  }

  return env;
}

module.exports = {
  createEnv,
  loadEnvFile,
  parseEnvFile
};
