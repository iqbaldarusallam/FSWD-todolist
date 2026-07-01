(function () {
  const params = new URLSearchParams(window.location.search);
  const taskId = params.get("id");
  const contentEl = document.getElementById("detailContent");

  function render() {
    const task = loadTasks().find(t => t.id === taskId);
    if (!task) {
      contentEl.innerHTML = `
        <a href="my-tasks.html" class="back-link"><i data-lucide="arrow-left" style="width:18px;height:18px;"></i> Kembali ke Tasks</a>
        <div class="empty-state">
          <div class="empty-state-icon"><i data-lucide="file-x"></i></div>
          <h3>Task tidak ditemukan</h3>
          <p>Task mungkin sudah dihapus.</p>
          <a href="my-tasks.html" class="btn-primary">Kembali ke Tasks</a>
        </div>`;
      lucide?.createIcons({ nodes: [contentEl] });
      return;
    }

    const overdue = !task.completed && isTaskOverdue(task);
    const statusText = task.completed ? "Selesai" : overdue ? "Terlambat" : "Sedang Dikerjakan";
    const statusColor = task.completed ? "#10b981" : overdue ? "var(--error)" : "var(--primary-container)";

    contentEl.innerHTML = `
      <a href="my-tasks.html" class="back-link"><i data-lucide="arrow-left" style="width:18px;height:18px;"></i> Kembali ke Tasks</a>
      <div class="detail-header animate-fade-in">
        <div class="detail-header-badges">
          <span class="badge ${task.priority === "High" ? "badge-high" : task.priority === "Medium" ? "badge-medium" : "badge-low"}"><i data-lucide="flag" style="width:14px;height:14px;"></i> ${task.priority}</span>
        </div>
        <h1 class="detail-title">${escapeHtml(task.text)}</h1>
        <div class="detail-meta" style="flex-wrap:wrap;gap:8px 24px;">
          <div class="detail-meta-item"><i data-lucide="clock" style="width:16px;height:16px;"></i><span>Dibuat ${formatDateTime(task.createdAt)}</span></div>
          ${task.completed && task.completedAt ? `<div class="detail-meta-item" style="color:#10b981;"><i data-lucide="check-circle-2" style="width:16px;height:16px;"></i><span>Selesai ${formatDateTime(task.completedAt)}</span></div>` : ""}
          ${overdue ? `<div class="detail-meta-item" style="color:var(--error);"><i data-lucide="alert-circle" style="width:16px;height:16px;"></i><span>Terlambat</span></div>` : ""}
          ${task.deadline ? `<div class="detail-meta-item"><i data-lucide="calendar" style="width:16px;height:16px;"></i><span>Deadline ${task.deadline}</span></div>` : ""}
        </div>
      </div>
      <div class="detail-bento stagger">
        <div class="base-card bento-card">
          <div class="bento-card-label">Status</div>
          <div class="bento-card-value"><span class="pulse-dot" style="background:${statusColor};"></span> ${statusText}</div>
        </div>
        <div class="base-card bento-card">
          <div class="bento-card-label">Prioritas</div>
          <div class="bento-card-value" style="font:var(--headline-md);">${task.priority}</div>
        </div>
      </div>
      <div class="detail-section animate-slide-up" style="animation-delay:200ms;">
        <h3 class="detail-section-title"><i data-lucide="file-text" style="width:20px;height:20px;"></i> Description</h3>
        <div class="detail-description"><p>${escapeHtml(task.description || task.text)}</p></div>
      </div>
      <div class="detail-float-action animate-slide-up" style="animation-delay:300ms; display:flex; gap:12px; flex-wrap:wrap;">
        <a href="create-task.html?id=${task.id}" class="btn-secondary" style="flex:1; min-width:180px; justify-content:center; padding:16px;"><i data-lucide="pencil" style="width:20px;height:20px;"></i> Edit Task</a>
        <button class="btn-primary" id="toggleCompleteBtn" style="flex:1; min-width:180px; padding:16px;font:var(--headline-md);"><i data-lucide="${task.completed ? "rotate-ccw" : "check-circle"}" style="width:20px;height:20px;"></i> ${task.completed ? "Batalkan Selesai" : "Tandai Selesai"}</button>
      </div>`;

    lucide?.createIcons({ nodes: [contentEl] });
    const mobileEditLink = document.getElementById("mobileEditLink");
    if (mobileEditLink) mobileEditLink.href = `create-task.html?id=${task.id}`;

    document.getElementById("toggleCompleteBtn").addEventListener("click", function() {
      this.disabled = true;
      this.style.transform = "scale(0.95)";
      setTimeout(() => {
        const result = toggleTask(task.id);
        render();
        showToast(result.completed ? "Task selesai" : "Status selesai dibatalkan");
      }, 200);
    });
  }

  render();
})();
