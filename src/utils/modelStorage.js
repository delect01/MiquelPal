const DATABASE_NAME = "pallet-simulator-models";
const DATABASE_VERSION = 1;
const MODEL_STORE = "models";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      DATABASE_NAME,
      DATABASE_VERSION
    );

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(MODEL_STORE)) {
        database.createObjectStore(
          MODEL_STORE,
          { keyPath: "id" }
        );
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function createModelId() {
  return globalThis.crypto?.randomUUID?.() ??
    `model-${Date.now()}-${Math.random()}`;
}

export async function saveImportedModel({
  file,
  format,
  unit,
  dimensions
}) {
  const database = await openDatabase();
  const record = {
    id: createModelId(),
    name: file.name,
    format,
    unit,
    size: file.size,
    blob: file,
    dimensions,
    createdAt: new Date().toISOString()
  };

  await new Promise((resolve, reject) => {
    const transaction = database.transaction(
      MODEL_STORE,
      "readwrite"
    );
    transaction.objectStore(MODEL_STORE).put(record);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });

  database.close();
  return record;
}

export async function getImportedModel(modelId) {
  const database = await openDatabase();

  const record = await new Promise((resolve, reject) => {
    const transaction = database.transaction(
      MODEL_STORE,
      "readonly"
    );
    const request = transaction
      .objectStore(MODEL_STORE)
      .get(modelId);

    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });

  database.close();
  return record;
}

export async function deleteImportedModel(modelId) {
  const database = await openDatabase();

  await new Promise((resolve, reject) => {
    const transaction = database.transaction(
      MODEL_STORE,
      "readwrite"
    );
    transaction.objectStore(MODEL_STORE).delete(modelId);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });

  database.close();
}
