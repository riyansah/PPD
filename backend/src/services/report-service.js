const { AppError } = require("../errors/app-error");
const { formatJakartaDate, formatJakartaDateTime } = require("../utils/time");

const PERIODS = ["daily", "weekly", "monthly", "custom"];
const DATASETS = ["tasks", "activities", "routines", "summary"];

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

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }

  return normalized;
}

function getLocalDateParts(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  return { year, month, day };
}

function addDays(dateValue, days) {
  const { year, month, day } = getLocalDateParts(dateValue);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function getDayOfWeek(dateValue) {
  const { year, month, day } = getLocalDateParts(dateValue);
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return dayOfWeek === 0 ? 7 : dayOfWeek;
}

function localDateStartToUtcIso(dateValue) {
  const { year, month, day } = getLocalDateParts(dateValue);
  return new Date(Date.UTC(year, month - 1, day, -7, 0, 0, 0)).toISOString();
}

function parseReportPeriod(query, now) {
  const period = query.period ? String(query.period).trim() : "weekly";
  const errors = [];

  if (!PERIODS.includes(period)) {
    errors.push({
      code: "VALIDATION_ERROR",
      field: "period",
      message: "Period must be daily, weekly, monthly, or custom."
    });
  }

  const anchorDate = normalizeLocalDate(query.date) || formatJakartaDate(now);
  const startDateInput = normalizeLocalDate(query.start_date);
  const endDateInput = normalizeLocalDate(query.end_date);

  if (query.date && !normalizeLocalDate(query.date)) {
    errors.push({
      code: "VALIDATION_ERROR",
      field: "date",
      message: "Date must be a valid YYYY-MM-DD date."
    });
  }

  if (period === "custom") {
    if (!startDateInput) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "start_date",
        message: "Start date is required for custom reports."
      });
    }

    if (!endDateInput) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "end_date",
        message: "End date is required for custom reports."
      });
    }

    if (startDateInput && endDateInput && endDateInput < startDateInput) {
      errors.push({
        code: "VALIDATION_ERROR",
        field: "end_date",
        message: "End date must be greater than or equal to start date."
      });
    }
  }

  if (errors.length > 0) {
    throw createValidationError(errors);
  }

  let startDate = anchorDate;
  let endDate = anchorDate;

  if (period === "weekly") {
    startDate = addDays(anchorDate, 1 - getDayOfWeek(anchorDate));
    endDate = addDays(startDate, 6);
  } else if (period === "monthly") {
    const { year, month } = getLocalDateParts(anchorDate);
    startDate = `${year}-${pad(month)}-01`;
    const endExclusive = month === 12 ? `${year + 1}-01-01` : `${year}-${pad(month + 1)}-01`;
    endDate = addDays(endExclusive, -1);
  } else if (period === "custom") {
    startDate = startDateInput;
    endDate = endDateInput;
  }

  return {
    period,
    date: anchorDate,
    start_date: startDate,
    end_date: endDate,
    start_iso: localDateStartToUtcIso(startDate),
    end_iso: localDateStartToUtcIso(addDays(endDate, 1))
  };
}

function toNumber(value) {
  return Number(value || 0);
}

function buildSummaryText({ periodRange, taskSummary, activitySummary, routineSummary, activityMostFrequent }) {
  const periodLabel = periodRange.period === "daily"
    ? "hari ini"
    : periodRange.period === "weekly"
      ? "periode mingguan ini"
      : periodRange.period === "monthly"
        ? "periode bulanan ini"
        : "rentang tanggal ini";
  const categoryText = activityMostFrequent.category
    ? `Kategori aktivitas yang paling sering dilakukan adalah ${activityMostFrequent.category}.`
    : "Belum ada aktivitas yang tercatat pada periode ini.";

  return `Pada ${periodLabel}, Anda menyelesaikan ${taskSummary.completed} dari ${taskSummary.active_total} pekerjaan aktif. ${categoryText} Terdapat ${taskSummary.overdue} pekerjaan yang melewati deadline dan ${routineSummary.missed} rutinitas yang terlewat.`;
}

function createSummary({ periodRange, rawTaskSummary, rawActivitySummary, rawRoutineSummary, activityCategoryDistribution, activityMostFrequent }) {
  const activeTasks = toNumber(rawTaskSummary.active_total);
  const completedTasks = toNumber(rawTaskSummary.completed);
  const routineTotal = toNumber(rawRoutineSummary.total_scheduled);
  const routineCompleted = toNumber(rawRoutineSummary.completed);
  const taskSummary = {
    total: toNumber(rawTaskSummary.total),
    completed: completedTasks,
    in_progress: toNumber(rawTaskSummary.in_progress),
    paused: toNumber(rawTaskSummary.paused),
    cancelled: toNumber(rawTaskSummary.cancelled),
    overdue: toNumber(rawTaskSummary.overdue),
    active_total: activeTasks,
    completion_percentage: activeTasks === 0 ? 0 : Math.round((completedTasks / activeTasks) * 100)
  };
  const activitySummary = {
    total: toNumber(rawActivitySummary.total),
    completed: toNumber(rawActivitySummary.completed),
    cancelled: toNumber(rawActivitySummary.cancelled),
    scheduled: toNumber(rawActivitySummary.scheduled),
    category_distribution: activityCategoryDistribution
  };
  const routineSummary = {
    total_scheduled: routineTotal,
    completed: routineCompleted,
    missed: toNumber(rawRoutineSummary.missed),
    cancelled: toNumber(rawRoutineSummary.cancelled),
    pending: toNumber(rawRoutineSummary.pending),
    completion_percentage: routineTotal === 0 ? 0 : Math.round((routineCompleted / routineTotal) * 100)
  };

  return {
    period: periodRange.period,
    range: {
      start_date: periodRange.start_date,
      end_date: periodRange.end_date
    },
    task_summary: taskSummary,
    activity_summary: activitySummary,
    routine_summary: routineSummary,
    activity_most_frequent: activityMostFrequent,
    charts: {
      tasks_by_status: {
        in_progress: taskSummary.in_progress,
        completed: taskSummary.completed,
        paused: taskSummary.paused,
        cancelled: taskSummary.cancelled,
        overdue: taskSummary.overdue
      },
      activities_by_status: {
        scheduled: activitySummary.scheduled,
        completed: activitySummary.completed,
        cancelled: activitySummary.cancelled
      },
      activities_by_category: activitySummary.category_distribution,
      routines_by_status: {
        completed: routineSummary.completed,
        missed: routineSummary.missed,
        cancelled: routineSummary.cancelled,
        pending: routineSummary.pending
      }
    },
    generated_summary_text: buildSummaryText({
      periodRange,
      taskSummary,
      activitySummary,
      routineSummary,
      activityMostFrequent
    })
  };
}

function csvEscape(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);
  return /[",\n\r]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function createCsv(headers, rows) {
  const lines = [
    headers.map((header) => csvEscape(header.label)).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header.key])).join(","))
  ];

  return `\ufeff${lines.join("\n")}\n`;
}

function flattenSummary(summary) {
  return [
    { metric: "period", value: summary.period },
    { metric: "start_date", value: summary.range.start_date },
    { metric: "end_date", value: summary.range.end_date },
    { metric: "tasks_total", value: summary.task_summary.total },
    { metric: "tasks_completed", value: summary.task_summary.completed },
    { metric: "tasks_in_progress", value: summary.task_summary.in_progress },
    { metric: "tasks_paused", value: summary.task_summary.paused },
    { metric: "tasks_cancelled", value: summary.task_summary.cancelled },
    { metric: "tasks_overdue", value: summary.task_summary.overdue },
    { metric: "tasks_completion_percentage", value: summary.task_summary.completion_percentage },
    { metric: "activities_total", value: summary.activity_summary.total },
    { metric: "activities_completed", value: summary.activity_summary.completed },
    { metric: "activities_cancelled", value: summary.activity_summary.cancelled },
    { metric: "routines_total_scheduled", value: summary.routine_summary.total_scheduled },
    { metric: "routines_completed", value: summary.routine_summary.completed },
    { metric: "routines_missed", value: summary.routine_summary.missed },
    { metric: "routines_completion_percentage", value: summary.routine_summary.completion_percentage },
    { metric: "generated_summary_text", value: summary.generated_summary_text }
  ];
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createZip(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.name);
    const data = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data, "utf8");
    const crc = crc32(data);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, name, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);
    offset += localHeader.length + name.length + data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const localDirectory = Buffer.concat(localParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(localDirectory.length, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([localDirectory, centralDirectory, end]);
}

function escapePdfText(value) {
  return String(value ?? "").replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function createPdf(lines) {
  const content = [
    "BT",
    "/F1 10 Tf",
    "50 760 Td",
    ...lines.slice(0, 62).map((line, index) => `${index === 0 ? "" : "T* "}${`(${escapePdfText(line)}) Tj`}`),
    "ET"
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`
  ];
  const chunks = [Buffer.from("%PDF-1.4\n")];
  const offsets = [0];

  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.concat(chunks).length);
    chunks.push(Buffer.from(`${index + 1} 0 obj\n${object}\nendobj\n`));
  }

  const xrefOffset = Buffer.concat(chunks).length;
  const xrefRows = ["xref", `0 ${objects.length + 1}`, "0000000000 65535 f "];
  for (let index = 1; index < offsets.length; index += 1) {
    xrefRows.push(`${String(offsets[index]).padStart(10, "0")} 00000 n `);
  }

  chunks.push(Buffer.from(`${xrefRows.join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`));
  return Buffer.concat(chunks);
}

function createReportService({ reportRepository, routineService, nowProvider = () => new Date() }) {
  function getNow() {
    return nowProvider();
  }

  function getPeriodRange(query) {
    return parseReportPeriod(query || {}, getNow());
  }

  function getSummary(userId, query) {
    if (routineService) {
      routineService.reconcileRoutineHistories();
    }

    const now = getNow();
    const periodRange = getPeriodRange(query);
    const activityCategoryDistribution = reportRepository.getActivityCategoryCounts(
      userId,
      periodRange.start_date,
      periodRange.end_date
    );

    return createSummary({
      periodRange,
      rawTaskSummary: reportRepository.getTaskSummary(userId, now.toISOString(), periodRange.start_iso, periodRange.end_iso),
      rawActivitySummary: reportRepository.getActivitySummary(userId, periodRange.start_date, periodRange.end_date),
      rawRoutineSummary: reportRepository.getRoutineSummary(userId, periodRange.start_date, periodRange.end_date),
      activityCategoryDistribution,
      activityMostFrequent: reportRepository.getActivityMostFrequent(userId, periodRange.start_date, periodRange.end_date)
    });
  }

  function listTasks(userId, query) {
    const now = getNow();
    const periodRange = getPeriodRange(query);
    return {
      period: periodRange.period,
      range: { start_date: periodRange.start_date, end_date: periodRange.end_date },
      items: reportRepository.listTasks(userId, now.toISOString(), periodRange.start_iso, periodRange.end_iso).map((task) => ({
        ...task,
        id: Number(task.id),
        is_overdue: Boolean(task.is_overdue)
      }))
    };
  }

  function listActivities(userId, query) {
    const periodRange = getPeriodRange(query);
    return {
      period: periodRange.period,
      range: { start_date: periodRange.start_date, end_date: periodRange.end_date },
      items: reportRepository.listActivities(userId, periodRange.start_date, periodRange.end_date).map((activity) => ({
        ...activity,
        id: Number(activity.id)
      }))
    };
  }

  function listRoutines(userId, query) {
    const periodRange = getPeriodRange(query);
    return {
      period: periodRange.period,
      range: { start_date: periodRange.start_date, end_date: periodRange.end_date },
      items: reportRepository.listRoutineHistories(userId, periodRange.start_date, periodRange.end_date).map((history) => ({
        ...history,
        id: Number(history.id),
        routine_id: Number(history.routine_id)
      }))
    };
  }

  function createCsvDataset(dataset, userId, query) {
    if (dataset === "tasks") {
      return createCsv([
        { key: "id", label: "id" },
        { key: "title", label: "title" },
        { key: "status", label: "status" },
        { key: "priority", label: "priority" },
        { key: "start_at", label: "start_at" },
        { key: "deadline_at", label: "deadline_at" },
        { key: "completed_at", label: "completed_at" },
        { key: "is_overdue", label: "is_overdue" }
      ], listTasks(userId, query).items);
    }

    if (dataset === "activities") {
      return createCsv([
        { key: "id", label: "id" },
        { key: "title", label: "title" },
        { key: "category", label: "category" },
        { key: "activity_date", label: "activity_date" },
        { key: "start_time", label: "start_time" },
        { key: "end_time", label: "end_time" },
        { key: "status", label: "status" },
        { key: "confirmed_at", label: "confirmed_at" }
      ], listActivities(userId, query).items);
    }

    if (dataset === "routines") {
      return createCsv([
        { key: "id", label: "id" },
        { key: "routine_id", label: "routine_id" },
        { key: "routine_title_snapshot", label: "routine_title_snapshot" },
        { key: "scheduled_date", label: "scheduled_date" },
        { key: "scheduled_start", label: "scheduled_start" },
        { key: "scheduled_end", label: "scheduled_end" },
        { key: "status", label: "status" },
        { key: "confirmed_at", label: "confirmed_at" }
      ], listRoutines(userId, query).items);
    }

    return createCsv([
      { key: "metric", label: "metric" },
      { key: "value", label: "value" }
    ], flattenSummary(getSummary(userId, query)));
  }

  return {
    exportCsv(userId, query = {}) {
      const requestedDatasets = String(query.datasets || "tasks,activities,routines,summary")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const uniqueDatasets = [...new Set(requestedDatasets)];
      const invalid = uniqueDatasets.find((dataset) => !DATASETS.includes(dataset));
      if (!uniqueDatasets.length || invalid) {
        throw createValidationError([{
          code: "VALIDATION_ERROR",
          field: "datasets",
          message: "Datasets must include one or more of tasks, activities, routines, or summary."
        }]);
      }

      const periodRange = getPeriodRange(query);
      const files = uniqueDatasets.map((dataset) => ({
        name: `${dataset}.csv`,
        data: createCsvDataset(dataset, userId, query)
      }));
      const suffix = `${periodRange.start_date}_${periodRange.end_date}`;

      if (files.length === 1) {
        return {
          body: Buffer.from(files[0].data, "utf8"),
          contentType: "text/csv; charset=utf-8",
          filename: `laporan-${files[0].name.replace(".csv", "")}-${suffix}.csv`
        };
      }

      return {
        body: createZip(files),
        contentType: "application/zip",
        filename: `laporan-produktivitas-${suffix}.zip`
      };
    },

    exportPdf(user, query = {}) {
      const summary = getSummary(user.id, query);
      const tasks = listTasks(user.id, query).items;
      const activities = listActivities(user.id, query).items;
      const routines = listRoutines(user.id, query).items;
      const printedAt = formatJakartaDateTime(getNow());
      const lines = [
        "Laporan Produktivitas",
        `Nama pengguna: ${user.display_name || user.username}`,
        `Periode: ${summary.range.start_date} sampai ${summary.range.end_date}`,
        `Tanggal cetak: ${printedAt} WIB`,
        "",
        "Ringkasan:",
        summary.generated_summary_text,
        "",
        "Statistik utama:",
        `Pekerjaan total/selesai/terlambat: ${summary.task_summary.total}/${summary.task_summary.completed}/${summary.task_summary.overdue}`,
        `Aktivitas total/selesai/dibatalkan: ${summary.activity_summary.total}/${summary.activity_summary.completed}/${summary.activity_summary.cancelled}`,
        `Rutinitas terjadwal/selesai/terlewat: ${summary.routine_summary.total_scheduled}/${summary.routine_summary.completed}/${summary.routine_summary.missed}`,
        "",
        "Grafik:",
        `Pekerjaan: ${Object.entries(summary.charts.tasks_by_status).map(([key, value]) => `${key}=${value}`).join(", ")}`,
        `Aktivitas: ${Object.entries(summary.charts.activities_by_status).map(([key, value]) => `${key}=${value}`).join(", ")}`,
        `Rutinitas: ${Object.entries(summary.charts.routines_by_status).map(([key, value]) => `${key}=${value}`).join(", ")}`,
        "",
        "Tabel pekerjaan:",
        ...tasks.slice(0, 12).map((task) => `#${task.id} ${task.title} | ${task.status} | ${task.deadline_at}`),
        "",
        "Tabel aktivitas:",
        ...activities.slice(0, 12).map((activity) => `#${activity.id} ${activity.title} | ${activity.category} | ${activity.activity_date} ${activity.start_time}-${activity.end_time}`),
        "",
        "Tabel rutinitas:",
        ...routines.slice(0, 12).map((routine) => `#${routine.id} ${routine.routine_title_snapshot} | ${routine.status} | ${routine.scheduled_date} ${routine.scheduled_start}-${routine.scheduled_end}`),
        "",
        "Halaman 1"
      ];

      return {
        body: createPdf(lines),
        contentType: "application/pdf",
        filename: `laporan-produktivitas-${summary.range.start_date}_${summary.range.end_date}.pdf`
      };
    },

    getSummary,
    listActivities,
    listRoutines,
    listTasks
  };
}

module.exports = {
  createReportService
};
