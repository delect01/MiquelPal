import {
  getAllImportedModels,
  getImportedModel,
  putImportedModelRecord
} from "./modelStorage.js";
import {
  createProjectId,
  loadProjectLibrary,
  preserveUnreadableStorageList,
  saveProject
} from "./projectStorage.js";

/*
  FITXERS DE PROJECTE I CÒPIES DE SEGURETAT

  Les dades viuen a l'emmagatzematge del navegador (o
  del programa), que és propi de cada ordinador. Aquests
  fitxers permeten passar-les d'un lloc a un altre:

  - Projecte (.miquelpal.json): un projecte amb els
    models 3D que fa servir (peces, pinça i palet).
  - Còpia de seguretat: totes les biblioteques
    (projectes, peces, separadors, pinces i palets),
    les preferències i tots els models 3D.

  Els models conserven el seu id: les peces que els
  fan servir els continuen trobant en importar-los.
*/
export const PROJECT_FILE_FORMAT = "miquelpal-project";
export const BACKUP_FILE_FORMAT = "miquelpal-backup";
const FILE_VERSION = 1;

// Llistes desades (es fusionen per id en importar una còpia)
const LIBRARY_STORAGE_KEYS = [
  "pallet-simulator-project-library",
  "pallet-simulator-piece-library",
  "pallet-simulator-separator-library",
  "pallet-simulator-gripper-library",
  "pallet-simulator-pallet-library"
];

// Preferències (només s'importen si encara no n'hi ha)
const SETTING_STORAGE_KEYS = [
  "pallet-simulator-language",
  "pallet-simulator-last-gripper",
  "pallet-simulator-conveyor-belt-width",
  "pallet-simulator-duplicate-spacing"
];

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      resolve(dataUrl.slice(dataUrl.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64, type) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: type || "application/octet-stream" });
}

async function serializeModel(record) {
  const { blob, ...metadata } = record;

  return {
    ...metadata,
    blobType: blob?.type ?? "",
    data: blob ? await blobToBase64(blob) : null
  };
}

function deserializeModel(model) {
  const { data, blobType, ...metadata } = model;

  // El carregador llegeix el nom del fitxer per saber-ne el format
  const blob = base64ToBlob(data, blobType);

  return {
    ...metadata,
    blob:
      typeof File === "function"
        ? new File([blob], metadata.name || "model", { type: blob.type })
        : blob
  };
}

// Tots els modelId que apareixen dins unes dades
function collectModelIds(value, ids = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectModelIds(item, ids));
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => {
      if (key === "modelId" && typeof item === "string" && item) {
        ids.add(item);
      } else {
        collectModelIds(item, ids);
      }
    });
  }

  return ids;
}

// Desa els models que encara no hi són; retorna quants n'ha afegit
async function restoreModels(models) {
  let restoredCount = 0;

  for (const model of Array.isArray(models) ? models : []) {
    if (!model?.id || typeof model.data !== "string") {
      continue;
    }

    if (await getImportedModel(model.id)) {
      continue;
    }

    await putImportedModelRecord(deserializeModel(model));
    restoredCount += 1;
  }

  return restoredCount;
}

function toFileName(name) {
  return (
    String(name ?? "")
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ") || "projecte"
  );
}

export function downloadJsonFile(fileName, data) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data)], { type: "application/json" })
  );
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Es deixa temps perquè la descàrrega comenci
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Fitxer d'un projecte amb els seus models 3D
export async function createProjectFile(project) {
  const models = [];

  for (const modelId of collectModelIds(project)) {
    const record = await getImportedModel(modelId);

    if (record) {
      models.push(await serializeModel(record));
    }
  }

  return {
    fileName: `${toFileName(project.name)}.miquelpal.json`,
    data: {
      format: PROJECT_FILE_FORMAT,
      version: FILE_VERSION,
      exportedAt: new Date().toISOString(),
      project,
      models
    }
  };
}

// Còpia de seguretat de totes les dades
export async function createBackupFile() {
  const storage = {};

  [...LIBRARY_STORAGE_KEYS, ...SETTING_STORAGE_KEYS].forEach((key) => {
    const value = window.localStorage.getItem(key);

    if (value !== null) {
      storage[key] = value;
    }
  });

  const models = [];

  for (const record of await getAllImportedModels()) {
    models.push(await serializeModel(record));
  }

  const date = new Date().toISOString().slice(0, 10);

  return {
    fileName: `MiquelPal-copia-${date}.json`,
    data: {
      format: BACKUP_FILE_FORMAT,
      version: FILE_VERSION,
      exportedAt: new Date().toISOString(),
      storage,
      models
    }
  };
}

export async function readTransferFile(file) {
  const data = JSON.parse(await file.text());

  if (
    data?.format === PROJECT_FILE_FORMAT &&
    data.project &&
    typeof data.project === "object"
  ) {
    return data;
  }

  if (
    data?.format === BACKUP_FILE_FORMAT &&
    data.storage &&
    typeof data.storage === "object"
  ) {
    return data;
  }

  throw new Error("Format de fitxer desconegut");
}

/*
  Importa un fitxer de projecte a la biblioteca.
  Si ja hi ha un projecte amb el mateix id (p. ex. el
  mateix fitxer importat dues vegades), s'afegeix com
  un projecte nou en lloc de sobreescriure'l.
  Retorna el projecte desat (o null si no s'ha pogut).
*/
export async function importProjectFile(data, importedSuffix) {
  await restoreModels(data.models);

  const library = loadProjectLibrary();
  const project = { ...data.project };
  const idExists = library.some((item) => item.id === project.id);
  const nameExists = library.some(
    (item) =>
      String(item.name).toLowerCase() ===
      String(project.name).toLowerCase()
  );

  if (!project.id || idExists) {
    project.id = createProjectId();
  }

  if (nameExists) {
    project.name = `${project.name} ${importedSuffix}`;
  }

  return saveProject(project);
}

function getItemKey(item) {
  return item && typeof item === "object" && item.id
    ? `id:${item.id}`
    : `json:${JSON.stringify(item)}`;
}

/*
  Importa una còpia de seguretat: afegeix els elements
  de les biblioteques que no hi són (els que ja hi són
  no es toquen), les preferències que falten i els
  models. Retorna quants projectes i models ha afegit.
*/
export async function importBackupFile(data) {
  let projectCount = 0;
  let itemCount = 0;

  LIBRARY_STORAGE_KEYS.forEach((key) => {
    let incoming;

    try {
      incoming = JSON.parse(data.storage[key] ?? "[]");
    } catch {
      return;
    }

    if (!Array.isArray(incoming) || incoming.length === 0) {
      return;
    }

    let current;

    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
      current = Array.isArray(parsed) ? parsed : [];
    } catch {
      current = [];
    }

    const existingKeys = new Set(current.map(getItemKey));
    const added = incoming.filter((item) => !existingKeys.has(getItemKey(item)));

    if (added.length === 0 || !preserveUnreadableStorageList(key)) {
      return;
    }

    window.localStorage.setItem(key, JSON.stringify([...current, ...added]));
    itemCount += added.length;

    if (key === "pallet-simulator-project-library") {
      projectCount += added.length;
    }
  });

  SETTING_STORAGE_KEYS.forEach((key) => {
    if (
      typeof data.storage[key] === "string" &&
      window.localStorage.getItem(key) === null
    ) {
      window.localStorage.setItem(key, data.storage[key]);
    }
  });

  const modelCount = await restoreModels(data.models);

  return { projectCount, itemCount, modelCount };
}
