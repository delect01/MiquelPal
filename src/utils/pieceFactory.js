import { roundToThreeDecimals } from "./appModelUtils.js";
import { withoutGraspGroup } from "./graspGroups.js";

/*
  Següent identificador intern lliure.
*/
export function getNextPieceId(pieces) {
  const numericIds = pieces
    .map((piece) => Number(piece.id))
    .filter((pieceId) => Number.isFinite(pieceId));

  return numericIds.length === 0
    ? 1
    : Math.max(...numericIds) + 1;
}

/*
  Peça nova (paramètrica o importada) al centre
  del palet, recolzada a sobre.
*/
export function createPieceFromDefinition(
  pieceDefinition,
  id,
  orderId
) {
  return {
    id,
    orderId,
    name: pieceDefinition.name || `Peça ${id}`,
    pieceType: pieceDefinition.pieceType,
    // Plantilla de la biblioteca d'on surt (Configurador de cinta)
    libraryPieceId: pieceDefinition.libraryPieceId ?? null,

    modelId: pieceDefinition.modelId ?? null,
    modelName: pieceDefinition.modelName ?? null,
    modelFormat: pieceDefinition.modelFormat ?? null,
    modelUnit: pieceDefinition.modelUnit ?? null,
    modelBottomFace:
      pieceDefinition.modelBottomFace ?? "NEGATIVE_Y",
    // El volum de col·lisió no es copia: es comparteix per model
    // (collisionGeometryStore.js)

    width: pieceDefinition.width,
    height: pieceDefinition.height,
    depth: pieceDefinition.depth,
    topWidth: pieceDefinition.topWidth,
    topDepth: pieceDefinition.topDepth,

    // TCP de la pinça (agafada de la cinta, si n'hi ha)
    referencePoint: pieceDefinition.referencePoint ?? "CENTER",
    faceOffsetX: pieceDefinition.faceOffsetX ?? 0,
    faceOffsetY: pieceDefinition.faceOffsetY ?? 0,
    faceRotationDeg: pieceDefinition.faceRotationDeg ?? 0,

    x: 0,
    y: 0,
    z: roundToThreeDecimals(
      Number(pieceDefinition.height) / 2
    ),

    rxDeg: 0,
    ryDeg: 0,
    rzDeg: 0
  };
}

export function createSeparatorFromDefinition(
  separatorDefinition,
  id,
  orderId
) {
  return {
    id,
    orderId,
    name: separatorDefinition.name || `Separador ${id}`,
    pieceCategory: "SEPARATOR",
    pieceType: "RECTANGULAR",

    width: separatorDefinition.width,
    height: separatorDefinition.height,
    depth: separatorDefinition.depth,
    topWidth: separatorDefinition.width,
    topDepth: separatorDefinition.depth,

    color: separatorDefinition.color || "#d4b483",
    modelType: separatorDefinition.modelType || "BOX",
    modelData: separatorDefinition.modelData || null,

    referencePoint: "TOP_CENTER",
    faceOffsetX: 0,
    faceOffsetY: 0,
    faceRotationDeg: 0,

    x: 0,
    y: 0,
    z: roundToThreeDecimals(
      Number(separatorDefinition.height) / 2
    ),

    rxDeg: 0,
    ryDeg: 0,
    rzDeg: 0
  };
}

/*
  Còpia desplaçada offsetX mm en X del palet (el botó
  Duplicar hi passa la mida de la peça més la distància
  de duplicació).
*/
export function createDuplicatedPiece(
  sourcePiece,
  id,
  orderId,
  offsetX = 100
) {
  // La còpia és una agafada individual
  return {
    ...withoutGraspGroup(sourcePiece),
    id,
    orderId,
    x: roundToThreeDecimals(Number(sourcePiece.x) + offsetX),
    y: roundToThreeDecimals(Number(sourcePiece.y)),
    z: roundToThreeDecimals(Number(sourcePiece.z))
  };
}
