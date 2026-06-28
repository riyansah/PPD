const WIB_TIMEZONE = "Asia/Jakarta";
const WIB_OFFSET_MINUTES = 7 * 60;

function pad(value) {
  return String(value).padStart(2, "0");
}

function createUtcIso(date = new Date()) {
  return date.toISOString();
}

function getJakartaDateParts(input = new Date()) {
  const date = input instanceof Date ? input : new Date(input);
  const shifted = new Date(date.getTime() + WIB_OFFSET_MINUTES * 60 * 1000);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
    seconds: shifted.getUTCSeconds()
  };
}

function formatJakartaDate(input = new Date()) {
  const parts = getJakartaDateParts(input);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function formatJakartaTime(input = new Date()) {
  const parts = getJakartaDateParts(input);
  return `${pad(parts.hours)}:${pad(parts.minutes)}`;
}

function formatJakartaDateTime(input = new Date()) {
  const parts = getJakartaDateParts(input);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)} ${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`;
}

function getServerTimeMeta(now = new Date()) {
  return {
    server_time: createUtcIso(now),
    timezone: WIB_TIMEZONE,
    local_date: formatJakartaDate(now),
    local_time: formatJakartaTime(now)
  };
}

module.exports = {
  WIB_TIMEZONE,
  createUtcIso,
  formatJakartaDate,
  formatJakartaDateTime,
  formatJakartaTime,
  getJakartaDateParts,
  getServerTimeMeta
};
