
import { createTask } from "./tasks.js";
import { saveTasks, loadTasks } from "./storage.js";
import { filterTasks, sortTasks } from "./filters.js";
import { debounce, searchTasks } from "./search.js";

import {
  createTaskCommand,
  createHistoryManager,
} from "./commands.js";

import { setupKeyboardShortcuts } from "./shortcuts.js";

import {
  openModal,
  closeModal,
  renderTasks,
  updateStats,
} from "./ui.js";

// DOM ELEMENTS
const addTaskBtn = document.getElementById("addTaskBtn");
const emptyAddBtn = document.getElementById("emptyAddBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");

const modal = document.getElementById("taskModal");
const taskForm = document.getElementById("taskForm");

const navButtons = document.querySelectorAll(".nav-item");
const priorityFilter = document.getElementById("priorityFilter");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

// LOAD SAVED TASKS
const tasks = loadTasks();

// VALID URL VALUES
const validStatuses = ["all", "active", "completed"];
const validPriorities = ["all", "high", "medium", "low"];

const validSorts = [
  "custom",
  "newest",
  "oldest",
  "priority",
  "dueDate",
  "title",
];

// READ FILTERS FROM URL
function getFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);

  const status = params.get("status") || "all";
  const priority = params.get("priority") || "all";
  const sort = params.get("sort") || "custom";

  return {
    status: validStatuses.includes(status)
      ? status
      : "all",

    priority: validPriorities.includes(priority)
      ? priority
      : "all",

    sort: validSorts.includes(sort)
      ? sort
      : "custom",
  };
}

// INITIAL FILTER STATE
const initialFilters = getFiltersFromURL();

let currentStatus = initialFilters.status;
let currentPriority = initialFilters.priority;
let currentSort = initialFilters.sort;

let currentSearch = "";

// UPDATE URL PARAMETERS
function updateURL() {
  const url = new URL(window.location.href);

  if (currentStatus === "all") {
    url.searchParams.delete("status");
  } else {
    url.searchParams.set("status", currentStatus);
  }

  if (currentPriority === "all") {
    url.searchParams.delete("priority");
  } else {
    url.searchParams.set("priority", currentPriority);
  }

  if (currentSort === "custom") {
    url.searchParams.delete("sort");
  } else {
    url.searchParams.set("sort", currentSort);
  }

  window.history.replaceState(null, "", url);
}

// UPDATE FILTER CONTROLS
function updateFilterControls() {
  navButtons.forEach((button) => {
    const isActive =
      button.dataset.view === currentStatus;

    button.classList.toggle("active", isActive);

    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  priorityFilter.value = currentPriority;
  sortSelect.value = currentSort;
}

// CHECK WHETHER DRAGGING IS ALLOWED
function canDragTasks() {
  return (
    currentStatus === "all" &&
    currentPriority === "all" &&
    currentSort === "custom" &&
    currentSearch.trim() === "" &&
    searchInput.value.trim() === ""
  );
}

// DISPLAY FILTERED, SEARCHED AND SORTED TASKS
function displayTasks() {
  const filteredTasks = filterTasks(
    tasks,
    currentStatus,
    currentPriority
  );

  const searchedTasks = searchTasks(
    filteredTasks,
    currentSearch
  );

  const sortedTasks = sortTasks(
    searchedTasks,
    currentSort
  );

  renderTasks(
    sortedTasks,
    deleteTask,
    changeTaskStatus,
    currentSearch,
    tasks.length > 0,
    reorderTasks,
    canDragTasks()
  );
}

// UPDATE UNDO AND REDO BUTTONS
function updateHistoryButtons() {
  undoBtn.disabled = !history.canUndo();
  redoBtn.disabled = !history.canRedo();
}

// UPDATE AFTER ANY TASK CHANGE
function refreshApp() {
  saveTasks(tasks);
  updateStats(tasks);
  displayTasks();
  updateHistoryButtons();
}

// CREATE HISTORY MANAGER
const history = createHistoryManager(refreshApp, 20);

// EXECUTE A TASK CHANGE THROUGH COMMAND PATTERN
function commitTasks(nextTasks) {
  const command = createTaskCommand(tasks, nextTasks);

  history.execute(command);
}

// OPEN MODAL
addTaskBtn.addEventListener("click", openModal);
emptyAddBtn.addEventListener("click", openModal);

// CLOSE MODAL
closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

// CLOSE BY CLICKING BACKDROP
modal.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-close-modal")) {
    closeModal();
  }
});

// CLOSE WITH ESCAPE
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) {
    closeModal();
  }
});

// STATUS FILTER
navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentStatus = button.dataset.view;

    updateFilterControls();
    updateURL();
    displayTasks();
  });
});

// PRIORITY FILTER
priorityFilter.addEventListener("change", (event) => {
  currentPriority = event.target.value;

  updateURL();
  displayTasks();
});

// SORT TASKS
sortSelect.addEventListener("change", (event) => {
  currentSort = event.target.value;

  updateURL();
  displayTasks();
});

// DEBOUNCED SEARCH
const debouncedSearch = debounce((query) => {
  currentSearch = query.trim();
  displayTasks();
}, 300);

searchInput.addEventListener("input", (event) => {
  debouncedSearch(event.target.value);
});

// RESTORE FILTERS FROM BROWSER HISTORY
window.addEventListener("popstate", () => {
  const filters = getFiltersFromURL();

  currentStatus = filters.status;
  currentPriority = filters.priority;
  currentSort = filters.sort;

  updateFilterControls();
  displayTasks();
});

// CREATE OR EDIT TASK
taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = document
    .getElementById("taskTitle")
    .value.trim();

  const description = document
    .getElementById("taskDescription")
    .value.trim();

  const priority = document.getElementById("taskPriority").value;
  const dueDate = document.getElementById("taskDueDate").value;
  const taskId = document.getElementById("taskId").value;

  if (!title) return;

  if (taskId) {
    // EDIT EXISTING TASK
    const existingTask = tasks.find(
      (task) => task.id === taskId
    );

    if (!existingTask) return;

    // DON'T RECORD UNCHANGED EDITS
    if (
      existingTask.title === title &&
      existingTask.description === description &&
      existingTask.priority === priority &&
      existingTask.dueDate === dueDate
    ) {
      closeModal();
      return;
    }

    const nextTasks = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            title,
            description,
            priority,
            dueDate,
          }
        : task
    );

    commitTasks(nextTasks);
  } else {
    // CREATE NEW TASK
    const newTask = createTask(
      title,
      description,
      priority,
      dueDate
    );

    commitTasks([...tasks, newTask]);
  }

  closeModal();
});

// DELETE TASK
function deleteTask(id) {
  const exists = tasks.some(
    (task) => task.id === id
  );

  if (!exists) return;

  const nextTasks = tasks.filter(
    (task) => task.id !== id
  );

  commitTasks(nextTasks);
}

// COMPLETE OR REOPEN TASK
function changeTaskStatus(id, completed) {
  const existingTask = tasks.find(
    (task) => task.id === id
  );

  if (!existingTask) return;

  if (existingTask.completed === completed) return;

  const nextTasks = tasks.map((task) =>
    task.id === id
      ? { ...task, completed }
      : task
  );

  commitTasks(nextTasks);
}

// DRAG AND DROP REORDERING
function reorderTasks(draggedId, targetId) {
  if (!canDragTasks()) return;

  const oldIndex = tasks.findIndex(
    (task) => task.id === draggedId
  );

  const targetIndex = tasks.findIndex(
    (task) => task.id === targetId
  );

  if (
    oldIndex === -1 ||
    targetIndex === -1 ||
    oldIndex === targetIndex
  ) {
    return;
  }

  const nextTasks = [...tasks];

  const [movedTask] = nextTasks.splice(
    oldIndex,
    1
  );

  nextTasks.splice(targetIndex, 0, movedTask);

  commitTasks(nextTasks);
}

// UNDO BUTTON
undoBtn.addEventListener("click", () => {
  history.undo();
});

// REDO BUTTON
redoBtn.addEventListener("click", () => {
  history.redo();
});

// KEYBOARD SHORTCUTS
setupKeyboardShortcuts({
  onNewTask: openModal,

  onSearch: () => {
    searchInput.focus();
    searchInput.select();
  },

  onUndo: () => history.undo(),
  onRedo: () => history.redo(),

  isModalOpen: () => !modal.hidden,

  canUndo: () => history.canUndo(),
  canRedo: () => history.canRedo(),
});

// INITIAL RENDER
updateFilterControls();
displayTasks();
updateStats(tasks);
updateHistoryButtons();
