
// COMMAND PATTERN
// Each command can execute and undo a task change.

export function createTaskCommand(tasks, nextTasks) {
  // Save independent copies of the task states
  const before = tasks.map((task) => ({ ...task }));
  const after = nextTasks.map((task) => ({ ...task }));

  // Replace the array contents without changing
  // the original array reference.
  function applySnapshot(snapshot) {
    tasks.splice(
      0,
      tasks.length,
      ...snapshot.map((task) => ({ ...task }))
    );
  }

  return {
    execute() {
      applySnapshot(after);
    },

    undo() {
      applySnapshot(before);
    },
  };
}

// HISTORY MANAGER
export function createHistoryManager(
  onChange,
  maxHistory = 20
) {
  const undoStack = [];
  const redoStack = [];

  // EXECUTE A NEW COMMAND
  function execute(command) {
    command.execute();

    undoStack.push(command);

    // Keep only the latest 20 actions
    if (undoStack.length > maxHistory) {
      undoStack.shift();
    }

    // New actions invalidate redo history
    redoStack.length = 0;

    onChange();
  }

  // UNDO LAST ACTION
  function undo() {
    if (undoStack.length === 0) return;

    const command = undoStack.pop();

    command.undo();
    redoStack.push(command);

    onChange();
  }

  // REDO LAST UNDONE ACTION
  function redo() {
    if (redoStack.length === 0) return;

    const command = redoStack.pop();

    command.execute();
    undoStack.push(command);

    onChange();
  }

  return {
    execute,
    undo,
    redo,

    canUndo() {
      return undoStack.length > 0;
    },

    canRedo() {
      return redoStack.length > 0;
    },
  };
}
