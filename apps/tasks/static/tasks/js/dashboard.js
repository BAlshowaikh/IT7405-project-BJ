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
  const taskDetailsTaskIdInput = document.getElementById("task-details-task-id");
  const taskDetailsDeleteBtn = document.getElementById("task-details-delete-btn");
  const markCompleteBtn = document.getElementById("task-details-mark-complete");

    // ------- Edit Task panel elements -------
  const editPanel = document.getElementById("edit-task-panel");
  const editForm = document.getElementById("edit-task-form");
  const editErrorEl = document.getElementById("edit-task-error");
  const editTaskIdInput = document.getElementById("edit-task-id");
  const editTitleInput = document.getElementById("edit-task-title");
  const editDescriptionInput = document.getElementById("edit-task-description");
  const editDueDateInput = document.getElementById("edit-task-due-date");
  const editPrioritySelect = document.getElementById("edit-task-priority");
  const editCloseBtn = document.getElementById("close-edit-task");
  const editCancelBtn = document.getElementById("cancel-edit-task");
  const editStatusSelect = document.getElementById("edit-task-status");


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
    // mid (default)
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
    // todo (default)
    return `
      <span class="inline-flex px-3 py-1 text-xs font-medium rounded-full
                   bg-slate-100 text-slate-700">
        To Do
      </span>`;
  }

  // ============================================================
  // 🔹 TASK DETAILS MODAL (view details when clicking a row)
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
  const detailsEditBtn = document.getElementById("task-details-edit-btn"); // for later

  let currentTaskId = null;
  let currentTaskData = null;

  const openDetailsPanel = () => {
    if (!detailsPanel) return;
    // Panel starts with translate-x-full (hidden offscreen)
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

  // Small helpers to style the pills inside the modal
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
      el.classList.add("bg-emerald-100", "text-emerald-700", "border-emerald-200");
    } else if (status === "in_progress") {
      el.classList.add("bg-indigo-100", "text-indigo-700", "border-indigo-200");
    } else {
      el.classList.add("bg-slate-100", "text-slate-700", "border-slate-200");
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

  // 🔹 Keep track of the currently opened task
  currentTaskId = task.id;          // this is your public_id from backend
  currentTaskData = task;

  // Optional: also sync hidden input (useful for debugging or other handlers)
  if (taskDetailsTaskIdInput) {
    taskDetailsTaskIdInput.value = task.id || "";
  }

  // ----- Title -----
  if (detailsTitleEl) {
    detailsTitleEl.textContent = task.title || "";
  }

  // ----- Description -----
  if (detailsDescriptionEl) {
    const desc = task.description || "";
    detailsDescriptionEl.textContent =
      desc.trim().length > 0 ? desc : "No description.";
  }

  // ----- Status + Priority pills -----
  setStatusPillElement(detailsStatusPillEl, task.status);
  setPriorityPillElement(detailsPriorityPillEl, task.priority);

  // ----- Due date -----
  if (detailsDueDateEl) {
    if (task.due_date) {
      detailsDueDateEl.textContent = `Due: ${task.due_date}`;
    } else {
      detailsDueDateEl.textContent = "No due date";
    }
  }

  // ----- Mark as complete button label -----
  if (markCompleteBtn) {
    if (task.status === "done") {
      markCompleteBtn.textContent = "Completed";
      markCompleteBtn.disabled = true;
      markCompleteBtn.classList.remove("bg-emerald-500", "hover:bg-emerald-400");
      markCompleteBtn.classList.add("bg-emerald-700", "cursor-default");
    } else {
      markCompleteBtn.textContent = "Mark as Complete";
      markCompleteBtn.disabled = false;
      markCompleteBtn.classList.add("bg-emerald-500");
      markCompleteBtn.classList.remove("bg-emerald-700", "cursor-default");
    }
  }

  // Finally, open the slide-over panel
  openDetailsPanel();
}

  
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

    // Works for both server-rendered and JS-rendered rows
    const rows = tableBody.querySelectorAll("tr[data-task-id]");

    rows.forEach((row) => {
      // Ensure common class if you want styling
      row.classList.add("task-row");

      // Avoid stacking duplicate listeners
      if (row._taskClickHandler) {
        row.removeEventListener("click", row._taskClickHandler);
      }

      const handler = (event) => {
        // Ignore clicks on checkboxes (for future complete-toggle)
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
        return `
          <tr data-task-id="${task.id}"
              class="hover:bg-slate-50 cursor-pointer">
            <td class="px-6 py-3 text-slate-800">
              <div class="flex items-center gap-3">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 text-sky-500"
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

  async function loadTasks(statusFilter = "all") {
    if (!listUrl) return;

    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== "all") {
      params.append("status", statusFilter);
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
    } catch (err) {
      console.error("Error loading tasks", err);
    }
  }

  // Initial load
  loadTasks(currentStatusFilter);

  // Attach handlers to any server-rendered rows (before/if API load fails)
  attachTaskRowClickHandlers();

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

        // Reload the list so the new task uses the same markup
        await loadTasks(currentStatusFilter);

        closePanel();
      } catch (err) {
        errorEl.textContent = "Network error. Please try again.";
        errorEl.classList.remove("hidden")
      }
    })
  }

  const handleTableBodyClick = (event) => {
    if (!tableBody) return;

    // Ignore clicks on checkboxes (for later complete-toggle)
    if (event.target.closest("input[type='checkbox']")) {
      return;
    }

    const row = event.target.closest("tr[data-task-id]");
    if (!row) return;

    const taskId = row.getAttribute("data-task-id");
    console.log("[handleTableBodyClick] clicked taskId:", taskId);

    if (!taskId) {
      console.warn("Row has no valid task id");
      return;
    }
    openTaskDetailsById(taskId);
  };

  // --------------- Handle the Delete icon clicks
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

      // Success: close details panel & reload tasks
      closeDetailsPanel();
      await loadTasks(currentStatusFilter);
    } catch (err) {
      console.error("Error deleting task", err);
      alert("Network error while deleting the task. Please try again.");
    }
  };

  // --------------- Handle the edit panel
  //   const toDateInputValue = (isoString) => {
  //   if (!isoString) return "";
  //   // "2025-11-30" or "2025-11-30T00:00:00Z"
  //   return isoString.slice(0, 10);
  // };

  // const openEditPanelForTask = (task) => {
  //   if (!task || !editPanel) return;

  //   // Fill hidden id with public_id
  //   if (editTaskIdInput) {
  //     editTaskIdInput.value = task.id || "";
  //   }

  //   if (editTitleInput) {
  //     editTitleInput.value = task.title || "";
  //   }

  //   if (editDescriptionInput) {
  //     editDescriptionInput.value = task.description || "";
  //   }

  //   if (editDueDateInput) {
  //     editDueDateInput.value = toDateInputValue(task.due_date);
  //   }

  //   if (editPrioritySelect) {
  //     editPrioritySelect.value = task.priority || "mid";
  //   }

  //   if (editErrorEl) {
  //     editErrorEl.classList.add("hidden");
  //     editErrorEl.textContent = "";
  //   }

  //   // Slide in
  //   editPanel.classList.remove("translate-x-full");
  // };
    const toDateInputValue = (isoString) => {
    if (!isoString) return "";
    // "2025-11-30" or "2025-11-30T00:00:00Z"
    return isoString.slice(0, 10);
  };

  const openEditPanelForTask = (task) => {
    console.log("[edit] openEditPanelForTask called with:", task);

    // 🔹 Always query fresh from DOM (in case earlier const was null)
    const panelEl = document.getElementById("edit-task-panel");
    const idInputEl = document.getElementById("edit-task-id");
    const titleInputEl = document.getElementById("edit-task-title");
    const descInputEl = document.getElementById("edit-task-description");
    const dueDateInputEl = document.getElementById("edit-task-due-date");
    const prioritySelectEl = document.getElementById("edit-task-priority");
    const statusSelectEl = document.getElementById("edit-task-status");
    const errorEl = document.getElementById("edit-task-error");

    console.log("[edit] DOM refs", {
      panelEl,
      idInputEl,
      titleInputEl,
      descInputEl,
      dueDateInputEl,
      prioritySelectEl,
      errorEl,
    });

    if (!task) {
      console.warn("[edit] No task passed into openEditPanelForTask");
      return;
    }

    if (!panelEl) {
      console.error("[edit] No element with id='edit-task-panel' found");
      return;
    }

    // Fill hidden id with public_id
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

    // 🔹 Slide in (remove translate-x-full so it appears)
    panelEl.classList.remove("translate-x-full");
    console.log("[edit] Removed translate-x-full from edit-task-panel");
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

  //   const handleDetailsEditClick = () => {
  //   console.log("[edit] Edit button clicked");
  //   if (!currentTaskData || !currentTaskId) {
  //     console.warn("[edit] No current task selected");
  //     return;
  //   }

  //   // Close details so edit panel isn't hidden behind it
  //   closeDetailsPanel();

  //   // Open separate edit panel prefilled with current data
  //   openEditPanelForTask(currentTaskData);
  // };
    const handleDetailsEditClick = async () => {
    console.log("[edit] Edit button clicked");

    // 1) Prefer the hidden input inside the details modal
    const hiddenId = taskDetailsTaskIdInput ? taskDetailsTaskIdInput.value : "";
    const taskId = hiddenId || currentTaskId;

    console.log("[edit] taskId from hidden/current:", { hiddenId, currentTaskId, taskId });

    if (!taskId) {
      console.warn("[edit] No task id available for edit");
      return;
    }

    // 2) If we have a cached task for this id, use it
    if (currentTaskData && currentTaskData.id === taskId) {
      console.log("[edit] Using cached currentTaskData");
      closeDetailsPanel();
      openEditPanelForTask(currentTaskData);
      return;
    }

    // 3) Otherwise, fetch fresh details from the API
    const url = `${detailBaseUrl}${taskId}/`;
    console.log("[edit] Fetching task for edit from:", url);

    try {
      const response = await fetch(url, {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (!response.ok) {
        console.error("[edit] Failed to fetch task details for edit", response.status);
        return;
      }

      const data = await response.json();
      if (!data.ok || !data.task) {
        console.error("[edit] Invalid task detail payload for edit", data);
        return;
      }

      // Keep globals in sync
      currentTaskData = data.task;
      currentTaskId = data.task.id;

      // Close details so edit panel isn't hidden
      closeDetailsPanel();

      // Open edit panel with fresh task data
      openEditPanelForTask(data.task);
    } catch (err) {
      console.error("[edit] Error fetching task for edit", err);
    }
  };


  window.handleTaskDetailsEdit = handleDetailsEditClick;

// if (detailsPanel) {
//   detailsPanel.addEventListener("click", (event) => {
//     // 🔹 Edit button (or its icon children)
//     const editBtn = event.target.closest("#task-details-edit-btn");
//     if (editBtn) {
//       console.log("[edit] Delegated handler fired");
//       handleDetailsEditClick();
//       return;
//     }

//     // 🔹 Delete button (still handled normally, but we can keep it here too if you want)
//     const deleteBtn = event.target.closest("#task-details-delete-btn");
//     if (deleteBtn && taskDetailsDeleteBtn) {
//       handleDeleteTaskClick();
//       return;
//     }

//     // (You can also later hook mark-complete here if you prefer.)
//   });
// }

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

        // 1) Refresh tasks table
        await loadTasks(currentStatusFilter);

        // 2) Optionally reopen details modal with fresh data
        if (data.task) {
          renderTaskDetails(data.task);
        } else {
          openTaskDetailsById(taskId);
        }

        // 3) Close the edit panel
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



  if (tableBody) {
    tableBody.addEventListener("click", handleTableBodyClick);
  }

  if (taskDetailsDeleteBtn) {
    taskDetailsDeleteBtn.addEventListener("click", handleDeleteTaskClick);
  }

    if (editCloseBtn) {
    editCloseBtn.addEventListener("click", closeEditPanel);
  }
  if (editCancelBtn) {
    editCancelBtn.addEventListener("click", closeEditPanel);
  }

    if (detailsEditBtn) {
    detailsEditBtn.addEventListener("click", handleDetailsEditClick);
  }

  

})()

