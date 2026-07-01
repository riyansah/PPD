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

const WIB_OFFSET_MINUTES = 7 * 60;
const TASK_PAGE = "/tasks";
const ACTIVITY_PAGE = "/activities";
const SECURITY_PAGE = "/security";
const state = {
  activities: [],
  activityEditingId: null,
  activityPagination: {
    page: 1,
    page_size: 20,
    total_items: 0,
    total_pages: 0
  },
  selectedActivityId: null,
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

function renderWarnings(target, warnings) {
  if (!target) {
    return;
  }

  target.innerHTML = "";
  for (const warning of warnings || []) {
    const item = document.createElement("div");
    item.className = "warning-card";
    item.innerHTML = `
      <strong>Aktivitas berhasil disimpan dengan peringatan</strong>
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

function getCurrentPath() {
  if (window.location.pathname === ACTIVITY_PAGE) {
    return ACTIVITY_PAGE;
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

function setActiveNav() {
  const currentPath = getCurrentPath();
  for (const link of elements.navLinks) {
    let target = TASK_PAGE;
    if (link.dataset.navTarget === "activities") {
      target = ACTIVITY_PAGE;
    }
    if (link.dataset.navTarget === "security") {
      target = SECURITY_PAGE;
    }
    link.classList.toggle("is-active", currentPath === target);
  }
}

function setPageVisibility() {
  const currentPath = getCurrentPath();
  for (const section of elements.pageModules) {
    const sectionPath = section.dataset.pageSection === "activities"
      ? ACTIVITY_PAGE
      : TASK_PAGE;
    section.hidden = currentPath !== sectionPath;
  }
}

function setPageCopy() {
  const currentPath = getCurrentPath();

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
  elements.taskPaginationLabel.textContent = totalPages
    ? `Halaman ${page} dari ${totalPages}`
    : "Tidak ada halaman";
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
  elements.activityPaginationLabel.textContent = totalPages
    ? `Halaman ${page} dari ${totalPages}`
    : "Tidak ada halaman";
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
      renderWarnings(elements.activityWarningList, payload.warnings);
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

function bindEvents() {
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
    updateOverviewMetrics();
    const sessionData = await loadSession();
    if (!sessionData) {
      return;
    }

    renderSession(sessionData);

    if (getCurrentPath() === ACTIVITY_PAGE) {
      await loadActivities(1);
    } else {
      await loadTasks(1);
    }

    if (window.location.pathname === SECURITY_PAGE) {
      document.getElementById("security").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (error) {
    setMessage(getCurrentPath() === ACTIVITY_PAGE ? elements.activityListMessage : elements.taskListMessage, error.message || "Terjadi kesalahan saat memuat aplikasi.", "error");
  }
}

void boot();
