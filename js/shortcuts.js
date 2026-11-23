
// KEYBOARD SHORTCUTS

export function setupKeyboardShortcuts({
  onNewTask,
  onSearch,
  onUndo,
  onRedo,
  isModalOpen,
  canUndo,
  canRedo,
}) {
  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    const ctrlOrCmd = event.ctrlKey || event.metaKey;

    // Check whether the user is typing
    const target = event.target;

    const isTyping =
      target instanceof Element &&
      (target.matches("input, textarea, select") ||
        target.isContentEditable ||
        Boolean(target.closest("[contenteditable='true']")));

    // Let the existing modal handler process Escape
    if (key === "escape") return;

    // Don't trigger shortcuts inside the modal
    if (isModalOpen()) return;

    // CTRL/CMD + K: FOCUS SEARCH
    if (
      ctrlOrCmd &&
      !event.shiftKey &&
      !event.altKey &&
      key === "k"
    ) {
      event.preventDefault();
      onSearch();
      return;
    }

    // Preserve normal text editing shortcuts
    if (isTyping) return;

    if (event.altKey) return;

    // CTRL/CMD + Z: UNDO
    if (
      ctrlOrCmd &&
      !event.shiftKey &&
      key === "z"
    ) {
      if (canUndo()) {
        event.preventDefault();
        onUndo();
      }

      return;
    }

    // CTRL + Y or CTRL/CMD + SHIFT + Z: REDO
    if (
      ctrlOrCmd &&
      (
        (!event.shiftKey && key === "y") ||
        (event.shiftKey && key === "z")
      )
    ) {
      if (canRedo()) {
        event.preventDefault();
        onRedo();
      }

      return;
    }

    // N: OPEN NEW TASK MODAL
    if (
      !ctrlOrCmd &&
      !event.shiftKey &&
      key === "n"
    ) {
      event.preventDefault();
      onNewTask();
    }
  });
}
