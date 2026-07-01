const { AppError } = require("../errors/app-error");
const {
  ACTIVITY_CATEGORIES,
  ACTIVITY_CONFIRMABLE_STATUSES,
  ACTIVITY_STATUSES
} = require("../constants/activities");
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

function getJakartaDayOfWeek(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return dayOfWeek === 0 ? 7 : dayOfWeek;
}

function computeActivityStatus(activity, now = new Date()) {
  if (activity.status === "completed" || activity.status === "cancelled") {
    return activity.status;
  }

  const currentDate = formatJakartaDate(now);
  const currentTime = formatJakartaTime(now);

  if (activity.activity_date > currentDate) {
    return "upcoming";
  }

  if (activity.activity_date < currentDate) {
    return "pending_confirmation";
  }

  if (currentTime >= activity.end_time) {
    return "pending_confirmation";
  }

  if (currentTime >= activity.start_time) {
    return "in_progress";
  }

  return "upcoming";
}

function mapActivity(activity, now = new Date()) {
  return {
    id: Number(activity.id),
    ...(activity.user_id !== undefined ? { user_id: Number(activity.user_id) } : {}),
    title: activity.title,
    category: activity.category,
    activity_date: activity.activity_date,
    start_time: activity.start_time,
    end_time: activity.end_time,
    status: activity.status,
    computed_status: computeActivityStatus(activity, now),
    notes: activity.notes,
    confirmed_at: activity.confirmed_at,
    created_at: activity.created_at,
    updated_at: activity.updated_at,
    ...(activity.deleted_at !== undefined ? { deleted_at: activity.deleted_at } : {})
  };
}

function createConflictWarnings(activityDate, activityConflicts, routineConflicts) {
  return [
    ...activityConflicts.map((activity) => ({
      code: "SCHEDULE_CONFLICT",
      entity_type: "activity",
      entity_id: Number(activity.id),
      title: activity.title,
      date: activity.activity_date,
      start_time: activity.start_time,
      end_time: activity.end_time,
      message: `Jadwal ini bertabrakan dengan aktivitas '${activity.title}' pukul ${activity.start_time}-${activity.end_time}.`
    })),
    ...routineConflicts.map((routine) => ({
      code: "SCHEDULE_CONFLICT",
      entity_type: "routine",
      entity_id: Number(routine.id),
      title: routine.title,
      date: activityDate,
      day_of_week: Number(routine.day_of_week),
      start_time: routine.start_time,
      end_time: routine.end_time,
      message: `Jadwal ini bertabrakan dengan rutinitas '${routine.title}' pukul ${routine.start_time}-${routine.end_time}.`
    }))
  ];
}

function createActivityService({ activityRepository, nowProvider = () => new Date() }) {
  function getNow() {
    return nowProvider();
  }

  function buildActivityPayload(input, { defaultStatus = "scheduled", existingConfirmedAt = null } = {}) {
    const errors = [];
    const title = normalizeRequiredText(input.title);
    const category = input.category === undefined ? undefined : String(input.category).trim();
    const activityDate = normalizeLocalDate(input.activity_date);
    const startTime = normalizeLocalTime(input.start_time);
    const endTime = normalizeLocalTime(input.end_time);
    const notes = normalizeNullableText(input.notes);
    const status = input.status === undefined ? defaultStatus : String(input.status).trim();

    if (!title) {
      errors.push({ code: "VALIDATION_ERROR", field: "title", message: "Title is required." });
    }

    if (!ACTIVITY_CATEGORIES.includes(category)) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "category",
        message: "Category must use a supported value."
      });
    }

    if (!activityDate) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "activity_date",
        message: "Activity date must be a valid YYYY-MM-DD date."
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

    if (!ACTIVITY_STATUSES.includes(status)) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "status",
        message: "Status must use a supported value."
      });
    }

    if (startTime && endTime && endTime <= startTime) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "end_time",
        message: "End time must be greater than start time."
      });
    }

    if (errors.length > 0) {
      throw createValidationError(errors);
    }

    let confirmedAt = null;
    if (status === "completed" || status === "cancelled") {
      confirmedAt = existingConfirmedAt || createUtcIso(getNow());
    }

    return {
      title,
      category,
      activity_date: activityDate,
      start_time: startTime,
      end_time: endTime,
      status,
      notes,
      confirmed_at: confirmedAt
    };
  }

  function validateStatusPatch(input, existingConfirmedAt) {
    const errors = [];
    const keys = Object.keys(input || {});
    const status = input ? String(input.status || "").trim() : "";

    if (keys.length !== 1 || !keys.includes("status")) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "status",
        message: "Only the status field is allowed."
      });
    }

    if (!ACTIVITY_CONFIRMABLE_STATUSES.includes(status)) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "status",
        message: "Status must be completed or cancelled."
      });
    }

    if (errors.length > 0) {
      throw createValidationError(errors);
    }

    return {
      status,
      confirmed_at: existingConfirmedAt || createUtcIso(getNow())
    };
  }

  function buildListQuery(query) {
    const errors = [];
    const page = parsePositiveInteger(query.page, 1);
    const pageSize = parsePositiveInteger(query.page_size, 20, 100);
    const search = query.search ? String(query.search).trim().toLowerCase() : "";
    const category = query.category ? String(query.category).trim() : undefined;
    const status = query.status ? String(query.status).trim() : undefined;
    const dateFrom = query.date_from ? normalizeLocalDate(query.date_from) : undefined;
    const dateTo = query.date_to ? normalizeLocalDate(query.date_to) : undefined;
    const startTimeFrom = query.start_time_from ? normalizeLocalTime(query.start_time_from) : undefined;
    const startTimeTo = query.start_time_to ? normalizeLocalTime(query.start_time_to) : undefined;
    const endTimeFrom = query.end_time_from ? normalizeLocalTime(query.end_time_from) : undefined;
    const endTimeTo = query.end_time_to ? normalizeLocalTime(query.end_time_to) : undefined;
    const sort = query.sort ? String(query.sort) : "activity_date";
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

    if (query.category && !ACTIVITY_CATEGORIES.includes(category)) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "category",
        message: "Category filter must use a supported value."
      });
    }

    if (query.status && !ACTIVITY_STATUSES.includes(status)) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "status",
        message: "Status filter must use a supported value."
      });
    }

    if (query.date_from && !dateFrom) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "date_from",
        message: "Date-from filter must be a valid YYYY-MM-DD date."
      });
    }

    if (query.date_to && !dateTo) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "date_to",
        message: "Date-to filter must be a valid YYYY-MM-DD date."
      });
    }

    if (query.start_time_from && !startTimeFrom) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "start_time_from",
        message: "Start-time-from filter must be a valid HH:mm value."
      });
    }

    if (query.start_time_to && !startTimeTo) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "start_time_to",
        message: "Start-time-to filter must be a valid HH:mm value."
      });
    }

    if (query.end_time_from && !endTimeFrom) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "end_time_from",
        message: "End-time-from filter must be a valid HH:mm value."
      });
    }

    if (query.end_time_to && !endTimeTo) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "end_time_to",
        message: "End-time-to filter must be a valid HH:mm value."
      });
    }

    if (!["activity_date", "start_time", "end_time", "created_at", "title"].includes(sort)) {
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
        category,
        status,
        dateFrom,
        dateTo,
        startTimeFrom,
        startTimeTo,
        endTimeFrom,
        endTimeTo
      },
      order,
      page,
      pageSize,
      sort
    };
  }

  function getActivityOrThrow(activityId, userId) {
    const activity = activityRepository.findActivityByIdForUser(activityId, userId);
    if (!activity) {
      throw new AppError("Activity not found.", {
        statusCode: 404,
        code: "NOT_FOUND"
      });
    }

    return activity;
  }

  function findConflicts(userId, payload, excludeActivityId) {
    if (payload.status === "cancelled") {
      return [];
    }

    const activityConflicts = activityRepository.findActivityConflicts({
      userId,
      activityDate: payload.activity_date,
      startTime: payload.start_time,
      endTime: payload.end_time,
      excludeActivityId
    });
    const routineConflicts = activityRepository.findRoutineConflicts({
      userId,
      dayOfWeek: getJakartaDayOfWeek(payload.activity_date),
      startTime: payload.start_time,
      endTime: payload.end_time
    });

    return createConflictWarnings(payload.activity_date, activityConflicts, routineConflicts);
  }

  return {
    createActivity(userId, input) {
      const payload = buildActivityPayload(input, { defaultStatus: "scheduled" });
      const now = getNow();
      const nowIso = createUtcIso(now);
      const activityId = activityRepository.createActivity({
        user_id: userId,
        ...payload,
        created_at: nowIso,
        updated_at: nowIso
      });
      const activity = getActivityOrThrow(activityId, userId);

      return {
        activity: mapActivity(activity, now),
        warnings: findConflicts(userId, payload, activityId)
      };
    },

    deleteActivity(activityId, userId) {
      const nowIso = createUtcIso(getNow());
      getActivityOrThrow(activityId, userId);
      activityRepository.softDeleteActivity(activityId, userId, nowIso, nowIso);
      return { deleted: true };
    },

    getActivity(activityId, userId) {
      return mapActivity(getActivityOrThrow(activityId, userId), getNow());
    },

    listActivities(userId, query) {
      const parsed = buildListQuery(query);
      const now = getNow();
      const result = activityRepository.listActivitiesForUser({
        filters: {
          ...parsed.filters,
          userId
        },
        pagination: {
          limit: parsed.pageSize,
          offset: (parsed.page - 1) * parsed.pageSize
        },
        sort: parsed.sort,
        order: parsed.order
      });

      return {
        items: result.items.map((activity) => mapActivity(activity, now)),
        pagination: {
          page: parsed.page,
          page_size: parsed.pageSize,
          total_items: result.totalItems,
          total_pages: result.totalItems === 0 ? 0 : Math.ceil(result.totalItems / parsed.pageSize)
        }
      };
    },

    updateActivity(activityId, userId, input) {
      const existing = getActivityOrThrow(activityId, userId);
      const payload = buildActivityPayload(input, {
        defaultStatus: existing.status,
        existingConfirmedAt: existing.confirmed_at
      });
      activityRepository.updateActivity(activityId, userId, {
        ...payload,
        updated_at: createUtcIso(getNow())
      });
      const activity = getActivityOrThrow(activityId, userId);

      return {
        activity: mapActivity(activity, getNow()),
        warnings: findConflicts(userId, payload, activityId)
      };
    },

    updateActivityStatus(activityId, userId, input) {
      const existing = getActivityOrThrow(activityId, userId);
      const payload = validateStatusPatch(input, existing.confirmed_at);
      activityRepository.updateActivityStatus(
        activityId,
        userId,
        payload.status,
        payload.confirmed_at,
        createUtcIso(getNow())
      );
      return {
        activity: mapActivity(getActivityOrThrow(activityId, userId), getNow()),
        warnings: []
      };
    }
  };
}

module.exports = {
  computeActivityStatus,
  createActivityService,
  normalizeLocalDate,
  normalizeLocalTime
};
