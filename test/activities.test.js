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

async function createActivity(harness, cookie, overrides = {}) {
  return request(harness.server, {
    method: "POST",
    path: "/api/activities",
    headers: { Cookie: cookie },
    body: {
      title: "Gym",
      category: "olahraga",
      activity_date: "2026-06-28",
      start_time: "18:00",
      end_time: "19:00",
      notes: "Leg day",
      ...overrides
    }
  });
}

function fixedNow(iso) {
  return () => new Date(iso);
}

test("activity endpoints require authentication", async () => {
  const harness = await createHarness();

  try {
    const response = await request(harness.server, { path: "/api/activities" });
    assert.equal(response.statusCode, 401);
    assert.equal(response.json.errors[0].code, "UNAUTHENTICATED");
  } finally {
    await harness.close();
  }
});

test("creating a valid activity succeeds with default scheduled status and envelope metadata", async () => {
  const harness = await createHarness({ nowProvider: fixedNow("2026-06-28T09:00:00.000Z") });

  try {
    await setupPrimaryUser(harness);
    const cookie = await loginAsOwner(harness);
    const response = await createActivity(harness, cookie);

    assert.equal(response.statusCode, 201);
    assert.equal(response.json.data.status, "scheduled");
    assert.equal(response.json.data.computed_status, "upcoming");
    assert.equal(response.json.data.confirmed_at, null);
    assert.equal(Array.isArray(response.json.warnings), true);
    assert.equal(typeof response.json.meta.server_time, "string");
    assert.equal(typeof response.json.meta.request_id, "string");
  } finally {
    await harness.close();
  }
});

test("activity validation rejects required-field, category, date, and time errors", async () => {
  const harness = await createHarness();

  try {
    await setupPrimaryUser(harness);
    const cookie = await loginAsOwner(harness);

    const missingTitle = await createActivity(harness, cookie, { title: "   " });
    assert.equal(missingTitle.statusCode, 422);
    assert.equal(missingTitle.json.errors[0].field, "title");

    const invalidCategory = await createActivity(harness, cookie, { category: "travel" });
    assert.equal(invalidCategory.statusCode, 422);
    assert.equal(invalidCategory.json.errors[0].field, "category");

    const invalidDate = await createActivity(harness, cookie, { activity_date: "2026-02-31" });
    assert.equal(invalidDate.statusCode, 422);
    assert.equal(invalidDate.json.errors[0].field, "activity_date");

    const invalidStartTime = await createActivity(harness, cookie, { start_time: "9:00" });
    assert.equal(invalidStartTime.statusCode, 422);
    assert.equal(invalidStartTime.json.errors[0].field, "start_time");

    const invalidEndTime = await createActivity(harness, cookie, { end_time: "24:00" });
    assert.equal(invalidEndTime.statusCode, 422);
    assert.equal(invalidEndTime.json.errors[0].field, "end_time");
  } finally {
    await harness.close();
  }
});

test("activity validation rejects end_time less than or equal to start_time", async () => {
  const harness = await createHarness();

  try {
    await setupPrimaryUser(harness);
    const cookie = await loginAsOwner(harness);

    const equalTimes = await createActivity(harness, cookie, { end_time: "18:00" });
    assert.equal(equalTimes.statusCode, 422);
    assert.equal(equalTimes.json.errors[0].field, "end_time");

    const reversedTimes = await createActivity(harness, cookie, {
      start_time: "19:00",
      end_time: "18:00"
    });
    assert.equal(reversedTimes.statusCode, 422);
    assert.equal(reversedTimes.json.errors[0].field, "end_time");
  } finally {
    await harness.close();
  }
});

test("activity list, detail, update, and delete are scoped to the authenticated user", async () => {
  const harness = await createHarness();

  try {
    await setupPrimaryUser(harness);
    await createSecondaryUser(harness);
    const ownerCookie = await loginAsOwner(harness);
    const memberCookie = await loginAsMember(harness);

    const ownerActivity = await createActivity(harness, ownerCookie, { title: "Owner activity" });
    const memberActivity = await createActivity(harness, memberCookie, { title: "Member activity" });

    const ownerList = await request(harness.server, {
      path: "/api/activities",
      headers: { Cookie: ownerCookie }
    });
    assert.equal(ownerList.statusCode, 200);
    assert.equal(ownerList.json.data.items.length, 1);
    assert.equal(ownerList.json.data.items[0].title, "Owner activity");

    const detail404 = await request(harness.server, {
      path: `/api/activities/${memberActivity.json.data.id}`,
      headers: { Cookie: ownerCookie }
    });
    assert.equal(detail404.statusCode, 404);

    const update404 = await request(harness.server, {
      method: "PUT",
      path: `/api/activities/${memberActivity.json.data.id}`,
      headers: { Cookie: ownerCookie },
      body: {
        title: "Nope",
        category: "sosial",
        activity_date: "2026-06-28",
        start_time: "08:00",
        end_time: "09:00",
        status: "scheduled",
        notes: ""
      }
    });
    assert.equal(update404.statusCode, 404);

    const delete404 = await request(harness.server, {
      method: "DELETE",
      path: `/api/activities/${memberActivity.json.data.id}`,
      headers: { Cookie: ownerCookie }
    });
    assert.equal(delete404.statusCode, 404);

    const detail = await request(harness.server, {
      path: `/api/activities/${ownerActivity.json.data.id}`,
      headers: { Cookie: ownerCookie }
    });
    assert.equal(detail.statusCode, 200);
    assert.equal(detail.json.data.title, "Owner activity");
  } finally {
    await harness.close();
  }
});

test("search, category/status filters, date/time filters, sorting, pagination, and stable tie-breaking work", async () => {
  const harness = await createHarness({ nowProvider: fixedNow("2026-06-28T01:00:00.000Z") });

  try {
    await setupPrimaryUser(harness);
    const cookie = await loginAsOwner(harness);

    await createActivity(harness, cookie, {
      title: "Alpha study",
      category: "belajar",
      activity_date: "2026-06-27",
      start_time: "07:00",
      end_time: "08:00",
      notes: "contains orange"
    });
    await createActivity(harness, cookie, {
      title: "Alpha study",
      category: "pekerjaan",
      activity_date: "2026-06-28",
      start_time: "09:00",
      end_time: "10:00",
      notes: "contains apple"
    });
    await createActivity(harness, cookie, {
      title: "Gamma social",
      category: "sosial",
      activity_date: "2026-06-29",
      start_time: "11:00",
      end_time: "12:00",
      notes: "contains banana",
      status: "cancelled"
    });

    const searchResponse = await request(harness.server, {
      path: "/api/activities?search=orange",
      headers: { Cookie: cookie }
    });
    assert.equal(searchResponse.statusCode, 200);
    assert.equal(searchResponse.json.data.items.length, 1);
    assert.equal(searchResponse.json.data.items[0].category, "belajar");

    const filterResponse = await request(harness.server, {
      path: "/api/activities?category=pekerjaan&status=scheduled&date_from=2026-06-28&date_to=2026-06-28&start_time_from=08:00&start_time_to=10:00&end_time_from=10:00&end_time_to=10:00",
      headers: { Cookie: cookie }
    });
    assert.equal(filterResponse.statusCode, 200);
    assert.equal(filterResponse.json.data.items.length, 1);
    assert.equal(filterResponse.json.data.items[0].title, "Alpha study");

    const sortedResponse = await request(harness.server, {
      path: "/api/activities?sort=title&order=asc&page_size=2&page=1",
      headers: { Cookie: cookie }
    });
    assert.equal(sortedResponse.statusCode, 200);
    assert.equal(sortedResponse.json.data.items.length, 2);
    assert.ok(sortedResponse.json.data.items[0].id > sortedResponse.json.data.items[1].id);
    assert.equal(sortedResponse.json.meta.pagination.total_items, 3);
    assert.equal(sortedResponse.json.meta.pagination.total_pages, 2);

    const pageTwo = await request(harness.server, {
      path: "/api/activities?sort=title&order=asc&page_size=2&page=2",
      headers: { Cookie: cookie }
    });
    assert.equal(pageTwo.statusCode, 200);
    assert.equal(pageTwo.json.data.items.length, 1);
  } finally {
    await harness.close();
  }
});

test("computed activity statuses use server time in Asia/Jakarta", async () => {
  const upcomingHarness = await createHarness({ nowProvider: fixedNow("2026-06-28T09:00:00.000Z") });
  const inProgressHarness = await createHarness({ nowProvider: fixedNow("2026-06-28T11:30:00.000Z") });
  const pendingHarness = await createHarness({ nowProvider: fixedNow("2026-06-28T14:00:00.000Z") });

  try {
    await setupPrimaryUser(upcomingHarness);
    const upcomingCookie = await loginAsOwner(upcomingHarness);
    const upcoming = await createActivity(upcomingHarness, upcomingCookie, {
      activity_date: "2026-06-28",
      start_time: "18:00",
      end_time: "19:00"
    });
    assert.equal(upcoming.json.data.computed_status, "upcoming");

    await setupPrimaryUser(inProgressHarness);
    const inProgressCookie = await loginAsOwner(inProgressHarness);
    const inProgress = await createActivity(inProgressHarness, inProgressCookie, {
      activity_date: "2026-06-28",
      start_time: "18:00",
      end_time: "19:00"
    });
    assert.equal(inProgress.json.data.computed_status, "in_progress");

    await setupPrimaryUser(pendingHarness);
    const pendingCookie = await loginAsOwner(pendingHarness);
    const pending = await createActivity(pendingHarness, pendingCookie, {
      activity_date: "2026-06-28",
      start_time: "18:00",
      end_time: "19:00"
    });
    assert.equal(pending.json.data.computed_status, "pending_confirmation");

    const completed = await createActivity(pendingHarness, pendingCookie, {
      title: "Done",
      status: "completed",
      start_time: "08:00",
      end_time: "09:00"
    });
    assert.equal(completed.json.data.computed_status, "completed");

    const cancelled = await createActivity(pendingHarness, pendingCookie, {
      title: "Cancelled",
      status: "cancelled",
      start_time: "10:00",
      end_time: "11:00"
    });
    assert.equal(cancelled.json.data.computed_status, "cancelled");
  } finally {
    await upcomingHarness.close();
    await inProgressHarness.close();
    await pendingHarness.close();
  }
});

test("status confirmation accepts only completed or cancelled and sets confirmed_at from server time", async () => {
  const harness = await createHarness({ nowProvider: fixedNow("2026-06-28T14:00:00.000Z") });

  try {
    await setupPrimaryUser(harness);
    const cookie = await loginAsOwner(harness);
    const created = await createActivity(harness, cookie, {
      activity_date: "2026-06-28",
      start_time: "16:00",
      end_time: "17:00"
    });
    const activityId = created.json.data.id;

    const invalid = await request(harness.server, {
      method: "PATCH",
      path: `/api/activities/${activityId}/status`,
      headers: { Cookie: cookie },
      body: { status: "scheduled" }
    });
    assert.equal(invalid.statusCode, 422);
    assert.equal(invalid.json.errors[0].field, "status");

    const completed = await request(harness.server, {
      method: "PATCH",
      path: `/api/activities/${activityId}/status`,
      headers: { Cookie: cookie },
      body: { status: "completed" }
    });
    assert.equal(completed.statusCode, 200);
    assert.equal(completed.json.data.status, "completed");
    assert.equal(completed.json.data.confirmed_at, "2026-06-28T14:00:00.000Z");

    const repeated = await request(harness.server, {
      method: "PATCH",
      path: `/api/activities/${activityId}/status`,
      headers: { Cookie: cookie },
      body: { status: "completed" }
    });
    assert.equal(repeated.statusCode, 200);
    assert.equal(repeated.json.data.confirmed_at, "2026-06-28T14:00:00.000Z");
  } finally {
    await harness.close();
  }
});

test("soft delete hides activities from list and detail endpoints", async () => {
  const harness = await createHarness();

  try {
    await setupPrimaryUser(harness);
    const cookie = await loginAsOwner(harness);
    const created = await createActivity(harness, cookie, { title: "Disposable" });
    const activityId = created.json.data.id;

    const deleted = await request(harness.server, {
      method: "DELETE",
      path: `/api/activities/${activityId}`,
      headers: { Cookie: cookie }
    });
    assert.equal(deleted.statusCode, 200);
    assert.equal(deleted.json.data.deleted, true);

    const detail = await request(harness.server, {
      path: `/api/activities/${activityId}`,
      headers: { Cookie: cookie }
    });
    assert.equal(detail.statusCode, 404);

    const list = await request(harness.server, {
      path: "/api/activities",
      headers: { Cookie: cookie }
    });
    assert.equal(list.statusCode, 200);
    assert.equal(list.json.data.items.length, 0);
  } finally {
    await harness.close();
  }
});

test("activity-to-activity and activity-to-routine conflicts return warnings without blocking save or update", async () => {
  const harness = await createHarness();

  try {
    await setupPrimaryUser(harness);
    const cookie = await loginAsOwner(harness);

    harness.db.prepare(`
      INSERT INTO routines (
        user_id,
        title,
        start_time,
        end_time,
        priority,
        notes,
        is_active,
        created_at,
        updated_at,
        deleted_at
      ) VALUES (?, ?, ?, ?, 'medium', NULL, 1, ?, ?, NULL)
    `).run(1, "Olahraga Pagi", "06:00", "07:00", createUtcIso(), createUtcIso());
    harness.db.prepare("INSERT INTO routine_days (routine_id, day_of_week) VALUES (1, 7)").run();

    const base = await createActivity(harness, cookie, {
      title: "Morning reading",
      category: "belajar",
      activity_date: "2026-06-28",
      start_time: "06:30",
      end_time: "07:30"
    });
    assert.equal(base.statusCode, 201);
    assert.equal(base.json.warnings.length, 1);
    assert.equal(base.json.warnings[0].entity_type, "routine");

    const overlapping = await createActivity(harness, cookie, {
      title: "Morning meeting",
      category: "pekerjaan",
      activity_date: "2026-06-28",
      start_time: "07:00",
      end_time: "08:00"
    });
    assert.equal(overlapping.statusCode, 201);
    assert.equal(overlapping.json.data.title, "Morning meeting");
    assert.equal(overlapping.json.warnings.some((warning) => warning.entity_type === "activity"), true);

    const backToBack = await createActivity(harness, cookie, {
      title: "No conflict",
      activity_date: "2026-06-28",
      start_time: "08:00",
      end_time: "09:00"
    });
    assert.equal(backToBack.statusCode, 201);
    assert.equal(backToBack.json.warnings.length, 0);

    harness.db.prepare("UPDATE activities SET status = 'cancelled' WHERE id = ?").run(base.json.data.id);
    harness.db.prepare("UPDATE activities SET deleted_at = ? WHERE id = ?").run(createUtcIso(), overlapping.json.data.id);

    const update = await request(harness.server, {
      method: "PUT",
      path: `/api/activities/${backToBack.json.data.id}`,
      headers: { Cookie: cookie },
      body: {
        title: "No self conflict",
        category: "pribadi",
        activity_date: "2026-06-28",
        start_time: "08:00",
        end_time: "09:00",
        status: "scheduled",
        notes: "updated"
      }
    });
    assert.equal(update.statusCode, 200);
    assert.equal(update.json.warnings.length, 0);
  } finally {
    await harness.close();
  }
});
