const test = require("node:test");
const assert = require("node:assert/strict");

const {
  WIB_TIMEZONE,
  formatJakartaDate,
  formatJakartaDateTime,
  formatJakartaTime,
  getServerTimeMeta
} = require("../backend/src/utils/time");

test("Jakarta formatters convert UTC to WIB", () => {
  const input = new Date("2026-06-28T17:15:30.000Z");

  assert.equal(formatJakartaDate(input), "2026-06-29");
  assert.equal(formatJakartaTime(input), "00:15");
  assert.equal(formatJakartaDateTime(input), "2026-06-29 00:15:30");
});

test("server time metadata includes the required timezone", () => {
  const meta = getServerTimeMeta(new Date("2026-06-28T00:00:00.000Z"));

  assert.equal(meta.timezone, WIB_TIMEZONE);
  assert.equal(meta.server_time, "2026-06-28T00:00:00.000Z");
});
