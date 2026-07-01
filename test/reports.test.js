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

function createTask(harness, cookie, overrides = {}) {
  return request(harness.server, {
    method: "POST",
    path: "/api/tasks",
    headers: { Cookie: cookie },
    body: {
      title: "Report task",
      description: "Visible in report",
      status: "in_progress",
      priority: "medium",
      start_at: "2026-07-01T01:00:00Z",
      deadline_at: "2026-07-01T06:00:00Z",
      ...overrides
    }
  });
}

function createActivity(harness, cookie, overrides = {}) {
  return request(harness.server, {
    method: "POST",
    path: "/api/activities",
    headers: { Cookie: cookie },
    body: {
      title: "Study block",
      category: "belajar",
      activity_date: "2026-07-01",
      start_time: "09:00",
      end_time: "10:00",
      status: "completed",
      notes: "Report activity",
      ...overrides
    }
  });
}

function createRoutine(harness, cookie, overrides = {}) {
  return request(harness.server, {
    method: "POST",
    path: "/api/routines",
    headers: { Cookie: cookie },
    body: {
      title: "Report routine",
      day_of_week: [3],
      start_time: "12:00",
      end_time: "12:30",
      priority: "medium",
      notes: "Report routine",
      is_active: true,
      ...overrides
    }
  });
}

test("report endpoints require authentication", async () => {
  const harness = await createHarness();

  try {
    const response = await request(harness.server, { path: "/api/reports/summary" });

    assert.equal(response.statusCode, 401);
    assert.equal(response.json.errors[0].code, "UNAUTHENTICATED");
  } finally {
    await harness.close();
  }
});

test("reports return filtered statistics, datasets, pdf, csv, and zip exports", async () => {
  const harness = await createHarness({
    nowProvider: () => new Date("2026-07-01T04:00:00Z")
  });

  try {
    await setupPrimaryUser(harness);
    const cookie = await loginAsOwner(harness);

    await createTask(harness, cookie, { title: "Completed report task", status: "completed" });
    await createTask(harness, cookie, {
      title: "Paused overdue report task",
      status: "paused",
      deadline_at: "2026-07-01T02:00:00Z"
    });
    await createTask(harness, cookie, {
      title: "Outside task",
      start_at: "2026-06-01T01:00:00Z",
      deadline_at: "2026-06-01T03:00:00Z"
    });
    await createActivity(harness, cookie);
    await createActivity(harness, cookie, {
      title: "Workout",
      category: "olahraga",
      status: "cancelled"
    });
    const routine = await createRoutine(harness, cookie);
    assert.equal(routine.statusCode, 201);
    harness.routineService.reconcileRoutineHistories();
    const confirmation = await request(harness.server, {
      method: "POST",
      path: `/api/routines/${routine.json.data.id}/confirm`,
      headers: { Cookie: cookie },
      body: {
        scheduled_date: "2026-07-01",
        status: "completed",
        notes: "Done"
      }
    });
    assert.equal(confirmation.statusCode, 200);

    const query = "period=daily&date=2026-07-01";
    const summary = await request(harness.server, {
      path: `/api/reports/summary?${query}`,
      headers: { Cookie: cookie }
    });
    assert.equal(summary.statusCode, 200);
    assert.equal(summary.json.data.task_summary.total, 2);
    assert.equal(summary.json.data.task_summary.completed, 1);
    assert.equal(summary.json.data.task_summary.overdue, 1);
    assert.equal(summary.json.data.task_summary.completion_percentage, 50);
    assert.equal(summary.json.data.activity_summary.total, 2);
    assert.equal(summary.json.data.activity_most_frequent.category, "belajar");
    assert.equal(summary.json.data.routine_summary.total_scheduled, 1);
    assert.equal(summary.json.data.routine_summary.completed, 1);
    assert.match(summary.json.data.generated_summary_text, /menyelesaikan 1 dari 2 pekerjaan aktif/u);

    const tasks = await request(harness.server, {
      path: `/api/reports/tasks?${query}`,
      headers: { Cookie: cookie }
    });
    assert.equal(tasks.statusCode, 200);
    assert.deepEqual(tasks.json.data.items.map((item) => item.title), [
      "Paused overdue report task",
      "Completed report task"
    ]);

    const activities = await request(harness.server, {
      path: `/api/reports/activities?${query}`,
      headers: { Cookie: cookie }
    });
    assert.equal(activities.statusCode, 200);
    assert.equal(activities.json.data.items.length, 2);

    const routines = await request(harness.server, {
      path: `/api/reports/routines?${query}`,
      headers: { Cookie: cookie }
    });
    assert.equal(routines.statusCode, 200);
    assert.equal(routines.json.data.items[0].status, "completed");

    const pdf = await request(harness.server, {
      path: `/api/reports/export/pdf?${query}`,
      headers: { Cookie: cookie }
    });
    assert.equal(pdf.statusCode, 200);
    assert.equal(pdf.headers["content-type"], "application/pdf");
    assert.match(pdf.body, /^%PDF-1\.4/u);
    assert.match(pdf.headers["content-disposition"], /laporan-produktivitas/u);

    const csv = await request(harness.server, {
      path: `/api/reports/export/csv?${query}&datasets=tasks`,
      headers: { Cookie: cookie }
    });
    assert.equal(csv.statusCode, 200);
    assert.match(csv.headers["content-type"], /^text\/csv/u);
    assert.match(csv.body, /Completed report task/u);
    assert.doesNotMatch(csv.body, /Outside task/u);

    const zip = await request(harness.server, {
      path: `/api/reports/export/csv?${query}&datasets=tasks,activities,summary`,
      headers: { Cookie: cookie }
    });
    assert.equal(zip.statusCode, 200);
    assert.equal(zip.headers["content-type"], "application/zip");
    assert.equal(zip.body.slice(0, 2), "PK");
  } finally {
    await harness.close();
  }
});

test("reports validate custom range and dataset filters", async () => {
  const harness = await createHarness();

  try {
    await setupPrimaryUser(harness);
    const cookie = await loginAsOwner(harness);

    const invalidRange = await request(harness.server, {
      path: "/api/reports/summary?period=custom&start_date=2026-07-02&end_date=2026-07-01",
      headers: { Cookie: cookie }
    });
    assert.equal(invalidRange.statusCode, 422);
    assert.equal(invalidRange.json.errors[0].field, "end_date");

    const invalidDataset = await request(harness.server, {
      path: "/api/reports/export/csv?datasets=unknown",
      headers: { Cookie: cookie }
    });
    assert.equal(invalidDataset.statusCode, 422);
    assert.equal(invalidDataset.json.errors[0].field, "datasets");
  } finally {
    await harness.close();
  }
});
