const test = require("node:test");
const assert = require("node:assert/strict");
const { createHarness, request } = require("./helpers/auth-test-utils");

async function setupPrimaryUser(harness) {
  return harness.authService.setupInitialAccount({
    username: "owner",
    email: "owner@example.com",
    displayName: "Owner",
    password: "Secure123"
  });
}

async function loginAsOwner(harness) {
  const response = await request(harness.server, {
    method: "POST",
    path: "/api/auth/login",
    body: {
      login: "owner",
      password: "Secure123"
    }
  });
  assert.equal(response.statusCode, 200);
  return response.cookies[0].cookie;
}

async function createTask(harness, cookie, overrides = {}) {
  return request(harness.server, {
    method: "POST",
    path: "/api/tasks",
    headers: { Cookie: cookie },
    body: {
      title: "Dashboard task",
      description: "Visible in dashboard",
      status: "in_progress",
      priority: "medium",
      start_at: "2026-07-01T01:00:00Z",
      deadline_at: "2026-07-01T04:00:00Z",
      ...overrides
    }
  });
}

async function createActivity(harness, cookie, overrides = {}) {
  return request(harness.server, {
    method: "POST",
    path: "/api/activities",
    headers: { Cookie: cookie },
    body: {
      title: "Morning focus",
      category: "belajar",
      activity_date: "2026-07-01",
      start_time: "09:00",
      end_time: "11:00",
      status: "scheduled",
      notes: "Dashboard agenda",
      ...overrides
    }
  });
}

async function createRoutine(harness, cookie, overrides = {}) {
  return request(harness.server, {
    method: "POST",
    path: "/api/routines",
    headers: { Cookie: cookie },
    body: {
      title: "Daily review",
      day_of_week: [3],
      start_time: "11:30",
      end_time: "12:00",
      priority: "high",
      notes: "Dashboard routine",
      is_active: true,
      ...overrides
    }
  });
}

test("dashboard endpoints require authentication", async () => {
  const harness = await createHarness();

  try {
    const response = await request(harness.server, { path: "/api/dashboard/summary" });

    assert.equal(response.statusCode, 401);
    assert.equal(response.json.errors[0].code, "UNAUTHENTICATED");
  } finally {
    await harness.close();
  }
});

test("dashboard returns summary, today agenda, deadlines, and charts from server time", async () => {
  const harness = await createHarness({
    nowProvider: () => new Date("2026-07-01T03:00:00Z")
  });

  try {
    await setupPrimaryUser(harness);
    const cookie = await loginAsOwner(harness);

    await createTask(harness, cookie, { title: "Future task", deadline_at: "2026-07-01T04:00:00Z" });
    await createTask(harness, cookie, {
      title: "Completed task",
      status: "completed",
      deadline_at: "2026-07-01T05:00:00Z"
    });
    await createTask(harness, cookie, {
      title: "Overdue paused task",
      status: "paused",
      priority: "urgent",
      start_at: "2026-06-30T01:00:00Z",
      deadline_at: "2026-06-30T02:00:00Z"
    });
    await createTask(harness, cookie, {
      title: "Cancelled task",
      status: "cancelled",
      deadline_at: "2026-07-01T06:00:00Z"
    });
    await createActivity(harness, cookie);
    await createRoutine(harness, cookie);

    const summary = await request(harness.server, {
      path: "/api/dashboard/summary",
      headers: { Cookie: cookie }
    });
    assert.equal(summary.statusCode, 200);
    assert.equal(summary.json.data.task_counts.total, 4);
    assert.equal(summary.json.data.task_counts.in_progress, 1);
    assert.equal(summary.json.data.task_counts.completed, 1);
    assert.equal(summary.json.data.task_counts.paused, 1);
    assert.equal(summary.json.data.task_counts.overdue, 1);
    assert.equal(summary.json.data.activity_counts.today, 1);
    assert.equal(summary.json.data.routine_counts.today, 1);
    assert.equal(summary.json.data.task_completion_percentage, 33);

    const today = await request(harness.server, {
      path: "/api/dashboard/today",
      headers: { Cookie: cookie }
    });
    assert.equal(today.statusCode, 200);
    assert.deepEqual(today.json.data.items.map((item) => item.entity_type), ["activity", "routine"]);
    assert.deepEqual(today.json.data.items.map((item) => item.label), ["Aktivitas", "Rutinitas"]);

    const deadlines = await request(harness.server, {
      path: "/api/dashboard/deadlines?limit=5",
      headers: { Cookie: cookie }
    });
    assert.equal(deadlines.statusCode, 200);
    assert.deepEqual(deadlines.json.data.items.map((item) => item.title), ["Overdue paused task", "Future task"]);
    assert.equal(deadlines.json.data.items[0].countdown_seconds, 0);
    assert.equal(deadlines.json.data.items[1].countdown_seconds, 3600);

    const charts = await request(harness.server, {
      path: "/api/dashboard/charts?period=weekly",
      headers: { Cookie: cookie }
    });
    assert.equal(charts.statusCode, 200);
    assert.equal(charts.json.data.period, "weekly");
    assert.equal(charts.json.data.tasks_by_status.in_progress, 1);
    assert.equal(charts.json.data.tasks_by_status.completed, 1);
    assert.equal(charts.json.data.tasks_by_status.paused, 1);
    assert.equal(charts.json.data.tasks_by_status.cancelled, 1);
    assert.equal(charts.json.data.activities_by_category.belajar, 1);
  } finally {
    await harness.close();
  }
});

test("dashboard validates period and deadline limit query values", async () => {
  const harness = await createHarness();

  try {
    await setupPrimaryUser(harness);
    const cookie = await loginAsOwner(harness);

    const invalidPeriod = await request(harness.server, {
      path: "/api/dashboard/charts?period=yearly",
      headers: { Cookie: cookie }
    });
    assert.equal(invalidPeriod.statusCode, 422);
    assert.equal(invalidPeriod.json.errors[0].field, "period");

    const invalidLimit = await request(harness.server, {
      path: "/api/dashboard/deadlines?limit=21",
      headers: { Cookie: cookie }
    });
    assert.equal(invalidLimit.statusCode, 422);
    assert.equal(invalidLimit.json.errors[0].field, "limit");
  } finally {
    await harness.close();
  }
});
