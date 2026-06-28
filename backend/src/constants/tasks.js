const TASK_STATUSES = ["in_progress", "completed", "paused", "cancelled"];
const TASK_PRIORITIES = ["low", "medium", "high", "urgent"];
const PRIORITY_ORDER = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4
};

module.exports = {
  PRIORITY_ORDER,
  TASK_PRIORITIES,
  TASK_STATUSES
};
