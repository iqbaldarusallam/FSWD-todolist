(function () {
  const currentDayText = document.getElementById("currentDayText");
  const currentDateText = document.getElementById("currentDateText");
  const countOverdue = document.getElementById("countOverdue");
  const countTodo = document.getElementById("countTodo");
  const countDone = document.getElementById("countDone");
  const overdueList = document.getElementById("overdueList");
  const todoList = document.getElementById("todoList");
  const doneList = document.getElementById("doneList");
  const dangerZone = document.getElementById("dangerZone");
  const form = document.getElementById("missionTaskForm");
  const titleInput = document.getElementById("missionTaskTitle");
  const descInput = document.getElementById("missionTaskInput");
  const priorityInput = document.getElementById("missionPriority");
  const deadlineInput = document.getElementById("missionDeadline");
  const deleteAllBtn = document.getElementById("deleteAllBtn");
  const resetAllDataBtn = document.getElementById("resetAllDataBtn");

  function splitTasks(tasks) {
    return {
      overdue: tasks.filter(t => isDeadlineMissed(t)),
      todo: tasks.filter(t => !t.completed && !isDeadlineMissed(t)),
      done: tasks.filter(t => t.completed),
    };
  }

  function renderBoard(container, tasks, emptyMessage) {
    if (!tasks.length) { container.innerHTML = `<div class="mission-empty-mini">${emptyMessage}</div>`; return; }
    container.innerHTML = tasks.map((task, i) => renderTaskCard(task, i)).join("");
    lucide?.createIcons({ nodes: [container] });
  }

  function render() {
    const { overdue, todo, done } = splitTasks(loadTasks());
    countOverdue.textContent = overdue.length;
    countTodo.textContent = todo.length;
    countDone.textContent = done.length;
    renderBoard(overdueList, overdue, "Tidak ada pekerjaan terlambat.");
    renderBoard(todoList, todo, "Belum ada pekerjaan aktif.");
    renderBoard(doneList, done, "Belum ada yang selesai.");
    if (dangerZone) dangerZone.style.display = loadTasks().length ? "flex" : "none";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (!title) {
      titleInput.focus();
      titleInput.style.borderColor = "var(--error)";
      setTimeout(() => { titleInput.style.borderColor = ""; }, 2000);
      showToast("Judul task harus diisi", "error");
      return;
    }
    createTask({ text: title, description: descInput.value.trim(), priority: priorityInput.value, deadline: deadlineInput.value || null });
    titleInput.value = "";
    descInput.value = "";
    priorityInput.value = "Medium";
    deadlineInput.value = "";
    render();
    showToast("Task berhasil ditambahkan");
  });

  deleteAllBtn.addEventListener("click", () => {
    if (!confirm("Hapus seluruh task?")) return;
    saveTasks([]);
    render();
    showToast("Semua task dihapus");
  });

  resetAllDataBtn?.addEventListener("click", () => {
    if (!confirm("Reset semua data? Semua task dan profile akan dihapus.")) return;
    const user = UserSwitcher?.getActiveUser();
    saveTasks([]);
    if (user) localStorage.removeItem("lumina-profile-" + user);
    render();
    showToast("Data berhasil di-reset");
    setTimeout(() => { window.location.reload(); }, 800);
  });

  [overdueList, todoList, doneList].forEach(list => bindTaskListEvents(list));

  overdueList.addEventListener("taskChanged", render);
  todoList.addEventListener("taskChanged", render);
  doneList.addEventListener("taskChanged", render);

  const { day, date } = formatDayDate();
  currentDayText.textContent = day;
  currentDateText.textContent = date;
  render();
})();
