function buildListQuery({ filters, pagination, sort, order }) {
  const whereClauses = ["user_id = ?", "deleted_at IS NULL"];
  const params = [filters.userId];

  if (filters.search) {
    whereClauses.push("(LOWER(title) LIKE ? OR LOWER(COALESCE(notes, '')) LIKE ?)");
    params.push(filters.search, filters.search);
  }

  if (filters.category) {
    whereClauses.push("category = ?");
    params.push(filters.category);
  }

  if (filters.status) {
    whereClauses.push("status = ?");
    params.push(filters.status);
  }

  if (filters.dateFrom) {
    whereClauses.push("activity_date >= ?");
    params.push(filters.dateFrom);
  }

  if (filters.dateTo) {
    whereClauses.push("activity_date <= ?");
    params.push(filters.dateTo);
  }

  if (filters.startTimeFrom) {
    whereClauses.push("start_time >= ?");
    params.push(filters.startTimeFrom);
  }

  if (filters.startTimeTo) {
    whereClauses.push("start_time <= ?");
    params.push(filters.startTimeTo);
  }

  if (filters.endTimeFrom) {
    whereClauses.push("end_time >= ?");
    params.push(filters.endTimeFrom);
  }

  if (filters.endTimeTo) {
    whereClauses.push("end_time <= ?");
    params.push(filters.endTimeTo);
  }

  const whereSql = `WHERE ${whereClauses.join(" AND ")}`;
  const orderSql = sort === "title"
    ? `LOWER(title) ${order.toUpperCase()}, id DESC`
    : `${sort} ${order.toUpperCase()}, id DESC`;

  return {
    countSql: `
      SELECT COUNT(*) AS count
      FROM activities
      ${whereSql}
    `,
    countParams: params,
    selectSql: `
      SELECT
        id,
        user_id,
        title,
        category,
        activity_date,
        start_time,
        end_time,
        status,
        notes,
        confirmed_at,
        created_at,
        updated_at,
        deleted_at
      FROM activities
      ${whereSql}
      ORDER BY ${orderSql}
      LIMIT ? OFFSET ?
    `,
    selectParams: [...params, pagination.limit, pagination.offset]
  };
}

function createActivityRepository(db) {
  return {
    createActivity(input) {
      const result = db
        .prepare(`
          INSERT INTO activities (
            user_id,
            title,
            category,
            activity_date,
            start_time,
            end_time,
            status,
            notes,
            confirmed_at,
            created_at,
            updated_at,
            deleted_at
          ) VALUES (
            @user_id,
            @title,
            @category,
            @activity_date,
            @start_time,
            @end_time,
            @status,
            @notes,
            @confirmed_at,
            @created_at,
            @updated_at,
            NULL
          )
        `)
        .run(input);

      return Number(result.lastInsertRowid);
    },

    findActivityByIdForUser(activityId, userId) {
      return (
        db
          .prepare(`
            SELECT
              id,
              user_id,
              title,
              category,
              activity_date,
              start_time,
              end_time,
              status,
              notes,
              confirmed_at,
              created_at,
              updated_at,
              deleted_at
            FROM activities
            WHERE id = ? AND user_id = ? AND deleted_at IS NULL
            LIMIT 1
          `)
          .get(activityId, userId) || null
      );
    },

    listActivitiesForUser({ filters, pagination, sort, order }) {
      const query = buildListQuery({ filters, pagination, sort, order });
      return {
        items: db.prepare(query.selectSql).all(...query.selectParams),
        totalItems: db.prepare(query.countSql).get(...query.countParams).count
      };
    },

    updateActivity(activityId, userId, input) {
      return db
        .prepare(`
          UPDATE activities
          SET
            title = @title,
            category = @category,
            activity_date = @activity_date,
            start_time = @start_time,
            end_time = @end_time,
            status = @status,
            notes = @notes,
            confirmed_at = @confirmed_at,
            updated_at = @updated_at
          WHERE id = @id AND user_id = @user_id AND deleted_at IS NULL
        `)
        .run({
          ...input,
          id: activityId,
          user_id: userId
        }).changes;
    },

    updateActivityStatus(activityId, userId, status, confirmedAt, updatedAt) {
      return db
        .prepare(`
          UPDATE activities
          SET status = ?, confirmed_at = ?, updated_at = ?
          WHERE id = ? AND user_id = ? AND deleted_at IS NULL
        `)
        .run(status, confirmedAt, updatedAt, activityId, userId).changes;
    },

    softDeleteActivity(activityId, userId, deletedAt, updatedAt) {
      return db
        .prepare(`
          UPDATE activities
          SET deleted_at = ?, updated_at = ?
          WHERE id = ? AND user_id = ? AND deleted_at IS NULL
        `)
        .run(deletedAt, updatedAt, activityId, userId).changes;
    },

    findActivityConflicts({ userId, activityDate, startTime, endTime, excludeActivityId }) {
      const excludeSql = excludeActivityId ? "AND id != ?" : "";
      const params = [userId, activityDate, endTime, startTime];
      if (excludeActivityId) {
        params.push(excludeActivityId);
      }

      return db.prepare(`
        SELECT id, title, activity_date, start_time, end_time
        FROM activities
        WHERE user_id = ?
          AND activity_date = ?
          AND deleted_at IS NULL
          AND status != 'cancelled'
          AND start_time < ?
          AND end_time > ?
          ${excludeSql}
        ORDER BY start_time ASC, id DESC
      `).all(...params);
    },

    findRoutineConflicts({ userId, dayOfWeek, startTime, endTime }) {
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
          AND routine_days.day_of_week = ?
          AND routines.start_time < ?
          AND routines.end_time > ?
        ORDER BY routines.start_time ASC, routines.id DESC
      `).all(userId, dayOfWeek, endTime, startTime);
    }
  };
}

module.exports = {
  createActivityRepository
};
