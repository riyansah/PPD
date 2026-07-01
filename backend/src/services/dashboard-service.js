const { AppError } = require("../errors/app-error");
const { formatJakartaDate, formatJakartaTime } = require("../utils/time");

const PERIODS = ["weekly", "monthly"];
const WEEK_IN_DAYS = 7;

function createValidationError(errors) {
  const error = new AppError("Validation failed.", {
    statusCode: 422,
    code: "VALIDATION_ERROR"
  });
  error.details = errors;
  return error;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function parsePositiveInteger(value, fallback, maximum) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > maximum) {
    return null;
  }

  return parsed;
}

function parsePeriod(value) {
  const period = value ? String(value).trim() : "weekly";
  return PERIODS.includes(period) ? period : null;
}

function getJakartaDateParts(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  return { year, month, day };
}

function addDaysToLocalDate(dateValue, days) {
  const { year, month, day } = getJakartaDateParts(dateValue);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function getDayOfWeek(dateValue) {
  const { year, month, day } = getJakartaDateParts(dateValue);
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return dayOfWeek === 0 ? 7 : dayOfWeek;
}

function localDateStartToUtcIso(dateValue) {
  const { year, month, day } = getJakartaDateParts(dateValue);
  return new Date(Date.UTC(year, month - 1, day, -7, 0, 0, 0)).toISOString();
}

function createPeriodRange(period, now) {
  const currentDate = formatJakartaDate(now);

  if (period === "monthly") {
    const { year, month } = getJakartaDateParts(currentDate);
    const startDate = `${year}-${pad(month)}-01`;
    const endExclusiveDate = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${pad(month + 1)}-01`;

    return {
      period,
      start_date: startDate,
      end_date: addDaysToLocalDate(endExclusiveDate, -1),
      start_iso: localDateStartToUtcIso(startDate),
      end_iso: localDateStartToUtcIso(endExclusiveDate)
    };
  }

  const startDate = addDaysToLocalDate(currentDate, 1 - getDayOfWeek(currentDate));
  const endExclusiveDate = addDaysToLocalDate(startDate, WEEK_IN_DAYS);

  return {
    period,
    start_date: startDate,
    end_date: addDaysToLocalDate(endExclusiveDate, -1),
    start_iso: localDateStartToUtcIso(startDate),
    end_iso: localDateStartToUtcIso(endExclusiveDate)
  };
}

function computeActivityStatus(activity, now) {
  if (activity.status === "completed" || activity.status === "cancelled") {
    return activity.status;
  }

  const currentDate = formatJakartaDate(now);
  const currentTime = formatJakartaTime(now);

  if (activity.activity_date < currentDate || (activity.activity_date === currentDate && currentTime >= activity.end_time)) {
    return "pending_confirmation";
  }

  if (activity.activity_date === currentDate && currentTime >= activity.start_time) {
    return "in_progress";
  }

  return "upcoming";
}

function mapTodayActivity(activity, now) {
  const computedStatus = computeActivityStatus(activity, now);

  return {
    id: Number(activity.id),
    entity_type: "activity",
    title: activity.title,
    label: "Aktivitas",
    category: activity.category,
    priority: null,
    status: activity.status,
    computed_status: computedStatus,
    start_time: activity.start_time,
    end_time: activity.end_time,
    scheduled_date: activity.activity_date,
    actionable: computedStatus === "pending_confirmation"
  };
}

function mapTodayRoutine(history) {
  return {
    id: Number(history.routine_id),
    history_id: Number(history.id),
    entity_type: "routine",
    title: history.routine_title_snapshot,
    label: "Rutinitas",
    category: null,
    priority: history.priority || "medium",
    status: history.status,
    computed_status: history.status,
    start_time: history.scheduled_start,
    end_time: history.scheduled_end,
    scheduled_date: history.scheduled_date,
    actionable: history.status === "missed_pending"
  };
}

function createDashboardService({
  dashboardRepository,
  routineService,
  nowProvider = () => new Date()
}) {
  function getNow() {
    return nowProvider();
  }

  return {
    getCharts(userId, query = {}) {
      const period = parsePeriod(query.period);
      if (!period) {
        throw createValidationError([{
          code: "VALIDATION_ERROR",
          field: "period",
          message: "Period must be weekly or monthly."
        }]);
      }

      const now = getNow();
      const range = createPeriodRange(period, now);

      return {
        period,
        range: {
          start_date: range.start_date,
          end_date: range.end_date
        },
        tasks_by_status: dashboardRepository.getTaskStatusChart(
          userId,
          now.toISOString(),
          range.start_iso,
          range.end_iso
        ),
        activities_by_status: dashboardRepository.getActivityStatusChart(
          userId,
          range.start_date,
          range.end_date,
          formatJakartaDate(now),
          formatJakartaTime(now)
        ),
        activities_by_category: dashboardRepository.getActivityCategoryChart(
          userId,
          range.start_date,
          range.end_date
        )
      };
    },

    getDeadlines(userId, query = {}) {
      const limit = parsePositiveInteger(query.limit, 5, 20);
      if (limit === null) {
        throw createValidationError([{
          code: "VALIDATION_ERROR",
          field: "limit",
          message: "Limit must be a positive integer not greater than 20."
        }]);
      }

      const now = getNow();
      const nowMs = now.getTime();

      return {
        items: dashboardRepository.listUpcomingDeadlines(userId, now.toISOString(), limit).map((task) => {
          const deadlineMs = new Date(task.deadline_at).getTime();
          return {
            id: Number(task.id),
            title: task.title,
            priority: task.priority,
            status: task.status,
            deadline_at: task.deadline_at,
            is_overdue: Boolean(task.is_overdue),
            countdown_seconds: Math.max(0, Math.floor((deadlineMs - nowMs) / 1000))
          };
        })
      };
    },

    getSummary(userId, query = {}) {
      const period = parsePeriod(query.period);
      if (!period) {
        throw createValidationError([{
          code: "VALIDATION_ERROR",
          field: "period",
          message: "Period must be weekly or monthly."
        }]);
      }

      if (routineService) {
        routineService.reconcileRoutineHistories();
      }

      const now = getNow();
      const currentDate = formatJakartaDate(now);
      const taskSummary = dashboardRepository.getTaskSummary(userId, now.toISOString());
      const activeTotal = Number(taskSummary.active_total || 0);
      const completed = Number(taskSummary.completed || 0);

      return {
        period,
        task_counts: {
          total: Number(taskSummary.total || 0),
          in_progress: Number(taskSummary.in_progress || 0),
          completed,
          paused: Number(taskSummary.paused || 0),
          overdue: Number(taskSummary.overdue || 0)
        },
        activity_counts: {
          today: dashboardRepository.countActivitiesToday(userId, currentDate)
        },
        routine_counts: {
          today: dashboardRepository.countRoutinesToday(userId, currentDate)
        },
        task_completion_percentage: activeTotal === 0 ? 0 : Math.round((completed / activeTotal) * 100)
      };
    },

    getToday(userId) {
      if (routineService) {
        routineService.reconcileRoutineHistories();
      }

      const now = getNow();
      const currentDate = formatJakartaDate(now);
      const activities = dashboardRepository
        .listTodayActivities(userId, currentDate)
        .map((activity) => mapTodayActivity(activity, now));
      const routines = dashboardRepository
        .listTodayRoutineHistories(userId, currentDate)
        .map(mapTodayRoutine);

      return {
        items: [...activities, ...routines].sort((left, right) => {
          const timeDiff = left.start_time.localeCompare(right.start_time);
          if (timeDiff !== 0) {
            return timeDiff;
          }
          return left.label.localeCompare(right.label);
        })
      };
    }
  };
}

module.exports = {
  createDashboardService
};
