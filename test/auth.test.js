const test = require("node:test");
const assert = require("node:assert/strict");
const { createHarness, request } = require("./helpers/auth-test-utils");

async function setupDefaultUser(harness) {
  return harness.authService.setupInitialAccount({
    username: "owner",
    email: "owner@example.com",
    displayName: "Owner",
    password: "Secure123"
  });
}

async function login(harness, credentials, cookie = "") {
  return request(harness.server, {
    method: "POST",
    path: "/api/auth/login",
    body: credentials,
    headers: cookie ? { Cookie: cookie } : {}
  });
}

test("initial account setup succeeds once and rejects repetition", async () => {
  const harness = await createHarness();

  try {
    const user = await setupDefaultUser(harness);
    assert.equal(user.username, "owner");

    await assert.rejects(
      () =>
        harness.authService.setupInitialAccount({
          username: "owner2",
          email: "owner2@example.com",
          displayName: "Owner 2",
          password: "Secure123"
        }),
      (error) => error.code === "ACCOUNT_SETUP_ALREADY_COMPLETED"
    );
  } finally {
    await harness.close();
  }
});

test("valid login succeeds and invalid login fails generically", async () => {
  const harness = await createHarness();

  try {
    await setupDefaultUser(harness);

    const invalid = await login(harness, {
      login: "owner",
      password: "wrong123"
    });
    assert.equal(invalid.statusCode, 401);
    assert.equal(invalid.json.errors[0].code, "INVALID_CREDENTIALS");

    const valid = await login(harness, {
      login: "OWNER@example.com",
      password: "Secure123"
    });
    assert.equal(valid.statusCode, 200);
    assert.equal(valid.json.data.user.username, "owner");
    assert.match(valid.cookies[0].cookie, /^ppd_sid=/u);
  } finally {
    await harness.close();
  }
});

test("session endpoint returns authenticated account and rejects unauthenticated access", async () => {
  const harness = await createHarness();

  try {
    await setupDefaultUser(harness);
    const loggedIn = await login(harness, {
      login: "owner",
      password: "Secure123"
    });
    const cookie = loggedIn.cookies[0].cookie;

    const session = await request(harness.server, {
      path: "/api/auth/session",
      headers: { Cookie: cookie }
    });
    assert.equal(session.statusCode, 200);
    assert.equal(session.json.data.authenticated, true);
    assert.equal(session.json.data.user.email, "owner@example.com");

    const unauthenticated = await request(harness.server, {
      path: "/api/auth/session"
    });
    assert.equal(unauthenticated.statusCode, 401);
    assert.equal(unauthenticated.json.errors[0].code, "UNAUTHENTICATED");
  } finally {
    await harness.close();
  }
});

test("logout invalidates the current session", async () => {
  const harness = await createHarness();

  try {
    await setupDefaultUser(harness);
    const loggedIn = await login(harness, {
      login: "owner",
      password: "Secure123"
    });
    const cookie = loggedIn.cookies[0].cookie;

    const logoutResponse = await request(harness.server, {
      method: "POST",
      path: "/api/auth/logout",
      headers: { Cookie: cookie }
    });
    assert.equal(logoutResponse.statusCode, 200);
    assert.equal(logoutResponse.json.data.logged_out, true);

    const session = await request(harness.server, {
      path: "/api/auth/session",
      headers: { Cookie: cookie }
    });
    assert.equal(session.statusCode, 401);
  } finally {
    await harness.close();
  }
});

test("password change enforces current password and rotates login credentials", async () => {
  const harness = await createHarness();

  try {
    await setupDefaultUser(harness);
    const loggedIn = await login(harness, {
      login: "owner",
      password: "Secure123"
    });
    const cookie = loggedIn.cookies[0].cookie;

    const invalidChange = await request(harness.server, {
      method: "PUT",
      path: "/api/auth/password",
      headers: { Cookie: cookie },
      body: {
        current_password: "Wrong123",
        new_password: "NewSecure123",
        confirm_password: "NewSecure123"
      }
    });
    assert.equal(invalidChange.statusCode, 401);
    assert.equal(invalidChange.json.errors[0].code, "INVALID_CURRENT_PASSWORD");

    const validChange = await request(harness.server, {
      method: "PUT",
      path: "/api/auth/password",
      headers: { Cookie: cookie },
      body: {
        current_password: "Secure123",
        new_password: "NewSecure123",
        confirm_password: "NewSecure123"
      }
    });
    assert.equal(validChange.statusCode, 200);
    assert.equal(validChange.json.data.updated, true);

    const oldPassword = await login(harness, {
      login: "owner",
      password: "Secure123"
    });
    assert.equal(oldPassword.statusCode, 401);

    const newPassword = await login(harness, {
      login: "owner",
      password: "NewSecure123"
    });
    assert.equal(newPassword.statusCode, 200);
  } finally {
    await harness.close();
  }
});

test("login rate limiting activates for repeated failures", async () => {
  const harness = await createHarness({
    loginRateLimitMaxAttempts: "2",
    loginRateLimitWindowMinutes: "15"
  });

  try {
    await setupDefaultUser(harness);

    const first = await login(harness, {
      login: "owner",
      password: "wrong123"
    });
    assert.equal(first.statusCode, 401);

    const second = await login(harness, {
      login: "OWNER",
      password: "wrong123"
    });
    assert.equal(second.statusCode, 401);

    const third = await login(harness, {
      login: "owner",
      password: "wrong123"
    });
    assert.equal(third.statusCode, 429);
    assert.equal(third.json.errors[0].code, "RATE_LIMITED");
  } finally {
    await harness.close();
  }
});

test("session cookie attributes match environment security settings", async () => {
  const testHarness = await createHarness();
  const prodHarness = await createHarness({ nodeEnv: "production" });

  try {
    await setupDefaultUser(testHarness);
    await setupDefaultUser(prodHarness);

    const testLogin = await login(testHarness, {
      login: "owner",
      password: "Secure123"
    });
    const testAttributes = testLogin.cookies[0].attributes.join(";");
    assert.match(testAttributes, /HttpOnly/u);
    assert.match(testAttributes, /SameSite=Lax/u);
    assert.doesNotMatch(testAttributes, /Secure/u);

    const prodLogin = await login(prodHarness, {
      login: "owner",
      password: "Secure123"
    });
    const prodAttributes = prodLogin.cookies[0].attributes.join(";");
    assert.match(prodAttributes, /HttpOnly/u);
    assert.match(prodAttributes, /SameSite=Lax/u);
    assert.match(prodAttributes, /Secure/u);
  } finally {
    await testHarness.close();
    await prodHarness.close();
  }
});

test("idle session expiration is enforced", async () => {
  const harness = await createHarness({
    sessionAbsoluteTtlSeconds: "10",
    sessionIdleTtlSeconds: "1"
  });

  try {
    await setupDefaultUser(harness);
    const loggedIn = await login(harness, {
      login: "owner",
      password: "Secure123"
    });
    const cookie = loggedIn.cookies[0].cookie;

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const session = await request(harness.server, {
      path: "/api/auth/session",
      headers: { Cookie: cookie }
    });
    assert.equal(session.statusCode, 401);
  } finally {
    await harness.close();
  }
});

test("absolute session expiration is enforced", async () => {
  const harness = await createHarness({
    sessionAbsoluteTtlSeconds: "1",
    sessionIdleTtlSeconds: "10"
  });

  try {
    await setupDefaultUser(harness);
    const loggedIn = await login(harness, {
      login: "owner",
      password: "Secure123"
    });
    const cookie = loggedIn.cookies[0].cookie;

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const session = await request(harness.server, {
      path: "/api/auth/session",
      headers: { Cookie: cookie }
    });
    assert.equal(session.statusCode, 401);
  } finally {
    await harness.close();
  }
});
