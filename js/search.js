
 // DEBOUNCE FUNCTION
export function debounce(callback, delay = 300) {
  let timer;

  return function (...args) {
    clearTimeout(timer);

    timer = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}

// SEARCH TASKS
export function searchTasks(tasks, query) {
  const searchTerm = query.trim().toLowerCase();

  if (!searchTerm) {
    return tasks;
  }

  return tasks.filter((task) => {
    const title = task.title.toLowerCase();
    const description = task.description.toLowerCase();

    return (
      title.includes(searchTerm) ||
      description.includes(searchTerm)
    );
  });
}
