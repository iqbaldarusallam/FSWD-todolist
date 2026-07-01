
(function () {
  const contentEl = document.getElementById("analyticsContent");

  let tasks = loadTasks();

  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;
  const active = total - done;
  const overdue = tasks.filter(t => !t.completed && isTaskOverdue(t)).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const now = new Date();
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const weekData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    const count = tasks.filter(t => { const c = new Date(t.createdAt); return c >= dayStart && c < dayEnd; }).length;
    weekData.push({ day: dayNames[d.getDay()], count });
  }
  const maxCount = Math.max(...weekData.map(w => w.count), 1);
  const peakIdx = weekData.findIndex(w => w.count === maxCount);

  const recentDone = tasks.filter(t => t.completed && t.completedAt).sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)).slice(0, 5);
  const upcomingDeadlines = tasks.filter(t => !t.completed && t.deadline).sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 5);

  contentEl.innerHTML = `
    <div class="productivity-card animate-fade-in">
      <div class="productivity-label">Tingkat Penyelesaian Task</div>
      <div class="productivity-score"><span id="prodScore">0</span><small>%</small></div>
      <div class="productivity-bar"><div class="productivity-bar-fill" id="prodBar" style="width:0%;"></div></div>
      <div class="productivity-trend">
        <i data-lucide="${percent >= 50 ? 'trending-up' : 'trending-down'}" style="width:18px;height:18px;"></i>
        <span>${done} dari ${total} task selesai</span>
      </div>
    </div>

    <div class="analytics-bento stagger">
      <div class="base-card bento-metric">
        <div class="bento-metric-icon" style="background:rgba(37,99,235,0.1);color:var(--primary-container);"><i data-lucide="layers" style="width:22px;height:22px;"></i></div>
        <div class="bento-metric-value">${total}</div>
        <div class="bento-metric-label">Total Task</div>
      </div>
      <div class="base-card bento-metric">
        <div class="bento-metric-icon" style="background:rgba(148,55,0,0.1);color:var(--tertiary);"><i data-lucide="clock" style="width:22px;height:22px;"></i></div>
        <div class="bento-metric-value">${active}</div>
        <div class="bento-metric-label">Task Aktif</div>
      </div>
      <div class="base-card bento-metric">
        <div class="bento-metric-icon" style="background:rgba(16,185,129,0.1);color:#10b981;"><i data-lucide="check-circle-2" style="width:22px;height:22px;"></i></div>
        <div class="bento-metric-value">${done}</div>
        <div class="bento-metric-label">Completed</div>
      </div>
      <div class="base-card bento-metric">
        <div class="bento-metric-icon" style="background:rgba(186,26,26,0.1);color:var(--error);"><i data-lucide="alert-circle" style="width:22px;height:22px;"></i></div>
        <div class="bento-metric-value">${overdue}</div>
        <div class="bento-metric-label">Terlambat</div>
      </div>
      <div class="base-card bento-metric bento-full-width bar-chart-container">
        <div class="bar-chart-header"><h3>Aktivitas Minggu Ini</h3><span style="font:var(--label-sm);color:var(--outline);">${total} task</span></div>
        <div class="bar-chart" id="barChart">
          ${weekData.map((w, i) => {
            const h = maxCount > 0 ? (w.count / maxCount) * 100 : 0;
            const p = i === peakIdx && w.count > 0 ? " peak" : "";
            return `<div class="bar-chart-col"><div class="bar-chart-bar${p}" style="height:${h}%;"><div class="bar-chart-tooltip">${w.count} tasks</div></div><span class="bar-chart-label">${w.day}</span></div>`;
          }).join('')}
        </div>
      </div>
      <div class="base-card bento-metric">
        <h3 style="font:var(--headline-md);margin-bottom:var(--sp-md);">Penyelesaian Terakhir</h3>
        ${recentDone.length === 0 ? '<p style="font:var(--body-md);color:var(--outline);text-align:center;padding:16px;">Belum ada task selesai</p>' :
          recentDone.map(t => `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--outline-variant);"><i data-lucide="check-circle-2" style="width:16px;height:16px;color:#10b981;flex-shrink:0;"></i><div style="flex:1;min-width:0;"><div style="font:var(--body-md);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-decoration:line-through;color:var(--outline);">${escapeHtml(t.text)}</div><div style="font:var(--label-sm);color:var(--outline);">${formatDateTime(t.completedAt)}</div></div></div>`).join('')}
      </div>
      <div class="base-card bento-metric">
        <h3 style="font:var(--headline-md);margin-bottom:var(--sp-md);">Upcoming Deadlines</h3>
        ${upcomingDeadlines.length === 0 ? '<p style="font:var(--body-md);color:var(--outline);text-align:center;padding:16px;">Belum ada deadline</p>' :
          upcomingDeadlines.map(t => `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--outline-variant);"><i data-lucide="calendar" style="width:16px;height:16px;color:var(--tertiary);flex-shrink:0;"></i><div style="flex:1;min-width:0;"><div style="font:var(--body-md);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(t.text)}</div><div style="font:var(--label-sm);color:var(--outline);">Deadline ${t.deadline}</div></div></div>`).join('')}
      </div>
    </div>`;

  lucide?.createIcons({ nodes: [contentEl] });
  const scoreEl = document.getElementById("prodScore");
  let c = 0; const timer = setInterval(() => { c++; scoreEl.textContent = c; if (c >= percent) clearInterval(timer); }, 15);
  requestAnimationFrame(() => { document.getElementById("prodBar").style.width = `${percent}%`; });
  setTimeout(() => { contentEl.querySelectorAll(".bar-chart-bar").forEach(b => { const h = b.style.height; b.style.height = "0%"; requestAnimationFrame(() => { b.style.height = h; }); }); }, 300);
})();
