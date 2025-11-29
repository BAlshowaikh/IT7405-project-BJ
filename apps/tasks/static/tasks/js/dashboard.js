 (function () {
    const openBtn = document.getElementById("open-add-task")
    const closeBtn = document.getElementById("close-add-task")
    const cancelBtn = document.getElementById("cancel-add-task")
    const panel = document.getElementById("add-task-panel")
    const form = document.getElementById("add-task-form")
    const errorEl = document.getElementById("add-task-error")
    const tableBody = document.getElementById("tasks-table-body")
    const createUrl = "/tasks/api/tasks/create/"

    function openPanel() {
      panel.classList.remove("translate-x-full")
    }

    function closePanel() {
      panel.classList.add("translate-x-full")
      errorEl.classList.add("hidden")
      errorEl.textContent = ""
      form.reset()
    }

    function getCsrfToken() {
      const cookie = document.cookie.split(";").find(c => c.trim().startsWith("csrftoken="))
      return cookie ? cookie.split("=")[1] : ""
    }

    if (openBtn) openBtn.addEventListener("click", openPanel)
    if (closeBtn) closeBtn.addEventListener("click", closePanel)
    if (cancelBtn) cancelBtn.addEventListener("click", closePanel)

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
            const msg = data.errors && data.errors.title
              ? data.errors.title
              : "Something went wrong.";
            errorEl.textContent = msg;
            errorEl.classList.remove("hidden");
            return;
          }

          // Insert new row into the table
          const task = data.task;
          const row = document.createElement("tr");
          row.setAttribute("data-task-id", task.id);
          row.className = "hover:bg-slate-750 cursor-pointer";
          row.innerHTML = `
            <td class="px-6 py-3 text-slate-100">${task.title}</td>
            <td class="px-6 py-3 text-slate-200">${task.priority === "high" ? "High" : task.priority === "low" ? "Low" : "Mid"}</td>
            <td class="px-6 py-3">${task.status === "done" ? "Completed" : task.status === "in_progress" ? "In Progress" : "To Do"}</td>
          `;
          tableBody.appendChild(row);

          closePanel();
        } catch (err) {
          errorEl.textContent = "Network error. Please try again.";
          errorEl.classList.remove("hidden");
        }
      });
    }
  })();

