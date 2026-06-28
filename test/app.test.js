const test = require("node:test");
const assert = require("node:assert/strict");
const { createHarness, request } = require("./helpers/auth-test-utils");

test("app serves health, login page, and redirects unauthenticated shell access", async () => {
  const harness = await createHarness();

  try {
    const health = await request(harness.server, { path: "/api/health" });
    assert.equal(health.statusCode, 200);
    assert.equal(health.json.data.status, "ok");
    assert.equal(health.json.meta.timezone, "Asia/Jakarta");
    assert.match(health.headers["x-request-id"], /^[0-9a-f-]{36}$/u);

    const loginPage = await request(harness.server, { path: "/login" });
    assert.equal(loginPage.statusCode, 200);
    assert.match(loginPage.body, /<h2>Login<\/h2>/u);

    const shell = await request(harness.server, { path: "/" });
    assert.equal(shell.statusCode, 302);
    assert.match(shell.headers.location, /^\/login\?next=%2F/u);
  } finally {
    await harness.close();
  }
});
