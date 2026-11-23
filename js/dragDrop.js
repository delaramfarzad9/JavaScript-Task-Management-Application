
// Store the ID of the task being dragged
let draggedTaskId = null;

// ENABLE DRAG AND DROP FOR A TASK CARD
export function makeTaskDraggable(
  taskCard,
  taskId,
  onReorder
) {
  taskCard.draggable = true;
  taskCard.title = "Drag to reorder task";

  // START DRAGGING
  taskCard.addEventListener("dragstart", (event) => {
    draggedTaskId = taskId;

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);

    // Delay styling so the drag preview looks normal
    requestAnimationFrame(() => {
      taskCard.classList.add("dragging");
    });
  });

  // ALLOW DROPPING ON THIS CARD
  taskCard.addEventListener("dragover", (event) => {
    if (
      draggedTaskId === null ||
      draggedTaskId === taskId
    ) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  });

  // DROP TASK
  taskCard.addEventListener("drop", (event) => {
    event.preventDefault();

    if (
      draggedTaskId === null ||
      draggedTaskId === taskId
    ) {
      return;
    }

    const sourceId = draggedTaskId;

    draggedTaskId = null;

    // Tell main.js to update the task order
    onReorder(sourceId, taskId);
  });

  // FINISH DRAGGING
  taskCard.addEventListener("dragend", () => {
    draggedTaskId = null;

    taskCard.classList.remove("dragging");
  });
}
