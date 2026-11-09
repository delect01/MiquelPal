/*
  Biblioteca de peces ("Guardar nom i característiques"
  del Configurador de peces).

  Són les definicions de peça guardades, amb un id
  estable. El Configurador de cinta les referencia pel
  seu id.
*/

import { preserveUnreadableStorageList } from "./projectStorage.js";
import { withoutStoredCollisionGeometry } from "./collisionGeometryStore.js";

const STORAGE_KEY = "pallet-simulator-piece-library";

export const PIECE_LIBRARY_CHANGED_EVENT = "piece-library-changed";

export function loadPieceLibrary() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    // Les plantilles antigues porten el volum de col·lisió: es treu
    return Array.isArray(parsed)
      ? parsed.map(withoutStoredCollisionGeometry)
      : [];
  } catch {
    return [];
  }
}

/*
  Plantilla nova a partir d'una peça col·locada al palet
  (mateixos camps que desa el Configurador de peces). Si
  el nom ja existeix a la biblioteca, s'hi afegeix un
  número: una plantilla amb el mateix nom se
  sobreescriuria en desar-la des del Configurador de
  peces.
*/
export function createTemplateFromPiece(piece, library) {
  const baseName =
    String(piece.name ?? "").trim() || "Peça";
  const usedNames = new Set(
    library.map((item) => String(item.name ?? "").trim().toLowerCase())
  );

  let name = baseName;

  for (let number = 2; usedNames.has(name.toLowerCase()); number += 1) {
    name = `${baseName} (${number})`;
  }

  return {
    id:
      window.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random()}`,
    name,
    pieceType: piece.pieceType,
    width: Number(piece.width),
    height: Number(piece.height),
    depth: Number(piece.depth),
    topWidth: Number(piece.topWidth ?? piece.width),
    topDepth: Number(piece.topDepth ?? piece.depth),
    modelId: piece.modelId ?? null,
    modelName: piece.modelName ?? null,
    modelFormat: piece.modelFormat ?? null,
    modelUnit: piece.modelUnit ?? null,
    modelBottomFace: piece.modelBottomFace ?? "NEGATIVE_Y"
  };
}

export function savePieceLibrary(items) {
  // Una biblioteca illegible es conserva abans de sobreescriure-la
  if (!preserveUnreadableStorageList(STORAGE_KEY)) {
    return false;
  }

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items.map(withoutStoredCollisionGeometry))
    );
  } catch (error) {
    console.error("No s'ha pogut guardar la biblioteca de peces:", error);
    return false;
  }

  // Avisa la resta de l'aplicació (Configurador de cinta)
  window.dispatchEvent(new Event(PIECE_LIBRARY_CHANGED_EVENT));
  return true;
}
