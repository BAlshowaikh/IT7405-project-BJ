//  (function () {
//     const openBtn = document.getElementById("open-add-task")
//     const closeBtn = document.getElementById("close-add-task")
//     const cancelBtn = document.getElementById("cancel-add-task")
//     const panel = document.getElementById("add-task-panel")
//     const form = document.getElementById("add-task-form")
//     const errorEl = document.getElementById("add-task-error")
//     const tableBody = document.getElementById("tasks-table-body")
//     const createUrl = "/tasks/api/tasks/create/"

//     const openPanel = () => {
//       panel.classList.remove("translate-x-full")
//     }

//     const closePanel = () => {
//       panel.classList.add("translate-x-full")
//       errorEl.classList.add("hidden")
//       errorEl.textContent = ""
//       form.reset()
//     }

//     const getCsrfToken = () => {
//       const cookie = document.cookie.split(";").find(c => c.trim().startsWith("csrftoken="))
//       return cookie ? cookie.split("=")[1] : ""
//     }

//     if (openBtn) openBtn.addEventListener("click", openPanel)
//     if (closeBtn) closeBtn.addEventListener("click", closePanel)
//     if (cancelBtn) cancelBtn.addEventListener("click", closePanel)

//     if (form) {
//       form.addEventListener("submit", async (event) => {
//         event.preventDefault();

//         const formData = new FormData(form);
//         const payload = Object.fromEntries(formData.entries());

//         try {
//           const response = await fetch(createUrl, {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//               "X-CSRFToken": getCsrfToken(),
//             },
//             body: JSON.stringify(payload),
//           });

//           const data = await response.json();

//           if (!response.ok || !data.success) {
//             const msg = data.errors && data.errors.title
//               ? data.errors.title
//               : "Something went wrong.";
//             errorEl.textContent = msg;
//             errorEl.classList.remove("hidden");
//             return;
//           }

//           // Insert new row into the table
//           const task = data.task;
//           const row = document.createElement("tr");
//           row.setAttribute("data-task-id", task.id);
//           row.className = "hover:bg-slate-750 cursor-pointer";
//           row.innerHTML = `
//             <td class="px-6 py-3 text-slate-100">${task.title}</td>
//             <td class="px-6 py-3 text-slate-200">${task.priority === "high" ? "High" : task.priority === "low" ? "Low" : "Mid"}</td>
//             <td class="px-6 py-3">${task.status === "done" ? "Completed" : task.status === "in_progress" ? "In Progress" : "To Do"}</td>
//           `;
//           tableBody.appendChild(row);

//           await loadTasks(currentStatusFilter);

//           closePanel();
//         } catch (err) {
//           errorEl.textContent = "Network error. Please try again.";
//           errorEl.classList.remove("hidden");
//         }
//       });
//     }
//   })()

(function () {
  const openBtn = document.getElementById("open-add-task");
  const closeBtn = document.getElementById("close-add-task");
  const cancelBtn = document.getElementById("cancel-add-task");
  const panel = document.getElementById("add-task-panel");
  const form = document.getElementById("add-task-form");
  const errorEl = document.getElementById("add-task-error");
  const tableBody = document.getElementById("tasks-table-body");

  // Optional: read URLs from data attributes (fallback to hard-coded)
  const root = document.getElementById("tasks-dashboard-root");
  const createUrl =
    (root && root.dataset.apiCreateUrl) || "/tasks/api/tasks/create/";
  const listUrl =
    (root && root.dataset.apiListUrl) || "/tasks/api/tasks/";

  // Current tab filter: "all", "in_progress", "done"
  let currentStatusFilter = "all";

  // ---------------- Panel open/close helpers ----------------
  const openPanel = () => {
    panel.classList.remove("translate-x-full");
  };

  const closePanel = () => {
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

  // ---------------- Small helpers for pills ----------------
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

  // ---------------- Render & load functions ----------------
  function renderTasks(tasks) {
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
              class="border-t border-slate-100 hover:bg-slate-50 transition-colors">
            <td class="px-6 py-3 text-sm text-slate-900">
              ${task.title}
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
  }

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

        // ❌ NO manual row creation here
        // ✅ Just reload the list so the new task uses the same markup
        await loadTasks(currentStatusFilter);

        closePanel();
      } catch (err) {
        errorEl.textContent = "Network error. Please try again.";
        errorEl.classList.remove("hidden");
      }
    });
  }
})();


