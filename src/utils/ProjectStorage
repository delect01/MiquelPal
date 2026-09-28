//Project storage

const PROJECT_LIBRARY_STORAGE_KEY =
  "pallet-simulator-project-library";

export function createProjectId() {
  if (
    window.crypto &&
    typeof window.crypto.randomUUID ===
      "function"
  ) {
    return window.crypto.randomUUID();
  }

  return (
    `${Date.now()}-` +
    `${Math.random()}`
  );
}

export function loadProjectLibrary() {
  try {
    const savedValue =
      window.localStorage.getItem(
        PROJECT_LIBRARY_STORAGE_KEY
      );

    if (!savedValue) {
      return [];
    }

    const parsedValue =
      JSON.parse(savedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue;
  } catch (error) {
    console.error(
      "No s'ha pogut carregar la biblioteca de projectes:",
      error
    );

    return [];
  }
}

export function saveProjectLibrary(
  projects
) {
  try {
    window.localStorage.setItem(
      PROJECT_LIBRARY_STORAGE_KEY,
      JSON.stringify(projects)
    );

    return true;
  } catch (error) {
    console.error(
      "No s'ha pogut guardar la biblioteca de projectes:",
      error
    );

    return false;
  }
}

export function findProjectById(
  projectId
) {
  const projects =
    loadProjectLibrary();

  return (
    projects.find(
      (project) =>
        project.id === projectId
    ) ??
    null
  );
}

export function saveProject(
  project
) {
  const projects =
    loadProjectLibrary();

  const existingIndex =
    projects.findIndex(
      (savedProject) =>
        savedProject.id === project.id
    );

  let updatedProjects;

  if (existingIndex >= 0) {
    updatedProjects =
      projects.map(
        (savedProject) =>
          savedProject.id ===
          project.id
            ? project
            : savedProject
      );
  } else {
    updatedProjects = [
      ...projects,
      project
    ];
  }

  const wasSaved =
    saveProjectLibrary(
      updatedProjects
    );

  return wasSaved
    ? project
    : null;
}

export function deleteProject(
  projectId
) {
  const projects =
    loadProjectLibrary();

  const updatedProjects =
    projects.filter(
      (project) =>
        project.id !== projectId
    );

  return saveProjectLibrary(
    updatedProjects
  );
}