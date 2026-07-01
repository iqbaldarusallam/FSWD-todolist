(function () {
  const params = new URLSearchParams(window.location.search);
  const editId = params.get("id");
  const titleInput = document.getElementById("taskTitle");
  const descInput = document.getElementById("taskDesc");
  const prioritySelector = document.getElementById("prioritySelector");
  const deadlineInput = document.getElementById("taskDeadline");
  const submitBtn = document.getElementById("submitBtn");
  const draftBtn = document.getElementById("draftBtn");
  const pageTitleDesktop = document.getElementById("pageTitleDesktop");
  const pageTitleMobile = document.getElementById("pageTitleMobile");
  const submitLabel = document.getElementById("submitLabel");
  const submitIcon = document.getElementById("submitIcon");

  let selectedPriority = "Medium";
  let editingTask = null;

  function setPriority(priority) {
    selectedPriority = priority;
    prioritySelector.querySelectorAll(".priority-pill").forEach(pill => pill.classList.toggle("active", pill.dataset.priority === priority));
  }

  function initEditMode() {
    if (!editId) return;
    editingTask = loadTasks().find(task => task.id === editId) || null;
    if (!editingTask) return;
    pageTitleDesktop.textContent = "Edit Task";
    pageTitleMobile.textContent = "Edit Task";
    submitLabel.textContent = "Simpan Perubahan";
    submitIcon.setAttribute("data-lucide", "save");
    titleInput.value = editingTask.text || "";
    descInput.value = editingTask.description || "";
    deadlineInput.value = editingTask.deadline || "";
    setPriority(editingTask.priority || "Medium");
    lucide?.createIcons({ nodes: [submitBtn] });
  }

  prioritySelector.addEventListener("click", (e) => {
    const pill = e.target.closest(".priority-pill");
    if (pill) setPriority(pill.dataset.priority);
  });

  submitBtn.addEventListener("click", saveTask);
  titleInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); saveTask(); } });
  if (draftBtn) draftBtn.addEventListener("click", () => { if (titleInput.value.trim()) saveTask(); else window.location.href = "my-tasks.html"; });

  function saveTask() {
    const text = titleInput.value.trim();
    if (!text) { titleInput.focus(); titleInput.style.borderColor = "var(--error)"; setTimeout(() => { titleInput.style.borderColor = ""; }, 2000); showToast("Judul task harus diisi", "error"); return; }

    if (editingTask) {
      updateTask(editingTask.id, { text, description: descInput.value.trim() || "", priority: selectedPriority, deadline: deadlineInput.value || null });
      showToast("Task berhasil diperbarui!");
      setTimeout(() => { window.location.href = `task-detail.html?id=${editingTask.id}`; }, 500);
      return;
    }

    createTask({ text, description: descInput.value.trim() || "", priority: selectedPriority, deadline: deadlineInput.value || null });
    showToast("Task berhasil dibuat!");
    setTimeout(() => { window.location.href = "my-tasks.html"; }, 500);
  }

  initEditMode();
})();
