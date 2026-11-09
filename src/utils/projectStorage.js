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

/*
  Protecció de les llistes desades (projectes i
  biblioteques).

  Si el valor d'una clau existeix però no és una llista
  llegible (JSON corrupte o un altre tipus), en llegir-lo
  l'aplicació veu una llista buida. Abans que el primer
  guardat el sobreescrigui, se'n fa una còpia a
  "<clau>-backup-<data>" perquè les dades antigues no es
  perdin.

  Retorna false si el valor és illegible i no s'ha pogut
  fer la còpia: en aquest cas no s'ha de sobreescriure.
*/
export function preserveUnreadableStorageList(storageKey) {
  let savedValue;

  try {
    savedValue = window.localStorage.getItem(storageKey);
  } catch (error) {
    console.error("No s'ha pogut llegir:", storageKey, error);
    return false;
  }

  if (!savedValue) {
    return true;
  }

  try {
    if (Array.isArray(JSON.parse(savedValue))) {
      return true;
    }
  } catch {
    // Illegible: es fa la còpia de seguretat
  }

  const backupKey = `${storageKey}-backup-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`;

  try {
    window.localStorage.setItem(backupKey, savedValue);
    console.warn(
      "Dades illegibles conservades a",
      backupKey,
      "abans de sobreescriure",
      storageKey
    );
    return true;
  } catch (error) {
    console.error(
      "No s'ha pogut conservar una còpia de les dades illegibles de",
      storageKey,
      error
    );
    return false;
  }
}

export function saveProjectLibrary(
  projects
) {
  // Mai sobreescriure una biblioteca illegible sense còpia
  if (
    !preserveUnreadableStorageList(
      PROJECT_LIBRARY_STORAGE_KEY
    )
  ) {
    return false;
  }

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