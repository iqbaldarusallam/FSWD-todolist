function readStorage(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch { return fallback; }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function activeUserKey(suffix) {
  const user = UserSwitcher?.getActiveUser() || "default";
  return suffix + "-" + user;
}

function loadTasks() {
  return readStorage(activeUserKey("lumina-tasks"), []);
}

function saveTasks(tasks) {
  writeStorage(activeUserKey("lumina-tasks"), tasks);
}

function loadProfile() {
  const user = String(UserSwitcher?.getActiveUser() || "User").trim() || "User";
  const fallback = { name: user, role: "Staff Operasional" };
  const stored = readStorage(activeUserKey("lumina-profile"), null);
  if (!stored || typeof stored !== "object" || !stored.name) return fallback;
  stored.name = String(stored.name).trim() || user;
  stored.role = String(stored.role || "Staff Operasional").trim();
  return stored;
}

function saveProfile(profile) {
  writeStorage(activeUserKey("lumina-profile"), profile);
}

function getInitials(name) {
  return String(name || "").split(" ").filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("");
}

function createTask({ text, description = "", priority = "Medium", deadline = null }) {
  const task = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    text,
    description,
    priority,
    deadline,
    createdAt: new Date().toISOString(),
    completed: false,
    completedAt: null,
  };
  const tasks = loadTasks();
  tasks.unshift(task);
  saveTasks(tasks);
  return task;
}

function toggleTask(id) {
  const tasks = loadTasks().map(t => {
    if (t.id !== id) return t;
    const completed = !t.completed;
    return { ...t, completed, completedAt: completed ? new Date().toISOString() : null };
  });
  saveTasks(tasks);
  const updated = tasks.find(t => t.id === id);
  return { tasks, completed: !!updated?.completed };
}

function deleteTask(id) {
  saveTasks(loadTasks().filter(t => t.id !== id));
}

function updateTask(id, payload) {
  const tasks = loadTasks().map(t => t.id === id ? { ...t, ...payload } : t);
  saveTasks(tasks);
  return tasks.find(t => t.id === id);
}

function isTaskOverdue(task) {
  if (task.completed) return false;
  const c = new Date(task.createdAt), now = new Date();
  return new Date(c.getFullYear(), c.getMonth(), c.getDate()) < new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isDeadlineMissed(task) {
  if (!task.deadline || task.completed) return false;
  const now = new Date();
  const deadlineDay = new Date(task.deadline + "T00:00:00");
  return deadlineDay < new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function dueLabel(task) {
  if (!task.deadline) return "";
  const now = new Date();
  const deadlineDay = new Date(task.deadline + "T00:00:00");
  const diff = Math.ceil((deadlineDay - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `Terlambat ${Math.abs(diff)} hari`;
  if (diff === 0) return "Jatuh tempo hari ini";
  if (diff === 1) return "Jatuh tempo besok";
  return `Jatuh tempo ${task.deadline}`;
}

function formatDateTime(d) {
  const date = new Date(d);
  const dateStr = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
  const timeStr = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  return `${dateStr}, ${timeStr}`;
}

function formatDayDate() {
  const now = new Date();
  return {
    day: new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(now),
    date: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(now),
  };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Selamat pagi";
  if (h < 17) return "Selamat siang";
  return "Selamat malam";
}

function escapeHtml(t) {
  const d = document.createElement("div");
  d.textContent = t;
  return d.innerHTML;
}

function renderTaskCard(task, index) {
  const completed = !!task.completed;
  const overdue = isDeadlineMissed(task);
  const badgeClass = task.priority === "High" ? "badge-high" : task.priority === "Medium" ? "badge-medium" : "badge-low";
  const statusClass = completed ? "done" : overdue ? "overdue" : "";
  const statusIcon = completed ? "check" : overdue ? "alert-circle" : "circle";
  const borderLeft = overdue ? "var(--error)" : completed ? "#10b981" : "var(--primary-container)";
  const meta = [];
  meta.push(`<span><i data-lucide="clock"></i> ${formatDateTime(task.createdAt)}</span>`);
  if (!completed && task.deadline) meta.push(`<span><i data-lucide="calendar"></i> ${escapeHtml(dueLabel(task))}</span>`);
  if (completed && task.completedAt) meta.push(`<span class="meta-done"><i data-lucide="check-circle-2"></i> Selesai ${formatDateTime(task.completedAt)}</span>`);
  return `
    <div class="task-item animate-slide-up${completed ? " completed" : ""}" style="border-left:3px solid ${borderLeft};animation-delay:${index * 50}ms;" data-id="${task.id}">
      <div class="task-row-top">
        <button class="task-checkbox-button" data-toggle="${task.id}" title="${completed ? "Batalkan selesai" : "Tandai selesai"}">
          <span class="task-status-indicator ${statusClass}"><i data-lucide="${statusIcon}"></i></span>
        </button>
        <div class="task-main">
          <div class="task-title-row">
            <span class="task-item-title ${completed ? "done" : ""}">${escapeHtml(task.text)}</span>
            <span class="badge ${badgeClass}">${task.priority}</span>
          </div>
          ${task.description ? `<p class="task-item-desc">${escapeHtml(task.description)}</p>` : ""}
          <div class="task-meta-line">${meta.join('<span class="task-meta-separator">·</span>')}</div>
          <div class="task-actions">
            <button class="task-toggle-btn ${completed ? "reopen" : "complete"}" data-toggle="${task.id}">
              <i data-lucide="${completed ? "rotate-ccw" : "check"}"></i>
              ${completed ? "Batalkan Selesai" : "Selesai"}
            </button>
            <div class="task-tools">
              <a class="task-icon-btn" href="task-detail.html?id=${task.id}" title="Detail"><i data-lucide="external-link"></i></a>
              <a class="task-icon-btn" href="create-task.html?id=${task.id}" title="Edit"><i data-lucide="pencil"></i></a>
              <button class="task-icon-btn delete" data-delete="${task.id}" title="Hapus"><i data-lucide="trash-2"></i></button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function bindTaskListEvents(container) {
  container.addEventListener("click", e => {
    const toggleTarget = e.target.closest("[data-toggle]");
    if (toggleTarget) {
      const result = toggleTask(toggleTarget.dataset.toggle);
      container.dispatchEvent(new CustomEvent("taskChanged"));
      showToast(result.completed ? "Task selesai!" : "Status selesai dibatalkan");
      return;
    }
    const deleteTarget = e.target.closest("[data-delete]");
    if (!deleteTarget) return;
    const item = deleteTarget.closest(".task-item");
    if (item) { item.style.transform = "translateX(100%)"; item.style.opacity = "0"; item.style.transition = "all 0.3s ease"; }
    setTimeout(() => { deleteTask(deleteTarget.dataset.delete); container.dispatchEvent(new CustomEvent("taskChanged")); showToast("Task dihapus"); }, 300);
  });
}

function showToast(message, type = "success") {
  let c = document.querySelector(".toast-container");
  if (!c) { c = document.createElement("div"); c.className = "toast-container"; document.body.appendChild(c); }
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  const iconName = type === "success" ? "check-circle" : "alert-circle";
  toast.innerHTML = `<i data-lucide="${iconName}" style="width:16px;height:16px;flex-shrink:0;"></i><span>${message}</span>`;
  c.appendChild(toast);
  lucide?.createIcons({ nodes: [toast] });
  setTimeout(() => {
    toast.classList.add("toast-hide");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}

function initShell() {
  if (typeof UserSwitcher !== "undefined") UserSwitcher.init();

  const profile = loadProfile();
  const initials = getInitials(profile.name);
  const currentPage = document.body.dataset.page;

  document.querySelectorAll(".avatar-initials:not(.user-switcher-avatar):not(.user-switcher-item .avatar-initials)").forEach(el => {
    el.textContent = initials;
  });
  document.querySelectorAll(".profile-name-display").forEach(el => { el.textContent = profile.name; });
  document.querySelectorAll(".profile-role-display").forEach(el => { el.textContent = profile.role; });

  const greetingEl = document.getElementById("greeting");
  const nameDisplay = document.getElementById("userNameDisplay");
  const displayName = String(profile.name || "User").trim() || "User";
  if (greetingEl) greetingEl.textContent = `${getGreeting()}, ${displayName.split(" ")[0]}`;
  if (nameDisplay) nameDisplay.textContent = displayName;

  const editNameBtn = document.getElementById("editNameBtn");
  const nameEditSection = document.getElementById("nameEditSection");
  const nameInput = document.getElementById("nameInput");
  const saveNameBtn = document.getElementById("saveNameBtn");
  if (editNameBtn && nameEditSection) {
    editNameBtn.addEventListener("click", () => {
      nameInput.value = profile.name;
      nameEditSection.style.display = nameEditSection.style.display === "none" ? "flex" : "none";
      if (nameEditSection.style.display === "flex") nameInput.focus();
    });
    saveNameBtn?.addEventListener("click", () => {
      const newName = nameInput.value.trim();
      if (!newName) return;
      const active = UserSwitcher?.getActiveUser();
      if (active && active !== newName) {
        const users = UserSwitcher.getUsers().map(u => u === active ? newName : u);
        UserSwitcher.saveUsers(users);
        const oldTasks = localStorage.getItem("lumina-tasks-" + active);
        const oldProfile = localStorage.getItem("lumina-profile-" + active);
        if (oldTasks) localStorage.setItem("lumina-tasks-" + newName, oldTasks);
        if (oldProfile) localStorage.setItem("lumina-profile-" + newName, oldProfile);
        localStorage.removeItem("lumina-tasks-" + active);
        localStorage.removeItem("lumina-profile-" + active);
        UserSwitcher.setActiveUser(newName);
      }
      saveProfile({ name: newName, role: profile.role });
      window.location.reload();
    });
    nameInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveNameBtn.click();
    });
  }

  document.querySelectorAll(".sidebar-link, .bottomnav-item").forEach(link => {
    link.classList.toggle("active", link.dataset.page === currentPage);
  });

  const hamburger = document.getElementById("mobileHamburger");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  if (hamburger && sidebar && overlay) {
    hamburger.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      overlay.classList.toggle("open");
    });
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("open");
    });
    sidebar.querySelectorAll(".sidebar-link, .sidebar-new-task").forEach(link => {
      link.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("open");
      });
    });
  }

  lucide?.createIcons();
  initScrollReveal();
}

document.addEventListener("DOMContentLoaded", initShell);
