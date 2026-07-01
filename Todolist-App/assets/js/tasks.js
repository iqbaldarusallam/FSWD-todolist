(function () {
  const taskListEl = document.getElementById("taskList");
  const emptyState = document.getElementById("emptyState");
  const subtitle = document.getElementById("taskSubtitle");
  const searchInput = document.getElementById("searchInput");
  const filterTabs = document.querySelectorAll(".filter-tab");
  const quickForm = document.getElementById("quickTaskForm");
  const quickTitle = document.getElementById("quickTaskTitle");
  const quickInput = document.getElementById("quickTaskInput");
  const quickPriority = document.getElementById("quickTaskPriority");
  const quickDeadline = document.getElementById("quickTaskDeadline");
  let currentFilter = "all";

  function filteredTasks() {
    let tasks = loadTasks();
    const query = searchInput?.value?.toLowerCase() || "";
    if (currentFilter === "active") tasks = tasks.filter(t => !t.completed);
    if (currentFilter === "completed") tasks = tasks.filter(t => t.completed);
    if (query) tasks = tasks.filter(t => t.text.toLowerCase().includes(query) || (t.description || "").toLowerCase().includes(query));
    tasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const ao = isDeadlineMissed(a), bo = isDeadlineMissed(b);
      if (ao !== bo) return ao ? -1 : 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return tasks;
  }

  function render() {
    const tasks = loadTasks();
    const pending = tasks.filter(t => !t.completed).length;
    const done = tasks.filter(t => t.completed).length;
    subtitle.textContent = `${pending} aktif, ${done} selesai.`;

    if (tasks.length === 0) {
      emptyState.style.display = "";
      taskListEl.innerHTML = "";
      lucide?.createIcons({ nodes: [emptyState] });
      return;
    }

    emptyState.style.display = "none";
    const filtered = filteredTasks();
    if (!filtered.length) {
      taskListEl.innerHTML = `<div style="text-align:center;padding:48px 16px;color:var(--on-surface-variant);"><i data-lucide="search-x" style="width:48px;height:48px;display:block;margin:0 auto 12px;"></i><p>Tidak ada task ditemukan.</p></div>`;
      lucide?.createIcons({ nodes: [taskListEl] });
      return;
    }

    taskListEl.innerHTML = filtered.map((task, i) => renderTaskCard(task, i)).join("");
    lucide?.createIcons({ nodes: [taskListEl] });
  }

  filterTabs.forEach(tab => tab.addEventListener("click", () => {
    filterTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentFilter = tab.dataset.filter;
    render();
  }));

  searchInput.addEventListener("input", render);

  bindTaskListEvents(taskListEl);
  taskListEl.addEventListener("taskChanged", render);

  if (quickForm) {
    quickForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = quickTitle.value.trim();
      if (!title) {
        quickTitle.focus();
        quickTitle.style.borderColor = "var(--error)";
        setTimeout(() => { quickTitle.style.borderColor = ""; }, 2000);
        showToast("Judul task harus diisi", "error");
        return;
      }
      createTask({ text: title, description: quickInput.value.trim(), priority: quickPriority.value, deadline: quickDeadline?.value || null });
      quickTitle.value = "";
      quickInput.value = "";
      quickPriority.value = "Medium";
      if (quickDeadline) quickDeadline.value = "";
      render();
      showToast("Task berhasil ditambahkan");
    });
  }

  render();
})();
