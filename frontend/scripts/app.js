const STATUS_LABELS = {
  in_progress: "Sedang berjalan",
  completed: "Selesai",
  paused: "Tertunda",
  cancelled: "Dibatalkan"
};

const PRIORITY_LABELS = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
  urgent: "Mendesak"
};

const ACTIVITY_CATEGORY_LABELS = {
  pekerjaan: "Pekerjaan",
  belajar: "Belajar",
  olahraga: "Olahraga",
  sosial: "Sosial",
  pribadi: "Pribadi"
};

const ACTIVITY_STATUS_LABELS = {
  scheduled: "Terjadwal",
  completed: "Selesai",
  cancelled: "Dibatalkan"
};

const ACTIVITY_COMPUTED_STATUS_LABELS = {
  upcoming: "Akan datang",
  in_progress: "Sedang berlangsung",
  pending_confirmation: "Menunggu konfirmasi",
  completed: "Selesai",
  cancelled: "Dibatalkan"
};

const WEEKDAY_LABELS = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
  7: "Minggu"
};

const ROUTINE_HISTORY_STATUS_LABELS = {
  missed_pending: "Menunggu konfirmasi",
  completed: "Selesai",
  missed: "Terlewat",
  cancelled: "Dibatalkan"
};

const WIB_OFFSET_MINUTES = 7 * 60;
const DASHBOARD_PAGE = "/dashboard";
const TASK_PAGE = "/tasks";
const ACTIVITY_PAGE = "/activities";
const ROUTINE_PAGE = "/routines";
const REPORTS_PAGE = "/reports";
const SECURITY_PAGE = "/security";

const state = {
  dashboard: {
    summary: null,
    today: [],
    deadlines: [],
    charts: null,
    countdownTimer: null,
    serverTimeBase: null,
    clientTimeBase: null
  },
  reports: {
    summary: null,
    tasks: [],
    activities: [],
    routines: []
  },
  activities: [],
  activityEditingId: null,
  activityPagination: {
    page: 1,
    page_size: 20,
    total_items: 0,
    total_pages: 0
  },
  routines: [],
  routineDetail: null,
  routineEditingId: null,
  routinePagination: {
    page: 1,
    page_size: 20,
    total_items: 0,
    total_pages: 0
  },
  selectedActivityId: null,
  selectedRoutineId: null,
  selectedTaskId: null,
  serverTime: null,
  taskEditingId: null,
  taskPagination: {
    page: 1,
    page_size: 20,
    total_items: 0,
    total_pages: 0
  },
  tasks: []
};

const elements = {
  dashboardChartRange: document.querySelector("[data-dashboard-chart-range]"),
  dashboardCharts: document.querySelector("[data-dashboard-charts]"),
  dashboardDeadlines: document.querySelector("[data-dashboard-deadlines]"),
  dashboardMessage: document.querySelector("[data-dashboard-message]"),
  dashboardPeriod: document.querySelector("[data-dashboard-period]"),
  dashboardSummary: document.querySelector("[data-dashboard-summary]"),
  dashboardToday: document.querySelector("[data-dashboard-today]"),
  reportExportCsvActivities: document.querySelector("[data-report-export-csv-activities]"),
  reportExportCsvAll: document.querySelector("[data-report-export-csv-all]"),
  reportExportCsvRoutines: document.querySelector("[data-report-export-csv-routines]"),
  reportExportCsvTasks: document.querySelector("[data-report-export-csv-tasks]"),
  reportExportPdf: document.querySelector("[data-report-export-pdf]"),
  reportFiltersForm: document.querySelector("[data-report-filters]"),
  reportMessage: document.querySelector("[data-report-message]"),
  reportRange: document.querySelector("[data-report-range]"),
  reportReset: document.querySelector("[data-report-reset]"),
  reportSummary: document.querySelector("[data-report-summary]"),
  reportSummaryText: document.querySelector("[data-report-summary-text]"),
  reportCharts: document.querySelector("[data-report-charts]"),
  reportTables: document.querySelector("[data-report-tables]"),
  accountDetails: document.querySelector("[data-account-details]"),
  activityDetail: document.querySelector("[data-activity-detail]"),
  activityFiltersForm: document.querySelector("[data-activity-filters]"),
  activityForm: document.querySelector("[data-activity-form]"),
  activityFormMessage: document.querySelector("[data-activity-form-message]"),
  activityFormTitle: document.querySelector("[data-activity-form-title]"),
  activityList: document.querySelector("[data-activity-list]"),
  activityListMessage: document.querySelector("[data-activity-list-message]"),
  activityPaginationLabel: document.querySelector("[data-activity-pagination-label]"),
  activityPageNext: document.querySelector("[data-activity-page-next]"),
  activityPagePrevious: document.querySelector("[data-activity-page-previous]"),
  activityReset: document.querySelector("[data-activity-reset]"),
  activitySubmit: document.querySelector("[data-activity-submit]"),
  activitySummary: document.querySelector("[data-activity-summary]"),
  activityWarningList: document.querySelector("[data-activity-warning-list]"),
  displayName: document.querySelector("[data-display-name]"),
  heroDescription: document.querySelector("[data-hero-description]"),
  heroEyebrow: document.querySelector("[data-hero-eyebrow]"),
  kpiSelectedLabel: document.querySelector("[data-kpi-selected-label]"),
  logoutButtons: Array.from(document.querySelectorAll("[data-logout-button]")),
  menuToggle: document.querySelector("[data-menu-toggle]"),
  metricAlertLabel: document.querySelector("[data-metric-alert-label]"),
  metricCard1Desc: document.querySelector("[data-metric-card-1-desc]"),
  metricCard1Label: document.querySelector("[data-metric-card-1-label]"),
  metricCard2Desc: document.querySelector("[data-metric-card-2-desc]"),
  metricCard2Label: document.querySelector("[data-metric-card-2-label]"),
  metricCard3Desc: document.querySelector("[data-metric-card-3-desc]"),
  metricCard3Label: document.querySelector("[data-metric-card-3-label]"),
  metricCard4Desc: document.querySelector("[data-metric-card-4-desc]"),
  metricCard4Label: document.querySelector("[data-metric-card-4-label]"),
  metricTotalLabel: document.querySelector("[data-metric-total-label]"),
  mobileMenu: document.getElementById("mobile-menu"),
  navLinks: Array.from(document.querySelectorAll("[data-nav-target]")),
  pageEyebrow: document.querySelector("[data-page-eyebrow]"),
  pageModules: Array.from(document.querySelectorAll("[data-page-section]")),
  pageTitle: document.querySelector("[data-page-title]"),
  passwordForm: document.querySelector("[data-password-form]"),
  passwordMessage: document.querySelector("[data-password-message]"),
  passwordSubmit: document.querySelector("[data-password-submit]"),
  routineDetail: document.querySelector("[data-routine-detail]"),
  routineFiltersForm: document.querySelector("[data-routine-filters]"),
  routineForm: document.querySelector("[data-routine-form]"),
  routineFormMessage: document.querySelector("[data-routine-form-message]"),
  routineFormTitle: document.querySelector("[data-routine-form-title]"),
  routineList: document.querySelector("[data-routine-list]"),
  routineListMessage: document.querySelector("[data-routine-list-message]"),
  routinePaginationLabel: document.querySelector("[data-routine-pagination-label]"),
  routinePageNext: document.querySelector("[data-routine-page-next]"),
  routinePagePrevious: document.querySelector("[data-routine-page-previous]"),
  routineReset: document.querySelector("[data-routine-reset]"),
  routineSubmit: document.querySelector("[data-routine-submit]"),
  routineSummary: document.querySelector("[data-routine-summary]"),
  routineWarningList: document.querySelector("[data-routine-warning-list]"),
  serverTime: document.querySelector("[data-server-time]"),
  sessionSummary: document.querySelector("[data-session-summary]"),
  statAlert: Array.from(document.querySelectorAll("[data-stat-alert]")),
  statSecondary1: Array.from(document.querySelectorAll("[data-stat-secondary-1]")),
  statSecondary2: Array.from(document.querySelectorAll("[data-stat-secondary-2]")),
  statSelected: Array.from(document.querySelectorAll("[data-stat-selected]")),
  statTotal: Array.from(document.querySelectorAll("[data-stat-total]")),
  taskDetail: document.querySelector("[data-task-detail]"),
  taskFiltersForm: document.querySelector("[data-task-filters]"),
  taskForm: document.querySelector("[data-task-form]"),
  taskFormMessage: document.querySelector("[data-task-form-message]"),
  taskFormTitle: document.querySelector("[data-task-form-title]"),
  taskList: document.querySelector("[data-task-list]"),
  taskListMessage: document.querySelector("[data-task-list-message]"),
  taskPaginationLabel: document.querySelector("[data-task-pagination-label]"),
  taskPageNext: document.querySelector("[data-task-page-next]"),
  taskPagePrevious: document.querySelector("[data-task-page-previous]"),
  taskReset: document.querySelector("[data-task-reset]"),
  taskSubmit: document.querySelector("[data-task-submit]"),
  taskSummary: document.querySelector("[data-task-summary]"),
  userSummary: document.querySelector("[data-user-summary]")
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function setText(targets, value) {
  for (const target of targets) {
    target.textContent = value;
  }
}

function setMessage(target, message, stateName = "") {
  if (!target) {
    return;
  }

  target.textContent = message;
  target.className = `form-message${stateName ? ` is-${stateName}` : ""}`;
}

function clearWarnings(target) {
  if (target) {
    target.innerHTML = "";
  }
}

function renderWarnings(target, warnings, heading = "Data berhasil disimpan dengan peringatan") {
  if (!target) {
    return;
  }

  target.innerHTML = "";
  for (const warning of warnings || []) {
    const item = document.createElement("div");
    item.className = "warning-card";
    item.innerHTML = `
      <strong>${escapeHtml(heading)}</strong>
      <p>${escapeHtml(warning.message)}</p>
      <p class="subtle">${escapeHtml((warning.entity_type || "").toUpperCase())} #${escapeHtml(String(warning.entity_id || "-"))} · ${escapeHtml(warning.start_time || "-")} - ${escapeHtml(warning.end_time || "-")}</p>
    `;
    target.appendChild(item);
  }
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const bodyText = await response.text();
  let payload = null;

  if (bodyText) {
    try {
      payload = JSON.parse(bodyText);
    } catch (error) {
      payload = null;
    }
  }

  return { response, payload };
}

function utcIsoToJakartaLocalInput(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const shifted = new Date(date.getTime() + WIB_OFFSET_MINUTES * 60 * 1000);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}T${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`;
}

function jakartaLocalInputToUtcIso(value) {
  if (!value) {
    return "";
  }

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/u);
  if (!match) {
    return "";
  }

  const [, year, month, day, hour, minute] = match;
  const utcMillis = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute) - WIB_OFFSET_MINUTES
  );

  return new Date(utcMillis).toISOString();
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta"
  }).format(new Date(value));
}

function formatLocalDate(value) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = String(value).split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta"
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatLocalTime(value) {
  return value || "-";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getErrorMessage(payload, fallback) {
  if (payload && Array.isArray(payload.errors) && payload.errors.length > 0) {
    return payload.errors.map((item) => item.message).join(" ");
  }

  return fallback;
}


function formatCountdown(seconds) {
  const totalSeconds = Math.max(0, Number(seconds) || 0);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
}

function getEstimatedServerNow() {
  if (!state.dashboard.serverTimeBase || !state.dashboard.clientTimeBase) {
    return state.serverTime ? new Date(state.serverTime) : new Date();
  }

  return new Date(state.dashboard.serverTimeBase.getTime() + (Date.now() - state.dashboard.clientTimeBase));
}

function syncDashboardClock(serverTime) {
  if (!serverTime) {
    return;
  }

  state.dashboard.serverTimeBase = new Date(serverTime);
  state.dashboard.clientTimeBase = Date.now();
}

function renderDashboardSummary() {
  if (!elements.dashboardSummary) {
    return;
  }

  const summary = state.dashboard.summary;
  if (!summary) {
    elements.dashboardSummary.innerHTML = '<div class="empty-copy">Ringkasan dashboard belum tersedia.</div>';
    return;
  }

  const cards = [
    ["Total pekerjaan", summary.task_counts.total],
    ["Sedang berjalan", summary.task_counts.in_progress],
    ["Selesai", summary.task_counts.completed],
    ["Tertunda", summary.task_counts.paused],
    ["Aktivitas hari ini", summary.activity_counts.today],
    ["Rutinitas hari ini", summary.routine_counts.today],
    ["Lewat deadline", summary.task_counts.overdue],
    ["Pekerjaan selesai", `${summary.task_completion_percentage}%`]
  ];

  elements.dashboardSummary.innerHTML = cards.map(([label, value], index) => `
    <article class="metric-card ${index === 0 ? "metric-accent" : index === 6 ? "metric-alert" : ""}">
      <span class="metric-label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
    </article>
  `).join("");
}

function renderDashboardToday() {
  if (!elements.dashboardToday) {
    return;
  }

  const items = state.dashboard.today;
  if (!items.length) {
    elements.dashboardToday.innerHTML = '<div class="empty-copy">Tidak ada agenda aktif untuk hari ini.</div>';
    return;
  }

  elements.dashboardToday.innerHTML = items.map((item) => {
    const isRoutine = item.entity_type === "routine";
    const statusLabel = isRoutine
      ? ROUTINE_HISTORY_STATUS_LABELS[item.computed_status] || item.computed_status
      : ACTIVITY_COMPUTED_STATUS_LABELS[item.computed_status] || item.computed_status;
    const secondary = isRoutine
      ? `Prioritas ${PRIORITY_LABELS[item.priority] || item.priority || "-"}`
      : ACTIVITY_CATEGORY_LABELS[item.category] || item.category || "-";

    return `
      <article class="task-card dashboard-agenda-card">
        <div class="task-card-main">
          <div class="task-card-heading">
            <div>
              <p class="panel-label">${escapeHtml(item.label)}</p>
              <h4>${escapeHtml(item.title)}</h4>
              <p class="subtle">${escapeHtml(item.start_time)} - ${escapeHtml(item.end_time)} · ${escapeHtml(secondary)}</p>
            </div>
            <div class="task-badges">
              <span class="badge ${isRoutine ? "badge-routine" : "badge-status"}">${escapeHtml(item.label)}</span>
              <span class="badge ${item.actionable ? "badge-overdue" : "badge-status"}">${escapeHtml(statusLabel)}</span>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderDashboardDeadlines() {
  if (!elements.dashboardDeadlines) {
    return;
  }

  const items = state.dashboard.deadlines;
  if (!items.length) {
    elements.dashboardDeadlines.innerHTML = '<div class="empty-copy">Tidak ada pekerjaan aktif dengan deadline.</div>';
    return;
  }

  const now = getEstimatedServerNow();
  elements.dashboardDeadlines.innerHTML = items.map((item) => {
    const remaining = Math.max(0, Math.floor((new Date(item.deadline_at).getTime() - now.getTime()) / 1000));
    const isOverdue = item.is_overdue || remaining === 0;

    return `
      <article class="deadline-card">
        <div>
          <p class="panel-label">Task #${escapeHtml(String(item.id))}</p>
          <h4>${escapeHtml(item.title)}</h4>
          <p class="subtle">${escapeHtml(formatDateTime(item.deadline_at))}</p>
        </div>
        <div class="task-badges">
          <span class="badge badge-priority">${escapeHtml(PRIORITY_LABELS[item.priority] || item.priority)}</span>
          <span class="badge ${isOverdue ? "badge-overdue" : "badge-status"}">${isOverdue ? "Terlambat" : escapeHtml(formatCountdown(remaining))}</span>
        </div>
        <a class="secondary-button deadline-link" href="/tasks">Lihat detail</a>
      </article>
    `;
  }).join("");
}

function renderChartBlock(title, data, labels) {
  const entries = Object.entries(labels).map(([key, label]) => [key, label, Number(data[key] || 0)]);
  const maxValue = Math.max(1, ...entries.map(([, , value]) => value));

  return `
    <article class="chart-card">
      <h4>${escapeHtml(title)}</h4>
      <div class="chart-bars">
        ${entries.map(([key, label, value]) => `
          <div class="chart-row">
            <span>${escapeHtml(label)}</span>
            <div class="chart-track"><div class="chart-bar chart-bar-${escapeHtml(key)}" style="width: ${Math.round((value / maxValue) * 100)}%"></div></div>
            <strong>${escapeHtml(String(value))}</strong>
          </div>
        `).join("")}
      </div>
    </article>
  `;
}

function renderDashboardCharts() {
  if (!elements.dashboardCharts) {
    return;
  }

  const charts = state.dashboard.charts;
  if (!charts) {
    elements.dashboardCharts.innerHTML = '<div class="empty-copy">Grafik dashboard belum tersedia.</div>';
    return;
  }

  elements.dashboardChartRange.textContent = `${charts.period === "monthly" ? "Bulanan" : "Mingguan"}: ${formatLocalDate(charts.range.start_date)} - ${formatLocalDate(charts.range.end_date)}`;
  elements.dashboardCharts.innerHTML = [
    renderChartBlock("Pekerjaan", charts.tasks_by_status, {
      in_progress: "Berjalan",
      completed: "Selesai",
      paused: "Tertunda",
      cancelled: "Dibatalkan",
      overdue: "Lewat deadline"
    }),
    renderChartBlock("Aktivitas", charts.activities_by_status, {
      scheduled: "Terjadwal",
      completed: "Selesai",
      cancelled: "Dibatalkan",
      pending_confirmation: "Belum dikonfirmasi"
    }),
    renderChartBlock("Kategori Aktivitas", charts.activities_by_category, ACTIVITY_CATEGORY_LABELS)
  ].join("");
}

function updateDashboardMetrics() {
  const summary = state.dashboard.summary;
  if (!summary) {
    setText(elements.statTotal, "0");
    setText(elements.statSecondary1, "0");
    setText(elements.statSecondary2, "0");
    setText(elements.statAlert, "0");
    setText(elements.statSelected, "0");
    return;
  }

  setText(elements.statTotal, String(summary.task_counts.total));
  setText(elements.statSecondary1, String(summary.task_counts.completed));
  setText(elements.statSecondary2, String(summary.activity_counts.today + summary.routine_counts.today));
  setText(elements.statAlert, String(summary.task_counts.overdue));
  setText(elements.statSelected, `${summary.task_completion_percentage}%`);
}

function startDashboardCountdown() {
  if (state.dashboard.countdownTimer) {
    window.clearInterval(state.dashboard.countdownTimer);
  }

  state.dashboard.countdownTimer = window.setInterval(renderDashboardDeadlines, 1000);
}

async function loadDashboard() {
  const period = elements.dashboardPeriod ? elements.dashboardPeriod.value : "weekly";
  setMessage(elements.dashboardMessage, "Memuat dashboard…", "");

  const [summaryResult, todayResult, deadlinesResult, chartsResult] = await Promise.all([
    requestJson(`/api/dashboard/summary?period=${encodeURIComponent(period)}`),
    requestJson("/api/dashboard/today"),
    requestJson("/api/dashboard/deadlines"),
    requestJson(`/api/dashboard/charts?period=${encodeURIComponent(period)}`)
  ]);

  const firstPayload = summaryResult.payload || todayResult.payload || deadlinesResult.payload || chartsResult.payload;
  setServerTime(firstPayload && firstPayload.meta ? firstPayload.meta.server_time : null);
  syncDashboardClock(firstPayload && firstPayload.meta ? firstPayload.meta.server_time : null);

  const failed = [summaryResult, todayResult, deadlinesResult, chartsResult].find((result) => !result.response.ok);
  if (failed) {
    setMessage(elements.dashboardMessage, getErrorMessage(failed.payload, "Gagal memuat dashboard."), "error");
    return;
  }

  state.dashboard.summary = summaryResult.payload.data;
  state.dashboard.today = todayResult.payload.data.items;
  state.dashboard.deadlines = deadlinesResult.payload.data.items;
  state.dashboard.charts = chartsResult.payload.data;

  renderDashboardSummary();
  renderDashboardToday();
  renderDashboardDeadlines();
  renderDashboardCharts();
  updateDashboardMetrics();
  startDashboardCountdown();
  setMessage(elements.dashboardMessage, "", "");
}


function buildReportQuery() {
  const params = new URLSearchParams();
  const formData = new FormData(elements.reportFiltersForm);

  for (const [key, rawValue] of formData.entries()) {
    const value = String(rawValue).trim();
    if (value) {
      params.set(key, value);
    }
  }

  if (!params.has("period")) {
    params.set("period", "weekly");
  }

  return params;
}

function updateReportExportLinks() {
  const query = buildReportQuery();
  const queryText = query.toString();
  const withDatasets = (datasets) => {
    const params = new URLSearchParams(queryText);
    params.set("datasets", datasets);
    return params.toString();
  };

  if (elements.reportExportPdf) {
    elements.reportExportPdf.href = `/api/reports/export/pdf?${queryText}`;
  }
  if (elements.reportExportCsvTasks) {
    elements.reportExportCsvTasks.href = `/api/reports/export/csv?${withDatasets("tasks")}`;
  }
  if (elements.reportExportCsvActivities) {
    elements.reportExportCsvActivities.href = `/api/reports/export/csv?${withDatasets("activities")}`;
  }
  if (elements.reportExportCsvRoutines) {
    elements.reportExportCsvRoutines.href = `/api/reports/export/csv?${withDatasets("routines")}`;
  }
  if (elements.reportExportCsvAll) {
    elements.reportExportCsvAll.href = `/api/reports/export/csv?${withDatasets("tasks,activities,routines,summary")}`;
  }
}

function renderReportSummary() {
  const summary = state.reports.summary;
  if (!summary) {
    elements.reportSummary.innerHTML = '<div class="empty-copy">Ringkasan laporan belum tersedia.</div>';
    elements.reportSummaryText.innerHTML = "";
    return;
  }

  const cards = [
    ["Pekerjaan", summary.task_summary.total],
    ["Pekerjaan selesai", summary.task_summary.completed],
    ["Lewat deadline", summary.task_summary.overdue],
    ["Penyelesaian pekerjaan", `${summary.task_summary.completion_percentage}%`],
    ["Aktivitas", summary.activity_summary.total],
    ["Aktivitas selesai", summary.activity_summary.completed],
    ["Rutinitas terjadwal", summary.routine_summary.total_scheduled],
    ["Penyelesaian rutinitas", `${summary.routine_summary.completion_percentage}%`]
  ];

  elements.reportRange.textContent = `${formatLocalDate(summary.range.start_date)} - ${formatLocalDate(summary.range.end_date)}`;
  elements.reportSummary.innerHTML = cards.map(([label, value], index) => `
    <article class="metric-card ${index === 0 ? "metric-accent" : index === 2 ? "metric-alert" : ""}">
      <span class="metric-label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
    </article>
  `).join("");
  elements.reportSummaryText.innerHTML = `
    <article class="empty-copy report-insight">
      <strong>Ringkasan otomatis</strong>
      <p>${escapeHtml(summary.generated_summary_text)}</p>
      <p class="subtle">Aktivitas tersering: ${escapeHtml(summary.activity_most_frequent.title || "-")} · Kategori: ${escapeHtml(summary.activity_most_frequent.category || "-")}</p>
    </article>
  `;
}

function renderReportCharts() {
  const summary = state.reports.summary;
  if (!summary) {
    elements.reportCharts.innerHTML = "";
    return;
  }

  elements.reportCharts.innerHTML = [
    renderChartBlock("Pekerjaan", summary.charts.tasks_by_status, {
      in_progress: "Berjalan",
      completed: "Selesai",
      paused: "Tertunda",
      cancelled: "Dibatalkan",
      overdue: "Lewat deadline"
    }),
    renderChartBlock("Aktivitas", summary.charts.activities_by_status, {
      scheduled: "Terjadwal",
      completed: "Selesai",
      cancelled: "Dibatalkan"
    }),
    renderChartBlock("Rutinitas", summary.charts.routines_by_status, {
      completed: "Selesai",
      missed: "Terlewat",
      cancelled: "Dibatalkan",
      pending: "Pending"
    })
  ].join("");
}

function renderReportTable(title, headers, rows, emptyMessage) {
  if (!rows.length) {
    return `<article class="report-table-card"><h4>${escapeHtml(title)}</h4><div class="empty-copy">${escapeHtml(emptyMessage)}</div></article>`;
  }

  return `
    <article class="report-table-card">
      <h4>${escapeHtml(title)}</h4>
      <div class="report-table-wrap">
        <table class="report-table">
          <thead><tr>${headers.map((header) => `<th>${escapeHtml(header.label)}</th>`).join("")}</tr></thead>
          <tbody>
            ${rows.slice(0, 12).map((row) => `
              <tr>${headers.map((header) => `<td>${escapeHtml(row[header.key] ?? "-")}</td>`).join("")}</tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </article>
  `;
}

function renderReportTables() {
  elements.reportTables.innerHTML = [
    renderReportTable("Pekerjaan", [
      { key: "title", label: "Judul" },
      { key: "status", label: "Status" },
      { key: "priority", label: "Prioritas" },
      { key: "deadline_at", label: "Deadline" }
    ], state.reports.tasks, "Tidak ada pekerjaan pada periode ini."),
    renderReportTable("Aktivitas", [
      { key: "title", label: "Judul" },
      { key: "category", label: "Kategori" },
      { key: "activity_date", label: "Tanggal" },
      { key: "status", label: "Status" }
    ], state.reports.activities, "Tidak ada aktivitas pada periode ini."),
    renderReportTable("Rutinitas", [
      { key: "routine_title_snapshot", label: "Judul" },
      { key: "scheduled_date", label: "Tanggal" },
      { key: "scheduled_start", label: "Mulai" },
      { key: "status", label: "Status" }
    ], state.reports.routines, "Tidak ada riwayat rutinitas pada periode ini.")
  ].join("");
}

function updateReportMetrics() {
  const summary = state.reports.summary;
  if (!summary) {
    setText(elements.statTotal, "0");
    setText(elements.statSecondary1, "0");
    setText(elements.statSecondary2, "0");
    setText(elements.statAlert, "0");
    setText(elements.statSelected, "0");
    return;
  }

  setText(elements.statTotal, String(summary.task_summary.total));
  setText(elements.statSecondary1, String(summary.task_summary.completed));
  setText(elements.statSecondary2, String(summary.activity_summary.total + summary.routine_summary.total_scheduled));
  setText(elements.statAlert, String(summary.task_summary.overdue + summary.routine_summary.missed));
  setText(elements.statSelected, `${summary.task_summary.completion_percentage}%`);
}

async function loadReports() {
  setMessage(elements.reportMessage, "Memuat laporan…", "");
  updateReportExportLinks();
  const queryText = buildReportQuery().toString();
  const [summaryResult, tasksResult, activitiesResult, routinesResult] = await Promise.all([
    requestJson(`/api/reports/summary?${queryText}`),
    requestJson(`/api/reports/tasks?${queryText}`),
    requestJson(`/api/reports/activities?${queryText}`),
    requestJson(`/api/reports/routines?${queryText}`)
  ]);
  const firstPayload = summaryResult.payload || tasksResult.payload || activitiesResult.payload || routinesResult.payload;
  setServerTime(firstPayload && firstPayload.meta ? firstPayload.meta.server_time : null);

  const failed = [summaryResult, tasksResult, activitiesResult, routinesResult].find((result) => !result.response.ok);
  if (failed) {
    setMessage(elements.reportMessage, getErrorMessage(failed.payload, "Gagal memuat laporan."), "error");
    return;
  }

  state.reports.summary = summaryResult.payload.data;
  state.reports.tasks = tasksResult.payload.data.items;
  state.reports.activities = activitiesResult.payload.data.items;
  state.reports.routines = routinesResult.payload.data.items;
  renderReportSummary();
  renderReportCharts();
  renderReportTables();
  updateReportMetrics();
  updateReportExportLinks();
  setMessage(elements.reportMessage, "", "");
}

function formatWeekdays(days) {
  if (!Array.isArray(days) || days.length === 0) {
    return "-";
  }

  return days.map((day) => WEEKDAY_LABELS[day] || String(day)).join(", ");
}

function getCurrentPath() {
  if (window.location.pathname === "/" || window.location.pathname === DASHBOARD_PAGE) {
    return DASHBOARD_PAGE;
  }

  if (window.location.pathname === ACTIVITY_PAGE) {
    return ACTIVITY_PAGE;
  }

  if (window.location.pathname === ROUTINE_PAGE) {
    return ROUTINE_PAGE;
  }

  if (window.location.pathname === REPORTS_PAGE) {
    return REPORTS_PAGE;
  }

  if (window.location.pathname === SECURITY_PAGE) {
    return SECURITY_PAGE;
  }

  return TASK_PAGE;
}

function setServerTime(serverTime) {
  state.serverTime = serverTime || null;
  if (elements.serverTime) {
    elements.serverTime.textContent = serverTime
      ? `Server ${formatDateTime(serverTime)}`
      : "Waktu server tidak tersedia";
  }
}

function pathForTarget(target) {
  if (target === "dashboard") {
    return DASHBOARD_PAGE;
  }

  if (target === "activities") {
    return ACTIVITY_PAGE;
  }

  if (target === "routines") {
    return ROUTINE_PAGE;
  }

  if (target === "reports") {
    return REPORTS_PAGE;
  }

  if (target === "security") {
    return SECURITY_PAGE;
  }

  return TASK_PAGE;
}

function setActiveNav() {
  const currentPath = getCurrentPath();
  for (const link of elements.navLinks) {
    link.classList.toggle("is-active", currentPath === pathForTarget(link.dataset.navTarget));
  }
}

function setPageVisibility() {
  const currentPath = getCurrentPath();
  for (const section of elements.pageModules) {
    section.hidden = currentPath !== pathForTarget(section.dataset.pageSection);
  }
}

function setPageCopy() {
  const currentPath = getCurrentPath();

  if (currentPath === DASHBOARD_PAGE) {
    elements.pageEyebrow.textContent = "Control Center";
    elements.pageTitle.textContent = "Dashboard";
    elements.heroEyebrow.textContent = "Productivity Command Center";
    elements.heroDescription.textContent = "Pantau statistik, agenda hari ini, deadline terdekat, dan grafik produktivitas dengan acuan waktu server.";
    elements.metricTotalLabel.textContent = "Total pekerjaan";
    elements.metricAlertLabel.textContent = "Lewat deadline";
    elements.metricCard1Label.textContent = "Total pekerjaan";
    elements.metricCard1Desc.textContent = "Semua pekerjaan aktif maupun historis yang belum dihapus.";
    elements.metricCard2Label.textContent = "Selesai";
    elements.metricCard2Desc.textContent = "Jumlah pekerjaan selesai.";
    elements.metricCard3Label.textContent = "Agenda hari ini";
    elements.metricCard3Desc.textContent = "Gabungan aktivitas dan rutinitas hari ini.";
    elements.metricCard4Label.textContent = "Lewat deadline";
    elements.metricCard4Desc.textContent = "Pekerjaan aktif yang melewati deadline.";
    elements.kpiSelectedLabel.textContent = "Penyelesaian";
    return;
  }

  if (currentPath === REPORTS_PAGE) {
    elements.pageEyebrow.textContent = "Productivity Reports";
    elements.pageTitle.textContent = "Reports";
    elements.heroEyebrow.textContent = "Period Intelligence";
    elements.heroDescription.textContent = "Evaluasi pekerjaan, aktivitas, dan rutinitas berdasarkan periode yang sama dengan file ekspor.";
    elements.metricTotalLabel.textContent = "Total pekerjaan";
    elements.metricAlertLabel.textContent = "Risiko periode";
    elements.metricCard1Label.textContent = "Pekerjaan";
    elements.metricCard1Desc.textContent = "Pekerjaan yang dimulai pada periode laporan.";
    elements.metricCard2Label.textContent = "Selesai";
    elements.metricCard2Desc.textContent = "Pekerjaan selesai dalam data periode.";
    elements.metricCard3Label.textContent = "Kegiatan";
    elements.metricCard3Desc.textContent = "Aktivitas dan rutinitas pada periode.";
    elements.metricCard4Label.textContent = "Perlu perhatian";
    elements.metricCard4Desc.textContent = "Deadline terlewat dan rutinitas terlewat.";
    elements.kpiSelectedLabel.textContent = "Penyelesaian";
    return;
  }

  if (currentPath === ACTIVITY_PAGE) {
    elements.pageEyebrow.textContent = "Activity Workspace";
    elements.pageTitle.textContent = "Activity Operations";
    elements.heroEyebrow.textContent = "Daily Activity Dashboard";
    elements.heroDescription.textContent = "Kelola aktivitas harian, status turunan, konflik jadwal, dan konfirmasi lewat waktu dari satu workspace yang responsif.";
    elements.metricTotalLabel.textContent = "Total aktivitas";
    elements.metricAlertLabel.textContent = "Menunggu konfirmasi";
    elements.metricCard1Label.textContent = "Semua aktivitas";
    elements.metricCard1Desc.textContent = "Jumlah aktivitas pada hasil filter saat ini.";
    elements.metricCard2Label.textContent = "Selesai";
    elements.metricCard2Desc.textContent = "Aktivitas selesai di halaman aktif.";
    elements.metricCard3Label.textContent = "Terjadwal";
    elements.metricCard3Desc.textContent = "Aktivitas yang masih terjadwal.";
    elements.metricCard4Label.textContent = "Menunggu konfirmasi";
    elements.metricCard4Desc.textContent = "Aktivitas yang sudah lewat waktu dan perlu konfirmasi.";
    elements.kpiSelectedLabel.textContent = "Aktivitas terpilih";
    return;
  }

  if (currentPath === ROUTINE_PAGE) {
    elements.pageEyebrow.textContent = "Routine Workspace";
    elements.pageTitle.textContent = "Routine Operations";
    elements.heroEyebrow.textContent = "Recurring Routine Dashboard";
    elements.heroDescription.textContent = "Kelola template rutinitas, hari aktif, benturan jadwal, serta histori penyelesaian harian dari satu workspace yang responsif.";
    elements.metricTotalLabel.textContent = "Total rutinitas";
    elements.metricAlertLabel.textContent = "Nonaktif";
    elements.metricCard1Label.textContent = "Semua rutinitas";
    elements.metricCard1Desc.textContent = "Jumlah template rutinitas pada hasil filter saat ini.";
    elements.metricCard2Label.textContent = "Aktif";
    elements.metricCard2Desc.textContent = "Template rutinitas yang aktif menghasilkan histori baru.";
    elements.metricCard3Label.textContent = "Selesai";
    elements.metricCard3Desc.textContent = "Histori selesai pada rutinitas yang sedang dipilih.";
    elements.metricCard4Label.textContent = "Nonaktif";
    elements.metricCard4Desc.textContent = "Rutinitas yang saat ini dinonaktifkan.";
    elements.kpiSelectedLabel.textContent = "Rutinitas terpilih";
    return;
  }

  elements.pageEyebrow.textContent = "SaaS Workspace";
  elements.pageTitle.textContent = currentPath === SECURITY_PAGE ? "Security Settings" : "Task Operations";
  elements.heroEyebrow.textContent = "Operations Dashboard";
  elements.heroDescription.textContent = "Kelola modul produktivitas dari satu dashboard yang responsif.";
  elements.metricTotalLabel.textContent = "Total";
  elements.metricAlertLabel.textContent = "Butuh perhatian";
  elements.metricCard1Label.textContent = "Semua pekerjaan";
  elements.metricCard1Desc.textContent = "Jumlah item pada hasil filter saat ini.";
  elements.metricCard2Label.textContent = "Selesai";
  elements.metricCard2Desc.textContent = "Pekerjaan selesai pada halaman aktif.";
  elements.metricCard3Label.textContent = "Sedang berjalan";
  elements.metricCard3Desc.textContent = "Item aktif yang masih berjalan.";
  elements.metricCard4Label.textContent = "Butuh perhatian";
  elements.metricCard4Desc.textContent = "Pekerjaan yang melewati deadline.";
  elements.kpiSelectedLabel.textContent = "Task terpilih";
}

function updateOverviewMetrics() {
  const currentPath = getCurrentPath();

  if (currentPath === DASHBOARD_PAGE) {
    updateDashboardMetrics();
    return;
  }

  if (currentPath === REPORTS_PAGE) {
    updateReportMetrics();
    return;
  }

  if (currentPath === ACTIVITY_PAGE) {
    const completed = state.activities.filter((activity) => activity.status === "completed").length;
    const scheduled = state.activities.filter((activity) => activity.status === "scheduled").length;
    const pending = state.activities.filter((activity) => activity.computed_status === "pending_confirmation").length;
    const selected = state.selectedActivityId ? 1 : 0;
    const total = state.activityPagination.total_items || state.activities.length;

    setText(elements.statTotal, String(total));
    setText(elements.statSecondary1, String(completed));
    setText(elements.statSecondary2, String(scheduled));
    setText(elements.statAlert, String(pending));
    setText(elements.statSelected, String(selected));
    return;
  }

  if (currentPath === ROUTINE_PAGE) {
    const active = state.routines.filter((routine) => routine.is_active).length;
    const inactive = state.routines.filter((routine) => !routine.is_active).length;
    const completed = state.routineDetail && Array.isArray(state.routineDetail.history)
      ? state.routineDetail.history.filter((item) => item.status === "completed").length
      : 0;
    const selected = state.selectedRoutineId ? 1 : 0;
    const total = state.routinePagination.total_items || state.routines.length;

    setText(elements.statTotal, String(total));
    setText(elements.statSecondary1, String(active));
    setText(elements.statSecondary2, String(completed));
    setText(elements.statAlert, String(inactive));
    setText(elements.statSelected, String(selected));
    return;
  }

  const completed = state.tasks.filter((task) => task.status === "completed").length;
  const inProgress = state.tasks.filter((task) => task.status === "in_progress").length;
  const overdue = state.tasks.filter((task) => task.is_overdue).length;
  const selected = state.selectedTaskId ? 1 : 0;
  const total = state.taskPagination.total_items || state.tasks.length;

  setText(elements.statTotal, String(total));
  setText(elements.statSecondary1, String(completed));
  setText(elements.statSecondary2, String(inProgress));
  setText(elements.statAlert, String(overdue));
  setText(elements.statSelected, String(selected));
}

function resetTaskForm() {
  state.taskEditingId = null;
  elements.taskForm.reset();
  elements.taskForm.elements.status.value = "in_progress";
  elements.taskForm.elements.priority.value = "medium";
  elements.taskForm.elements.task_id.value = "";
  elements.taskFormTitle.textContent = "Buat pekerjaan baru";
  elements.taskSubmit.textContent = "Simpan pekerjaan";
  setMessage(elements.taskFormMessage, "", "");
}

function getTaskById(taskId) {
  return state.tasks.find((task) => task.id === taskId) || null;
}

function renderTaskDetail(task) {
  if (!task) {
    elements.taskDetail.innerHTML = '<div class="empty-copy">Pilih pekerjaan dari daftar untuk melihat detail lengkap.</div>';
    updateOverviewMetrics();
    return;
  }

  elements.taskDetail.innerHTML = `
    <div class="detail-stack">
      <div>
        <p class="panel-label">Task #${task.id}</p>
        <h4>${escapeHtml(task.title)}</h4>
        <p class="subtle">${escapeHtml(task.description || "Tidak ada deskripsi.")}</p>
      </div>
      <div class="task-badges">
        <span class="badge badge-status">${escapeHtml(STATUS_LABELS[task.status] || task.status)}</span>
        <span class="badge badge-priority">${escapeHtml(PRIORITY_LABELS[task.priority] || task.priority)}</span>
        ${task.is_overdue ? '<span class="badge badge-overdue">Melewati deadline</span>' : '<span class="badge badge-status">Masih sesuai jadwal</span>'}
      </div>
      <div class="detail-grid">
        <div><strong>Status</strong><span>${escapeHtml(STATUS_LABELS[task.status] || task.status)}</span></div>
        <div><strong>Prioritas</strong><span>${escapeHtml(PRIORITY_LABELS[task.priority] || task.priority)}</span></div>
        <div><strong>Mulai</strong><span>${escapeHtml(formatDateTime(task.start_at))}</span></div>
        <div><strong>Deadline</strong><span>${escapeHtml(formatDateTime(task.deadline_at))}</span></div>
        <div><strong>Selesai</strong><span>${escapeHtml(formatDateTime(task.completed_at))}</span></div>
        <div><strong>Sinkronisasi</strong><span>${escapeHtml(formatDateTime(task.updated_at))}</span></div>
      </div>
    </div>
  `;
  updateOverviewMetrics();
}

function fillTaskForm(task) {
  state.taskEditingId = task.id;
  elements.taskForm.elements.task_id.value = String(task.id);
  elements.taskForm.elements.title.value = task.title || "";
  elements.taskForm.elements.description.value = task.description || "";
  elements.taskForm.elements.status.value = task.status;
  elements.taskForm.elements.priority.value = task.priority;
  elements.taskForm.elements.start_at.value = utcIsoToJakartaLocalInput(task.start_at);
  elements.taskForm.elements.deadline_at.value = utcIsoToJakartaLocalInput(task.deadline_at);
  elements.taskFormTitle.textContent = `Edit pekerjaan #${task.id}`;
  elements.taskSubmit.textContent = "Update pekerjaan";
  setMessage(elements.taskFormMessage, "Mode edit aktif.", "success");
  document.getElementById("task-editor").scrollIntoView({ behavior: "smooth", block: "start" });
}

function buildTaskStatusOptions(task) {
  return Object.entries(STATUS_LABELS)
    .map(([value, label]) => `<option value="${value}"${task.status === value ? " selected" : ""}>${escapeHtml(label)}</option>`)
    .join("");
}

function renderTaskList() {
  const tasks = state.tasks;
  elements.taskList.innerHTML = "";

  if (!tasks.length) {
    elements.taskList.innerHTML = '<div class="empty-copy">Belum ada pekerjaan yang cocok dengan filter saat ini.</div>';
    renderTaskDetail(null);
    return;
  }

  for (const task of tasks) {
    const item = document.createElement("article");
    item.className = "task-card";
    item.innerHTML = `
      <div class="task-card-main">
        <div class="task-card-heading">
          <div>
            <p class="panel-label">Task #${task.id}</p>
            <h4>${escapeHtml(task.title)}</h4>
            <p class="subtle">${escapeHtml(task.description || "Tanpa deskripsi")}</p>
          </div>
          <div class="task-badges">
            <span class="badge badge-status">${escapeHtml(STATUS_LABELS[task.status] || task.status)}</span>
            <span class="badge badge-priority">${escapeHtml(PRIORITY_LABELS[task.priority] || task.priority)}</span>
            ${task.is_overdue ? '<span class="badge badge-overdue">Melewati deadline</span>' : ""}
          </div>
        </div>
        <div class="task-meta-grid">
          <span><strong>Mulai</strong> ${escapeHtml(formatDateTime(task.start_at))}</span>
          <span><strong>Deadline</strong> ${escapeHtml(formatDateTime(task.deadline_at))}</span>
          <span><strong>Selesai</strong> ${escapeHtml(formatDateTime(task.completed_at))}</span>
        </div>
      </div>
      <div class="task-card-actions">
        <label class="field field-inline">
          <span>Status</span>
          <select data-task-status="${task.id}">
            ${buildTaskStatusOptions(task)}
          </select>
        </label>
        <div class="button-row button-row-compact">
          <button class="secondary-button" type="button" data-task-view="${task.id}">Detail</button>
          <button class="secondary-button" type="button" data-task-edit="${task.id}">Edit</button>
          <button class="secondary-button" type="button" data-task-complete="${task.id}">Selesaikan</button>
          <button class="danger-button" type="button" data-task-delete="${task.id}">Hapus</button>
        </div>
      </div>
    `;
    elements.taskList.appendChild(item);
  }
}

function updateTaskPaginationUi() {
  const { page, page_size: pageSize, total_items: totalItems, total_pages: totalPages } = state.taskPagination;
  elements.taskPaginationLabel.textContent = totalPages ? `Halaman ${page} dari ${totalPages}` : "Tidak ada halaman";
  elements.taskPagePrevious.disabled = page <= 1;
  elements.taskPageNext.disabled = totalPages === 0 || page >= totalPages;
  elements.taskSummary.textContent = totalItems
    ? `${totalItems} pekerjaan ditemukan, menampilkan hingga ${pageSize} per halaman.`
    : "Belum ada data pekerjaan untuk ditampilkan.";
  updateOverviewMetrics();
}

function buildTaskListQuery(page = state.taskPagination.page) {
  const params = new URLSearchParams();
  const formData = new FormData(elements.taskFiltersForm);
  params.set("page", String(page));

  for (const [key, rawValue] of formData.entries()) {
    const value = String(rawValue).trim();
    if (!value) {
      continue;
    }

    if (["start_from", "start_to", "deadline_from", "deadline_to"].includes(key)) {
      const isoValue = jakartaLocalInputToUtcIso(value);
      if (isoValue) {
        params.set(key, isoValue);
      }
      continue;
    }

    params.set(key, value);
  }

  return params;
}

async function loadTasks(page = 1) {
  state.taskPagination.page = page;
  setMessage(elements.taskListMessage, "Memuat daftar pekerjaan…", "");

  const params = buildTaskListQuery(page);
  const { response, payload } = await requestJson(`/api/tasks?${params.toString()}`);
  setServerTime(payload && payload.meta ? payload.meta.server_time : null);

  if (!response.ok) {
    setMessage(elements.taskListMessage, getErrorMessage(payload, "Gagal memuat daftar pekerjaan."), "error");
    return;
  }

  state.tasks = payload.data.items;
  state.taskPagination = payload.meta.pagination;
  renderTaskList();
  updateTaskPaginationUi();
  setMessage(elements.taskListMessage, "", "");

  const activeTask = getTaskById(state.selectedTaskId) || state.tasks[0] || null;
  state.selectedTaskId = activeTask ? activeTask.id : null;
  renderTaskDetail(activeTask);
}

function collectTaskPayload() {
  return {
    title: elements.taskForm.elements.title.value,
    description: elements.taskForm.elements.description.value,
    status: elements.taskForm.elements.status.value,
    priority: elements.taskForm.elements.priority.value,
    start_at: jakartaLocalInputToUtcIso(elements.taskForm.elements.start_at.value),
    deadline_at: jakartaLocalInputToUtcIso(elements.taskForm.elements.deadline_at.value)
  };
}

async function submitTaskForm(event) {
  event.preventDefault();
  setMessage(elements.taskFormMessage, "Menyimpan pekerjaan…", "");
  elements.taskSubmit.disabled = true;

  try {
    const taskId = state.taskEditingId;
    const method = taskId ? "PUT" : "POST";
    const path = taskId ? `/api/tasks/${taskId}` : "/api/tasks";
    const { response, payload } = await requestJson(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(collectTaskPayload())
    });

    setServerTime(payload && payload.meta ? payload.meta.server_time : null);

    if (!response.ok) {
      setMessage(elements.taskFormMessage, getErrorMessage(payload, "Gagal menyimpan pekerjaan."), "error");
      return;
    }

    const task = payload.data;
    state.selectedTaskId = task.id;
    resetTaskForm();
    setMessage(elements.taskFormMessage, taskId ? "Pekerjaan berhasil diperbarui." : "Pekerjaan berhasil dibuat.", "success");
    await loadTasks(taskId ? state.taskPagination.page : 1);
    state.selectedTaskId = task.id;
    renderTaskDetail(getTaskById(task.id) || task);
  } finally {
    elements.taskSubmit.disabled = false;
  }
}

async function deleteTask(taskId) {
  const confirmed = window.confirm("Hapus pekerjaan ini? Data tidak hilang permanen, tetapi akan disembunyikan dari daftar.");
  if (!confirmed) {
    return;
  }

  const { response, payload } = await requestJson(`/api/tasks/${taskId}`, { method: "DELETE" });
  setServerTime(payload && payload.meta ? payload.meta.server_time : null);

  if (!response.ok) {
    setMessage(elements.taskListMessage, getErrorMessage(payload, "Gagal menghapus pekerjaan."), "error");
    return;
  }

  if (state.selectedTaskId === taskId) {
    state.selectedTaskId = null;
  }

  setMessage(elements.taskListMessage, "Pekerjaan berhasil dihapus.", "success");
  await loadTasks(state.taskPagination.page);
}

async function patchTaskStatus(taskId, status, successMessage = "Status pekerjaan diperbarui.") {
  const { response, payload } = await requestJson(`/api/tasks/${taskId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  setServerTime(payload && payload.meta ? payload.meta.server_time : null);

  if (!response.ok) {
    setMessage(elements.taskListMessage, getErrorMessage(payload, "Gagal memperbarui status pekerjaan."), "error");
    await loadTasks(state.taskPagination.page);
    return;
  }

  state.selectedTaskId = payload.data.id;
  setMessage(elements.taskListMessage, successMessage, "success");
  await loadTasks(state.taskPagination.page);
}

async function loadTaskDetail(taskId) {
  const { response, payload } = await requestJson(`/api/tasks/${taskId}`);
  setServerTime(payload && payload.meta ? payload.meta.server_time : null);

  if (!response.ok) {
    setMessage(elements.taskListMessage, getErrorMessage(payload, "Gagal memuat detail pekerjaan."), "error");
    return;
  }

  state.selectedTaskId = payload.data.id;
  renderTaskDetail(payload.data);
}

function resetActivityForm() {
  state.activityEditingId = null;
  elements.activityForm.reset();
  elements.activityForm.elements.category.value = "pekerjaan";
  elements.activityForm.elements.status.value = "scheduled";
  elements.activityForm.elements.activity_id.value = "";
  elements.activityFormTitle.textContent = "Buat aktivitas baru";
  elements.activitySubmit.textContent = "Simpan aktivitas";
  setMessage(elements.activityFormMessage, "", "");
  clearWarnings(elements.activityWarningList);
}

function getActivityById(activityId) {
  return state.activities.find((activity) => activity.id === activityId) || null;
}

function renderActivityDetail(activity) {
  if (!activity) {
    elements.activityDetail.innerHTML = '<div class="empty-copy">Pilih aktivitas dari daftar untuk melihat detail lengkap.</div>';
    updateOverviewMetrics();
    return;
  }

  const canConfirm = activity.status === "scheduled" && activity.computed_status === "pending_confirmation";
  elements.activityDetail.innerHTML = `
    <div class="detail-stack">
      <div>
        <p class="panel-label">Activity #${activity.id}</p>
        <h4>${escapeHtml(activity.title)}</h4>
        <p class="subtle">${escapeHtml(activity.notes || "Tidak ada catatan.")}</p>
      </div>
      <div class="task-badges">
        <span class="badge badge-priority">${escapeHtml(ACTIVITY_CATEGORY_LABELS[activity.category] || activity.category)}</span>
        <span class="badge badge-status">${escapeHtml(ACTIVITY_STATUS_LABELS[activity.status] || activity.status)}</span>
        <span class="badge ${canConfirm ? "badge-overdue" : "badge-status"}">${escapeHtml(ACTIVITY_COMPUTED_STATUS_LABELS[activity.computed_status] || activity.computed_status)}</span>
      </div>
      <div class="detail-grid">
        <div><strong>Kategori</strong><span>${escapeHtml(ACTIVITY_CATEGORY_LABELS[activity.category] || activity.category)}</span></div>
        <div><strong>Status utama</strong><span>${escapeHtml(ACTIVITY_STATUS_LABELS[activity.status] || activity.status)}</span></div>
        <div><strong>Status turunan</strong><span>${escapeHtml(ACTIVITY_COMPUTED_STATUS_LABELS[activity.computed_status] || activity.computed_status)}</span></div>
        <div><strong>Tanggal</strong><span>${escapeHtml(formatLocalDate(activity.activity_date))}</span></div>
        <div><strong>Mulai</strong><span>${escapeHtml(formatLocalTime(activity.start_time))}</span></div>
        <div><strong>Selesai</strong><span>${escapeHtml(formatLocalTime(activity.end_time))}</span></div>
        <div><strong>Dikonfirmasi</strong><span>${escapeHtml(formatDateTime(activity.confirmed_at))}</span></div>
        <div><strong>Sinkronisasi</strong><span>${escapeHtml(formatDateTime(activity.updated_at))}</span></div>
      </div>
      <div class="button-row status-action-row">
        <button class="secondary-button" type="button" data-activity-detail-edit="${activity.id}">Edit</button>
        <button class="secondary-button" type="button" data-activity-detail-complete="${activity.id}">Selesai</button>
        <button class="secondary-button" type="button" data-activity-detail-cancel="${activity.id}">Dibatalkan</button>
        <button class="danger-button" type="button" data-activity-detail-delete="${activity.id}">Hapus</button>
      </div>
    </div>
  `;
  updateOverviewMetrics();
}

function fillActivityForm(activity) {
  state.activityEditingId = activity.id;
  elements.activityForm.elements.activity_id.value = String(activity.id);
  elements.activityForm.elements.title.value = activity.title || "";
  elements.activityForm.elements.category.value = activity.category;
  elements.activityForm.elements.activity_date.value = activity.activity_date;
  elements.activityForm.elements.status.value = activity.status;
  elements.activityForm.elements.start_time.value = activity.start_time;
  elements.activityForm.elements.end_time.value = activity.end_time;
  elements.activityForm.elements.notes.value = activity.notes || "";
  elements.activityFormTitle.textContent = `Edit aktivitas #${activity.id}`;
  elements.activitySubmit.textContent = "Update aktivitas";
  setMessage(elements.activityFormMessage, "Mode edit aktif.", "success");
  clearWarnings(elements.activityWarningList);
  document.getElementById("activity-editor").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderActivityList() {
  const activities = state.activities;
  elements.activityList.innerHTML = "";

  if (!activities.length) {
    elements.activityList.innerHTML = '<div class="empty-copy">Belum ada aktivitas yang cocok dengan filter saat ini.</div>';
    renderActivityDetail(null);
    return;
  }

  for (const activity of activities) {
    const needsConfirmation = activity.status === "scheduled" && activity.computed_status === "pending_confirmation";
    const item = document.createElement("article");
    item.className = "task-card";
    item.innerHTML = `
      <div class="task-card-main">
        <div class="task-card-heading">
          <div>
            <p class="panel-label">Activity #${activity.id}</p>
            <h4>${escapeHtml(activity.title)}</h4>
            <p class="subtle">${escapeHtml(activity.notes || "Tanpa catatan")}</p>
          </div>
          <div class="task-badges">
            <span class="badge badge-priority">${escapeHtml(ACTIVITY_CATEGORY_LABELS[activity.category] || activity.category)}</span>
            <span class="badge badge-status">${escapeHtml(ACTIVITY_STATUS_LABELS[activity.status] || activity.status)}</span>
            <span class="badge ${needsConfirmation ? "badge-overdue" : "badge-status"}">${escapeHtml(ACTIVITY_COMPUTED_STATUS_LABELS[activity.computed_status] || activity.computed_status)}</span>
          </div>
        </div>
        <div class="task-meta-grid">
          <span><strong>Tanggal</strong> ${escapeHtml(formatLocalDate(activity.activity_date))}</span>
          <span><strong>Jam</strong> ${escapeHtml(activity.start_time)} - ${escapeHtml(activity.end_time)}</span>
          <span><strong>Konfirmasi</strong> ${escapeHtml(formatDateTime(activity.confirmed_at))}</span>
        </div>
      </div>
      <div class="task-card-actions">
        <div class="button-row button-row-compact">
          <button class="secondary-button" type="button" data-activity-view="${activity.id}">Detail</button>
          <button class="secondary-button" type="button" data-activity-edit="${activity.id}">Edit</button>
          <button class="secondary-button" type="button" data-activity-complete="${activity.id}">Selesai</button>
          <button class="secondary-button" type="button" data-activity-cancel="${activity.id}">Dibatalkan</button>
          <button class="danger-button" type="button" data-activity-delete="${activity.id}">Hapus</button>
        </div>
      </div>
    `;
    elements.activityList.appendChild(item);
  }
}

function updateActivityPaginationUi() {
  const { page, page_size: pageSize, total_items: totalItems, total_pages: totalPages } = state.activityPagination;
  elements.activityPaginationLabel.textContent = totalPages ? `Halaman ${page} dari ${totalPages}` : "Tidak ada halaman";
  elements.activityPagePrevious.disabled = page <= 1;
  elements.activityPageNext.disabled = totalPages === 0 || page >= totalPages;
  elements.activitySummary.textContent = totalItems
    ? `${totalItems} aktivitas ditemukan, menampilkan hingga ${pageSize} per halaman.`
    : "Belum ada data aktivitas untuk ditampilkan.";
  updateOverviewMetrics();
}

function buildActivityListQuery(page = state.activityPagination.page) {
  const params = new URLSearchParams();
  const formData = new FormData(elements.activityFiltersForm);
  params.set("page", String(page));

  for (const [key, rawValue] of formData.entries()) {
    const value = String(rawValue).trim();
    if (value) {
      params.set(key, value);
    }
  }

  return params;
}

async function loadActivities(page = 1) {
  state.activityPagination.page = page;
  setMessage(elements.activityListMessage, "Memuat daftar aktivitas…", "");

  const params = buildActivityListQuery(page);
  const { response, payload } = await requestJson(`/api/activities?${params.toString()}`);
  setServerTime(payload && payload.meta ? payload.meta.server_time : null);

  if (!response.ok) {
    setMessage(elements.activityListMessage, getErrorMessage(payload, "Gagal memuat daftar aktivitas."), "error");
    return;
  }

  state.activities = payload.data.items;
  state.activityPagination = payload.meta.pagination;
  renderActivityList();
  updateActivityPaginationUi();
  setMessage(elements.activityListMessage, "", "");

  const activeActivity = getActivityById(state.selectedActivityId) || state.activities[0] || null;
  state.selectedActivityId = activeActivity ? activeActivity.id : null;
  renderActivityDetail(activeActivity);
}

function collectActivityPayload() {
  return {
    title: elements.activityForm.elements.title.value,
    category: elements.activityForm.elements.category.value,
    activity_date: elements.activityForm.elements.activity_date.value,
    status: elements.activityForm.elements.status.value,
    start_time: elements.activityForm.elements.start_time.value,
    end_time: elements.activityForm.elements.end_time.value,
    notes: elements.activityForm.elements.notes.value
  };
}

async function submitActivityForm(event) {
  event.preventDefault();
  clearWarnings(elements.activityWarningList);
  setMessage(elements.activityFormMessage, "Menyimpan aktivitas…", "");
  elements.activitySubmit.disabled = true;

  try {
    const activityId = state.activityEditingId;
    const method = activityId ? "PUT" : "POST";
    const path = activityId ? `/api/activities/${activityId}` : "/api/activities";
    const { response, payload } = await requestJson(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(collectActivityPayload())
    });

    setServerTime(payload && payload.meta ? payload.meta.server_time : null);

    if (!response.ok) {
      setMessage(elements.activityFormMessage, getErrorMessage(payload, "Gagal menyimpan aktivitas."), "error");
      return;
    }

    const activity = payload.data;
    state.selectedActivityId = activity.id;
    resetActivityForm();
    setMessage(elements.activityFormMessage, activityId ? "Aktivitas berhasil diperbarui." : "Aktivitas berhasil dibuat.", "success");
    if (payload.warnings && payload.warnings.length > 0) {
      renderWarnings(elements.activityWarningList, payload.warnings, "Aktivitas berhasil disimpan dengan peringatan");
    }
    await loadActivities(activityId ? state.activityPagination.page : 1);
    state.selectedActivityId = activity.id;
    renderActivityDetail(getActivityById(activity.id) || activity);
  } finally {
    elements.activitySubmit.disabled = false;
  }
}

async function deleteActivity(activityId) {
  const confirmed = window.confirm("Hapus aktivitas ini? Aktivitas akan disembunyikan dari tampilan normal.");
  if (!confirmed) {
    return;
  }

  const { response, payload } = await requestJson(`/api/activities/${activityId}`, { method: "DELETE" });
  setServerTime(payload && payload.meta ? payload.meta.server_time : null);

  if (!response.ok) {
    setMessage(elements.activityListMessage, getErrorMessage(payload, "Gagal menghapus aktivitas."), "error");
    return;
  }

  if (state.selectedActivityId === activityId) {
    state.selectedActivityId = null;
  }

  setMessage(elements.activityListMessage, "Aktivitas berhasil dihapus.", "success");
  await loadActivities(state.activityPagination.page);
}

async function patchActivityStatus(activityId, status, successMessage) {
  const confirmed = window.confirm(`Ubah status aktivitas menjadi ${ACTIVITY_STATUS_LABELS[status]}?`);
  if (!confirmed) {
    return;
  }

  const { response, payload } = await requestJson(`/api/activities/${activityId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  setServerTime(payload && payload.meta ? payload.meta.server_time : null);

  if (!response.ok) {
    setMessage(elements.activityListMessage, getErrorMessage(payload, "Gagal memperbarui status aktivitas."), "error");
    await loadActivities(state.activityPagination.page);
    return;
  }

  state.selectedActivityId = payload.data.id;
  setMessage(elements.activityListMessage, successMessage, "success");
  await loadActivities(state.activityPagination.page);
}

async function loadActivityDetail(activityId) {
  const { response, payload } = await requestJson(`/api/activities/${activityId}`);
  setServerTime(payload && payload.meta ? payload.meta.server_time : null);

  if (!response.ok) {
    setMessage(elements.activityListMessage, getErrorMessage(payload, "Gagal memuat detail aktivitas."), "error");
    return;
  }

  state.selectedActivityId = payload.data.id;
  renderActivityDetail(payload.data);
}

function resetRoutineForm() {
  state.routineEditingId = null;
  elements.routineForm.reset();
  elements.routineForm.elements.priority.value = "medium";
  elements.routineForm.elements.is_active.value = "true";
  elements.routineForm.elements.routine_id.value = "";
  elements.routineFormTitle.textContent = "Buat rutinitas baru";
  elements.routineSubmit.textContent = "Simpan rutinitas";
  setMessage(elements.routineFormMessage, "", "");
  clearWarnings(elements.routineWarningList);
}

function getRoutineById(routineId) {
  return state.routines.find((routine) => routine.id === routineId) || null;
}

function renderRoutineHistoryItems(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return '<div class="empty-copy">Belum ada riwayat untuk rutinitas ini.</div>';
  }

  return history.slice(0, 12).map((item) => {
    const canConfirm = item.status === "missed_pending";
    return `
      <article class="history-card">
        <div class="history-card-head">
          <div>
            <strong>${escapeHtml(formatLocalDate(item.scheduled_date))}</strong>
            <p class="subtle">${escapeHtml(item.scheduled_start)} - ${escapeHtml(item.scheduled_end)}</p>
          </div>
          <span class="badge ${item.status === "missed" ? "badge-overdue" : "badge-status"}">${escapeHtml(ROUTINE_HISTORY_STATUS_LABELS[item.status] || item.status)}</span>
        </div>
        <p class="subtle">${escapeHtml(item.notes || item.routine_title_snapshot || "Tanpa catatan tambahan")}</p>
        <p class="subtle">Konfirmasi: ${escapeHtml(formatDateTime(item.confirmed_at))}</p>
        ${canConfirm ? `
          <div class="button-row button-row-compact">
            <button class="secondary-button" type="button" data-routine-history-complete="${escapeHtml(String(item.id))}" data-routine-history-date="${escapeHtml(item.scheduled_date)}">Selesai</button>
            <button class="secondary-button" type="button" data-routine-history-cancel="${escapeHtml(String(item.id))}" data-routine-history-date="${escapeHtml(item.scheduled_date)}">Dibatalkan</button>
          </div>
        ` : ""}
      </article>
    `;
  }).join("");
}

function renderRoutineDetail(routine) {
  if (!routine) {
    elements.routineDetail.innerHTML = '<div class="empty-copy">Pilih rutinitas dari daftar untuk melihat detail dan histori.</div>';
    updateOverviewMetrics();
    return;
  }

  const latestHistory = Array.isArray(routine.upcoming_history) && routine.upcoming_history.length > 0
    ? routine.upcoming_history[0]
    : null;

  elements.routineDetail.innerHTML = `
    <div class="detail-stack">
      <div>
        <p class="panel-label">Routine #${routine.id}</p>
        <h4>${escapeHtml(routine.title)}</h4>
        <p class="subtle">${escapeHtml(routine.notes || "Tidak ada catatan.")}</p>
      </div>
      <div class="task-badges">
        <span class="badge badge-priority">${escapeHtml(PRIORITY_LABELS[routine.priority] || routine.priority)}</span>
        <span class="badge ${routine.is_active ? "badge-status" : "badge-overdue"}">${routine.is_active ? "Aktif" : "Nonaktif"}</span>
        ${latestHistory ? `<span class="badge badge-status">Berikutnya ${escapeHtml(formatLocalDate(latestHistory.scheduled_date))}</span>` : ""}
      </div>
      <div class="detail-grid">
        <div><strong>Hari aktif</strong><span>${escapeHtml(formatWeekdays(routine.day_of_week))}</span></div>
        <div><strong>Jam</strong><span>${escapeHtml(routine.start_time)} - ${escapeHtml(routine.end_time)}</span></div>
        <div><strong>Prioritas</strong><span>${escapeHtml(PRIORITY_LABELS[routine.priority] || routine.priority)}</span></div>
        <div><strong>Status</strong><span>${routine.is_active ? "Aktif" : "Nonaktif"}</span></div>
        <div><strong>Dibuat</strong><span>${escapeHtml(formatDateTime(routine.created_at))}</span></div>
        <div><strong>Sinkronisasi</strong><span>${escapeHtml(formatDateTime(routine.updated_at))}</span></div>
      </div>
      <div class="button-row status-action-row">
        <button class="secondary-button" type="button" data-routine-detail-edit="${routine.id}">Edit</button>
        <button class="secondary-button" type="button" data-routine-detail-toggle="${routine.id}" data-routine-detail-active="${routine.is_active ? "true" : "false"}">${routine.is_active ? "Nonaktifkan" : "Aktifkan"}</button>
        <button class="danger-button" type="button" data-routine-detail-delete="${routine.id}">Hapus</button>
      </div>
      <div>
        <p class="panel-label">Riwayat Rutinitas</p>
        <div class="history-list">${renderRoutineHistoryItems(routine.history)}</div>
      </div>
    </div>
  `;
  updateOverviewMetrics();
}

function fillRoutineForm(routine) {
  state.routineEditingId = routine.id;
  elements.routineForm.elements.routine_id.value = String(routine.id);
  elements.routineForm.elements.title.value = routine.title || "";
  elements.routineForm.elements.priority.value = routine.priority || "medium";
  elements.routineForm.elements.is_active.value = routine.is_active ? "true" : "false";
  elements.routineForm.elements.start_time.value = routine.start_time || "";
  elements.routineForm.elements.end_time.value = routine.end_time || "";
  elements.routineForm.elements.notes.value = routine.notes || "";
  for (const checkbox of elements.routineForm.querySelectorAll("input[name=\"day_of_week\"]")) {
    checkbox.checked = Array.isArray(routine.day_of_week) && routine.day_of_week.includes(Number(checkbox.value));
  }
  elements.routineFormTitle.textContent = `Edit rutinitas #${routine.id}`;
  elements.routineSubmit.textContent = "Update rutinitas";
  setMessage(elements.routineFormMessage, "Mode edit aktif.", "success");
  clearWarnings(elements.routineWarningList);
  document.getElementById("routine-editor").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderRoutineList() {
  const routines = state.routines;
  elements.routineList.innerHTML = "";

  if (!routines.length) {
    elements.routineList.innerHTML = '<div class="empty-copy">Belum ada rutinitas yang cocok dengan filter saat ini.</div>';
    renderRoutineDetail(null);
    return;
  }

  for (const routine of routines) {
    const item = document.createElement("article");
    item.className = "task-card";
    item.innerHTML = `
      <div class="task-card-main">
        <div class="task-card-heading">
          <div>
            <p class="panel-label">Routine #${routine.id}</p>
            <h4>${escapeHtml(routine.title)}</h4>
            <p class="subtle">${escapeHtml(routine.notes || "Tanpa catatan")}</p>
          </div>
          <div class="task-badges">
            <span class="badge badge-priority">${escapeHtml(PRIORITY_LABELS[routine.priority] || routine.priority)}</span>
            <span class="badge ${routine.is_active ? "badge-status" : "badge-overdue"}">${routine.is_active ? "Aktif" : "Nonaktif"}</span>
          </div>
        </div>
        <div class="task-meta-grid">
          <span><strong>Hari</strong> ${escapeHtml(formatWeekdays(routine.day_of_week))}</span>
          <span><strong>Jam</strong> ${escapeHtml(routine.start_time)} - ${escapeHtml(routine.end_time)}</span>
          <span><strong>Sinkronisasi</strong> ${escapeHtml(formatDateTime(routine.updated_at))}</span>
        </div>
      </div>
      <div class="task-card-actions">
        <div class="button-row button-row-compact">
          <button class="secondary-button" type="button" data-routine-view="${routine.id}">Detail</button>
          <button class="secondary-button" type="button" data-routine-edit="${routine.id}">Edit</button>
          <button class="secondary-button" type="button" data-routine-toggle="${routine.id}" data-routine-active="${routine.is_active ? "true" : "false"}">${routine.is_active ? "Nonaktifkan" : "Aktifkan"}</button>
          <button class="danger-button" type="button" data-routine-delete="${routine.id}">Hapus</button>
        </div>
      </div>
    `;
    elements.routineList.appendChild(item);
  }
}

function updateRoutinePaginationUi() {
  const { page, page_size: pageSize, total_items: totalItems, total_pages: totalPages } = state.routinePagination;
  elements.routinePaginationLabel.textContent = totalPages ? `Halaman ${page} dari ${totalPages}` : "Tidak ada halaman";
  elements.routinePagePrevious.disabled = page <= 1;
  elements.routinePageNext.disabled = totalPages === 0 || page >= totalPages;
  elements.routineSummary.textContent = totalItems
    ? `${totalItems} rutinitas ditemukan, menampilkan hingga ${pageSize} per halaman.`
    : "Belum ada data rutinitas untuk ditampilkan.";
  updateOverviewMetrics();
}

function buildRoutineListQuery(page = state.routinePagination.page) {
  const params = new URLSearchParams();
  const formData = new FormData(elements.routineFiltersForm);
  params.set("page", String(page));

  for (const [key, rawValue] of formData.entries()) {
    const value = String(rawValue).trim();
    if (value) {
      params.set(key, value);
    }
  }

  return params;
}

async function loadRoutineDetail(routineId) {
  const { response, payload } = await requestJson(`/api/routines/${routineId}`);
  setServerTime(payload && payload.meta ? payload.meta.server_time : null);

  if (!response.ok) {
    setMessage(elements.routineListMessage, getErrorMessage(payload, "Gagal memuat detail rutinitas."), "error");
    return;
  }

  state.selectedRoutineId = payload.data.id;
  state.routineDetail = payload.data;
  renderRoutineDetail(payload.data);
}

async function loadRoutines(page = 1) {
  state.routinePagination.page = page;
  setMessage(elements.routineListMessage, "Memuat daftar rutinitas…", "");

  const params = buildRoutineListQuery(page);
  const { response, payload } = await requestJson(`/api/routines?${params.toString()}`);
  setServerTime(payload && payload.meta ? payload.meta.server_time : null);

  if (!response.ok) {
    setMessage(elements.routineListMessage, getErrorMessage(payload, "Gagal memuat daftar rutinitas."), "error");
    return;
  }

  state.routines = payload.data.items;
  state.routinePagination = payload.meta.pagination;
  renderRoutineList();
  updateRoutinePaginationUi();
  setMessage(elements.routineListMessage, "", "");

  const activeRoutine = getRoutineById(state.selectedRoutineId) || state.routines[0] || null;
  state.selectedRoutineId = activeRoutine ? activeRoutine.id : null;
  if (activeRoutine) {
    await loadRoutineDetail(activeRoutine.id);
  } else {
    state.routineDetail = null;
    renderRoutineDetail(null);
  }
}

function collectRoutinePayload() {
  const days = Array.from(elements.routineForm.querySelectorAll("input[name=\"day_of_week\"]:checked"))
    .map((input) => Number(input.value));

  return {
    title: elements.routineForm.elements.title.value,
    day_of_week: days,
    start_time: elements.routineForm.elements.start_time.value,
    end_time: elements.routineForm.elements.end_time.value,
    priority: elements.routineForm.elements.priority.value,
    notes: elements.routineForm.elements.notes.value,
    is_active: elements.routineForm.elements.is_active.value === "true"
  };
}

async function submitRoutineForm(event) {
  event.preventDefault();
  clearWarnings(elements.routineWarningList);
  setMessage(elements.routineFormMessage, "Menyimpan rutinitas…", "");
  elements.routineSubmit.disabled = true;

  try {
    const routineId = state.routineEditingId;
    const method = routineId ? "PUT" : "POST";
    const path = routineId ? `/api/routines/${routineId}` : "/api/routines";
    const { response, payload } = await requestJson(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(collectRoutinePayload())
    });

    setServerTime(payload && payload.meta ? payload.meta.server_time : null);

    if (!response.ok) {
      setMessage(elements.routineFormMessage, getErrorMessage(payload, "Gagal menyimpan rutinitas."), "error");
      return;
    }

    const routine = payload.data;
    state.selectedRoutineId = routine.id;
    resetRoutineForm();
    setMessage(elements.routineFormMessage, routineId ? "Rutinitas berhasil diperbarui." : "Rutinitas berhasil dibuat.", "success");
    if (payload.warnings && payload.warnings.length > 0) {
      renderWarnings(elements.routineWarningList, payload.warnings, "Rutinitas berhasil disimpan dengan peringatan");
    }
    await loadRoutines(routineId ? state.routinePagination.page : 1);
    state.selectedRoutineId = routine.id;
    await loadRoutineDetail(routine.id);
  } finally {
    elements.routineSubmit.disabled = false;
  }
}

async function deleteRoutine(routineId) {
  const confirmed = window.confirm("Hapus template rutinitas ini? Histori yang sudah tercatat tetap dipertahankan.");
  if (!confirmed) {
    return;
  }

  const { response, payload } = await requestJson(`/api/routines/${routineId}`, { method: "DELETE" });
  setServerTime(payload && payload.meta ? payload.meta.server_time : null);

  if (!response.ok) {
    setMessage(elements.routineListMessage, getErrorMessage(payload, "Gagal menghapus rutinitas."), "error");
    return;
  }

  if (state.selectedRoutineId === routineId) {
    state.selectedRoutineId = null;
    state.routineDetail = null;
  }

  setMessage(elements.routineListMessage, "Rutinitas berhasil dihapus.", "success");
  await loadRoutines(state.routinePagination.page);
}

async function toggleRoutine(routineId, isActive, successMessage) {
  const nextValue = !isActive;
  const confirmed = window.confirm(`${nextValue ? "Aktifkan" : "Nonaktifkan"} rutinitas ini?`);
  if (!confirmed) {
    return;
  }

  const { response, payload } = await requestJson(`/api/routines/${routineId}/toggle`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: nextValue })
  });
  setServerTime(payload && payload.meta ? payload.meta.server_time : null);

  if (!response.ok) {
    setMessage(elements.routineListMessage, getErrorMessage(payload, "Gagal mengubah status rutinitas."), "error");
    await loadRoutines(state.routinePagination.page);
    return;
  }

  state.selectedRoutineId = payload.data.id;
  setMessage(elements.routineListMessage, successMessage || "Status rutinitas diperbarui.", "success");
  await loadRoutines(state.routinePagination.page);
  await loadRoutineDetail(payload.data.id);
}

async function confirmRoutineHistory(routineId, scheduledDate, status, successMessage) {
  const confirmed = window.confirm(`Konfirmasi kemunculan rutinitas ini sebagai ${ROUTINE_HISTORY_STATUS_LABELS[status]}?`);
  if (!confirmed) {
    return;
  }

  const notes = window.prompt("Catatan opsional untuk riwayat ini:", "") || "";
  const { response, payload } = await requestJson(`/api/routines/${routineId}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scheduled_date: scheduledDate,
      status,
      notes
    })
  });
  setServerTime(payload && payload.meta ? payload.meta.server_time : null);

  if (!response.ok) {
    setMessage(elements.routineListMessage, getErrorMessage(payload, "Gagal mengonfirmasi riwayat rutinitas."), "error");
    await loadRoutineDetail(routineId);
    return;
  }

  setMessage(elements.routineListMessage, successMessage, "success");
  await loadRoutineDetail(routineId);
}

async function submitPasswordForm(event) {
  event.preventDefault();
  const currentPassword = elements.passwordForm.elements.current_password.value;
  const newPassword = elements.passwordForm.elements.new_password.value;
  const confirmPassword = elements.passwordForm.elements.confirm_password.value;

  if (newPassword !== confirmPassword) {
    setMessage(elements.passwordMessage, "Konfirmasi password baru tidak cocok.", "error");
    return;
  }

  setMessage(elements.passwordMessage, "Memperbarui password…", "");
  elements.passwordSubmit.disabled = true;

  try {
    const { response, payload } = await requestJson("/api/auth/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      })
    });

    setServerTime(payload && payload.meta ? payload.meta.server_time : null);

    if (!response.ok) {
      setMessage(elements.passwordMessage, getErrorMessage(payload, "Gagal memperbarui password."), "error");
      return;
    }

    elements.passwordForm.reset();
    setMessage(elements.passwordMessage, "Password berhasil diperbarui.", "success");
  } finally {
    elements.passwordSubmit.disabled = false;
  }
}

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
}

function handleTaskListClick(event) {
  const target = event.target.closest("button, select");
  if (!target) {
    return;
  }

  if (target.matches("[data-task-view]")) {
    loadTaskDetail(Number(target.dataset.taskView));
    return;
  }

  if (target.matches("[data-task-edit]")) {
    const task = getTaskById(Number(target.dataset.taskEdit));
    if (task) {
      fillTaskForm(task);
    }
    return;
  }

  if (target.matches("[data-task-delete]")) {
    deleteTask(Number(target.dataset.taskDelete));
    return;
  }

  if (target.matches("[data-task-complete]")) {
    patchTaskStatus(Number(target.dataset.taskComplete), "completed", "Pekerjaan ditandai selesai.");
  }
}

function handleTaskListChange(event) {
  const select = event.target.closest("select[data-task-status]");
  if (!select) {
    return;
  }

  patchTaskStatus(Number(select.dataset.taskStatus), select.value);
}

function handleActivityListClick(event) {
  const target = event.target.closest("button");
  if (!target) {
    return;
  }

  if (target.matches("[data-activity-view]")) {
    loadActivityDetail(Number(target.dataset.activityView));
    return;
  }

  if (target.matches("[data-activity-edit]")) {
    const activity = getActivityById(Number(target.dataset.activityEdit));
    if (activity) {
      fillActivityForm(activity);
    }
    return;
  }

  if (target.matches("[data-activity-delete]")) {
    deleteActivity(Number(target.dataset.activityDelete));
    return;
  }

  if (target.matches("[data-activity-complete]")) {
    patchActivityStatus(Number(target.dataset.activityComplete), "completed", "Aktivitas ditandai selesai.");
    return;
  }

  if (target.matches("[data-activity-cancel]")) {
    patchActivityStatus(Number(target.dataset.activityCancel), "cancelled", "Aktivitas dibatalkan.");
  }
}

function handleActivityDetailClick(event) {
  const target = event.target.closest("button");
  if (!target) {
    return;
  }

  if (target.matches("[data-activity-detail-edit]")) {
    const activity = getActivityById(Number(target.dataset.activityDetailEdit));
    if (activity) {
      fillActivityForm(activity);
    }
    return;
  }

  if (target.matches("[data-activity-detail-complete]")) {
    patchActivityStatus(Number(target.dataset.activityDetailComplete), "completed", "Aktivitas ditandai selesai.");
    return;
  }

  if (target.matches("[data-activity-detail-cancel]")) {
    patchActivityStatus(Number(target.dataset.activityDetailCancel), "cancelled", "Aktivitas dibatalkan.");
    return;
  }

  if (target.matches("[data-activity-detail-delete]")) {
    deleteActivity(Number(target.dataset.activityDetailDelete));
  }
}

function handleRoutineListClick(event) {
  const target = event.target.closest("button");
  if (!target) {
    return;
  }

  if (target.matches("[data-routine-view]")) {
    loadRoutineDetail(Number(target.dataset.routineView));
    return;
  }

  if (target.matches("[data-routine-edit]")) {
    const routine = getRoutineById(Number(target.dataset.routineEdit));
    if (routine) {
      fillRoutineForm(routine);
    }
    return;
  }

  if (target.matches("[data-routine-toggle]")) {
    toggleRoutine(
      Number(target.dataset.routineToggle),
      target.dataset.routineActive === "true",
      "Status rutinitas diperbarui."
    );
    return;
  }

  if (target.matches("[data-routine-delete]")) {
    deleteRoutine(Number(target.dataset.routineDelete));
  }
}

function handleRoutineDetailClick(event) {
  const target = event.target.closest("button");
  if (!target || !state.routineDetail) {
    return;
  }

  if (target.matches("[data-routine-detail-edit]")) {
    fillRoutineForm(state.routineDetail);
    return;
  }

  if (target.matches("[data-routine-detail-toggle]")) {
    toggleRoutine(
      Number(target.dataset.routineDetailToggle),
      target.dataset.routineDetailActive === "true",
      "Status rutinitas diperbarui."
    );
    return;
  }

  if (target.matches("[data-routine-detail-delete]")) {
    deleteRoutine(Number(target.dataset.routineDetailDelete));
    return;
  }

  if (target.matches("[data-routine-history-complete]")) {
    confirmRoutineHistory(
      state.routineDetail.id,
      target.dataset.routineHistoryDate,
      "completed",
      "Riwayat rutinitas ditandai selesai."
    );
    return;
  }

  if (target.matches("[data-routine-history-cancel]")) {
    confirmRoutineHistory(
      state.routineDetail.id,
      target.dataset.routineHistoryDate,
      "cancelled",
      "Riwayat rutinitas dibatalkan."
    );
  }
}

function bindEvents() {
  if (elements.dashboardPeriod) {
    elements.dashboardPeriod.addEventListener("change", loadDashboard);
  }
  if (elements.reportFiltersForm) {
    elements.reportFiltersForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await loadReports();
    });
  }
  if (elements.reportReset) {
    elements.reportReset.addEventListener("click", async () => {
      elements.reportFiltersForm.reset();
      elements.reportFiltersForm.elements.period.value = "weekly";
      await loadReports();
    });
  }
  elements.taskForm.addEventListener("submit", submitTaskForm);
  elements.taskReset.addEventListener("click", resetTaskForm);
  elements.taskFiltersForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await loadTasks(1);
  });
  document.querySelector("[data-task-clear-filters]").addEventListener("click", async () => {
    elements.taskFiltersForm.reset();
    elements.taskFiltersForm.elements.sort.value = "created_at";
    elements.taskFiltersForm.elements.order.value = "desc";
    elements.taskFiltersForm.elements.page_size.value = "20";
    await loadTasks(1);
  });
  elements.taskPagePrevious.addEventListener("click", async () => {
    if (state.taskPagination.page > 1) {
      await loadTasks(state.taskPagination.page - 1);
    }
  });
  elements.taskPageNext.addEventListener("click", async () => {
    if (state.taskPagination.page < state.taskPagination.total_pages) {
      await loadTasks(state.taskPagination.page + 1);
    }
  });
  elements.taskList.addEventListener("click", handleTaskListClick);
  elements.taskList.addEventListener("change", handleTaskListChange);

  elements.activityForm.addEventListener("submit", submitActivityForm);
  elements.activityReset.addEventListener("click", resetActivityForm);
  elements.activityFiltersForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await loadActivities(1);
  });
  document.querySelector("[data-activity-clear-filters]").addEventListener("click", async () => {
    elements.activityFiltersForm.reset();
    elements.activityFiltersForm.elements.sort.value = "activity_date";
    elements.activityFiltersForm.elements.order.value = "desc";
    elements.activityFiltersForm.elements.page_size.value = "20";
    await loadActivities(1);
  });
  elements.activityPagePrevious.addEventListener("click", async () => {
    if (state.activityPagination.page > 1) {
      await loadActivities(state.activityPagination.page - 1);
    }
  });
  elements.activityPageNext.addEventListener("click", async () => {
    if (state.activityPagination.page < state.activityPagination.total_pages) {
      await loadActivities(state.activityPagination.page + 1);
    }
  });
  elements.activityList.addEventListener("click", handleActivityListClick);
  elements.activityDetail.addEventListener("click", handleActivityDetailClick);

  elements.routineForm.addEventListener("submit", submitRoutineForm);
  elements.routineReset.addEventListener("click", resetRoutineForm);
  elements.routineFiltersForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await loadRoutines(1);
  });
  document.querySelector("[data-routine-clear-filters]").addEventListener("click", async () => {
    elements.routineFiltersForm.reset();
    elements.routineFiltersForm.elements.sort.value = "created_at";
    elements.routineFiltersForm.elements.order.value = "desc";
    elements.routineFiltersForm.elements.page_size.value = "20";
    await loadRoutines(1);
  });
  elements.routinePagePrevious.addEventListener("click", async () => {
    if (state.routinePagination.page > 1) {
      await loadRoutines(state.routinePagination.page - 1);
    }
  });
  elements.routinePageNext.addEventListener("click", async () => {
    if (state.routinePagination.page < state.routinePagination.total_pages) {
      await loadRoutines(state.routinePagination.page + 1);
    }
  });
  elements.routineList.addEventListener("click", handleRoutineListClick);
  elements.routineDetail.addEventListener("click", handleRoutineDetailClick);

  elements.passwordForm.addEventListener("submit", submitPasswordForm);

  for (const button of elements.logoutButtons) {
    button.addEventListener("click", logout);
  }

  if (elements.menuToggle && elements.mobileMenu) {
    elements.menuToggle.addEventListener("click", () => {
      const expanded = elements.menuToggle.getAttribute("aria-expanded") === "true";
      elements.menuToggle.setAttribute("aria-expanded", String(!expanded));
      elements.mobileMenu.hidden = expanded;
    });
  }
}

async function loadSession() {
  const { response, payload } = await requestJson("/api/auth/session");
  if (response.status === 401) {
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    return null;
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Gagal memuat sesi."));
  }

  setServerTime(payload.meta.server_time);
  return payload.data;
}

function renderSession(sessionData) {
  const user = sessionData.user;
  elements.userSummary.textContent = `${user.username} · ${user.email}`;
  elements.displayName.textContent = user.display_name;
  elements.sessionSummary.textContent = `Sesi aktif sampai ${formatDateTime(sessionData.session.expires_at)} WIB.`;
  elements.accountDetails.textContent = `Akun ${user.username} menggunakan zona waktu ${user.timezone}.`;
}

async function boot() {
  try {
    bindEvents();
    setActiveNav();
    setPageVisibility();
    setPageCopy();
    resetTaskForm();
    resetActivityForm();
    resetRoutineForm();
    updateOverviewMetrics();
    const sessionData = await loadSession();
    if (!sessionData) {
      return;
    }

    renderSession(sessionData);

    if (getCurrentPath() === DASHBOARD_PAGE) {
      await loadDashboard();
    } else if (getCurrentPath() === REPORTS_PAGE) {
      await loadReports();
    } else if (getCurrentPath() === ACTIVITY_PAGE) {
      await loadActivities(1);
    } else if (getCurrentPath() === ROUTINE_PAGE) {
      await loadRoutines(1);
    } else {
      await loadTasks(1);
    }

    if (window.location.pathname === SECURITY_PAGE) {
      document.getElementById("security").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (error) {
    const target = getCurrentPath() === ACTIVITY_PAGE
      ? elements.activityListMessage
      : getCurrentPath() === ROUTINE_PAGE
        ? elements.routineListMessage
        : elements.taskListMessage;
    setMessage(target, error.message || "Terjadi kesalahan saat memuat aplikasi.", "error");
  }
}

void boot();
