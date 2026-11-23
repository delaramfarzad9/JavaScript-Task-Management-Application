
// TASKFLOW LOCAL STORAGE
const STORAGE_KEY = "taskflow-tasks";
const BACKUP_KEY = "taskflow-tasks-backup";
const CURRENT_VERSION = 2;

// SAVE TASKS
export function saveTasks(tasks) {
  if (!Array.isArray(tasks)) {
    console.error("Tasks must be an array.");
    return false;
  }

  const data = {
    version: CURRENT_VERSION,
    tasks,
  };

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );

    return true;
  } catch (error) {
    console.error("Failed to save tasks:", error);
    return false;
  }
}

// CONVERT OLD TASKS TO CURRENT STRUCTURE
// Exported so we can test migration separately.
export function migrateLegacyTasks(oldTasks) {
  if (!Array.isArray(oldTasks)) {
    return [];
  }

  return oldTasks
    .filter(
      (task) =>
        task !== null &&
        typeof task === "object" &&
        !Array.isArray(task)
    )
    .map((task) => ({
      id:
        typeof task.id === "string" && task.id
          ? task.id
          : crypto.randomUUID(),

      title:
        typeof task.title === "string" &&
        task.title.trim()
          ? task.title
          : "Untitled Task",

      description:
        typeof task.description === "string"
          ? task.description
          : "",

      priority: ["low", "medium", "high"].includes(
        task.priority
      )
        ? task.priority
        : "medium",

      dueDate:
        typeof task.dueDate === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate) &&
        !Number.isNaN(
          new Date(task.dueDate + "T00:00:00").getTime()
        )
          ? task.dueDate
          : "",

      completed: task.completed === true,

      createdAt:
        typeof task.createdAt === "string" &&
        !Number.isNaN(Date.parse(task.createdAt))
          ? task.createdAt
          : new Date().toISOString(),
    }));
}

// BACK UP DATA THAT CANNOT BE LOADED
function backupInvalidData(rawData) {
  try {
    // Preserve the first backup rather than overwrite it.
    if (!localStorage.getItem(BACKUP_KEY)) {
      localStorage.setItem(BACKUP_KEY, rawData);
    }
  } catch (error) {
    console.error("Could not back up invalid data:", error);
  }
}

// LOAD TASKS
export function loadTasks() {
  let savedData;

  try {
    savedData = localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
      return [];
    }

    const parsedData = JSON.parse(savedData);

    // VERSION 1: Original unversioned array
    if (Array.isArray(parsedData)) {
      const migratedTasks = migrateLegacyTasks(parsedData);

      saveTasks(migratedTasks);

      console.info("Migrated legacy task array to version 2.");

      return migratedTasks;
    }

    // CHECK STORED OBJECT STRUCTURE
    if (
      !parsedData ||
      typeof parsedData !== "object" ||
      !Array.isArray(parsedData.tasks)
    ) {
      console.warn("Invalid task storage structure.");
      backupInvalidData(savedData);
      return [];
    }

    // PREVENT LOADING AN UNSUPPORTED FUTURE VERSION
    if (parsedData.version > CURRENT_VERSION) {
      console.warn("Unsupported future storage version.");
      backupInvalidData(savedData);
      return [];
    }

    // VERSION 1: Older versioned object
    if (
      parsedData.version === 1 ||
      parsedData.version === undefined
    ) {
      const migratedTasks = migrateLegacyTasks(
        parsedData.tasks
      );

      saveTasks(migratedTasks);

      console.info("Migrated tasks from version 1 to 2.");

      return migratedTasks;
    }

    // VERSION 2: CURRENT STRUCTURE
    if (parsedData.version === CURRENT_VERSION) {
      const validTasks = migrateLegacyTasks(
        parsedData.tasks
      );

      // Repair missing or invalid fields if necessary
      if (
        JSON.stringify(validTasks) !==
        JSON.stringify(parsedData.tasks)
      ) {
        saveTasks(validTasks);

        console.info("Task data was normalised.");
      }

      return validTasks;
    }

    // UNKNOWN VERSION
    console.warn("Unknown storage version.");
    backupInvalidData(savedData);
    return [];
  } catch (error) {
    console.error("Failed to load saved tasks:", error);

    if (savedData !== undefined && savedData !== null) {
      backupInvalidData(savedData);
    }

    return [];
  }
}
