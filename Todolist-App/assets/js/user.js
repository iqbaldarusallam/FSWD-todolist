(function () {
  const userForm = document.getElementById("userForm");
  const nameInput = document.getElementById("userNameInput");
  const roleInput = document.getElementById("userRoleInput");
  const userListPage = document.getElementById("userListPage");

  function renderUserPage() {
    const active = UserSwitcher.getActiveUser();
    const profile = loadProfile();
    nameInput.value = profile.name || active || "";
    roleInput.value = profile.role || "Staff Operasional";

    const users = UserSwitcher.getUsers();
    if (!users.length) {
      userListPage.innerHTML = `<div class="mission-empty-mini">Belum ada user. Simpan nama untuk membuat user pertama.</div>`;
      return;
    }

    userListPage.innerHTML = users.map(name => {
      const isActive = name === active;
      const ini = getInitials(name) || "?";
      return `
        <div class="user-list-page-item ${isActive ? "active" : ""}" data-user="${escapeHtml(name)}">
          <div class="avatar avatar-initials" style="width:36px;height:36px;font-size:12px;">${ini}</div>
          <div style="flex:1;min-width:0;">
            <strong>${escapeHtml(name)}</strong>
            <span>${isActive ? "Sedang digunakan" : "Klik untuk gunakan"}</span>
          </div>
          ${isActive ? '<i data-lucide="check-circle" style="width:20px;height:20px;color:var(--primary);"></i>' : '<i data-lucide="chevron-right" style="width:18px;height:18px;color:var(--outline);"></i>'}
        </div>`;
    }).join("");
    lucide?.createIcons({ nodes: [userListPage] });
  }

  userForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newName = nameInput.value.trim();
    const role = roleInput.value.trim() || "Staff Operasional";
    if (!newName) {
      nameInput.focus();
      showToast("Nama pengguna harus diisi", "error");
      return;
    }

    const oldName = UserSwitcher.getActiveUser();
    const users = UserSwitcher.getUsers();

    if (oldName && oldName !== newName) {
      const updatedUsers = users.map(u => u === oldName ? newName : u);
      if (!updatedUsers.includes(newName)) updatedUsers.push(newName);
      localStorage.setItem("lumina-users", JSON.stringify([...new Set(updatedUsers)]));

      const oldTasks = localStorage.getItem("lumina-tasks-" + oldName);
      if (oldTasks) localStorage.setItem("lumina-tasks-" + newName, oldTasks);
      localStorage.removeItem("lumina-tasks-" + oldName);
      localStorage.removeItem("lumina-profile-" + oldName);
    } else {
      UserSwitcher.addUser(newName);
    }

    UserSwitcher.setActiveUser(newName);
    saveProfile({ name: newName, role });
    showToast("Data user berhasil disimpan");
    setTimeout(() => window.location.reload(), 500);
  });

  userListPage.addEventListener("click", (e) => {
    const item = e.target.closest(".user-list-page-item");
    if (!item) return;
    const name = item.dataset.user;
    if (!name) return;
    UserSwitcher.setActiveUser(name);
    showToast(`Menggunakan user ${name}`);
    setTimeout(() => window.location.reload(), 400);
  });

  renderUserPage();
})();
