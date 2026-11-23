
 // FILTER TASKS BY STATUS AND PRIORITY
export function filterTasks(tasks, status, priority = "all") {
  return tasks.filter((task) => {
    const matchesStatus =
      status === "all" ||
      (status === "active" && !task.completed) ||
      (status === "completed" && task.completed);

    const matchesPriority =
      priority === "all" || task.priority === priority;

    return matchesStatus && matchesPriority;
  });
}

// SORT TASKS
export function sortTasks(tasks, sortBy = "custom") {
  // Copy the array to avoid changing the original order
  const sortedTasks = [...tasks];

  switch (sortBy) {
    case "newest":
      return sortedTasks.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

    case "oldest":
      return sortedTasks.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

    case "priority": {
      const priorityOrder = {
        high: 1,
        medium: 2,
        low: 3,
      };

      return sortedTasks.sort(
        (a, b) =>
          priorityOrder[a.priority] - priorityOrder[b.priority]
      );
    }

    case "dueDate":
      return sortedTasks.sort((a, b) => {
        // Tasks without a due date go to the end
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;

        return a.dueDate.localeCompare(b.dueDate);
      });

    case "title":
      return sortedTasks.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, {
          sensitivity: "base",
        })
      );

    case "custom":
    default:
      return sortedTasks;
  }
}
