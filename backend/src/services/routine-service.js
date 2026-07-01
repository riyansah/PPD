const { AppError } = require("../errors/app-error");
const {
  PRIORITY_ORDER,
  ROUTINE_CONFIRMABLE_STATUSES,
  ROUTINE_PRIORITIES
} = require("../constants/routines");
const { createUtcIso, formatJakartaDate, formatJakartaTime } = require("../utils/time");

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

function normalizeLocalDate(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/u);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return normalized;
}

function normalizeLocalTime(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return /^([01]\d|2[0-3]):([0-5]\d)$/u.test(normalized) ? normalized : null;
}

function parseBooleanInput(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === 1 || value === "1" || value === "true") {
    return true;
  }

  if (value === 0 || value === "0" || value === "false") {
    return false;
  }

  return null;
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

function normalizeDayOfWeekList(input) {
  if (!Array.isArray(input)) {
    return null;
  }

  const parsed = input.map((value) => Number(value));
  if (!parsed.length) {
    return [];
  }

  const unique = [...new Set(parsed)];
  const allValid = unique.every((value) => Number.isInteger(value) && value >= 1 && value <= 7);
  if (!allValid || unique.length !== parsed.length) {
    return null;
  }

  return unique.sort((left, right) => left - right);
}

function getDayOfWeekFromDate(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return dayOfWeek === 0 ? 7 : dayOfWeek;
}

function mapRoutineHistory(history) {
  return {
    id: Number(history.id),
    routine_id: Number(history.routine_id),
    user_id: Number(history.user_id),
    routine_title_snapshot: history.routine_title_snapshot,
    scheduled_date: history.scheduled_date,
    scheduled_start: history.scheduled_start,
    scheduled_end: history.scheduled_end,
    status: history.status,
    confirmed_at: history.confirmed_at,
    notes: history.notes,
    created_at: history.created_at
  };
}

function mapRoutine(routine, dayOfWeek) {
  return {
    id: Number(routine.id),
    ...(routine.user_id !== undefined ? { user_id: Number(routine.user_id) } : {}),
    title: routine.title,
    day_of_week: dayOfWeek,
    start_time: routine.start_time,
    end_time: routine.end_time,
    priority: routine.priority,
    notes: routine.notes,
    is_active: Boolean(routine.is_active),
    created_at: routine.created_at,
    updated_at: routine.updated_at,
    ...(routine.deleted_at !== undefined ? { deleted_at: routine.deleted_at } : {})
  };
}

function createConflictWarnings(dayOfWeekList, routineConflicts, activityConflicts) {
  return [
    ...routineConflicts.map((routine) => ({
      code: "SCHEDULE_CONFLICT",
      entity_type: "routine",
      entity_id: Number(routine.id),
      title: routine.title,
      day_of_week: Number(routine.day_of_week),
      start_time: routine.start_time,
      end_time: routine.end_time,
      message: `Rutinitas ini bertabrakan dengan rutinitas '${routine.title}' pada hari ${Number(routine.day_of_week)} pukul ${routine.start_time}-${routine.end_time}.`
    })),
    ...activityConflicts.map((activity) => ({
      code: "SCHEDULE_CONFLICT",
      entity_type: "activity",
      entity_id: Number(activity.id),
      title: activity.title,
      day_of_week: getDayOfWeekFromDate(activity.activity_date),
      date: activity.activity_date,
      start_time: activity.start_time,
      end_time: activity.end_time,
      message: `Rutinitas ini beririsan dengan aktivitas '${activity.title}' pada ${activity.activity_date} pukul ${activity.start_time}-${activity.end_time}.`
    }))
  ];
}

function createRoutineService({ routineRepository, nowProvider = () => new Date() }) {
  function getNow() {
    return nowProvider();
  }

  function getRoutineOrThrow(routineId, userId) {
    const routine = routineRepository.findRoutineByIdForUser(routineId, userId);
    if (!routine) {
      throw new AppError("Routine not found.", {
        statusCode: 404,
        code: "NOT_FOUND"
      });
    }

    return routine;
  }

  function buildRoutinePayload(input, { defaultPriority = "medium", defaultIsActive = true } = {}) {
    const errors = [];
    const title = normalizeRequiredText(input.title);
    const dayOfWeek = normalizeDayOfWeekList(input.day_of_week);
    const startTime = normalizeLocalTime(input.start_time);
    const endTime = normalizeLocalTime(input.end_time);
    const priority = input.priority === undefined ? defaultPriority : String(input.priority).trim();
    const notes = normalizeNullableText(input.notes);
    const isActive = input.is_active === undefined ? defaultIsActive : parseBooleanInput(input.is_active);

    if (!title) {
      errors.push({ code: "VALIDATION_ERROR", field: "title", message: "Title is required." });
    }

    if (dayOfWeek === null) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "day_of_week",
        message: "Day-of-week must contain unique values between 1 and 7."
      });
    } else if (dayOfWeek.length === 0) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "day_of_week",
        message: "At least one active weekday is required."
      });
    }

    if (!startTime) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "start_time",
        message: "Start time must be a valid HH:mm value."
      });
    }

    if (!endTime) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "end_time",
        message: "End time must be a valid HH:mm value."
      });
    }

    if (startTime && endTime && endTime <= startTime) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "end_time",
        message: "End time must be greater than start time."
      });
    }

    if (!ROUTINE_PRIORITIES.includes(priority)) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "priority",
        message: "Priority must use a supported value."
      });
    }

    if (isActive === null) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "is_active",
        message: "Active flag must be true or false."
      });
    }

    if (errors.length > 0) {
      throw createValidationError(errors);
    }

    return {
      title,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      priority,
      notes,
      is_active: isActive
    };
  }

  function buildListQuery(query) {
    const errors = [];
    const page = parsePositiveInteger(query.page, 1);
    const pageSize = parsePositiveInteger(query.page_size, 20, 100);
    const isActive = parseBooleanFilter(query.is_active);
    const search = query.search ? String(query.search).trim().toLowerCase() : "";
    const priority = query.priority ? String(query.priority).trim() : undefined;
    const dayOfWeek = query.day_of_week === undefined || query.day_of_week === ""
      ? undefined
      : Number(query.day_of_week);
    const sort = query.sort ? String(query.sort) : "created_at";
    const order = query.order ? String(query.order).toLowerCase() : "desc";

    if (page === null) {
      errors.push({ code: "VALIDATION_ERROR", field: "page", message: "Page must be a positive integer." });
    }

    if (pageSize === null) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "page_size",
        message: "Page size must be a positive integer not greater than 100."
      });
    }

    if (query.priority && !ROUTINE_PRIORITIES.includes(priority)) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "priority",
        message: "Priority filter must use a supported value."
      });
    }

    if (isActive === null) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "is_active",
        message: "Active filter must be true or false."
      });
    }

    if (dayOfWeek !== undefined && (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7)) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "day_of_week",
        message: "Day-of-week filter must be an integer between 1 and 7."
      });
    }

    if (!["start_time", "end_time", "priority", "created_at", "title"].includes(sort)) {
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
        priority,
        isActive,
        dayOfWeek
      },
      order,
      page,
      pageSize,
      sort,
      pagination: {
        limit: pageSize,
        offset: (page - 1) * pageSize
      }
    };
  }

  function mapRoutinesWithDays(items) {
    const ids = items.map((item) => Number(item.id));
    const days = routineRepository.listRoutineDaysForIds(ids);
    const daysByRoutineId = new Map();

    for (const item of days) {
      if (!daysByRoutineId.has(Number(item.routine_id))) {
        daysByRoutineId.set(Number(item.routine_id), []);
      }
      daysByRoutineId.get(Number(item.routine_id)).push(Number(item.day_of_week));
    }

    return items.map((item) => mapRoutine(item, daysByRoutineId.get(Number(item.id)) || []));
  }

  function getWarnings({ userId, dayOfWeek, startTime, endTime, excludeRoutineId, isActive }) {
    if (!isActive) {
      return [];
    }

    const routineConflicts = routineRepository.findRoutineConflicts({
      userId,
      dayOfWeekList: dayOfWeek,
      startTime,
      endTime,
      excludeRoutineId
    });
    const activityConflicts = routineRepository.findActivityConflicts({
      userId,
      dayOfWeekList: dayOfWeek,
      startTime,
      endTime
    });

    return createConflictWarnings(dayOfWeek, routineConflicts, activityConflicts);
  }

  function mapDetail(routine, history) {
    const currentDate = formatJakartaDate(getNow());
    const upcomingHistory = history
      .filter((item) => item.scheduled_date >= currentDate)
      .slice()
      .sort((left, right) => left.scheduled_date.localeCompare(right.scheduled_date))
      .slice(0, 10)
      .map(mapRoutineHistory);

    return {
      ...routine,
      history: history.map(mapRoutineHistory),
      upcoming_history: upcomingHistory
    };
  }

  return {
    confirmRoutine(routineId, userId, input) {
      getRoutineOrThrow(routineId, userId);

      const scheduledDate = normalizeLocalDate(input.scheduled_date);
      const status = input ? String(input.status || "").trim() : "";
      const notes = normalizeNullableText(input.notes);
      const errors = [];

      if (!scheduledDate) {
        errors.push({
          code: "VALIDATION_ERROR",
          field: "scheduled_date",
          message: "Scheduled date must be a valid YYYY-MM-DD date."
        });
      }

      if (!ROUTINE_CONFIRMABLE_STATUSES.includes(status)) {
        errors.push({
          code: "VALIDATION_ERROR",
          field: "status",
          message: "Status must be completed or cancelled."
        });
      }

      if (errors.length > 0) {
        throw createValidationError(errors);
      }

      const history = routineRepository.findRoutineHistoryForConfirmation(routineId, userId, scheduledDate);
      if (!history) {
        throw new AppError("Routine history not found.", {
          statusCode: 404,
          code: "NOT_FOUND"
        });
      }

      if (history.status === "missed") {
        throw new AppError("Missed routine history cannot be confirmed again.", {
          statusCode: 409,
          code: "INVALID_STATE"
        });
      }

      if (history.status === "completed" || history.status === "cancelled") {
        if (history.status !== status) {
          throw new AppError("Routine history has already been confirmed with a different status.", {
            statusCode: 409,
            code: "INVALID_STATE"
          });
        }

        return mapRoutineHistory(history);
      }

      const confirmedAt = createUtcIso(getNow());
      routineRepository.updateRoutineHistoryConfirmation(history.id, status, confirmedAt, notes);

      return mapRoutineHistory({
        ...history,
        status,
        confirmed_at: confirmedAt,
        notes
      });
    },

    createRoutine(userId, input) {
      const payload = buildRoutinePayload(input);
      const timestamp = createUtcIso(getNow());
      const routineId = routineRepository.createRoutine({
        user_id: userId,
        ...payload,
        is_active: payload.is_active ? 1 : 0,
        created_at: timestamp,
        updated_at: timestamp
      });
      const routine = routineRepository.findRoutineByIdForUser(routineId, userId);

      return {
        routine: mapRoutine(routine, payload.day_of_week),
        warnings: getWarnings({
          userId,
          dayOfWeek: payload.day_of_week,
          startTime: payload.start_time,
          endTime: payload.end_time,
          excludeRoutineId: routineId,
          isActive: payload.is_active
        })
      };
    },

    deleteRoutine(routineId, userId) {
      getRoutineOrThrow(routineId, userId);
      const timestamp = createUtcIso(getNow());
      routineRepository.softDeleteRoutine(routineId, userId, timestamp, timestamp);
      return {
        id: routineId,
        deleted_at: timestamp
      };
    },

    getRoutine(routineId, userId) {
      const routine = getRoutineOrThrow(routineId, userId);
      const dayOfWeek = routineRepository.findRoutineDays(routineId);
      const history = routineRepository.findRoutineHistoryByRoutineForUser(routineId, userId);
      return mapDetail(mapRoutine(routine, dayOfWeek), history);
    },

    listRoutines(userId, query) {
      const parsed = buildListQuery(query);
      const results = routineRepository.listRoutinesForUser({
        filters: {
          userId,
          ...parsed.filters
        },
        pagination: parsed.pagination,
        sort: parsed.sort === "priority" ? "priority" : parsed.sort,
        order: parsed.order
      });

      let items = mapRoutinesWithDays(results.items);
      if (parsed.sort === "priority") {
        items = items.sort((left, right) => {
          const diff = PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority];
          if (diff !== 0) {
            return parsed.order === "asc" ? diff : -diff;
          }
          return right.id - left.id;
        });
      }

      const totalItems = Number(results.totalItems);
      const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / parsed.pageSize);

      return {
        items,
        pagination: {
          page: parsed.page,
          page_size: parsed.pageSize,
          total_items: totalItems,
          total_pages: totalPages
        }
      };
    },

    reconcileRoutineHistories() {
      const now = getNow();
      const currentDate = formatJakartaDate(now);
      const currentTime = formatJakartaTime(now);
      const currentDayOfWeek = getDayOfWeekFromDate(currentDate);
      const timestamp = createUtcIso(now);

      return {
        current_date: currentDate,
        current_time: currentTime,
        created_count: routineRepository.createMissingHistoriesForDate({
          scheduledDate: currentDate,
          dayOfWeek: currentDayOfWeek,
          createdAt: timestamp
        }),
        missed_count: routineRepository.markPendingHistoriesAsMissed({
          currentDate,
          currentTime,
          confirmedAt: timestamp
        })
      };
    },

    toggleRoutine(routineId, userId, input) {
      const routine = getRoutineOrThrow(routineId, userId);
      const keys = Object.keys(input || {});
      const isActive = parseBooleanInput(input ? input.is_active : undefined);
      const errors = [];

      if (keys.length !== 1 || !keys.includes("is_active")) {
        errors.push({
          code: "VALIDATION_ERROR",
          field: "is_active",
          message: "Only the is_active field is allowed."
        });
      }

      if (isActive === null) {
        errors.push({
          code: "VALIDATION_ERROR",
          field: "is_active",
          message: "Active flag must be true or false."
        });
      }

      if (errors.length > 0) {
        throw createValidationError(errors);
      }

      const updatedAt = createUtcIso(getNow());
      if (Boolean(routine.is_active) !== isActive) {
        routineRepository.updateRoutineToggle(routineId, userId, isActive, updatedAt);
      }

      return mapRoutine(
        {
          ...routine,
          is_active: isActive ? 1 : 0,
          updated_at: Boolean(routine.is_active) === isActive ? routine.updated_at : updatedAt
        },
        routineRepository.findRoutineDays(routineId)
      );
    },

    updateRoutine(routineId, userId, input) {
      getRoutineOrThrow(routineId, userId);
      const payload = buildRoutinePayload(input);
      const updatedAt = createUtcIso(getNow());
      routineRepository.updateRoutine(routineId, userId, {
        ...payload,
        is_active: payload.is_active ? 1 : 0,
        updated_at: updatedAt
      });
      const routine = routineRepository.findRoutineByIdForUser(routineId, userId);

      return {
        routine: mapRoutine(routine, payload.day_of_week),
        warnings: getWarnings({
          userId,
          dayOfWeek: payload.day_of_week,
          startTime: payload.start_time,
          endTime: payload.end_time,
          excludeRoutineId: routineId,
          isActive: payload.is_active
        })
      };
    }
  };
}

module.exports = {
  createRoutineService
};
