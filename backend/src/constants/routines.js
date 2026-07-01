const ROUTINE_PRIORITIES = ["low", "medium", "high", "urgent"];
const ROUTINE_CONFIRMABLE_STATUSES = ["completed", "cancelled"];
const ROUTINE_HISTORY_STATUSES = ["missed_pending", "completed", "missed", "cancelled"];
const PRIORITY_ORDER = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4
};

module.exports = {
  PRIORITY_ORDER,
  ROUTINE_CONFIRMABLE_STATUSES,
  ROUTINE_HISTORY_STATUSES,
  ROUTINE_PRIORITIES
};
