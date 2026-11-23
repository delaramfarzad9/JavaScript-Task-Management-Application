
import { makeTaskDraggable } from "./dragDrop.js";

// DOM ELEMENTS
const modal = document.getElementById("taskModal");
const modalContent = modal.querySelector(".modal-content");
const modalTitle = document.getElementById("modalTitle");
const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");

const appLayout = document.querySelector(".app-layout");

const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const taskSummary = document.getElementById("taskSummary");

const emptyHeading = emptyState.querySelector("h3");
const emptyDescription = emptyState.querySelector("p");
const emptyAddBtn = document.getElementById("emptyAddBtn");

let previousFocusedElement = null;
let lastEditTaskId = null;
let previousBodyOverflow = "";

// GET FOCUSABLE ELEMENTS
function getFocusableElements(container) {
  const selector = [
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "a[href]",
    "[tabindex]:not([tabindex='-1'])",
  ].join(", ");

  return Array.from(
    container.querySelectorAll(selector)
  ).filter(
    (element) =>
      !element.hidden &&
      element.getClientRects().length > 0
  );
}

// REUSABLE FOCUS TRAP
function trapFocus(event, container) {
  if (event.key !== "Tab") return;

  const elements = getFocusableElements(container);

  if (elements.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }

  const first = elements[0];
  const last = elements[elements.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  } else if (!container.contains(active)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  }
}

// SHOW TASK FORM MODAL
function showModal(opener = document.activeElement) {
  previousFocusedElement = opener;

  modal.hidden = false;
  appLayout.inert = true;

  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  taskTitle.focus();
}

// OPEN NEW TASK
export function openModal() {
  taskForm.reset();

  document.getElementById("taskId").value = "";
  modalTitle.textContent = "Create New Task";
  lastEditTaskId = null;

  showModal();
}

// OPEN EDIT TASK
export function openEditModal(task, editButton) {
  document.getElementById("taskId").value = task.id;
  document.getElementById("taskTitle").value = task.title;
  document.getElementById("taskDescription").value =
    task.description ?? "";
  document.getElementById("taskPriority").value =
    task.priority;
  document.getElementById("taskDueDate").value =
    task.dueDate ?? "";

  modalTitle.textContent = "Edit Task";
  lastEditTaskId = task.id;

  showModal(editButton);
}

// CLOSE TASK FORM MODAL
export function closeModal() {
  if (modal.hidden) return;

  modal.hidden = true;
  appLayout.inert = false;
  document.body.style.overflow = previousBodyOverflow;

  let focusTarget = previousFocusedElement;

  // Find the replacement Edit button after a re-render
  if (
    (!focusTarget || !focusTarget.isConnected) &&
    lastEditTaskId
  ) {
    focusTarget = Array.from(
      taskList.querySelectorAll("[data-edit-task-id]")
    ).find(
      (button) =>
        button.dataset.editTaskId === lastEditTaskId
    );
  }

  if (!focusTarget || !focusTarget.isConnected) {
    focusTarget = document.getElementById("addTaskBtn");
  }

  focusTarget.focus();

  previousFocusedElement = null;
  lastEditTaskId = null;
}

// TRAP FOCUS IN TASK FORM MODAL
modal.addEventListener("keydown", (event) => {
  trapFocus(event, modalContent);
});

// KEEP FOCUS INSIDE TASK FORM
document.addEventListener("focusin", (event) => {
  if (modal.hidden) return;

  if (!modalContent.contains(event.target)) {
    const first = getFocusableElements(modalContent)[0];
    first?.focus();
  }
});

// =====================================
// CUSTOM DELETE CONFIRMATION MODAL
// =====================================

// Build dialog using existing TaskFlow CSS classes
const deleteModal = document.createElement("div");

deleteModal.className = "modal";
deleteModal.hidden = true;
deleteModal.id = "deleteConfirmModal";

deleteModal.innerHTML = `
  <div
    class="modal-backdrop"
    data-close-delete
  ></div>

  <section
    class="modal-content"
    role="dialog"
    aria-modal="true"
    aria-labelledby="deleteModalTitle"
    aria-describedby="deleteModalDescription"
    tabindex="-1"
  >
    <div class="modal-header">
      <div>
        <p class="eyebrow">CONFIRMATION</p>
        <h2 id="deleteModalTitle">
          Delete this task?
        </h2>
      </div>

      <button
        type="button"
        class="close-btn"
        id="closeDeleteModalBtn"
        aria-label="Close delete confirmation"
      >
        &times;
      </button>
    </div>

    <p
      id="deleteModalDescription"
      style="color: var(--text-muted); margin-bottom: 28px;"
    ></p>

    <div class="modal-actions">
      <button
        type="button"
        class="btn btn-outline"
        id="cancelDeleteBtn"
      >
        Cancel
      </button>

      <button
        type="button"
        class="btn btn-primary"
        id="confirmDeleteBtn"
      >
        Delete Task
      </button>
    </div>
  </section>
`;

document.body.append(deleteModal);

const deleteModalContent = deleteModal.querySelector(
  ".modal-content"
);

const deleteDescription = document.getElementById(
  "deleteModalDescription"
);

const confirmDeleteBtn = document.getElementById(
  "confirmDeleteBtn"
);

const cancelDeleteBtn = document.getElementById(
  "cancelDeleteBtn"
);

const closeDeleteBtn = document.getElementById(
  "closeDeleteModalBtn"
);

let deleteOpener = null;
let pendingDelete = null;
let deletePreviousOverflow = "";

// OPEN DELETE CONFIRMATION
function openDeleteModal(task, opener, onDelete) {
  deleteOpener = opener;

  pendingDelete = () => onDelete(task.id);

  // Use textContent so task titles remain safe
  deleteDescription.textContent =
    `Are you sure you want to delete "${task.title}"? ` +
    "You can restore it using Undo.";

  deletePreviousOverflow = document.body.style.overflow;

  deleteModal.hidden = false;
  appLayout.inert = true;
  document.body.style.overflow = "hidden";

  // Start focus inside the confirmation dialog
  cancelDeleteBtn.focus();
}

// CLOSE DELETE CONFIRMATION
function closeDeleteModal(confirmed = false) {
  if (deleteModal.hidden) return;

  deleteModal.hidden = true;
  appLayout.inert = false;
  document.body.style.overflow = deletePreviousOverflow;

  const onConfirm = pendingDelete;
  const opener = deleteOpener;

  pendingDelete = null;
  deleteOpener = null;

  if (confirmed) {
    // Delete through main.js so Undo still works
    onConfirm?.();

    // The original Delete button no longer exists
    // after its task card is removed.
    const nextButton = taskList.querySelector(
      ".task-action-btn"
    );

    const focusTarget =
      nextButton || document.getElementById("addTaskBtn");

    focusTarget.focus();
  } else {
    // Cancellation returns focus to Delete
    if (opener?.isConnected) {
      opener.focus();
    } else {
      document.getElementById("addTaskBtn").focus();
    }
  }
}

// CONFIRM DELETE
confirmDeleteBtn.addEventListener("click", () => {
  closeDeleteModal(true);
});

// CANCEL DELETE
cancelDeleteBtn.addEventListener("click", () => {
  closeDeleteModal(false);
});

// CLOSE WITH X
closeDeleteBtn.addEventListener("click", () => {
  closeDeleteModal(false);
});

// CLOSE BY CLICKING BACKDROP
deleteModal.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-close-delete")) {
    closeDeleteModal(false);
  }
});

// ESCAPE AND KEYBOARD FOCUS
deleteModal.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeDeleteModal(false);
    return;
  }

  trapFocus(event, deleteModalContent);
});

// KEEP FOCUS INSIDE DELETE DIALOG
document.addEventListener("focusin", (event) => {
  if (deleteModal.hidden) return;

  if (!deleteModalContent.contains(event.target)) {
    cancelDeleteBtn.focus();
  }
});

// =====================================
// SEARCH HIGHLIGHTING
// =====================================

function highlightText(element, text, query) {
  const originalText = String(text ?? "");
  const searchTerm = query.trim().toLowerCase();

  element.replaceChildren();

  if (!searchTerm) {
    element.textContent = originalText;
    return;
  }

  const lowerText = originalText.toLowerCase();
  let startIndex = 0;

  while (startIndex < originalText.length) {
    const matchIndex = lowerText.indexOf(
      searchTerm,
      startIndex
    );

    if (matchIndex === -1) {
      element.append(
        document.createTextNode(
          originalText.slice(startIndex)
        )
      );
      break;
    }

    element.append(
      document.createTextNode(
        originalText.slice(startIndex, matchIndex)
      )
    );

    const mark = document.createElement("mark");

    mark.textContent = originalText.slice(
      matchIndex,
      matchIndex + searchTerm.length
    );

    element.append(mark);

    startIndex = matchIndex + searchTerm.length;
  }
}

// =====================================
// RENDER TASKS
// =====================================

export function renderTasks(
  tasks,
  onDelete,
  onStatusChange,
  searchTerm = "",
  hasSavedTasks = false,
  onReorder = null,
  canReorder = false
) {
  taskList.replaceChildren();

  taskSummary.textContent = `Showing ${tasks.length} ${
    tasks.length === 1 ? "task" : "tasks"
  }`;

  // EMPTY STATE
  if (tasks.length === 0) {
    emptyState.hidden = false;

    if (hasSavedTasks) {
      emptyHeading.textContent = "No matching tasks";
      emptyDescription.textContent =
        "Try changing your search or filters to find your tasks.";
      emptyAddBtn.hidden = true;
    } else {
      emptyHeading.textContent = "No tasks yet";
      emptyDescription.textContent =
        "Your workspace is ready. Create your first task to get started.";
      emptyAddBtn.hidden = false;
    }

    return;
  }

  emptyState.hidden = true;

  // TASK CARDS
  tasks.forEach((task) => {
    const taskCard = document.createElement("article");
    taskCard.className = "task-item";

    taskCard.classList.toggle(
      "completed",
      task.completed
    );

    // DRAG AND DROP
    if (canReorder && onReorder) {
      makeTaskDraggable(
        taskCard,
        task.id,
        onReorder
      );
    }

    // COMPLETION CHECKBOX
    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;

    checkbox.setAttribute(
      "aria-label",
      `Mark ${task.title} as completed`
    );

    checkbox.addEventListener("change", () => {
      onStatusChange?.(task.id, checkbox.checked);
    });

    // TASK CONTENT
    const taskContent = document.createElement("div");
    taskContent.className = "task-content";

    // TITLE
    const title = document.createElement("h3");
    title.className = "task-title";

    highlightText(title, task.title, searchTerm);

    // DESCRIPTION
    const description = document.createElement("p");
    description.className = "task-description";

    highlightText(
      description,
      task.description,
      searchTerm
    );

    // PRIORITY
    const priority = document.createElement("span");

    priority.className =
      `priority-badge priority-${task.priority}`;

    priority.textContent = task.priority;

    // DUE DATE
    const dueDate = document.createElement("span");
    dueDate.className = "task-date";

    if (task.dueDate) {
      const formattedDate = new Date(
        task.dueDate + "T00:00:00"
      ).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      dueDate.textContent = `Due: ${formattedDate}`;
    }

    // METADATA
    const taskMeta = document.createElement("div");
    taskMeta.className = "task-meta";

    taskMeta.append(priority, dueDate);

    taskContent.append(
      title,
      description,
      taskMeta
    );

    // EDIT BUTTON
    const editBtn = document.createElement("button");

    editBtn.type = "button";
    editBtn.className = "task-action-btn";
    editBtn.textContent = "Edit";

    editBtn.dataset.editTaskId = task.id;

    editBtn.addEventListener("click", () => {
      openEditModal(task, editBtn);
    });

    // DELETE BUTTON
    const deleteBtn = document.createElement("button");

    deleteBtn.type = "button";
    deleteBtn.className = "task-action-btn";
    deleteBtn.textContent = "Delete";

    deleteBtn.addEventListener("click", () => {
      openDeleteModal(task, deleteBtn, onDelete);
    });

    // TASK ACTION BUTTONS
    const taskActions = document.createElement("div");
    taskActions.className = "task-actions";

    taskActions.append(editBtn, deleteBtn);

    // BUILD TASK CARD
    taskCard.append(
      checkbox,
      taskContent,
      taskActions
    );

    taskList.append(taskCard);
  });
}

// =====================================
// DASHBOARD STATISTICS
// =====================================

export function updateStats(tasks) {
  const total = tasks.length;

  const completed = tasks.filter(
    (task) => task.completed
  ).length;

  const active = total - completed;

  // DASHBOARD CARDS
  document.getElementById("totalTasks").textContent =
    total;

  document.getElementById("pendingTasks").textContent =
    active;

  document.getElementById("doneTasks").textContent =
    completed;

  // SIDEBAR COUNTERS
  document.getElementById("allCount").textContent =
    total;

  document.getElementById("activeCount").textContent =
    active;

  document.getElementById("completedCount").textContent =
    completed;
}
