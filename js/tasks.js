
export function createTask(title, description, priority, dueDate) {
  return {
    id: crypto.randomUUID(),
    title: title,
    description: description,
    priority: priority,
    dueDate: dueDate,
    completed: false,
    createdAt: new Date().toISOString(),
  };
}
