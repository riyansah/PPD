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

async function createRoutine(harness, cookie, overrides = {}) {
  return request(harness.server, {
    method: "POST",
    path: "/api/routines",
    headers: { Cookie: cookie },
    body: {
      title: "Morning workout",
      day_of_week: [1, 3, 5],
      start_time: "06:00",
      end_time: "07:00",
      priority: "high",
      notes: "Cardio",
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
      title: "Gym",
      category: "olahraga",
      activity_date: "2026-06-29",
      start_time: "06:30",
      end_time: "07:30",
      notes: "Leg day",
      ...overrides
    }
  });
}

function createMutableClock(initialIso) {
  let currentIso = initialIso;
  return {
    nowProvider() {
      return new Date(currentIso);
    },
    set(iso) {
      currentIso = iso;
    }
  };
}

test("routine endpoints require authentication", async () => {
  const harness = await createHarness();

  try {
    const response = await request(harness.server, { path: "/api/routines" });
    assert.equal(response.statusCode, 401);
    assert.equal(response.json.errors[0].code, "UNAUTHENTICATED");
  } finally {
    await harness.close();
  }
});

test("creating a routine succeeds with warnings envelope and list/detail are scoped", async () => {
  const harness = await createHarness();

  try {
    await setupPrimaryUser(harness);
    await createSecondaryUser(harness);
    const ownerCookie = await loginAsOwner(harness);
    const memberCookie = await loginAsMember(harness);

    const ownerRoutine = await createRoutine(harness, ownerCookie, { title: "Owner routine" });
    const memberRoutine = await createRoutine(harness, memberCookie, { title: "Member routine" });

    assert.equal(ownerRoutine.statusCode, 201);
    assert.equal(ownerRoutine.json.data.title, "Owner routine");
    assert.deepEqual(ownerRoutine.json.data.day_of_week, [1, 3, 5]);
    assert.equal(Array.isArray(ownerRoutine.json.warnings), true);

    const ownerList = await request(harness.server, {
      path: "/api/routines",
      headers: { Cookie: ownerCookie }
    });
    assert.equal(ownerList.statusCode, 200);
    assert.equal(ownerList.json.data.items.length, 1);
    assert.equal(ownerList.json.data.items[0].title, "Owner routine");

    const detail404 = await request(harness.server, {
      path: `/api/routines/${memberRoutine.json.data.id}`,
      headers: { Cookie: ownerCookie }
    });
    assert.equal(detail404.statusCode, 404);
  } finally {
    await harness.close();
  }
});

test("routine validation rejects invalid weekdays, duplicates, invalid times, and unsupported priority", async () => {
  const harness = await createHarness();

  try {
    await setupPrimaryUser(harness);
    const cookie = await loginAsOwner(harness);

    const noDays = await createRoutine(harness, cookie, { day_of_week: [] });
    assert.equal(noDays.statusCode, 422);
    assert.equal(noDays.json.errors[0].field, "day_of_week");

    const duplicateDay = await createRoutine(harness, cookie, { day_of_week: [1, 1] });
    assert.equal(duplicateDay.statusCode, 422);
    assert.equal(duplicateDay.json.errors[0].field, "day_of_week");

    const invalidDay = await createRoutine(harness, cookie, { day_of_week: [8] });
    assert.equal(invalidDay.statusCode, 422);
    assert.equal(invalidDay.json.errors[0].field, "day_of_week");

    const invalidOrder = await createRoutine(harness, cookie, { start_time: "07:00", end_time: "06:00" });
    assert.equal(invalidOrder.statusCode, 422);
    assert.equal(invalidOrder.json.errors[0].field, "end_time");

    const invalidPriority = await createRoutine(harness, cookie, { priority: "critical" });
    assert.equal(invalidPriority.statusCode, 422);
    assert.equal(invalidPriority.json.errors[0].field, "priority");
  } finally {
    await harness.close();
  }
});

test("search, filters, sorting, pagination, update weekday replacement, toggle, and soft delete work", async () => {
  const harness = await createHarness();

  try {
    await setupPrimaryUser(harness);
    const cookie = await loginAsOwner(harness);

    const alpha = await createRoutine(harness, cookie, {
      title: "Alpha focus",
      day_of_week: [1, 2],
      start_time: "05:00",
      end_time: "06:00",
      priority: "low",
      notes: "contains sunrise"
    });
    await createRoutine(harness, cookie, {
      title: "Beta focus",
      day_of_week: [2],
      start_time: "08:00",
      end_time: "09:00",
      priority: "urgent",
      notes: "contains orange"
    });
    await createRoutine(harness, cookie, {
      title: "Gamma focus",
      day_of_week: [7],
      start_time: "07:00",
      end_time: "08:00",
      priority: "medium",
      notes: "weekend"
    });

    const search = await request(harness.server, {
      path: "/api/routines?search=orange",
      headers: { Cookie: cookie }
    });
    assert.equal(search.statusCode, 200);
    assert.equal(search.json.data.items.length, 1);
    assert.equal(search.json.data.items[0].title, "Beta focus");

    const filtered = await request(harness.server, {
      path: "/api/routines?priority=low&day_of_week=2&sort=start_time&order=asc&page_size=1&page=1",
      headers: { Cookie: cookie }
    });
    assert.equal(filtered.statusCode, 200);
    assert.equal(filtered.json.data.items.length, 1);
    assert.equal(filtered.json.data.items[0].title, "Alpha focus");
    assert.equal(filtered.json.meta.pagination.total_items, 1);

    const toggle = await request(harness.server, {
      method: "PATCH",
      path: `/api/routines/${alpha.json.data.id}/toggle`,
      headers: { Cookie: cookie },
      body: { is_active: false }
    });
    assert.equal(toggle.statusCode, 200);
    assert.equal(toggle.json.data.is_active, false);

    const inactive = await request(harness.server, {
      path: "/api/routines?is_active=false",
      headers: { Cookie: cookie }
    });
    assert.equal(inactive.statusCode, 200);
    assert.equal(inactive.json.data.items.length, 1);
    assert.equal(inactive.json.data.items[0].title, "Alpha focus");

    const updated = await request(harness.server, {
      method: "PUT",
      path: `/api/routines/${alpha.json.data.id}`,
      headers: { Cookie: cookie },
      body: {
        title: "Alpha revised",
        day_of_week: [4],
        start_time: "05:30",
        end_time: "06:30",
        priority: "high",
        notes: "updated weekdays",
        is_active: true
      }
    });
    assert.equal(updated.statusCode, 200);
    assert.deepEqual(updated.json.data.day_of_week, [4]);
    assert.equal(updated.json.data.is_active, true);

    const deleted = await request(harness.server, {
      method: "DELETE",
      path: `/api/routines/${alpha.json.data.id}`,
      headers: { Cookie: cookie }
    });
    assert.equal(deleted.statusCode, 200);

    const postDeleteList = await request(harness.server, {
      path: "/api/routines",
      headers: { Cookie: cookie }
    });
    assert.equal(postDeleteList.statusCode, 200);
    assert.equal(postDeleteList.json.data.items.some((item) => item.id === alpha.json.data.id), false);
  } finally {
    await harness.close();
  }
});

test("routine conflict warnings include routine-to-routine and routine-to-activity overlaps without blocking save", async () => {
  const harness = await createHarness();

  try {
    await setupPrimaryUser(harness);
    const cookie = await loginAsOwner(harness);

    await createRoutine(harness, cookie, {
      title: "Existing routine",
      day_of_week: [1],
      start_time: "06:00",
      end_time: "07:00"
    });
    await createActivity(harness, cookie, {
      title: "Existing activity",
      activity_date: "2026-06-29",
      start_time: "06:15",
      end_time: "06:45"
    });

    const response = await createRoutine(harness, cookie, {
      title: "Conflicting routine",
      day_of_week: [1],
      start_time: "06:30",
      end_time: "07:30"
    });

    assert.equal(response.statusCode, 201);
    assert.equal(response.json.warnings.length, 2);
    assert.equal(response.json.warnings.some((warning) => warning.entity_type === "routine"), true);
    assert.equal(response.json.warnings.some((warning) => warning.entity_type === "activity"), true);
  } finally {
    await harness.close();
  }
});

test("history generation is idempotent, respects Asia/Jakarta local date, and inactive routines are excluded", async () => {
  const clock = createMutableClock("2026-06-28T17:05:00.000Z");
  const harness = await createHarness({ nowProvider: clock.nowProvider });

  try {
    await setupPrimaryUser(harness);
    const cookie = await loginAsOwner(harness);

    const activeRoutine = await createRoutine(harness, cookie, {
      title: "Monday routine",
      day_of_week: [1],
      start_time: "00:30",
      end_time: "01:00"
    });
    await createRoutine(harness, cookie, {
      title: "Inactive monday routine",
      day_of_week: [1],
      start_time: "00:30",
      end_time: "01:00",
      is_active: false
    });

    const firstRun = harness.routineService.reconcileRoutineHistories();
    assert.equal(firstRun.current_date, "2026-06-29");
    assert.equal(firstRun.created_count, 1);

    const secondRun = harness.routineService.reconcileRoutineHistories();
    assert.equal(secondRun.created_count, 0);

    const detail = await request(harness.server, {
      path: `/api/routines/${activeRoutine.json.data.id}`,
      headers: { Cookie: cookie }
    });
    assert.equal(detail.statusCode, 200);
    assert.equal(detail.json.data.history.length, 1);
    assert.equal(detail.json.data.history[0].scheduled_date, "2026-06-29");
    assert.equal(detail.json.data.history[0].status, "missed_pending");
  } finally {
    await harness.close();
  }
});

test("history snapshots survive routine update and soft delete", async () => {
  const clock = createMutableClock("2026-06-28T17:05:00.000Z");
  const harness = await createHarness({ nowProvider: clock.nowProvider });

  try {
    await setupPrimaryUser(harness);
    const cookie = await loginAsOwner(harness);
    const created = await createRoutine(harness, cookie, {
      title: "Snapshot base",
      day_of_week: [1],
      start_time: "06:00",
      end_time: "07:00"
    });
    const routineId = created.json.data.id;

    harness.routineService.reconcileRoutineHistories();

    const updated = await request(harness.server, {
      method: "PUT",
      path: `/api/routines/${routineId}`,
      headers: { Cookie: cookie },
      body: {
        title: "Snapshot revised",
        day_of_week: [1],
        start_time: "08:00",
        end_time: "09:00",
        priority: "high",
        notes: "changed",
        is_active: true
      }
    });
    assert.equal(updated.statusCode, 200);

    const deleted = await request(harness.server, {
      method: "DELETE",
      path: `/api/routines/${routineId}`,
      headers: { Cookie: cookie }
    });
    assert.equal(deleted.statusCode, 200);

    const history = harness.db.prepare(`
      SELECT routine_title_snapshot, scheduled_start, scheduled_end
      FROM routine_histories
      WHERE routine_id = ?
    `).get(routineId);

    assert.deepEqual(history, {
      routine_title_snapshot: "Snapshot base",
      scheduled_start: "06:00",
      scheduled_end: "07:00"
    });
  } finally {
    await harness.close();
  }
});

test("confirmation behavior is scoped, idempotent for repeated same status, and rejects incompatible transitions", async () => {
  const clock = createMutableClock("2026-06-28T17:05:00.000Z");
  const harness = await createHarness({ nowProvider: clock.nowProvider });

  try {
    await setupPrimaryUser(harness);
    await createSecondaryUser(harness);
    const ownerCookie = await loginAsOwner(harness);
    const memberCookie = await loginAsMember(harness);

    const created = await createRoutine(harness, ownerCookie, {
      title: "Confirm me",
      day_of_week: [1]
    });
    harness.routineService.reconcileRoutineHistories();

    const firstConfirm = await request(harness.server, {
      method: "POST",
      path: `/api/routines/${created.json.data.id}/confirm`,
      headers: { Cookie: ownerCookie },
      body: {
        scheduled_date: "2026-06-29",
        status: "completed",
        notes: "Done"
      }
    });
    assert.equal(firstConfirm.statusCode, 200);
    assert.equal(firstConfirm.json.data.status, "completed");
    assert.equal(firstConfirm.json.data.notes, "Done");

    const repeated = await request(harness.server, {
      method: "POST",
      path: `/api/routines/${created.json.data.id}/confirm`,
      headers: { Cookie: ownerCookie },
      body: {
        scheduled_date: "2026-06-29",
        status: "completed",
        notes: "Changed"
      }
    });
    assert.equal(repeated.statusCode, 200);
    assert.equal(repeated.json.data.status, "completed");
    assert.equal(repeated.json.data.notes, "Done");

    const incompatible = await request(harness.server, {
      method: "POST",
      path: `/api/routines/${created.json.data.id}/confirm`,
      headers: { Cookie: ownerCookie },
      body: {
        scheduled_date: "2026-06-29",
        status: "cancelled"
      }
    });
    assert.equal(incompatible.statusCode, 409);

    const otherUser = await request(harness.server, {
      method: "POST",
      path: `/api/routines/${created.json.data.id}/confirm`,
      headers: { Cookie: memberCookie },
      body: {
        scheduled_date: "2026-06-29",
        status: "completed"
      }
    });
    assert.equal(otherUser.statusCode, 404);
  } finally {
    await harness.close();
  }
});

test("automatic missed processing and repeated scheduler start are stable", async () => {
  const clock = createMutableClock("2026-06-28T17:01:00.000Z");
  const harness = await createHarness({ nowProvider: clock.nowProvider, startScheduler: true, schedulerIntervalMs: 25 });

  try {
    await setupPrimaryUser(harness);
    const cookie = await loginAsOwner(harness);
    const created = await createRoutine(harness, cookie, {
      title: "Missable",
      day_of_week: [1],
      start_time: "00:01",
      end_time: "00:02"
    });

    const firstInterval = harness.routineScheduler.start();
    const secondInterval = harness.routineScheduler.start();
    assert.equal(firstInterval, secondInterval);

    harness.routineService.reconcileRoutineHistories();
    clock.set("2026-06-28T17:10:00.000Z");
    const result = harness.routineService.reconcileRoutineHistories();
    assert.equal(result.missed_count, 1);

    const detail = await request(harness.server, {
      path: `/api/routines/${created.json.data.id}`,
      headers: { Cookie: cookie }
    });
    assert.equal(detail.statusCode, 200);
    assert.equal(detail.json.data.history[0].status, "missed");

    const lateConfirm = await request(harness.server, {
      method: "POST",
      path: `/api/routines/${created.json.data.id}/confirm`,
      headers: { Cookie: cookie },
      body: {
        scheduled_date: "2026-06-29",
        status: "completed"
      }
    });
    assert.equal(lateConfirm.statusCode, 409);
  } finally {
    await harness.close();
  }
});
