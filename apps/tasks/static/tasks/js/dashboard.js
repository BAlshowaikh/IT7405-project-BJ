(function () {
  const openBtn = document.getElementById("open-add-task");
  const closeBtn = document.getElementById("close-add-task");
  const cancelBtn = document.getElementById("cancel-add-task");
  const panel = document.getElementById("add-task-panel");
  const form = document.getElementById("add-task-form");
  const errorEl = document.getElementById("add-task-error");
  const tableBody = document.getElementById("tasks-table-body");

  // ------- Task details elements -------
  const taskDetailsPanel = document.getElementById("task-details-panel");
  const taskDetailsTaskIdInput = document.getElementById(
    "task-details-task-id"
  );
  const taskDetailsDeleteBtn = document.getElementById(
    "task-details-delete-btn"
  );
  const markCompleteBtn = document.getElementById("task-details-mark-complete");

  // ------- Edit Task panel elements -------
  const editPanel = document.getElementById("edit-task-panel");
  const editForm = document.getElementById("edit-task-form");
  const editErrorEl = document.getElementById("edit-task-error");
  const editTaskIdInput = document.getElementById("edit-task-id");
  const editTitleInput = document.getElementById("edit-task-title");
  const editDescriptionInput = document.getElementById(
    "edit-task-description"
  );
  const editDueDateInput = document.getElementById("edit-task-due-date");
  const editPrioritySelect = document.getElementById("edit-task-priority");
  const editCloseBtn = document.getElementById("close-edit-task");
  const editCancelBtn = document.getElementById("cancel-edit-task");
  const editStatusSelect = document.getElementById("edit-task-status");

  // ------- Search elements -------
  const searchInput = document.getElementById("task-search");
  const searchSuggestionsEl = document.getElementById(
    "task-search-suggestions"
  );

  // read URLs from data attributes (fallback to hard-coded)
  const root = document.getElementById("tasks-dashboard-root");
  const createUrl =
    (root && root.dataset.apiCreateUrl) || "/tasks/api/tasks/create/";
  const listUrl =
    (root && root.dataset.apiListUrl) || "/tasks/api/tasks/";
  const detailBaseUrl =
    (root && root.dataset.apiDetailBaseUrl) || "/tasks/api/tasks/";

  // Current tab filter: "all", "in_progress", "done"
  let currentStatusFilter = "all";
  let currentSearchQuery = "";

  // ---------------- Add Task panel open/close helpers ----------------
  const openPanel = () => {
    if (!panel) return;
    panel.classList.remove("translate-x-full");
  };

  const closePanel = () => {
    if (!panel || !form || !errorEl) return;
    panel.classList.add("translate-x-full");
    errorEl.classList.add("hidden");
    errorEl.textContent = "";
    form.reset();
  };

  const getCsrfToken = () => {
    const cookie = document.cookie
      .split(";")
      .find((c) => c.trim().startsWith("csrftoken="));
    return cookie ? cookie.split("=")[1] : "";
  };

  if (openBtn) openBtn.addEventListener("click", openPanel);
  if (closeBtn) closeBtn.addEventListener("click", closePanel);
  if (cancelBtn) cancelBtn.addEventListener("click", closePanel);

  // ---------------- Status tabs (All / In progress / Completed) ----------------
  const statusTabsContainer = document.getElementById("task-status-tabs");

  const setActiveStatusTab = (status) => {
    if (!statusTabsContainer) return;

    const buttons = statusTabsContainer.querySelectorAll("[data-status]");

    buttons.forEach((btn) => {
      const btnStatus = btn.getAttribute("data-status");

      if (btnStatus === status) {
        btn.classList.add(
          "border-b-2",
          "border-sky-500",
          "text-slate-900",
          "font-medium"
        );
        btn.classList.remove("text-slate-500");
      } else {
        btn.classList.remove(
          "border-b-2",
          "border-sky-500",
          "text-slate-900",
          "font-medium"
        );
        btn.classList.add("text-slate-500");
      }
    });
  };

  if (statusTabsContainer) {
    statusTabsContainer.addEventListener("click", (event) => {
      const clicked = event.target.closest("[data-status]");
      if (!clicked) return;

      const newStatus = clicked.getAttribute("data-status") || "all";

      currentStatusFilter = newStatus;
      setActiveStatusTab(newStatus);

      loadTasks(currentStatusFilter, currentSearchQuery);
    });
  }

  // ---------------- Small helpers for pills (table) ----------------
  function priorityPillHtml(priority) {
    if (priority === "high") {
      return `
        <span class="inline-flex px-3 py-1 text-xs font-medium rounded-full
                     bg-red-100 text-red-700">
          High
        </span>`;
    }
    if (priority === "low") {
      return `
        <span class="inline-flex px-3 py-1 text-xs font-medium rounded-full
                     bg-emerald-100 text-emerald-700">
          Low
        </span>`;
    }
    return `
      <span class="inline-flex px-3 py-1 text-xs font-medium rounded-full
                   bg-amber-100 text-amber-700">
        Mid
      </span>`;
  }

  function statusPillHtml(status) {
    if (status === "done") {
      return `
        <span class="inline-flex px-3 py-1 text-xs font-medium rounded-full
                     bg-emerald-100 text-emerald-700">
          Completed
        </span>`;
    }
    if (status === "in_progress") {
      return `
        <span class="inline-flex px-3 py-1 text-xs font-medium rounded-full
                     bg-indigo-100 text-indigo-700">
          In Progress
        </span>`;
    }
    return `
      <span class="inline-flex px-3 py-1 text-xs font-medium rounded-full
                   bg-slate-100 text-slate-700">
        To Do
      </span>`;
  }

  // ============================================================
  // 🔹 TASK DETAILS MODAL
  // ============================================================

  const detailsPanel = document.getElementById("task-details-panel");
  const closeDetailsBtn = document.querySelector(
    "[data-action='close-task-details']"
  );
  const detailsTitleEl = document.getElementById("task-details-title");
  const detailsDescriptionEl = document.getElementById(
    "task-details-description"
  );
  const detailsStatusPillEl = document.getElementById(
    "task-details-status-pill"
  );
  const detailsPriorityPillEl = document.getElementById(
    "task-details-priority-pill"
  );
  const detailsDueDateEl = document.getElementById("task-details-due-date");
  const detailsEditBtn = document.getElementById("task-details-edit-btn");

  let currentTaskId = null;
  let currentTaskData = null;

  const openDetailsPanel = () => {
    if (!detailsPanel) return;
    detailsPanel.classList.remove("translate-x-full");
  };

  const closeDetailsPanel = () => {
    if (!detailsPanel) return;
    detailsPanel.classList.add("translate-x-full");
    currentTaskId = null;
    currentTaskData = null;
  };

  if (closeDetailsBtn) {
    closeDetailsBtn.addEventListener("click", () => {
      closeDetailsPanel();
    });
  }

  const setStatusPillElement = (el, status) => {
    if (!el) return;

    el.textContent =
      status === "done"
        ? "Completed"
        : status === "in_progress"
        ? "In Progress"
        : "To Do";

    el.className =
      "inline-flex items-center px-2 py-1 rounded-full border font-medium text-xs";

    if (status === "done") {
      el.classList.add(
        "bg-emerald-100",
        "text-emerald-700",
        "border-emerald-200"
      );
    } else if (status === "in_progress") {
      el.classList.add(
        "bg-indigo-100",
        "text-indigo-700",
        "border-indigo-200"
      );
    } else {
      el.classList.add(
        "bg-slate-100",
        "text-slate-700",
        "border-slate-200"
      );
    }
  };

  const setPriorityPillElement = (el, priority) => {
    if (!el) return;

    el.textContent =
      priority === "high" ? "High" : priority === "low" ? "Low" : "Mid";

    el.className =
      "inline-flex items-center px-2 py-1 rounded-full border font-medium text-xs";

    if (priority === "high") {
      el.classList.add("bg-rose-100", "text-rose-700", "border-rose-200");
    } else if (priority === "low") {
      el.classList.add(
        "bg-emerald-100",
        "text-emerald-700",
        "border-emerald-200"
      );
    } else {
      el.classList.add("bg-amber-100", "text-amber-700", "border-amber-200");
    }
  };

  const renderTaskDetails = (task) => {
    if (!task) return;

    currentTaskId = task.id;
    currentTaskData = task;

    if (taskDetailsTaskIdInput) {
      taskDetailsTaskIdInput.value = task.id || "";
    }

    if (detailsTitleEl) {
      detailsTitleEl.textContent = task.title || "";
    }

    if (detailsDescriptionEl) {
      const desc = task.description || "";
      detailsDescriptionEl.textContent =
        desc.trim().length > 0 ? desc : "No description.";
    }

    setStatusPillElement(detailsStatusPillEl, task.status);
    setPriorityPillElement(detailsPriorityPillEl, task.priority);

    if (detailsDueDateEl) {
      if (task.due_date) {
        detailsDueDateEl.textContent = `Due: ${task.due_date}`;
      } else {
        detailsDueDateEl.textContent = "No due date";
      }
    }

    if (markCompleteBtn) {
      if (task.status === "done") {
        markCompleteBtn.textContent = "Completed";
        markCompleteBtn.disabled = true;
        markCompleteBtn.classList.remove(
          "bg-emerald-500",
          "hover:bg-emerald-400"
        );
        markCompleteBtn.classList.add("bg-emerald-700", "cursor-default");
      } else {
        markCompleteBtn.textContent = "Mark as Complete";
        markCompleteBtn.disabled = false;
        markCompleteBtn.classList.add("bg-emerald-500");
        markCompleteBtn.classList.remove(
          "bg-emerald-700",
          "cursor-default"
        );
      }
    }

    openDetailsPanel();
  };

  const openTaskDetailsById = async (taskId) => {
    if (!taskId || !detailBaseUrl) return;

    const url = `${detailBaseUrl}${taskId}/`;

    try {
      const response = await fetch(url, {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (!response.ok) {
        console.error("Failed to load task details", response.status);
        return;
      }

      const data = await response.json();
      if (!data.ok || !data.task) {
        console.error("Invalid task detail payload", data);
        return;
      }

      renderTaskDetails(data.task);
    } catch (err) {
      console.error("Error fetching task details", err);
    }
  };

  const attachTaskRowClickHandlers = () => {
    if (!tableBody) return;

    const rows = tableBody.querySelectorAll("tr[data-task-id]");

    rows.forEach((row) => {
      row.classList.add("task-row");

      if (row._taskClickHandler) {
        row.removeEventListener("click", row._taskClickHandler);
      }

      const handler = (event) => {
        if (event.target.closest("input[type='checkbox']")) {
          return;
        }

        const taskId = row.getAttribute("data-task-id");
        if (!taskId) return;

        openTaskDetailsById(taskId);
      };

      row._taskClickHandler = handler;
      row.addEventListener("click", handler);
    });
  };

  // ---------------- Render & load functions ----------------
  const renderTasks = (tasks) => {
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (!tasks.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="3" class="px-6 py-4 text-sm text-slate-400">
            No tasks yet. Click “Add Task” to create your first one.
          </td>
        </tr>`;
      return;
    }

    const rowsHtml = tasks
      .map((task) => {
        const checkboxState =
          task.status === "done" ? "checked disabled" : "";

        return `
          <tr data-task-id="${task.id}"
              class="hover:bg-slate-50 cursor-pointer">
            <td class="px-6 py-3 text-slate-800">
              <div class="flex items-center gap-3">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 text-sky-500"
                  data-task-id="${task.id}"
                  ${checkboxState}
                />
                <span class="text-sm font-medium">${task.title}</span>
              </div>
            </td>
            <td class="px-6 py-3 text-sm">
              ${priorityPillHtml(task.priority)}
            </td>
            <td class="px-6 py-3 text-sm">
              ${statusPillHtml(task.status)}
            </td>
          </tr>`;
      })
      .join("");

    tableBody.innerHTML = rowsHtml;
  };

  async function loadTasks(statusFilter = "all", searchQuery = "") {
    if (!listUrl) return;

    const params = new URLSearchParams();

    if (statusFilter && statusFilter !== "all") {
      params.append("status", statusFilter);
    }

    if (searchQuery && searchQuery.trim().length > 0) {
      params.append("q", searchQuery.trim());
    }

    const url =
      params.toString().length > 0 ? `${listUrl}?${params.toString()}` : listUrl;

    try {
      const response = await fetch(url, {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (!response.ok) {
        console.error("Failed to load tasks", response.status);
        return;
      }

      const data = await response.json();
      renderTasks(data.tasks || []);

      if (data.stats) {
        const inProgressEl = document.getElementById("stat-in-progress");
        const completedEl = document.getElementById("stat-completed");
        const urgentEl = document.getElementById("stat-urgent-today");

        if (inProgressEl) {
          inProgressEl.textContent = data.stats.tasks_in_progress_this_week;
        }
        if (completedEl) {
          completedEl.textContent = data.stats.tasks_completed_this_week;
        }
        if (urgentEl) {
          urgentEl.textContent = data.stats.tasks_urgent_today;
        }
      }
    } catch (err) {
      console.error("Error loading tasks", err);
    }
  }

  // Initial load
  loadTasks(currentStatusFilter, currentSearchQuery);
  attachTaskRowClickHandlers();
  setActiveStatusTab(currentStatusFilter);

  // ---------------- Form submit (create task) ----------------
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      try {
        const response = await fetch(createUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCsrfToken(),
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          const msg =
            data.errors && data.errors.title
              ? data.errors.title
              : "Something went wrong.";
          errorEl.textContent = msg;
          errorEl.classList.remove("hidden");
          return;
        }

        await loadTasks(currentStatusFilter, currentSearchQuery);
        closePanel();
      } catch (err) {
        errorEl.textContent = "Network error. Please try again.";
        errorEl.classList.remove("hidden");
      }
    });
  }

  // ---------------- Row clicks -> open details ----------------
  const handleTableBodyClick = (event) => {
    if (!tableBody) return;

    if (event.target.closest("input[type='checkbox']")) {
      return;
    }

    const row = event.target.closest("tr[data-task-id]");
    if (!row) return;

    const taskId = row.getAttribute("data-task-id");
    if (!taskId) {
      console.warn("Row has no valid task id");
      return;
    }
    openTaskDetailsById(taskId);
  };

  if (tableBody) {
    tableBody.addEventListener("click", handleTableBodyClick);
  }

  // ----------------------- Mark task complete via checkbox ---------------------
  const markTaskComplete = async (taskId, checkboxEl) => {
    try {
      const response = await fetch(`/tasks/api/tasks/${taskId}/complete/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCsrfToken(),
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok === false) {
        console.error(
          "[checkbox] Failed to mark complete",
          response.status,
          data
        );
        if (checkboxEl) {
          checkboxEl.checked = false;
        }
        alert("Could not mark the task as completed. Please try again.");
        return;
      }

      if (checkboxEl) {
        checkboxEl.checked = true;
        checkboxEl.disabled = true;
      }

      await loadTasks(currentStatusFilter, currentSearchQuery);
    } catch (err) {
      console.error("[checkbox] Error marking complete", err);
      if (checkboxEl) {
        checkboxEl.checked = false;
      }
      alert("Network error while updating the task. Please try again.");
    }
  };

  if (tableBody) {
    tableBody.addEventListener("change", (event) => {
      const checkbox = event.target.closest(
        'input[type="checkbox"][data-task-id]'
      );
      if (!checkbox) return;

      if (checkbox.disabled) return;

      const taskId = checkbox.getAttribute("data-task-id");
      if (!taskId) return;

      if (!checkbox.checked) {
        checkbox.checked = true;
        return;
      }

      markTaskComplete(taskId, checkbox);
    });
  }

  // --------------- Delete task from details modal ---------------
  const handleDeleteTaskClick = async () => {
    if (!taskDetailsTaskIdInput) return;

    const taskId = taskDetailsTaskIdInput.value;
    if (!taskId) {
      console.warn("[delete] No task id found in details modal");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this task? This action cannot be undone."
    );
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/tasks/api/tasks/${taskId}/delete/`, {
        method: "DELETE",
        headers: {
          "X-CSRFToken": getCsrfToken(),
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok === false) {
        console.error("Failed to delete task", response.status, data);
        alert("Could not delete the task. Please try again.");
        return;
      }

      closeDetailsPanel();
      await loadTasks(currentStatusFilter, currentSearchQuery);
    } catch (err) {
      console.error("Error deleting task", err);
      alert("Network error while deleting the task. Please try again.");
    }
  };

  if (taskDetailsDeleteBtn) {
    taskDetailsDeleteBtn.addEventListener("click", handleDeleteTaskClick);
  }

  // --------------- Edit panel helpers ---------------
  const toDateInputValue = (isoString) => {
    if (!isoString) return "";
    return isoString.slice(0, 10);
  };

  const openEditPanelForTask = (task) => {
    const panelEl = document.getElementById("edit-task-panel");
    const idInputEl = document.getElementById("edit-task-id");
    const titleInputEl = document.getElementById("edit-task-title");
    const descInputEl = document.getElementById("edit-task-description");
    const dueDateInputEl = document.getElementById("edit-task-due-date");
    const prioritySelectEl = document.getElementById("edit-task-priority");
    const statusSelectEl = document.getElementById("edit-task-status");
    const errorEl = document.getElementById("edit-task-error");

    if (!task) {
      console.warn("[edit] No task passed into openEditPanelForTask");
      return;
    }

    if (!panelEl) {
      console.error("[edit] No element with id='edit-task-panel' found");
      return;
    }

    if (idInputEl) {
      idInputEl.value = task.id || "";
    }

    if (titleInputEl) {
      titleInputEl.value = task.title || "";
    }

    if (descInputEl) {
      descInputEl.value = task.description || "";
    }

    if (dueDateInputEl) {
      dueDateInputEl.value = toDateInputValue(task.due_date);
    }

    if (prioritySelectEl) {
      prioritySelectEl.value = task.priority || "mid";
    }

    if (statusSelectEl) {
      statusSelectEl.value = task.status || "todo";
    }

    if (errorEl) {
      errorEl.classList.add("hidden");
      errorEl.textContent = "";
    }

    panelEl.classList.remove("translate-x-full");
  };

  const closeEditPanel = () => {
    if (!editPanel) return;

    editPanel.classList.add("translate-x-full");

    if (editForm) {
      editForm.reset();
    }
    if (editErrorEl) {
      editErrorEl.classList.add("hidden");
      editErrorEl.textContent = "";
    }
  };

  const handleDetailsEditClick = async () => {
    const hiddenId = taskDetailsTaskIdInput ? taskDetailsTaskIdInput.value : "";
    const taskId = hiddenId || currentTaskId;

    if (!taskId) {
      return;
    }

    if (currentTaskData && currentTaskData.id === taskId) {
      closeDetailsPanel();
      openEditPanelForTask(currentTaskData);
      return;
    }

    const url = `${detailBaseUrl}${taskId}/`;

    try {
      const response = await fetch(url, {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (!response.ok) {
        console.error(
          "[edit] Failed to fetch task details for edit",
          response.status
        );
        return;
      }

      const data = await response.json();
      if (!data.ok || !data.task) {
        console.error("[edit] Invalid task detail payload for edit", data);
        return;
      }

      currentTaskData = data.task;
      currentTaskId = data.task.id;

      closeDetailsPanel();
      openEditPanelForTask(data.task);
    } catch (err) {
      console.error("[edit] Error fetching task for edit", err);
    }
  };

  window.handleTaskDetailsEdit = handleDetailsEditClick;

  if (detailsEditBtn) {
    detailsEditBtn.addEventListener("click", handleDetailsEditClick);
  }

  if (editForm) {
    editForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!editTaskIdInput) return;
      const taskId = editTaskIdInput.value;
      if (!taskId) {
        console.warn("[edit] No task id in edit form");
        return;
      }

      const formData = new FormData(editForm);
      const payload = Object.fromEntries(formData.entries());

      const url = `/tasks/api/tasks/${taskId}/update/`;

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCsrfToken(),
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          const msg =
            data.errors && data.errors.title
              ? data.errors.title
              : "Something went wrong.";
          if (editErrorEl) {
            editErrorEl.textContent = msg;
            editErrorEl.classList.remove("hidden");
          }
          return;
        }

        await loadTasks(currentStatusFilter, currentSearchQuery);

        if (data.task) {
          renderTaskDetails(data.task);
        } else {
          openTaskDetailsById(taskId);
        }

        closeEditPanel();
      } catch (err) {
        console.error("Error updating task", err);
        if (editErrorEl) {
          editErrorEl.textContent = "Network error. Please try again.";
          editErrorEl.classList.remove("hidden");
        }
      }
    });
  }

  if (editCloseBtn) {
    editCloseBtn.addEventListener("click", closeEditPanel);
  }
  if (editCancelBtn) {
    editCancelBtn.addEventListener("click", closeEditPanel);
  }

  // ============================================================
  // 🔎 SEARCH
  // ============================================================
  const debounce = (fn, delay = 300) => {
    let timerId;
    return (...args) => {
      clearTimeout(timerId);
      timerId = setTimeout(() => fn(...args), delay);
    };
  };

  const hideSearchSuggestions = () => {
    if (!searchSuggestionsEl) return;
    searchSuggestionsEl.classList.add("hidden");
    searchSuggestionsEl.innerHTML = "";
  };

  const renderSearchSuggestions = (tasks, query) => {
    if (!searchSuggestionsEl) return;

    const q = (query || "").trim();
    if (!q) {
      hideSearchSuggestions();
      return;
    }

    const limited = (tasks || []).slice(0, 5);

    if (!limited.length) {
      searchSuggestionsEl.innerHTML = `
        <div class="px-3 py-2 text-slate-400 text-xs">
          No task titles match
        </div>
      `;
      searchSuggestionsEl.classList.remove("hidden");
      return;
    }

    searchSuggestionsEl.innerHTML = limited
      .map(
        (t) => `
          <button
            type="button"
            class="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 text-xs"
            data-task-id="${t.id}"
            data-task-title="${(t.title || "").replace(/"/g, "&quot;")}"
          >
            ${t.title}
          </button>
        `
      )
      .join("");

    searchSuggestionsEl.classList.remove("hidden");
  };

  const handleSearchInputChange = async (event) => {
    if (!listUrl) return;

    const query = event.target.value || "";
    currentSearchQuery = query;

    if (query.trim().length === 0) {
      hideSearchSuggestions();
      loadTasks(currentStatusFilter, "");
      return;
    }

    if (query.trim().length < 2) {
      hideSearchSuggestions();
      return;
    }

    const params = new URLSearchParams();

    if (currentStatusFilter && currentStatusFilter !== "all") {
      params.append("status", currentStatusFilter);
    }
    params.append("q", query.trim());

    const url = `${listUrl}?${params.toString()}`;

    try {
      const response = await fetch(url, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });

      if (!response.ok) {
        console.error("Search suggestions load failed", response.status);
        return;
      }

      const data = await response.json();
      renderSearchSuggestions(data.tasks || [], query);
    } catch (err) {
      console.error("Error loading search suggestions", err);
    }
  };

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      debounce(handleSearchInputChange, 350)
    );

    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const query = searchInput.value || "";
        currentSearchQuery = query;
        hideSearchSuggestions();
        loadTasks(currentStatusFilter, query);
      }
    });
  }

  if (searchSuggestionsEl) {
    searchSuggestionsEl.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-task-id]");
      if (!btn) return;

      const title = btn.getAttribute("data-task-title") || "";

      if (searchInput) {
        searchInput.value = title;
        currentSearchQuery = title;
      }

      hideSearchSuggestions();
      loadTasks(currentStatusFilter, title);
    });
  }
})();
