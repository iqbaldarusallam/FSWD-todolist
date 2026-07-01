const UserSwitcher = (function () {
  const USERS_KEY = "lumina-users";
  const ACTIVE_KEY = "lumina-active-user";

  function getUsers() {
    try {
      const v = JSON.parse(localStorage.getItem(USERS_KEY));
      if (!Array.isArray(v)) return [];
      return v.filter(u => typeof u === "string" && u.trim());
    } catch {
      return [];
    }
  }

  function saveUsers(arr) {
    localStorage.setItem(USERS_KEY, JSON.stringify(arr));
  }

  function getActiveUser() {
    const v = localStorage.getItem(ACTIVE_KEY);
    return typeof v === "string" ? v : "";
  }

  function setActiveUser(name) {
    localStorage.setItem(ACTIVE_KEY, name);
  }

  function addUser(name) {
    const clean = (name || "").trim();
    if (!clean) return false;
    const users = getUsers();
    if (!users.includes(clean)) {
      users.push(clean);
      saveUsers(users);
    }
    setActiveUser(clean);
    return true;
  }

  function removeUser(name) {
    const users = getUsers().filter((u) => u !== name);
    saveUsers(users);
    localStorage.removeItem("lumina-tasks-" + name);
    localStorage.removeItem("lumina-profile-" + name);
    if (getActiveUser() === name) {
      setActiveUser(users[0] || "");
    }
  }

  function migrateOldData() {
    const users = getUsers();
    if (users.length > 0) return;

    const oldTasks = JSON.parse(
      localStorage.getItem("mission4-lumina-tasks") || "[]",
    );
    const oldProfile = JSON.parse(
      localStorage.getItem("mission4-lumina-profile") || "null",
    );
    const defaultName = String(oldProfile?.name || "User").trim() || "User";

    saveUsers([defaultName]);
    setActiveUser(defaultName);

    if (Array.isArray(oldTasks) && oldTasks.length > 0) {
      localStorage.setItem(
        "lumina-tasks-" + defaultName,
        JSON.stringify(oldTasks),
      );
    }

    if (oldProfile && typeof oldProfile === "object") {
      localStorage.setItem(
        "lumina-profile-" + defaultName,
        JSON.stringify({ name: defaultName, role: oldProfile.role || "Staff Operasional" }),
      );
    }
  }

  function init() {
    migrateOldData();

    const active = getActiveUser();
    const users = getUsers();
    if (!active && users.length > 0) {
      setActiveUser(users[0]);
    } else if (active && !users.includes(active)) {
      setActiveUser(users[0] || "");
    }

    document.querySelectorAll(".user-switcher-area").forEach((area) => {
      const activeUser = getActiveUser();
      const initials =
        activeUser
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0]?.toUpperCase())
          .join("") || "?";

      area.innerHTML = `
        <div class="user-switcher-trigger" id="userSwitcherTrigger">
          <div class="avatar avatar-initials user-switcher-avatar">${initials}</div>
          <div class="user-switcher-info">
            <span class="user-switcher-name">${activeUser || "Pilih User"}</span>
            <span class="user-switcher-label">Klik untuk switch</span>
          </div>
          <i data-lucide="chevron-down" style="width:16px;height:16px;color:var(--outline);"></i>
        </div>
        <div class="user-switcher-dropdown" id="userSwitcherDropdown">
          <div class="user-switcher-list" id="userSwitcherList"></div>
          <div class="user-switcher-add">
            <input type="text" id="newUserInput" placeholder="Tambah user baru..." maxlength="30" />
            <button id="addUserBtn" class="btn-primary" style="padding:8px 14px;font:500 12px/16px var(--font);">
              <i data-lucide="plus" style="width:14px;height:14px;"></i>
            </button>
          </div>
        </div>
      `;

      renderUserList();
      lucide?.createIcons({ nodes: [area] });

      const trigger = document.getElementById("userSwitcherTrigger");
      const dropdown = document.getElementById("userSwitcherDropdown");
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("open");
      });

      document.addEventListener("click", (e) => {
        if (!area.contains(e.target)) dropdown.classList.remove("open");
      });

      const addBtn = document.getElementById("addUserBtn");
      const newInput = document.getElementById("newUserInput");
      function doAdd() {
        const name = newInput.value.trim();
        if (!name) return;
        addUser(name);
        newInput.value = "";
        dropdown.classList.remove("open");
        window.location.reload();
      }
      addBtn.addEventListener("click", doAdd);
      newInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") doAdd();
      });

      area.addEventListener("click", (e) => {
        const userBtn = e.target.closest(".user-switcher-item");
        if (!userBtn) return;
        const name = userBtn.dataset.user;
        if (name && name !== getActiveUser()) {
          setActiveUser(name);
          window.location.reload();
        }
      });
    });

    const activeUser = getActiveUser();
    const initials =
      activeUser
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("") || "?";
    document
      .querySelectorAll(".mobile-topbar .avatar-initials")
      .forEach((el) => {
        el.textContent = initials;
      });
  }

  function renderUserList() {
    const list = document.getElementById("userSwitcherList");
    if (!list) return;
    const users = getUsers();
    const active = getActiveUser();
    list.innerHTML = users
      .map((name) => {
        const ini =
          name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase())
            .join("") || "?";
        const isActive = name === active;
        return `
        <div class="user-switcher-item ${isActive ? "active" : ""}" data-user="${name}">
          <div class="avatar avatar-initials" style="width:28px;height:28px;font-size:10px;">${ini}</div>
          <span class="user-switcher-item-name">${name}</span>
          ${isActive ? '<i data-lucide="check" style="width:14px;height:14px;color:var(--primary);"></i>' : ""}
        </div>`;
      })
      .join("");
    lucide?.createIcons({ nodes: [list] });
  }

  return {
    getUsers,
    getActiveUser,
    setActiveUser,
    addUser,
    removeUser,
    migrateOldData,
    init,
  };
})();
