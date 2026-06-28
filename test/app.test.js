const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");

const { createApp } = require("../backend/src/app");
const { createDatabaseConnection } = require("../backend/src/db/client");
const { runMigrations } = require("../backend/src/db/migrate");
const { createLogger } = require("../backend/src/utils/logger");

function requestJson(server, route) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: address.port,
        path: route,
        method: "GET"
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body
          });
        });
      }
    );

    req.on("error", reject);
    req.end();
  });
}

test("app serves health and shell routes", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ppd-app-"));
  const databasePath = path.join(tempDir, "app.sqlite");
  runMigrations({ databasePath, logger: createLogger({ level: "error" }) });

  const db = createDatabaseConnection(databasePath);
  const app = createApp({
    env: {
      appName: "PPD",
      nodeEnv: "test",
      timezone: "Asia/Jakarta"
    },
    db,
    logger: createLogger({ level: "error" })
  });

  const server = app.listen(0);

  try {
    const health = await requestJson(server, "/api/health");
    assert.equal(health.statusCode, 200);
    const payload = JSON.parse(health.body);
    assert.equal(payload.data.status, "ok");
    assert.equal(payload.meta.timezone, "Asia/Jakarta");
    assert.match(health.headers["x-request-id"], /^[0-9a-f-]{36}$/u);

    const shell = await requestJson(server, "/");
    assert.equal(shell.statusCode, 200);
    assert.match(shell.body, /Productivity Dashboard/u);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    db.close();
  }
});
