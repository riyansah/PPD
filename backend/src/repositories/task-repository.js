function buildListQuery({ filters, pagination, sort, order, nowIso }) {
  const whereClauses = ["user_id = ?", "deleted_at IS NULL"];
  const params = [filters.userId];

  if (filters.search) {
    whereClauses.push("(LOWER(title) LIKE ? OR LOWER(COALESCE(description, '')) LIKE ?)");
    params.push(filters.search, filters.search);
  }

  if (filters.status) {
    whereClauses.push("status = ?");
    params.push(filters.status);
  }

  if (filters.priority) {
    whereClauses.push("priority = ?");
    params.push(filters.priority);
  }

  if (filters.startFrom) {
    whereClauses.push("start_at >= ?");
    params.push(filters.startFrom);
  }

  if (filters.startTo) {
    whereClauses.push("start_at <= ?");
    params.push(filters.startTo);
  }

  if (filters.deadlineFrom) {
    whereClauses.push("deadline_at >= ?");
    params.push(filters.deadlineFrom);
  }

  if (filters.deadlineTo) {
    whereClauses.push("deadline_at <= ?");
    params.push(filters.deadlineTo);
  }

  if (filters.isOverdue === true) {
    whereClauses.push("deadline_at < ? AND status NOT IN ('completed', 'cancelled')");
    params.push(nowIso);
  }

  if (filters.isOverdue === false) {
    whereClauses.push("NOT (deadline_at < ? AND status NOT IN ('completed', 'cancelled'))");
    params.push(nowIso);
  }

  const whereSql = `WHERE ${whereClauses.join(" AND ")}`;

  let orderSql = "created_at DESC, id DESC";
  if (sort === "priority") {
    orderSql = `CASE priority
      WHEN 'low' THEN 1
      WHEN 'medium' THEN 2
      WHEN 'high' THEN 3
      WHEN 'urgent' THEN 4
      END ${order.toUpperCase()}, id DESC`;
  } else if (sort === "title") {
    orderSql = `LOWER(title) ${order.toUpperCase()}, id DESC`;
  } else {
    orderSql = `${sort} ${order.toUpperCase()}, id DESC`;
  }

  const selectSql = `
    SELECT
      id,
      title,
      description,
      status,
      priority,
      start_at,
      deadline_at,
      completed_at,
      created_at,
      updated_at,
      CASE
        WHEN deadline_at < ? AND status NOT IN ('completed', 'cancelled') THEN 1
        ELSE 0
      END AS is_overdue
    FROM tasks
    ${whereSql}
    ORDER BY ${orderSql}
    LIMIT ? OFFSET ?
  `;

  const countSql = `
    SELECT COUNT(*) AS count
    FROM tasks
    ${whereSql}
  `;

  return {
    selectSql,
    selectParams: [nowIso, ...params, pagination.limit, pagination.offset],
    countSql,
    countParams: params
  };
}

function createTaskRepository(db) {
  return {
    createTask(input) {
      const result = db
        .prepare(`
          INSERT INTO tasks (
            user_id,
            title,
            description,
            status,
            priority,
            start_at,
            deadline_at,
            completed_at,
            created_at,
            updated_at,
            deleted_at
          ) VALUES (
            @user_id,
            @title,
            @description,
            @status,
            @priority,
            @start_at,
            @deadline_at,
            @completed_at,
            @created_at,
            @updated_at,
            NULL
          )
        `)
        .run(input);

      return Number(result.lastInsertRowid);
    },

    findTaskByIdForUser(taskId, userId, nowIso) {
      return (
        db
          .prepare(`
            SELECT
              id,
              user_id,
              title,
              description,
              status,
              priority,
              start_at,
              deadline_at,
              completed_at,
              created_at,
              updated_at,
              deleted_at,
              CASE
                WHEN deadline_at < ? AND status NOT IN ('completed', 'cancelled') THEN 1
                ELSE 0
              END AS is_overdue
            FROM tasks
            WHERE id = ? AND user_id = ? AND deleted_at IS NULL
            LIMIT 1
          `)
          .get(nowIso, taskId, userId) || null
      );
    },

    listTasksForUser({ filters, pagination, sort, order, nowIso }) {
      const query = buildListQuery({ filters, pagination, sort, order, nowIso });
      const items = db.prepare(query.selectSql).all(...query.selectParams);
      const totalItems = db.prepare(query.countSql).get(...query.countParams).count;

      return {
        items,
        totalItems
      };
    },

    softDeleteTask(taskId, userId, deletedAt, updatedAt) {
      return db
        .prepare(`
          UPDATE tasks
          SET deleted_at = ?, updated_at = ?
          WHERE id = ? AND user_id = ? AND deleted_at IS NULL
        `)
        .run(deletedAt, updatedAt, taskId, userId).changes;
    },

    updateTask(taskId, userId, input) {
      return db
        .prepare(`
          UPDATE tasks
          SET
            title = @title,
            description = @description,
            status = @status,
            priority = @priority,
            start_at = @start_at,
            deadline_at = @deadline_at,
            completed_at = @completed_at,
            updated_at = @updated_at
          WHERE id = @id AND user_id = @user_id AND deleted_at IS NULL
        `)
        .run({
          ...input,
          id: taskId,
          user_id: userId
        }).changes;
    },

    updateTaskStatus(taskId, userId, status, completedAt, updatedAt) {
      return db
        .prepare(`
          UPDATE tasks
          SET status = ?, completed_at = ?, updated_at = ?
          WHERE id = ? AND user_id = ? AND deleted_at IS NULL
        `)
        .run(status, completedAt, updatedAt, taskId, userId).changes;
    }
  };
}

module.exports = {
  createTaskRepository
};
