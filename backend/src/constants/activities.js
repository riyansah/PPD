const ACTIVITY_CATEGORIES = ["pekerjaan", "belajar", "olahraga", "sosial", "pribadi"];
const ACTIVITY_STATUSES = ["scheduled", "completed", "cancelled"];
const ACTIVITY_CONFIRMABLE_STATUSES = ["completed", "cancelled"];
const ACTIVITY_COMPUTED_STATUSES = [
  "upcoming",
  "in_progress",
  "pending_confirmation",
  "completed",
  "cancelled"
];

module.exports = {
  ACTIVITY_CATEGORIES,
  ACTIVITY_COMPUTED_STATUSES,
  ACTIVITY_CONFIRMABLE_STATUSES,
  ACTIVITY_STATUSES
};
