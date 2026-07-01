const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const { createApp } = require("../../backend/src/app");
const { createEnv } = require("../../backend/src/config/env");
const { createDatabaseConnection } = require("../../backend/src/db/client");
const { runMigrations } = require("../../backend/src/db/migrate");
const { createLogger } = require("../../backend/src/utils/logger");
const { createUserRepository } = require("../../backend/src/repositories/user-repository");
const { createSessionRepository } = require("../../backend/src/repositories/session-repository");
const { createLoginRateLimitRepository } = require("../../backend/src/repositories/login-rate-limit-repository");
const { createAuthService } = require("../../backend/src/services/auth-service");

function parseSetCookie(setCookieHeader) {
  const values = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  return values.filter(Boolean).map((entry) => {
    const [cookie, ...attributes] = entry.split(";").map((part) => part.trim());
    return {
      cookie,
      attributes
    };
  });
}

function request(server, { method = "GET", path: route = "/", body, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const address = server.address();
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: address.port,
        path: route,
        method,
        headers: {
          ...(payload
            ? {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload)
              }
            : {}),
          ...headers
        }
      },
      (res) => {
        let responseBody = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          responseBody += chunk;
        });
        res.on("end", () => {
          let json = null;
          try {
            json = responseBody ? JSON.parse(responseBody) : null;
          } catch (error) {
            json = null;
          }

          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseBody,
            json,
            cookies: parseSetCookie(res.headers["set-cookie"])
          });
        });
      }
    );

    req.on("error", reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function createHarness(options = {}) {
  const { nowProvider, ...envOverrides } = options;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ppd-auth-"));
  const databasePath = path.join(tempDir, "app.sqlite");
  const env = createEnv({
    nodeEnv: envOverrides.nodeEnv || "test",
    port: "3001",
    appName: "PPD",
    timezone: "Asia/Jakarta",
    logLevel: "error",
    databasePath,
    backupDir: path.join(tempDir, "backups"),
    ...envOverrides
  });
  const logger = createLogger({ level: "error" });
  runMigrations({ databasePath, logger });
  const db = createDatabaseConnection(databasePath);
  const authService = createAuthService({
    env,
    db,
    logger,
    userRepository: createUserRepository(db),
    sessionRepository: createSessionRepository(db),
    loginRateLimitRepository: createLoginRateLimitRepository(db)
  });
  const app = createApp({ env, db, logger, nowProvider });
  const server = app.listen(0);

  return {
    authService,
    db,
    env,
    server,
    async close() {
      await new Promise((resolve) => server.close(resolve));
      db.close();
    }
  };
}

module.exports = {
  createHarness,
  parseSetCookie,
  request
};
