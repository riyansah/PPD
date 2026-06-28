const test = require("node:test");
const assert = require("node:assert/strict");
const { createHarness, request } = require("./helpers/auth-test-utils");
const { hashPassword } = require("../backend/src/utils/passwords");
const { createUtcIso } = require("../backend/src/utils/time");

async function setupPrimaryUser(harness) {
  return harness.authService.setupInitialAccount({
    username: "owner",
    email: "owner@example.com",
    displayName: "Owner",
    password: "Secure123"
  });
}

async function createSecondaryUser(harness) {
  const now = createUtcIso();
  const passwordHash = await hashPassword("Second123");
  const result = harness.db
    .prepare(`
      INSERT INTO users (username, email, password_hash, display_name, theme, timezone, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'system', 'Asia/Jakarta', ?, ?)
    `)
    .run("member", "member@example.com", passwordHash, "Member", now, now);

  harness.db
    .prepare(`
      INSERT INTO settings (
        user_id,
        theme,
        browser_notifications_enabled,
        in_app_notifications_enabled,
        reminder_minutes_before,
        created_at,
        updated_at
      ) VALUES (?, 'system', 0, 1, 15, ?, ?)
    `)
    .run(result.lastInsertRowid, now, now);

  return Number(result.lastInsertRowid);
}

async function login(harness, loginValue, password) {
  return request(harness.server, {
    method: "POST",
    path: "/api/auth/login",
    body: {
      login: loginValue,
      password
    }
  });
}

async function loginAsOwner(harness) {
  const response = await login(harness, "owner", "Secure123");
  assert.equal(response.statusCode, 200);
  return response.cookies[0].cookie;
}

async function loginAsMember(harness) {
  const response = await login(harness, "member", "Second123");
  assert.equal(response.statusCode, 200);
  return response.cookies[0].cookie;
}

async function createTask(harness, cookie, overrides = {}) {
  const response = await request(harness.server, {
    method: "POST",
    path: "/api/tasks",
    headers: { Cookie: cookie },
    body: {
      title: "Finish proposal",
      description: "Send final version to client",
      status: "in_progress",
      priority: "medium",
      start_at: "2026-06-28T01:00:00Z",
      deadline_at: "2026-06-29T01:00:00Z",
      ...overrides
    }
  });

  return response;
}

test("task endpoints require authentication", async () => {
  const harness = await createHarness();

  try {
    const response = await request(harness.server, {
      path: "/api/tasks"
    });

    assert.equal(response.statusCode, 401);
    assert.equal(response.json.errors[0].code, "UNAUTHENTICATED");
  } finally {
    await harness.close();
  }
});

test("creating a task succeeds and default values are applied", async () => {
  const harness = await createHarness();

  try {
    await setupPrimaryUser(harness);
    const cookie = await loginAsOwner(harness);
    const response = await createTask(harness, cookie, {
      status: undefined,
      priority: undefined
    });

    assert.equal(response.statusCode, 201);
    assert.equal(response.json.data.title, "Finish proposal");
    assert.equal(response.json.data.status, "in_progress");
    assert.equal(response.json.data.priority, "medium");
    assert.equal(response.json.data.completed_at, null);
    assert.equal(typeof response.json.meta.server_time, "string");
    assert.equal(typeof response.json.meta.request_id, "string");
  } finally {
    await harness.close();
  }
});

test("task validation rejects empty title and invalid deadline ordering", async () => {
  const harness = await createHarness();

  try {
    await setupPrimaryUser(harness);
    const cookie = await loginAsOwner(harness);

    const emptyTitle = await createTask(harness, cookie, {
      title: "   "
    });
    assert.equal(emptyTitle.statusCode, 422);
    assert.equal(emptyTitle.json.errors[0].field, "title");

    const invalidDeadline = await createTask(harness, cookie, {
      start_at: "2026-06-29T01:00:00Z",
      deadline_at: "2026-06-28T01:00:00Z"
    });
    assert.equal(invalidDeadline.statusCode, 422);
    assert.equal(invalidDeadline.json.errors[0].field, "deadline_at");
  } finally {
    await harness.close();
  }
});

test("task validation rejects unsupported status and priority values", async () => {
  const harness = await createHarness();

  try {
    await setupPrimaryUser(harness);
    const cookie = await loginAsOwner(harness);

    const invalidStatus = await createTask(harness, cookie, {
      status: "done"
    });
    assert.equal(invalidStatus.statusCode, 422);
    assert.equal(invalidStatus.json.errors[0].field, "status");

    const invalidPriority = await createTask(harness, cookie, {
      priority: "critical"
    });
    assert.equal(invalidPriority.statusCode, 422);
    assert.equal(invalidPriority.json.errors[0].field, "priority");
  } finally {
    await harness.close();
  }
});

test("task list only returns the authenticated user's data and private detail is isolated", async () => {
  const harness = await createHarness();

  try {
    await setupPrimaryUser(harness);
    await createSecondaryUser(harness);
    const ownerCookie = await loginAsOwner(harness);
    const memberCookie = await loginAsMember(harness);

    const ownerTask = await createTask(harness, ownerCookie, {
      title: "Owner task"
    });
    const memberTask = await createTask(harness, memberCookie, {
      title: "Member task"
    });

    const ownerList = await request(harness.server, {
      path: "/api/tasks",
      headers: { Cookie: ownerCookie }
    });
    assert.equal(ownerList.statusCode, 200);
    assert.equal(ownerList.json.data.items.length, 1);
    assert.equal(ownerList.json.data.items[0].title, "Owner task");

    const forbiddenDetail = await request(harness.server, {
      path: `/api/tasks/${memberTask.json.data.id}`,
      headers: { Cookie: ownerCookie }
    });
    assert.equal(forbiddenDetail.statusCode, 404);

    const ownerDetail = await request(harness.server, {
      path: `/api/tasks/${ownerTask.json.data.id}`,
      headers: { Cookie: ownerCookie }
    });
    assert.equal(ownerDetail.statusCode, 200);
    assert.equal(ownerDetail.json.data.title, "Owner task");
  } finally {
    await harness.close();
  }
});

test("search, filters, date ranges, pagination, sorting, and overdue calculation work", async () => {
  const harness = await createHarness();

  try {
    await setupPrimaryUser(harness);
    const cookie = await loginAsOwner(harness);

    await createTask(harness, cookie, {
      title: "Alpha planning",
      description: "draft milestones",
      priority: "high",
      start_at: "2026-06-27T01:00:00Z",
      deadline_at: "2100-01-02T01:00:00Z"
    });
    await createTask(harness, cookie, {
      title: "Beta review",
      description: "contains keyword orange",
      priority: "urgent",
      start_at: "2026-06-28T01:00:00Z",
      deadline_at: "2100-01-01T01:00:00Z"
    });
    await createTask(harness, cookie, {
      title: "Gamma archive",
      description: "old item",
      status: "paused",
      priority: "low",
      start_at: "2000-01-01T01:00:00Z",
      deadline_at: "2000-01-02T01:00:00Z"
    });

    const searchResponse = await request(harness.server, {
      path: "/api/tasks?search=orange",
      headers: { Cookie: cookie }
    });
    assert.equal(searchResponse.statusCode, 200);
    assert.equal(searchResponse.json.data.items.length, 1);
    assert.equal(searchResponse.json.data.items[0].title, "Beta review");

    const filterResponse = await request(harness.server, {
      path: "/api/tasks?status=paused&priority=low&start_from=1999-12-31T00:00:00Z&deadline_to=2000-01-03T00:00:00Z&is_overdue=true",
      headers: { Cookie: cookie }
    });
    assert.equal(filterResponse.statusCode, 200);
    assert.equal(filterResponse.json.data.items.length, 1);
    assert.equal(filterResponse.json.data.items[0].title, "Gamma archive");
    assert.equal(filterResponse.json.data.items[0].is_overdue, true);

    const sortedResponse = await request(harness.server, {
      path: "/api/tasks?sort=priority&order=desc&page_size=2&page=1",
      headers: { Cookie: cookie }
    });
    assert.equal(sortedResponse.statusCode, 200);
    assert.equal(sortedResponse.json.data.items.length, 2);
    assert.equal(sortedResponse.json.data.items[0].priority, "urgent");
    assert.equal(sortedResponse.json.meta.pagination.total_items, 3);
    assert.equal(sortedResponse.json.meta.pagination.total_pages, 2);

    const pageTwo = await request(harness.server, {
      path: "/api/tasks?sort=priority&order=desc&page_size=2&page=2",
      headers: { Cookie: cookie }
    });
    assert.equal(pageTwo.statusCode, 200);
    assert.equal(pageTwo.json.data.items.length, 1);
  } finally {
    await harness.close();
  }
});

test("completed_at is set and cleared consistently through status updates", async () => {
  const harness = await createHarness();

  try {
    await setupPrimaryUser(harness);
    const cookie = await loginAsOwner(harness);
    const created = await createTask(harness, cookie);
    const taskId = created.json.data.id;

    const completed = await request(harness.server, {
      method: "PATCH",
      path: `/api/tasks/${taskId}/status`,
      headers: { Cookie: cookie },
      body: {
        status: "completed"
      }
    });
    assert.equal(completed.statusCode, 200);
    assert.equal(completed.json.data.status, "completed");
    assert.equal(typeof completed.json.data.completed_at, "string");

    const reopened = await request(harness.server, {
      method: "PATCH",
      path: `/api/tasks/${taskId}/status`,
      headers: { Cookie: cookie },
      body: {
        status: "paused"
      }
    });
    assert.equal(reopened.statusCode, 200);
    assert.equal(reopened.json.data.status, "paused");
    assert.equal(reopened.json.data.completed_at, null);

    const updated = await request(harness.server, {
      method: "PUT",
      path: `/api/tasks/${taskId}`,
      headers: { Cookie: cookie },
      body: {
        title: "Updated proposal",
        description: "Updated body",
        status: "completed",
        priority: "high",
        start_at: "2026-06-28T01:00:00Z",
        deadline_at: "2026-06-29T01:00:00Z"
      }
    });
    assert.equal(updated.statusCode, 200);
    assert.equal(updated.json.data.status, "completed");
    assert.equal(typeof updated.json.data.completed_at, "string");
  } finally {
    await harness.close();
  }
});

test("soft delete hides tasks from list and detail endpoints", async () => {
  const harness = await createHarness();

  try {
    await setupPrimaryUser(harness);
    const cookie = await loginAsOwner(harness);
    const created = await createTask(harness, cookie, {
      title: "Disposable task"
    });
    const taskId = created.json.data.id;

    const deleted = await request(harness.server, {
      method: "DELETE",
      path: `/api/tasks/${taskId}`,
      headers: { Cookie: cookie }
    });
    assert.equal(deleted.statusCode, 200);
    assert.equal(deleted.json.data.deleted, true);

    const detail = await request(harness.server, {
      path: `/api/tasks/${taskId}`,
      headers: { Cookie: cookie }
    });
    assert.equal(detail.statusCode, 404);

    const list = await request(harness.server, {
      path: "/api/tasks",
      headers: { Cookie: cookie }
    });
    assert.equal(list.statusCode, 200);
    assert.equal(list.json.data.items.length, 0);
  } finally {
    await harness.close();
  }
});
