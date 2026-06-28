const { AppError } = require("../errors/app-error");
const { createUtcIso } = require("../utils/time");
const { TASK_PRIORITIES, TASK_STATUSES } = require("../constants/tasks");

function createValidationError(errors) {
  const error = new AppError("Validation failed.", {
    statusCode: 422,
    code: "VALIDATION_ERROR"
  });
  error.details = errors;
  return error;
}

function normalizeNullableText(value) {
  const normalized = String(value || "").trim();
  return normalized ? normalized : null;
}

function normalizeRequiredText(value) {
  return String(value || "").trim();
}

function normalizeIsoDateTime(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function parsePositiveInteger(value, fallback, maximum) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  if (maximum && parsed > maximum) {
    return null;
  }

  return parsed;
}

function parseBooleanFilter(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (["true", "1", true].includes(value)) {
    return true;
  }

  if (["false", "0", false].includes(value)) {
    return false;
  }

  return null;
}

function mapTask(task) {
  return {
    id: Number(task.id),
    ...(task.user_id !== undefined ? { user_id: Number(task.user_id) } : {}),
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    start_at: task.start_at,
    deadline_at: task.deadline_at,
    completed_at: task.completed_at,
    created_at: task.created_at,
    updated_at: task.updated_at,
    ...(task.deleted_at !== undefined ? { deleted_at: task.deleted_at } : {}),
    is_overdue: Boolean(task.is_overdue)
  };
}

function createTaskService({ taskRepository }) {
  function buildTaskPayload(input, { existingStatus, existingCompletedAt, defaultStatus = "in_progress", defaultPriority = "medium" } = {}) {
    const errors = [];
    const title = normalizeRequiredText(input.title);
    const description = normalizeNullableText(input.description);
    const status = input.status || defaultStatus;
    const priority = input.priority || defaultPriority;
    const startAt = normalizeIsoDateTime(input.start_at);
    const deadlineAt = normalizeIsoDateTime(input.deadline_at);

    if (!title) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "title",
        message: "Title is required."
      });
    }

    if (!startAt) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "start_at",
        message: "Start time must be a valid ISO 8601 datetime."
      });
    }

    if (!deadlineAt) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "deadline_at",
        message: "Deadline must be a valid ISO 8601 datetime."
      });
    }

    if (!TASK_STATUSES.includes(status)) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "status",
        message: "Status must use a supported value."
      });
    }

    if (!TASK_PRIORITIES.includes(priority)) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "priority",
        message: "Priority must use a supported value."
      });
    }

    if (startAt && deadlineAt && new Date(deadlineAt).getTime() < new Date(startAt).getTime()) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "deadline_at",
        message: "Deadline must be greater than or equal to start time."
      });
    }

    if (errors.length > 0) {
      throw createValidationError(errors);
    }

    let completedAt = null;
    if (status === "completed") {
      completedAt = existingStatus === "completed" && existingCompletedAt ? existingCompletedAt : createUtcIso();
    }

    return {
      title,
      description,
      status,
      priority,
      start_at: startAt,
      deadline_at: deadlineAt,
      completed_at: completedAt
    };
  }

  function validateStatusPatch(input, existingStatus, existingCompletedAt) {
    const errors = [];
    const keys = Object.keys(input || {});
    const status = input ? input.status : undefined;

    if (keys.length !== 1 || !keys.includes("status")) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "status",
        message: "Only the status field is allowed."
      });
    }

    if (!TASK_STATUSES.includes(status)) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "status",
        message: "Status must use a supported value."
      });
    }

    if (errors.length > 0) {
      throw createValidationError(errors);
    }

    return {
      status,
      completed_at:
        status === "completed"
          ? existingStatus === "completed" && existingCompletedAt
            ? existingCompletedAt
            : createUtcIso()
          : null
    };
  }

  function buildListQuery(query) {
    const errors = [];
    const page = parsePositiveInteger(query.page, 1);
    const pageSize = parsePositiveInteger(query.page_size, 20, 100);
    const isOverdue = parseBooleanFilter(query.is_overdue);
    const search = query.search ? String(query.search).trim().toLowerCase() : "";
    const status = query.status ? String(query.status) : undefined;
    const priority = query.priority ? String(query.priority) : undefined;
    const sort = query.sort ? String(query.sort) : "created_at";
    const order = query.order ? String(query.order).toLowerCase() : "desc";
    const startFrom = query.start_from ? normalizeIsoDateTime(query.start_from) : undefined;
    const startTo = query.start_to ? normalizeIsoDateTime(query.start_to) : undefined;
    const deadlineFrom = query.deadline_from ? normalizeIsoDateTime(query.deadline_from) : undefined;
    const deadlineTo = query.deadline_to ? normalizeIsoDateTime(query.deadline_to) : undefined;

    if (page === null) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "page",
        message: "Page must be a positive integer."
      });
    }

    if (pageSize === null) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "page_size",
        message: "Page size must be a positive integer not greater than 100."
      });
    }

    if (query.status && !TASK_STATUSES.includes(status)) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "status",
        message: "Status filter must use a supported value."
      });
    }

    if (query.priority && !TASK_PRIORITIES.includes(priority)) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "priority",
        message: "Priority filter must use a supported value."
      });
    }

    if (query.start_from && !startFrom) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "start_from",
        message: "Start date filter must be a valid ISO 8601 datetime."
      });
    }

    if (query.start_to && !startTo) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "start_to",
        message: "Start date filter must be a valid ISO 8601 datetime."
      });
    }

    if (query.deadline_from && !deadlineFrom) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "deadline_from",
        message: "Deadline filter must be a valid ISO 8601 datetime."
      });
    }

    if (query.deadline_to && !deadlineTo) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "deadline_to",
        message: "Deadline filter must be a valid ISO 8601 datetime."
      });
    }

    if (isOverdue === null) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "is_overdue",
        message: "Overdue filter must be true or false."
      });
    }

    if (!["deadline_at", "priority", "created_at", "title"].includes(sort)) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "sort",
        message: "Sort field must use a supported value."
      });
    }

    if (!["asc", "desc"].includes(order)) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "order",
        message: "Order must be asc or desc."
      });
    }

    if (errors.length > 0) {
      throw createValidationError(errors);
    }

    return {
      filters: {
        search: search ? `%${search}%` : undefined,
        status,
        priority,
        startFrom,
        startTo,
        deadlineFrom,
        deadlineTo,
        isOverdue
      },
      order,
      page,
      pageSize,
      sort
    };
  }

  function getTaskOrThrow(taskId, userId, nowIso) {
    const task = taskRepository.findTaskByIdForUser(taskId, userId, nowIso);
    if (!task) {
      throw new AppError("Task not found.", {
        statusCode: 404,
        code: "NOT_FOUND"
      });
    }

    return task;
  }

  return {
    createTask(userId, input) {
      const payload = buildTaskPayload(input);
      const now = createUtcIso();
      const taskId = taskRepository.createTask({
        user_id: userId,
        ...payload,
        created_at: now,
        updated_at: now
      });

      return mapTask(getTaskOrThrow(taskId, userId, now));
    },

    deleteTask(taskId, userId) {
      const now = createUtcIso();
      getTaskOrThrow(taskId, userId, now);
      taskRepository.softDeleteTask(taskId, userId, now, now);
      return {
        deleted: true
      };
    },

    getTask(taskId, userId) {
      return mapTask(getTaskOrThrow(taskId, userId, createUtcIso()));
    },

    listTasks(userId, query) {
      const parsed = buildListQuery(query);
      const now = createUtcIso();
      const result = taskRepository.listTasksForUser({
        filters: {
          ...parsed.filters,
          userId
        },
        pagination: {
          limit: parsed.pageSize,
          offset: (parsed.page - 1) * parsed.pageSize
        },
        sort: parsed.sort,
        order: parsed.order,
        nowIso: now
      });

      return {
        items: result.items.map(mapTask),
        pagination: {
          page: parsed.page,
          page_size: parsed.pageSize,
          total_items: result.totalItems,
          total_pages: result.totalItems === 0 ? 0 : Math.ceil(result.totalItems / parsed.pageSize)
        }
      };
    },

    updateTask(taskId, userId, input) {
      const existing = getTaskOrThrow(taskId, userId, createUtcIso());
      const payload = buildTaskPayload(input, {
        existingStatus: existing.status,
        existingCompletedAt: existing.completed_at
      });
      taskRepository.updateTask(taskId, userId, {
        ...payload,
        updated_at: createUtcIso()
      });
      return mapTask(getTaskOrThrow(taskId, userId, createUtcIso()));
    },

    updateTaskStatus(taskId, userId, input) {
      const existing = getTaskOrThrow(taskId, userId, createUtcIso());
      const payload = validateStatusPatch(input, existing.status, existing.completed_at);
      taskRepository.updateTaskStatus(
        taskId,
        userId,
        payload.status,
        payload.completed_at,
        createUtcIso()
      );
      return mapTask(getTaskOrThrow(taskId, userId, createUtcIso()));
    }
  };
}

module.exports = {
  createTaskService,
  normalizeIsoDateTime
};
