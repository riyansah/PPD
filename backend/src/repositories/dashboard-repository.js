function createCountMap(rows, keyName, allowedKeys) {
  const result = Object.fromEntries(allowedKeys.map((key) => [key, 0]));

  for (const row of rows) {
    if (Object.prototype.hasOwnProperty.call(result, row[keyName])) {
      result[row[keyName]] = Number(row.count);
    }
  }

  return result;
}

function createDashboardRepository(db) {
  return {
    countActivitiesToday(userId, localDate) {
      return Number(
        db
          .prepare(`
            SELECT COUNT(*) AS count
            FROM activities
            WHERE user_id = ?
              AND deleted_at IS NULL
              AND activity_date = ?
          `)
          .get(userId, localDate).count
      );
    },

    countRoutinesToday(userId, localDate) {
      return Number(
        db
          .prepare(`
            SELECT COUNT(*) AS count
            FROM routine_histories
            WHERE user_id = ?
              AND scheduled_date = ?
          `)
          .get(userId, localDate).count
      );
    },

    getTaskSummary(userId, nowIso) {
      return db
        .prepare(`
          SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
            SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) AS paused,
            SUM(CASE WHEN deadline_at < ? AND status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END) AS overdue,
            SUM(CASE WHEN status != 'cancelled' THEN 1 ELSE 0 END) AS active_total
          FROM tasks
          WHERE user_id = ?
            AND deleted_at IS NULL
        `)
        .get(nowIso, userId);
    },

    listTodayActivities(userId, localDate) {
      return db
        .prepare(`
          SELECT
            id,
            title,
            category,
            activity_date,
            start_time,
            end_time,
            status
          FROM activities
          WHERE user_id = ?
            AND deleted_at IS NULL
            AND activity_date = ?
            AND status = 'scheduled'
          ORDER BY start_time ASC, id DESC
        `)
        .all(userId, localDate);
    },

    listTodayRoutineHistories(userId, localDate) {
      return db
        .prepare(`
          SELECT
            routine_histories.id,
            routine_histories.routine_id,
            routine_histories.routine_title_snapshot,
            routine_histories.scheduled_date,
            routine_histories.scheduled_start,
            routine_histories.scheduled_end,
            routine_histories.status,
            routines.priority
          FROM routine_histories
          LEFT JOIN routines ON routines.id = routine_histories.routine_id
          WHERE routine_histories.user_id = ?
            AND routine_histories.scheduled_date = ?
            AND routine_histories.status = 'missed_pending'
          ORDER BY routine_histories.scheduled_start ASC, routine_histories.id DESC
        `)
        .all(userId, localDate);
    },

    listUpcomingDeadlines(userId, nowIso, limit) {
      return db
        .prepare(`
          SELECT
            id,
            title,
            priority,
            status,
            deadline_at,
            CASE
              WHEN deadline_at < ? THEN 1
              ELSE 0
            END AS is_overdue
          FROM tasks
          WHERE user_id = ?
            AND deleted_at IS NULL
            AND status NOT IN ('completed', 'cancelled')
          ORDER BY deadline_at ASC, id DESC
          LIMIT ?
        `)
        .all(nowIso, userId, limit);
    },

    getActivityStatusChart(userId, dateFrom, dateTo, currentDate, currentTime) {
      const storedCounts = createCountMap(
        db
          .prepare(`
            SELECT status, COUNT(*) AS count
            FROM activities
            WHERE user_id = ?
              AND deleted_at IS NULL
              AND activity_date >= ?
              AND activity_date <= ?
            GROUP BY status
          `)
          .all(userId, dateFrom, dateTo),
        "status",
        ["scheduled", "completed", "cancelled"]
      );

      const pendingConfirmation = Number(
        db
          .prepare(`
            SELECT COUNT(*) AS count
            FROM activities
            WHERE user_id = ?
              AND deleted_at IS NULL
              AND status = 'scheduled'
              AND activity_date >= ?
              AND activity_date <= ?
              AND (
                activity_date < ?
                OR (activity_date = ? AND end_time <= ?)
              )
          `)
          .get(userId, dateFrom, dateTo, currentDate, currentDate, currentTime).count
      );

      return {
        ...storedCounts,
        pending_confirmation: pendingConfirmation
      };
    },

    getActivityCategoryChart(userId, dateFrom, dateTo) {
      return createCountMap(
        db
          .prepare(`
            SELECT category, COUNT(*) AS count
            FROM activities
            WHERE user_id = ?
              AND deleted_at IS NULL
              AND activity_date >= ?
              AND activity_date <= ?
            GROUP BY category
          `)
          .all(userId, dateFrom, dateTo),
        "category",
        ["pekerjaan", "belajar", "olahraga", "sosial", "pribadi"]
      );
    },

    getTaskStatusChart(userId, nowIso, startIso, endIso) {
      const counts = createCountMap(
        db
          .prepare(`
            SELECT status, COUNT(*) AS count
            FROM tasks
            WHERE user_id = ?
              AND deleted_at IS NULL
              AND start_at >= ?
              AND start_at < ?
            GROUP BY status
          `)
          .all(userId, startIso, endIso),
        "status",
        ["in_progress", "completed", "paused", "cancelled"]
      );

      const overdue = Number(
        db
          .prepare(`
            SELECT COUNT(*) AS count
            FROM tasks
            WHERE user_id = ?
              AND deleted_at IS NULL
              AND start_at >= ?
              AND start_at < ?
              AND deadline_at < ?
              AND status NOT IN ('completed', 'cancelled')
          `)
          .get(userId, startIso, endIso, nowIso).count
      );

      return {
        ...counts,
        overdue
      };
    }
  };
}

module.exports = {
  createDashboardRepository
};
