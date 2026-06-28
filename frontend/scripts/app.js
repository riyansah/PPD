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

const WIB_OFFSET_MINUTES = 7 * 60;
const state = {
  editingTaskId: null,
  pagination: {
    page: 1,
    page_size: 20,
    total_items: 0,
    total_pages: 0
  },
  selectedTaskId: null,
  serverTime: null,
  tasks: []
};

const elements = {
  accountDetails: document.querySelector("[data-account-details]"),
  clearFilters: document.querySelector("[data-clear-filters]"),
  displayName: document.querySelector("[data-display-name]"),
  filtersForm: document.querySelector("[data-task-filters]"),
  listMessage: document.querySelector("[data-task-list-message]"),
  logoutButtons: Array.from(document.querySelectorAll("[data-logout-button]")),
  menuToggle: document.querySelector("[data-menu-toggle]"),
  mobileMenu: document.getElementById("mobile-menu"),
  navLinks: Array.from(document.querySelectorAll("[data-nav-target]")),
  pageNext: document.querySelector("[data-page-next]"),
  pagePrevious: document.querySelector("[data-page-previous]"),
  paginationLabel: document.querySelector("[data-pagination-label]"),
  passwordForm: document.querySelector("[data-password-form]"),
  passwordMessage: document.querySelector("[data-password-message]"),
  passwordSubmit: document.querySelector("[data-password-submit]"),
  serverTime: document.querySelector("[data-server-time]"),
  sessionSummary: document.querySelector("[data-session-summary]"),
  taskDetail: document.querySelector("[data-task-detail]"),
  taskForm: document.querySelector("[data-task-form]"),
  taskFormMessage: document.querySelector("[data-task-form-message]"),
  taskFormTitle: document.querySelector("[data-task-form-title]"),
  taskList: document.querySelector("[data-task-list]"),
  taskSummary: document.querySelector("[data-task-summary]"),
  taskSubmit: document.querySelector("[data-task-submit]"),
  taskReset: document.querySelector("[data-task-reset]"),
  userSummary: document.querySelector("[data-user-summary]")
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function setMessage(target, message, stateName = "") {
  if (!target) {
    return;
  }

  target.textContent = message;
  target.className = `form-message${stateName ? ` is-${stateName}` : ""}`;
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

function setServerTime(serverTime) {
  state.serverTime = serverTime || null;
  if (elements.serverTime) {
    elements.serverTime.textContent = serverTime
      ? `Server ${formatDateTime(serverTime)}`
      : "Waktu server tidak tersedia";
  }
}

function getCurrentPath() {
  return window.location.pathname === "/security" ? "/security" : "/tasks";
}

function setActiveNav() {
  const currentPath = getCurrentPath();
  for (const link of elements.navLinks) {
    const target = link.dataset.navTarget === "security" ? "/security" : "/tasks";
    link.classList.toggle("is-active", currentPath === target);
  }
}

function resetTaskForm() {
  state.editingTaskId = null;
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
    return;
  }

  elements.taskDetail.innerHTML = `
    <div class="detail-stack">
      <div>
        <h4>${escapeHtml(task.title)}</h4>
        <p class="subtle">${escapeHtml(task.description || "Tidak ada deskripsi.")}</p>
      </div>
      <div class="detail-grid">
        <div><strong>Status</strong><span>${escapeHtml(STATUS_LABELS[task.status] || task.status)}</span></div>
        <div><strong>Prioritas</strong><span>${escapeHtml(PRIORITY_LABELS[task.priority] || task.priority)}</span></div>
        <div><strong>Mulai</strong><span>${escapeHtml(formatDateTime(task.start_at))}</span></div>
        <div><strong>Deadline</strong><span>${escapeHtml(formatDateTime(task.deadline_at))}</span></div>
        <div><strong>Selesai</strong><span>${escapeHtml(formatDateTime(task.completed_at))}</span></div>
        <div><strong>Terlambat</strong><span>${task.is_overdue ? "Ya" : "Tidak"}</span></div>
      </div>
    </div>
  `;
}

function fillTaskForm(task) {
  state.editingTaskId = task.id;
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

function buildStatusOptions(task) {
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
            ${buildStatusOptions(task)}
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

function updatePaginationUi() {
  const { page, page_size: pageSize, total_items: totalItems, total_pages: totalPages } = state.pagination;
  elements.paginationLabel.textContent = totalPages
    ? `Halaman ${page} dari ${totalPages}`
    : "Tidak ada halaman";
  elements.pagePrevious.disabled = page <= 1;
  elements.pageNext.disabled = totalPages === 0 || page >= totalPages;
  elements.taskSummary.textContent = totalItems
    ? `${totalItems} pekerjaan ditemukan, menampilkan hingga ${pageSize} per halaman.`
    : "Belum ada data pekerjaan untuk ditampilkan.";
}

function buildTaskListQuery(page = state.pagination.page) {
  const params = new URLSearchParams();
  const formData = new FormData(elements.filtersForm);

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
  state.pagination.page = page;
  setMessage(elements.listMessage, "Memuat daftar pekerjaan…", "");

  const params = buildTaskListQuery(page);
  const { response, payload } = await requestJson(`/api/tasks?${params.toString()}`);
  setServerTime(payload && payload.meta ? payload.meta.server_time : null);

  if (!response.ok) {
    setMessage(elements.listMessage, getErrorMessage(payload, "Gagal memuat daftar pekerjaan."), "error");
    return;
  }

  state.tasks = payload.data.items;
  state.pagination = payload.meta.pagination;
  renderTaskList();
  updatePaginationUi();
  setMessage(elements.listMessage, "", "");

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
    const taskId = state.editingTaskId;
    const method = taskId ? "PUT" : "POST";
    const path = taskId ? `/api/tasks/${taskId}` : "/api/tasks";
    const { response, payload } = await requestJson(path, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
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
    await loadTasks(taskId ? state.pagination.page : 1);
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

  const { response, payload } = await requestJson(`/api/tasks/${taskId}`, {
    method: "DELETE"
  });
  setServerTime(payload && payload.meta ? payload.meta.server_time : null);

  if (!response.ok) {
    setMessage(elements.listMessage, getErrorMessage(payload, "Gagal menghapus pekerjaan."), "error");
    return;
  }

  if (state.selectedTaskId === taskId) {
    state.selectedTaskId = null;
  }

  setMessage(elements.listMessage, "Pekerjaan berhasil dihapus.", "success");
  await loadTasks(state.pagination.page);
}

async function patchTaskStatus(taskId, status, successMessage = "Status pekerjaan diperbarui.") {
  const { response, payload } = await requestJson(`/api/tasks/${taskId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status })
  });
  setServerTime(payload && payload.meta ? payload.meta.server_time : null);

  if (!response.ok) {
    setMessage(elements.listMessage, getErrorMessage(payload, "Gagal memperbarui status pekerjaan."), "error");
    await loadTasks(state.pagination.page);
    return;
  }

  state.selectedTaskId = payload.data.id;
  setMessage(elements.listMessage, successMessage, "success");
  await loadTasks(state.pagination.page);
}

async function loadTaskDetail(taskId) {
  const { response, payload } = await requestJson(`/api/tasks/${taskId}`);
  setServerTime(payload && payload.meta ? payload.meta.server_time : null);

  if (!response.ok) {
    setMessage(elements.listMessage, getErrorMessage(payload, "Gagal memuat detail pekerjaan."), "error");
    return;
  }

  state.selectedTaskId = payload.data.id;
  renderTaskDetail(payload.data);
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
      headers: {
        "Content-Type": "application/json"
      },
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
  await fetch("/api/auth/logout", {
    method: "POST"
  });
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

function bindEvents() {
  elements.taskForm.addEventListener("submit", submitTaskForm);
  elements.taskReset.addEventListener("click", resetTaskForm);
  elements.filtersForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await loadTasks(1);
  });
  elements.clearFilters.addEventListener("click", async () => {
    elements.filtersForm.reset();
    elements.filtersForm.elements.sort.value = "created_at";
    elements.filtersForm.elements.order.value = "desc";
    elements.filtersForm.elements.page_size.value = "20";
    await loadTasks(1);
  });
  elements.pagePrevious.addEventListener("click", async () => {
    if (state.pagination.page > 1) {
      await loadTasks(state.pagination.page - 1);
    }
  });
  elements.pageNext.addEventListener("click", async () => {
    if (state.pagination.page < state.pagination.total_pages) {
      await loadTasks(state.pagination.page + 1);
    }
  });
  elements.taskList.addEventListener("click", handleTaskListClick);
  elements.taskList.addEventListener("change", handleTaskListChange);
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
    resetTaskForm();
    const sessionData = await loadSession();
    if (!sessionData) {
      return;
    }

    renderSession(sessionData);
    await loadTasks(1);

    if (window.location.pathname === "/security") {
      document.getElementById("security").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (error) {
    setMessage(elements.listMessage, error.message || "Terjadi kesalahan saat memuat aplikasi.", "error");
  }
}

void boot();
