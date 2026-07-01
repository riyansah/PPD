function createCountMap(rows, keyName, allowedKeys) {
  const result = Object.fromEntries(allowedKeys.map((key) => [key, 0]));

  for (const row of rows) {
    if (Object.prototype.hasOwnProperty.call(result, row[keyName])) {
      result[row[keyName]] = Number(row.count);
    }
  }

  return result;
}

function createReportRepository(db) {
  return {
    getActivityCategoryCounts(userId, startDate, endDate) {
      return createCountMap(
        db.prepare(`
          SELECT category, COUNT(*) AS count
          FROM activities
          WHERE user_id = ?
            AND deleted_at IS NULL
            AND activity_date >= ?
            AND activity_date <= ?
          GROUP BY category
        `).all(userId, startDate, endDate),
        "category",
        ["pekerjaan", "belajar", "olahraga", "sosial", "pribadi"]
      );
    },

    getActivityMostFrequent(userId, startDate, endDate) {
      const byTitle = db.prepare(`
        SELECT title, COUNT(*) AS count
        FROM activities
        WHERE user_id = ?
          AND deleted_at IS NULL
          AND activity_date >= ?
          AND activity_date <= ?
        GROUP BY title
        ORDER BY count DESC, LOWER(title) ASC
        LIMIT 1
      `).get(userId, startDate, endDate) || null;

      const byCategory = db.prepare(`
        SELECT category, COUNT(*) AS count
        FROM activities
        WHERE user_id = ?
          AND deleted_at IS NULL
          AND activity_date >= ?
          AND activity_date <= ?
        GROUP BY category
        ORDER BY count DESC, category ASC
        LIMIT 1
      `).get(userId, startDate, endDate) || null;

      return {
        title: byTitle ? byTitle.title : null,
        title_count: byTitle ? Number(byTitle.count) : 0,
        category: byCategory ? byCategory.category : null,
        category_count: byCategory ? Number(byCategory.count) : 0
      };
    },

    getActivitySummary(userId, startDate, endDate) {
      return db.prepare(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
          SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS scheduled
        FROM activities
        WHERE user_id = ?
          AND deleted_at IS NULL
          AND activity_date >= ?
          AND activity_date <= ?
      `).get(userId, startDate, endDate);
    },

    getRoutineSummary(userId, startDate, endDate) {
      return db.prepare(`
        SELECT
          COUNT(*) AS total_scheduled,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
          SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) AS missed,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
          SUM(CASE WHEN status = 'missed_pending' THEN 1 ELSE 0 END) AS pending
        FROM routine_histories
        WHERE user_id = ?
          AND scheduled_date >= ?
          AND scheduled_date <= ?
      `).get(userId, startDate, endDate);
    },

    getTaskSummary(userId, nowIso, startIso, endIso) {
      return db.prepare(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
          SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) AS paused,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
          SUM(CASE WHEN deadline_at < ? AND status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END) AS overdue,
          SUM(CASE WHEN status != 'cancelled' THEN 1 ELSE 0 END) AS active_total
        FROM tasks
        WHERE user_id = ?
          AND deleted_at IS NULL
          AND start_at >= ?
          AND start_at < ?
      `).get(nowIso, userId, startIso, endIso);
    },

    listActivities(userId, startDate, endDate) {
      return db.prepare(`
        SELECT
          id,
          title,
          category,
          activity_date,
          start_time,
          end_time,
          status,
          notes,
          confirmed_at
        FROM activities
        WHERE user_id = ?
          AND deleted_at IS NULL
          AND activity_date >= ?
          AND activity_date <= ?
        ORDER BY activity_date ASC, start_time ASC, id ASC
      `).all(userId, startDate, endDate);
    },

    listRoutineHistories(userId, startDate, endDate) {
      return db.prepare(`
        SELECT
          id,
          routine_id,
          routine_title_snapshot,
          scheduled_date,
          scheduled_start,
          scheduled_end,
          status,
          confirmed_at,
          notes
        FROM routine_histories
        WHERE user_id = ?
          AND scheduled_date >= ?
          AND scheduled_date <= ?
        ORDER BY scheduled_date ASC, scheduled_start ASC, id ASC
      `).all(userId, startDate, endDate);
    },

    listTasks(userId, nowIso, startIso, endIso) {
      return db.prepare(`
        SELECT
          id,
          title,
          description,
          status,
          priority,
          start_at,
          deadline_at,
          completed_at,
          CASE
            WHEN deadline_at < ? AND status NOT IN ('completed', 'cancelled') THEN 1
            ELSE 0
          END AS is_overdue
        FROM tasks
        WHERE user_id = ?
          AND deleted_at IS NULL
          AND start_at >= ?
          AND start_at < ?
        ORDER BY start_at ASC, deadline_at ASC, id ASC
      `).all(nowIso, userId, startIso, endIso);
    }
  };
}

module.exports = {
  createReportRepository
};
