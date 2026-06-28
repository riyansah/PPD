const test = require("node:test");
const assert = require("node:assert/strict");

const { createEnv, parseEnvFile } = require("../backend/src/config/env");

test("parseEnvFile parses comments and quoted values", () => {
  const values = parseEnvFile(`
# comment
PORT=4000
APP_NAME="PPD"
`);

  assert.equal(values.PORT, "4000");
  assert.equal(values.APP_NAME, "PPD");
});

test("createEnv enforces Asia/Jakarta timezone", () => {
  const env = createEnv({ port: "3001", timezone: "Asia/Jakarta" });
  assert.equal(env.port, 3001);
  assert.equal(env.timezone, "Asia/Jakarta");
  assert.equal(env.isProduction, false);
});

test("createEnv rejects unsupported timezone", () => {
  assert.throws(() => createEnv({ timezone: "UTC" }), /Unsupported APP_TIMEZONE/);
});
