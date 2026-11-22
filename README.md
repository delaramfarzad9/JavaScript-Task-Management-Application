
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta
    name="description"
    content="A modern task management application built with vanilla JavaScript."
  />
  <title>TaskFlow | Task Manager</title>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
    rel="stylesheet"
  />

  <link rel="stylesheet" href="./css/style.css" />
  <script type="module" src="./js/main.js"></script>
</head>

<body>
  <div class="app-layout">

    <!-- SIDEBAR -->
    <aside class="sidebar">
      <a href="./" class="logo" aria-label="TaskFlow home">
        <span class="logo-icon">✓</span>
        <span>Task<span class="logo-accent">Flow</span></span>
      </a>

      <div class="sidebar-section">
        <p class="sidebar-label">WORKSPACE</p>

        <nav class="sidebar-nav" aria-label="Task views">
          <button
            class="nav-item active"
            type="button"
            data-view="all"
            aria-current="page"
          >
            <span>▦ &nbsp; All Tasks</span>
            <span class="nav-count" id="allCount">0</span>
          </button>

          <button class="nav-item" type="button" data-view="active">
            <span>◷ &nbsp; In Progress</span>
            <span class="nav-count" id="activeCount">0</span>
          </button>

          <button class="nav-item" type="button" data-view="completed">
            <span>✓ &nbsp; Completed</span>
            <span class="nav-count" id="completedCount">0</span>
          </button>
        </nav>
      </div>

      <div class="sidebar-bottom">
        <div class="sidebar-tip">
          <span class="tip-icon">✦</span>
          <h3>Stay organised</h3>
          <p>Small steps lead to big achievements.</p>
        </div>
        <p class="sidebar-footer">TaskFlow · Vanilla JS</p>
      </div>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="main-content">

      <!-- HEADER -->
      <header class="topbar">
        <div class="page-heading">
          <p class="eyebrow">YOUR WORKSPACE</p>
          <h1>My Tasks<span class="heading-dot">.</span></h1>
          <p class="page-subtitle">
            Organise your day and keep moving forward.
          </p>
        </div>

        <button class="btn btn-primary" id="addTaskBtn" type="button">
          <span aria-hidden="true">+</span> New Task
        </button>
      </header>

      <!-- STATISTICS -->
      <section class="stats-grid" aria-label="Task overview">
        <article class="stat-card">
          <div class="stat-icon icon-purple" aria-hidden="true">▦</div>
          <p class="stat-label">Total Tasks</p>
          <h2 id="totalTasks">0</h2>
          <span class="stat-description">All your tasks</span>
        </article>

        <article class="stat-card">
          <div class="stat-icon icon-orange" aria-hidden="true">◷</div>
          <p class="stat-label">In Progress</p>
          <h2 id="pendingTasks">0</h2>
          <span class="stat-description">Still to complete</span>
        </article>

        <article class="stat-card">
          <div class="stat-icon icon-green" aria-hidden="true">✓</div>
          <p class="stat-label">Completed</p>
          <h2 id="doneTasks">0</h2>
          <span class="stat-description">Great work!</span>
        </article>
      </section>

      <!-- TASKS SECTION -->
      <section class="tasks-section" aria-labelledby="tasksHeading">

        <div class="section-header">
          <div>
            <h2 id="tasksHeading">Your Tasks</h2>
            <p>Manage and prioritise your work.</p>
          </div>

          <div class="history-actions">
            <button
              class="btn btn-outline"
              id="undoBtn"
              type="button"
              disabled
              title="Undo (Ctrl+Z)"
            >
              ↶ Undo
            </button>
            <button
              class="btn btn-outline"
              id="redoBtn"
              type="button"
              disabled
              title="Redo (Ctrl+Y)"
            >
              ↷ Redo
            </button>
          </div>
        </div>

        <!-- SEARCH AND FILTERS -->
        <div class="toolbar">
          <div class="search-wrapper">
            <label class="sr-only" for="searchInput">
              Search tasks
            </label>
            <span class="search-icon" aria-hidden="true">⌕</span>
            <input
              type="search"
              id="searchInput"
              placeholder="Search your tasks..."
              autocomplete="off"
            />
          </div>

          <div class="filter-controls">
            <label class="sr-only" for="priorityFilter">
              Filter by priority
            </label>
            <select id="priorityFilter">
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            <label class="sr-only" for="sortSelect">
              Sort tasks
            </label>
            <select id="sortSelect">
              <option value="custom">Custom Order</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Priority</option>
              <option value="dueDate">Due Date</option>
              <option value="title">Title A–Z</option>
            </select>
          </div>
        </div>

        <!-- JAVASCRIPT WILL RENDER TASKS HERE -->
        <div
          id="taskList"
          class="task-list"
          aria-label="Task list"
        ></div>

        <!-- EMPTY STATE -->
        <div class="empty-state" id="emptyState">
          <div class="empty-icon" aria-hidden="true">☑</div>
          <h3>No tasks yet</h3>
          <p>
            Your workspace is ready. Create your first task
            to get started.
          </p>
          <button
            class="btn btn-primary"
            id="emptyAddBtn"
            type="button"
          >
            + Create a Task
          </button>
        </div>

        <p class="task-footer" id="taskSummary" aria-live="polite">
          Showing 0 tasks
        </p>
      </section>
    </main>
  </div>

  <!-- ADD / EDIT TASK MODAL -->
  <div class="modal" id="taskModal" hidden>
    <div class="modal-backdrop" data-close-modal></div>

    <section
      class="modal-content"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalTitle"
    >
      <div class="modal-header">
        <div>
          <p class="eyebrow">TASK DETAILS</p>
          <h2 id="modalTitle">Create New Task</h2>
        </div>

        <button
          class="close-btn"
          id="closeModalBtn"
          type="button"
          aria-label="Close dialog"
        >
          &times;
        </button>
      </div>

      <form id="taskForm">
        <input type="hidden" id="taskId" />

        <div class="form-group">
          <label for="taskTitle">Task Title *</label>
          <input
            type="text"
            id="taskTitle"
            name="title"
            placeholder="What needs to be done?"
            maxlength="100"
            required
          />
        </div>

        <div class="form-group">
          <label for="taskDescription">Description</label>
          <textarea
            id="taskDescription"
            name="description"
            rows="3"
            placeholder="Add some details..."
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="taskPriority">Priority</label>
            <select id="taskPriority" name="priority">
              <option value="low">Low</option>
              <option value="medium" selected>Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div class="form-group">
            <label for="taskDueDate">Due Date</label>
            <input
              type="date"
              id="taskDueDate"
              name="dueDate"
            />
          </div>
        </div>

        <div class="modal-actions">
          <button
            class="btn btn-outline"
            id="cancelBtn"
            type="button"
          >
            Cancel
          </button>
          <button class="btn btn-primary" type="submit">
            Save Task
          </button>
        </div>
      </form>
    </section>
  </div>

  <!-- NOTIFICATIONS -->
  <div
    id="toast"
    class="toast"
    role="status"
    aria-live="polite"
    hidden
  ></div>
</body>
</html>
