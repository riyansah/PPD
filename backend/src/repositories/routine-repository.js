function buildListQuery({ filters, pagination, sort, order }) {
  const joins = [];
  const whereClauses = ["routines.user_id = ?", "routines.deleted_at IS NULL"];
  const params = [filters.userId];

  if (filters.dayOfWeek) {
    joins.push("INNER JOIN routine_days AS filter_days ON filter_days.routine_id = routines.id");
    whereClauses.push("filter_days.day_of_week = ?");
    params.push(filters.dayOfWeek);
  }

  if (filters.search) {
    whereClauses.push("(LOWER(routines.title) LIKE ? OR LOWER(COALESCE(routines.notes, '')) LIKE ?)");
    params.push(filters.search, filters.search);
  }

  if (filters.priority) {
    whereClauses.push("routines.priority = ?");
    params.push(filters.priority);
  }

  if (filters.isActive !== undefined) {
    whereClauses.push("routines.is_active = ?");
    params.push(filters.isActive ? 1 : 0);
  }

  const joinSql = joins.length ? `\n      ${joins.join("\n      ")}` : "";
  const whereSql = `WHERE ${whereClauses.join(" AND ")}`;
  const orderSql = sort === "title"
    ? `LOWER(routines.title) ${order.toUpperCase()}, routines.id DESC`
    : `routines.${sort} ${order.toUpperCase()}, routines.id DESC`;

  return {
    countSql: `
      SELECT COUNT(DISTINCT routines.id) AS count
      FROM routines
      ${joinSql}
      ${whereSql}
    `,
    countParams: params,
    selectSql: `
      SELECT
        routines.id,
        routines.user_id,
        routines.title,
        routines.start_time,
        routines.end_time,
        routines.priority,
        routines.notes,
        routines.is_active,
        routines.created_at,
        routines.updated_at,
        routines.deleted_at
      FROM routines
      ${joinSql}
      ${whereSql}
      GROUP BY routines.id
      ORDER BY ${orderSql}
      LIMIT ? OFFSET ?
    `,
    selectParams: [...params, pagination.limit, pagination.offset]
  };
}

function createRoutineRepository(db) {
  const createRoutineWithDays = db.transaction((input) => {
    const result = db.prepare(`
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
      ) VALUES (
        @user_id,
        @title,
        @start_time,
        @end_time,
        @priority,
        @notes,
        @is_active,
        @created_at,
        @updated_at,
        NULL
      )
    `).run(input);

    const routineId = Number(result.lastInsertRowid);
    const insertDay = db.prepare("INSERT INTO routine_days (routine_id, day_of_week) VALUES (?, ?)");

    for (const dayOfWeek of input.day_of_week) {
      insertDay.run(routineId, dayOfWeek);
    }

    return routineId;
  });

  const updateRoutineWithDays = db.transaction((routineId, userId, input) => {
    db.prepare(`
      UPDATE routines
      SET
        title = @title,
        start_time = @start_time,
        end_time = @end_time,
        priority = @priority,
        notes = @notes,
        is_active = @is_active,
        updated_at = @updated_at
      WHERE id = @id AND user_id = @user_id AND deleted_at IS NULL
    `).run({
      ...input,
      id: routineId,
      user_id: userId
    });

    db.prepare("DELETE FROM routine_days WHERE routine_id = ?").run(routineId);
    const insertDay = db.prepare("INSERT INTO routine_days (routine_id, day_of_week) VALUES (?, ?)");

    for (const dayOfWeek of input.day_of_week) {
      insertDay.run(routineId, dayOfWeek);
    }
  });

  return {
    createRoutine(input) {
      return createRoutineWithDays(input);
    },

    createMissingHistoriesForDate({ scheduledDate, dayOfWeek, createdAt }) {
      const result = db.prepare(`
        INSERT OR IGNORE INTO routine_histories (
          routine_id,
          user_id,
          routine_title_snapshot,
          scheduled_date,
          scheduled_start,
          scheduled_end,
          status,
          confirmed_at,
          notes,
          created_at
        )
        SELECT
          routines.id,
          routines.user_id,
          routines.title,
          ?,
          routines.start_time,
          routines.end_time,
          'missed_pending',
          NULL,
          NULL,
          ?
        FROM routines
        INNER JOIN routine_days ON routine_days.routine_id = routines.id
        WHERE routines.deleted_at IS NULL
          AND routines.is_active = 1
          AND routine_days.day_of_week = ?
      `).run(scheduledDate, createdAt, dayOfWeek);

      return result.changes;
    },

    findActivityConflicts({ userId, dayOfWeekList, startTime, endTime }) {
      if (!dayOfWeekList.length) {
        return [];
      }

      const placeholders = dayOfWeekList.map(() => "?").join(", ");
      return db.prepare(`
        SELECT id, title, activity_date, start_time, end_time
        FROM activities
        WHERE user_id = ?
          AND deleted_at IS NULL
          AND status != 'cancelled'
          AND (((CAST(strftime('%w', activity_date) AS INTEGER) + 6) % 7) + 1) IN (${placeholders})
          AND start_time < ?
          AND end_time > ?
        ORDER BY activity_date ASC, start_time ASC, id DESC
      `).all(userId, ...dayOfWeekList, endTime, startTime);
    },

    findRoutineByIdForUser(routineId, userId) {
      return db.prepare(`
        SELECT
          id,
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
        FROM routines
        WHERE id = ? AND user_id = ? AND deleted_at IS NULL
        LIMIT 1
      `).get(routineId, userId) || null;
    },

    findRoutineConflicts({ userId, dayOfWeekList, startTime, endTime, excludeRoutineId }) {
      if (!dayOfWeekList.length) {
        return [];
      }

      const placeholders = dayOfWeekList.map(() => "?").join(", ");
      const params = [userId, ...dayOfWeekList, endTime, startTime];
      let excludeSql = "";

      if (excludeRoutineId) {
        excludeSql = "AND routines.id != ?";
        params.push(excludeRoutineId);
      }

      return db.prepare(`
        SELECT
          routines.id,
          routines.title,
          routines.start_time,
          routines.end_time,
          routine_days.day_of_week
        FROM routines
        INNER JOIN routine_days ON routine_days.routine_id = routines.id
        WHERE routines.user_id = ?
          AND routines.deleted_at IS NULL
          AND routines.is_active = 1
          AND routine_days.day_of_week IN (${placeholders})
          AND routines.start_time < ?
          AND routines.end_time > ?
          ${excludeSql}
        ORDER BY routine_days.day_of_week ASC, routines.start_time ASC, routines.id DESC
      `).all(...params);
    },

    findRoutineDays(routineId) {
      return db.prepare(`
        SELECT day_of_week
        FROM routine_days
        WHERE routine_id = ?
        ORDER BY day_of_week ASC
      `).all(routineId).map((row) => Number(row.day_of_week));
    },

    findRoutineHistoryByRoutineForUser(routineId, userId, { limit = 60 } = {}) {
      return db.prepare(`
        SELECT
          id,
          routine_id,
          user_id,
          routine_title_snapshot,
          scheduled_date,
          scheduled_start,
          scheduled_end,
          status,
          confirmed_at,
          notes,
          created_at
        FROM routine_histories
        WHERE routine_id = ? AND user_id = ?
        ORDER BY scheduled_date DESC, id DESC
        LIMIT ?
      `).all(routineId, userId, limit);
    },

    findRoutineHistoryForConfirmation(routineId, userId, scheduledDate) {
      return db.prepare(`
        SELECT
          id,
          routine_id,
          user_id,
          routine_title_snapshot,
          scheduled_date,
          scheduled_start,
          scheduled_end,
          status,
          confirmed_at,
          notes,
          created_at
        FROM routine_histories
        WHERE routine_id = ? AND user_id = ? AND scheduled_date = ?
        LIMIT 1
      `).get(routineId, userId, scheduledDate) || null;
    },

    listRoutinesForUser({ filters, pagination, sort, order }) {
      const query = buildListQuery({ filters, pagination, sort, order });
      return {
        items: db.prepare(query.selectSql).all(...query.selectParams),
        totalItems: db.prepare(query.countSql).get(...query.countParams).count
      };
    },

    listRoutineDaysForIds(routineIds) {
      if (!routineIds.length) {
        return [];
      }

      const placeholders = routineIds.map(() => "?").join(", ");
      return db.prepare(`
        SELECT routine_id, day_of_week
        FROM routine_days
        WHERE routine_id IN (${placeholders})
        ORDER BY routine_id ASC, day_of_week ASC
      `).all(...routineIds);
    },

    markPendingHistoriesAsMissed({ currentDate, currentTime, confirmedAt }) {
      const result = db.prepare(`
        UPDATE routine_histories
        SET status = 'missed', confirmed_at = ?
        WHERE status = 'missed_pending'
          AND (
            scheduled_date < ?
            OR (scheduled_date = ? AND scheduled_end < ?)
          )
      `).run(confirmedAt, currentDate, currentDate, currentTime);

      return result.changes;
    },

    softDeleteRoutine(routineId, userId, deletedAt, updatedAt) {
      return db.prepare(`
        UPDATE routines
        SET deleted_at = ?, updated_at = ?
        WHERE id = ? AND user_id = ? AND deleted_at IS NULL
      `).run(deletedAt, updatedAt, routineId, userId).changes;
    },

    updateRoutine(routineId, userId, input) {
      updateRoutineWithDays(routineId, userId, input);
    },

    updateRoutineHistoryConfirmation(historyId, status, confirmedAt, notes) {
      return db.prepare(`
        UPDATE routine_histories
        SET status = ?, confirmed_at = ?, notes = ?
        WHERE id = ?
      `).run(status, confirmedAt, notes, historyId).changes;
    },

    updateRoutineToggle(routineId, userId, isActive, updatedAt) {
      return db.prepare(`
        UPDATE routines
        SET is_active = ?, updated_at = ?
        WHERE id = ? AND user_id = ? AND deleted_at IS NULL
      `).run(isActive ? 1 : 0, updatedAt, routineId, userId).changes;
    }
  };
}

module.exports = {
  createRoutineRepository
};
