/*
  VOLUM DE COL·LISIÓ DE LES PECES IMPORTADES

  El volum tècnic (casc convex: vèrtexs, cares, arestes)
  d'una peça importada depèn només del model 3D i de la
  cara inferior triada. Abans es guardava una còpia
  completa dins de cada peça, capa, plantilla, autodesat
  i projecte, i omplia l'emmagatzematge del navegador.

  Ara no es guarda enlloc: es calcula una vegada per
  model (a partir del fitxer desat a IndexedDB) i es
  comparteix en memòria. Les peces només guarden
  modelId i modelBottomFace.

  getPieceCollisionGeometry(piece) és síncron: si el
  volum encara no està calculat, retorna null i en
  demana el càlcul; quan acaba, avisa els subscriptors
  (useCollisionGeometryVersion) perquè la interfície es
  torni a dibuixar.
*/

const DEFAULT_BOTTOM_FACE = "NEGATIVE_Y";

const geometries = new Map();
const pendingLoads = new Map();
const failedKeys = new Set();
const listeners = new Set();
let version = 0;

function getKey(modelId, bottomFace) {
  return `${modelId}|${bottomFace ?? DEFAULT_BOTTOM_FACE}`;
}

function notify() {
  version += 1;
  listeners.forEach((listener) => listener());
}

function isImportedModelPiece(piece) {
  return Boolean(
    piece && piece.pieceType === "IMPORTED_3D" && piece.modelId
  );
}

export function registerCollisionGeometry(
  modelId,
  bottomFace,
  collisionGeometry
) {
  if (!modelId || !collisionGeometry) {
    return;
  }

  const key = getKey(modelId, bottomFace);

  if (geometries.get(key) === collisionGeometry) {
    return;
  }

  geometries.set(key, collisionGeometry);
  failedKeys.delete(key);
  notify();
}

function requestCollisionGeometry(modelId, bottomFace) {
  const key = getKey(modelId, bottomFace);

  if (
    geometries.has(key) ||
    pendingLoads.has(key) ||
    failedKeys.has(key)
  ) {
    return;
  }

  // Import dinàmic: evita dependències circulars amb modelLoader
  const load = import("./modelLoader.js")
    .then(({ loadStoredModel }) =>
      loadStoredModel(modelId, bottomFace ?? DEFAULT_BOTTOM_FACE)
    )
    .then(({ collisionGeometry }) => {
      pendingLoads.delete(key);
      registerCollisionGeometry(modelId, bottomFace, collisionGeometry);
    })
    .catch((error) => {
      pendingLoads.delete(key);
      failedKeys.add(key);
      console.error(
        "No s'ha pogut calcular el volum de col·lisió del model",
        modelId,
        error
      );
      notify();
    });

  pendingLoads.set(key, load);
}

/*
  Volum de col·lisió d'una peça, o null si no en té
  (paramètrica) o encara s'està calculant.

  Les dades antigues que encara el porten a la peça es
  fan servir directament.
*/
export function getPieceCollisionGeometry(piece) {
  if (!piece) {
    return null;
  }

  if (piece.collisionGeometry) {
    return piece.collisionGeometry;
  }

  if (!isImportedModelPiece(piece)) {
    return null;
  }

  const key = getKey(piece.modelId, piece.modelBottomFace);

  if (geometries.has(key)) {
    return geometries.get(key);
  }

  requestCollisionGeometry(piece.modelId, piece.modelBottomFace);
  return null;
}

// Peça importada el volum de la qual encara no està disponible
export function isCollisionGeometryPending(piece) {
  return (
    isImportedModelPiece(piece) &&
    !piece.collisionGeometry &&
    !geometries.has(getKey(piece.modelId, piece.modelBottomFace))
  );
}

/*
  Còpia de la peça sense el volum de col·lisió, per
  desar-la. Si en portava un (dades antigues), es
  conserva en memòria perquè no s'hagi de recalcular.
*/
export function withoutStoredCollisionGeometry(piece) {
  if (!piece || !("collisionGeometry" in piece)) {
    return piece;
  }

  const { collisionGeometry, ...rest } = piece;

  if (collisionGeometry && isImportedModelPiece(piece)) {
    const key = getKey(piece.modelId, piece.modelBottomFace);

    if (!geometries.has(key)) {
      geometries.set(key, collisionGeometry);
    }
  }

  return rest;
}

export function subscribeCollisionGeometry(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCollisionGeometryVersion() {
  return version;
}
