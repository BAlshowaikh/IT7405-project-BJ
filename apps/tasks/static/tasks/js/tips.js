// // ============================
// //  Tips Page JS
// // ============================

// document.addEventListener("DOMContentLoaded", function () {
//   const getBtn = document.getElementById("get-tip-btn");
//   const tipDisplayCard = document.getElementById("tip-display-card");
//   const tipTextEl = document.getElementById("tip-text");
//   const tipCategoryEl = document.getElementById("tip-category");
//   const loadingTextEl = document.getElementById("tip-loading-text");
//   const saveBtn = document.getElementById("save-tip-btn");
//   const closeBtn = document.getElementById("close-tip-btn");
//   const errorEl = document.getElementById("tip-error");
//   const successEl = document.getElementById("tip-success");
//   const savedTipsTableBody = document.getElementById("saved-tips-table-body");

//   // -------------------------
//   // CSRF Helper
//   // -------------------------
//   const getCsrfToken = () => {
//     const cookie = document.cookie
//       .split(";")
//       .find((c) => c.trim().startsWith("csrftoken="));
//     return cookie ? cookie.split("=")[1] : "";
//   };

//   const showError = (msg) => {
//     if (!errorEl) return;
//     errorEl.textContent = msg;
//     errorEl.classList.remove("hidden");
//     if (successEl) {
//       successEl.classList.add("hidden");
//       successEl.textContent = "";
//     }
//   };

//   const showSuccess = (msg) => {
//     if (!successEl) return;
//     successEl.textContent = msg;
//     successEl.classList.remove("hidden");
//     if (errorEl) {
//       errorEl.classList.add("hidden");
//       errorEl.textContent = "";
//     }
//   };

//   const clearMessages = () => {
//     if (errorEl) {
//       errorEl.classList.add("hidden");
//       errorEl.textContent = "";
//     }
//     if (successEl) {
//       successEl.classList.add("hidden");
//       successEl.textContent = "";
//     }
//   };

//   // -------------------------
//   // "Get Tip" Button
//   // -------------------------
//   if (getBtn) {
//     getBtn.addEventListener("click", function () {
//       clearMessages();
//       getBtn.disabled = true;
//       getBtn.textContent = "Generating...";
//       loadingTextEl.classList.remove("hidden");

//       fetch(getBtn.dataset.apiUrl, {
//         headers: { "X-Requested-With": "XMLHttpRequest" },
//       })
//         .then((response) => response.json())
//         .then((data) => {
//           setTimeout(() => {
//             getBtn.disabled = false;
//             getBtn.textContent = "Get a new tip";
//             loadingTextEl.classList.add("hidden");

//             if (!data.ok) {
//               showError(data.error || "Could not load a tip.");
//               return;
//             }

//             const tip = data.tip;
//             tipTextEl.textContent = tip.text;
//             tipCategoryEl.textContent = tip.category
//               ? `Category: ${tip.category}`
//               : "";

//             tipDisplayCard.classList.remove("hidden");
//           }, 1200);
//         })
//         .catch((err) => {
//           console.error("Error fetching tip:", err);
//           loadingTextEl.classList.add("hidden");
//           showError("Network error while loading a tip.");
//         });
//     });
//   }

//   // -------------------------
//   // Save Tip
//   // -------------------------
//   if (saveBtn) {
//     saveBtn.addEventListener("click", function () {
//       clearMessages();
//       const text = tipTextEl.textContent.trim();
//       const category = tipCategoryEl.textContent.replace("Category: ", "").trim();

//       if (!text) {
//         showError("No tip to save.");
//         return;
//       }

//       fetch(saveBtn.dataset.apiUrl, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "X-CSRFToken": getCsrfToken(),
//           "X-Requested-With": "XMLHttpRequest",
//         },
//         body: JSON.stringify({ text, category }),
//       })
//         .then((response) => response.json())
//         .then((data) => {
//           if (!data.ok) {
//             showError(data.error || "Could not save the tip.");
//             return;
//           }

//         showSuccess("Tip saved.");

//         const tip = data.tip;
//         const row = document.createElement("tr");
//         row.setAttribute("data-tip-id", tip.id);
//         row.className = "hover:bg-slate-50";

//         row.innerHTML = `
//           <td class="px-6 py-3 text-slate-800 align-top">
//             <p class="text-sm">${tip.text}</p>
//           </td>
//           <td class="px-6 py-3 text-slate-500 text-xs align-top whitespace-nowrap">
//             ${tip.created_at.slice(0, 19).replace("T", " ")}
//           </td>
//           <td class="px-6 py-3 text-right align-top">
//             <button
//               type="button"
//               class="inline-flex items-center justify-center rounded-full p-2 text-slate-400 hover:text-rose-500 delete-tip-btn"
//               title="Delete tip"
//             >
//               <iconify-icon icon="lucide:trash-2" class="text-lg"></iconify-icon>
//             </button>
//           </td>
//         `;

//         //Remove the "No tips saved yet" row if it's still there
//         const emptyRow = document.getElementById("saved-tips-empty-row");
//         if (emptyRow) {
//           emptyRow.remove();
//         }

//         savedTipsTableBody.prepend(row);

//         })
//         .catch((err) => {
//           console.error("Error saving tip:", err);
//           showError("Network error while saving tip.");
//         });
//     });
//   }

//   // -------------------------
//   // Close Button
//   // -------------------------
//   if (closeBtn) {
//     closeBtn.addEventListener("click", function () {
//       tipDisplayCard.classList.add("hidden");
//       clearMessages();
//     });
//   }

//   // -------------------------
//   // Delete saved tip
//   // -------------------------
//   if (savedTipsTableBody) {
//     savedTipsTableBody.addEventListener("click", function (event) {
//       const btn = event.target.closest(".delete-tip-btn");
//       if (!btn) return;

//       const row = btn.closest("tr[data-tip-id]");
//       const tipId = row.dataset.tipId;

//       if (!confirm("Delete this tip?")) return;

//       fetch(`/tasks/api/tip/${tipId}/delete/`, {
//         method: "POST",
//         headers: {
//           "X-CSRFToken": getCsrfToken(),
//           "X-Requested-With": "XMLHttpRequest",
//         },
//       })
//         .then((response) => response.json())
//         .then((data) => {
//           if (!data.ok) {
//             showError("Could not delete tip.");
//             return;
//           }
//           row.remove();

//           // success toast for tip delete
//           if (window.showToast) {
//             window.showToast("Tip deleted successfully!");
//           }
//         })
//         .catch((err) => {
//           console.error("Error deleting tip:", err);
//           showError("Network error while deleting tip.");
//         });
//     });
//   }
// });
// ============================
//  Tips Page JS
// ============================

document.addEventListener("DOMContentLoaded", function () {
  const getBtn = document.getElementById("get-tip-btn");
  const tipDisplayCard = document.getElementById("tip-display-card");
  const tipTextEl = document.getElementById("tip-text");
  const tipCategoryEl = document.getElementById("tip-category");
  const loadingTextEl = document.getElementById("tip-loading-text");
  const saveBtn = document.getElementById("save-tip-btn");
  const closeBtn = document.getElementById("close-tip-btn");
  const errorEl = document.getElementById("tip-error");
  const successEl = document.getElementById("tip-success");
  const savedTipsTableBody = document.getElementById("saved-tips-table-body");
  const layout = document.getElementById("tips-layout");

  // -------------------------
  // Layout helpers
  // -------------------------
  const enterSplitLayout = () => {
    if (!layout) return;
    layout.classList.remove("items-center");
    layout.classList.add("md:flex-row", "md:items-start", "md:justify-between");
  };

  const resetLayout = () => {
    if (!layout) return;
    layout.classList.remove("md:flex-row", "md:items-start", "md:justify-between");
    layout.classList.add("items-center");
  };

  // -------------------------
  // CSRF Helper
  // -------------------------
  const getCsrfToken = () => {
    const cookie = document.cookie
      .split(";")
      .find((c) => c.trim().startsWith("csrftoken="));
    return cookie ? cookie.split("=")[1] : "";
  };

  const showError = (msg) => {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.classList.remove("hidden");
    if (successEl) {
      successEl.classList.add("hidden");
      successEl.textContent = "";
    }
  };

  const showSuccess = (msg) => {
    if (!successEl) return;
    successEl.textContent = msg;
    successEl.classList.remove("hidden");
    if (errorEl) {
      errorEl.classList.add("hidden");
      errorEl.textContent = "";
    }
  };

  const clearMessages = () => {
    if (errorEl) {
      errorEl.classList.add("hidden");
      errorEl.textContent = "";
    }
    if (successEl) {
      successEl.classList.add("hidden");
      successEl.textContent = "";
    }
  };

  // -------------------------
  // "Get Tip" Button
  // -------------------------
  if (getBtn) {
    getBtn.addEventListener("click", function () {
      clearMessages();
      getBtn.disabled = true;
      getBtn.textContent = "Generating...";
      if (loadingTextEl) {
        loadingTextEl.classList.remove("hidden");
      }

      fetch(getBtn.dataset.apiUrl, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      })
        .then((response) => response.json())
        .then((data) => {
          setTimeout(() => {
            getBtn.disabled = false;
            getBtn.textContent = "Get a new tip";
            if (loadingTextEl) {
              loadingTextEl.classList.add("hidden");
            }

            if (!data.ok) {
              showError(data.error || "Could not load a tip.");
              // Make sure layout stays in centered state if error happens
              if (tipDisplayCard) {
                tipDisplayCard.classList.add("hidden");
              }
              resetLayout();
              return;
            }

            const tip = data.tip;
            if (tipTextEl) {
              tipTextEl.textContent = tip.text;
            }
            if (tipCategoryEl) {
              tipCategoryEl.textContent = tip.category
                ? `Category: ${tip.category}`
                : "";
            }

            if (tipDisplayCard) {
              tipDisplayCard.classList.remove("hidden");
            }

            // ➜ Move layout to two-column (generator left, tip right)
            enterSplitLayout();
          }, 1200);
        })
        .catch((err) => {
          console.error("Error fetching tip:", err);
          if (loadingTextEl) {
            loadingTextEl.classList.add("hidden");
          }
          showError("Network error while loading a tip.");
          resetLayout();
        });
    });
  }

  // -------------------------
  // Save Tip
  // -------------------------
  if (saveBtn) {
    saveBtn.addEventListener("click", function () {
      clearMessages();
      const text = tipTextEl ? tipTextEl.textContent.trim() : "";
      const category = tipCategoryEl
        ? tipCategoryEl.textContent.replace("Category: ", "").trim()
        : "";

      if (!text) {
        showError("No tip to save.");
        return;
      }

      fetch(saveBtn.dataset.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCsrfToken(),
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ text, category }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (!data.ok) {
            showError(data.error || "Could not save the tip.");
            return;
          }

          showSuccess("Tip saved.");

          const tip = data.tip;
          if (!savedTipsTableBody) return;

          const row = document.createElement("tr");
          row.setAttribute("data-tip-id", tip.id);
          row.className = "hover:bg-slate-50";

          row.innerHTML = `
            <td class="px-6 py-3 text-slate-800 align-top">
              <p class="text-sm">${tip.text}</p>
            </td>
            <td class="px-6 py-3 text-slate-500 text-xs align-top whitespace-nowrap">
              ${tip.created_at.slice(0, 19).replace("T", " ")}
            </td>
            <td class="px-6 py-3 text-right align-top">
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-full p-2 text-slate-400 hover:text-rose-500 delete-tip-btn"
                title="Delete tip"
              >
                <iconify-icon icon="lucide:trash-2" class="text-lg"></iconify-icon>
              </button>
            </td>
          `;

          // Remove the "No tips saved yet" row if it's still there
          const emptyRow = document.getElementById("saved-tips-empty-row");
          if (emptyRow) {
            emptyRow.remove();
          }

          savedTipsTableBody.prepend(row);
        })
        .catch((err) => {
          console.error("Error saving tip:", err);
          showError("Network error while saving tip.");
        });
    });
  }

  // -------------------------
  // Close Button
  // -------------------------
  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      if (tipDisplayCard) {
        tipDisplayCard.classList.add("hidden");
      }
      clearMessages();
      // ➜ Back to centered generator card
      resetLayout();
    });
  }

  // -------------------------
  // Delete saved tip
  // -------------------------
  if (savedTipsTableBody) {
    savedTipsTableBody.addEventListener("click", function (event) {
      const btn = event.target.closest(".delete-tip-btn");
      if (!btn) return;

      const row = btn.closest("tr[data-tip-id]");
      if (!row) return;

      const tipId = row.dataset.tipId;

      if (!confirm("Delete this tip?")) return;

      fetch(`/tasks/api/tip/${tipId}/delete/`, {
        method: "POST",
        headers: {
          "X-CSRFToken": getCsrfToken(),
          "X-Requested-With": "XMLHttpRequest",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (!data.ok) {
            showError("Could not delete tip.");
            return;
          }
          row.remove();

          // success toast for tip delete
          if (window.showToast) {
            window.showToast("Tip deleted successfully!");
          }
        })
        .catch((err) => {
          console.error("Error deleting tip:", err);
          showError("Network error while deleting tip.");
        });
    });
  }
});
