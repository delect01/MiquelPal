import { getPieceLocalVertices } from "./pieceGeometry.js";
import { palletEulerToThreeQuaternion, threeToPallet } from "./pieceUtils.js";
import { withoutGraspGroup } from "./graspGroups.js";

const REPLICATION_CLEARANCE = 0.5;

/*
  DISTÀNCIA DE DUPLICACIÓ

  Separació (mm) entre una peça i les seves còpies, en
  X i en Y del palet: 0 = enganxades. La fan servir el
  botó Duplicar i la rèplica amb Ctrl + arrossegar. Es
  desa al navegador.
*/
const SPACING_STORAGE_KEY = "pallet-simulator-duplicate-spacing";

function toSpacingValue(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
}

export function normalizeDuplicateSpacing(spacing) {
  return {
    x: toSpacingValue(spacing?.x),
    y: toSpacingValue(spacing?.y)
  };
}

export function loadDuplicateSpacing() {
  try {
    const savedValue = window.localStorage.getItem(SPACING_STORAGE_KEY);
    return normalizeDuplicateSpacing(savedValue ? JSON.parse(savedValue) : null);
  } catch {
    return normalizeDuplicateSpacing(null);
  }
}

export function saveDuplicateSpacing(spacing) {
  try {
    window.localStorage.setItem(
      SPACING_STORAGE_KEY,
      JSON.stringify(normalizeDuplicateSpacing(spacing))
    );
  } catch (error) {
    console.error("No s'ha pogut desar la distància de duplicació:", error);
  }
}

/*
  Pas entre còpies en l'espai de Three.js: la mida de la
  peça (girada) més el marge i la separació. En Three.js
  X = -Y del palet i Z = -X del palet.
*/
function getProjectedStep(piece, spacing = null) {
  const { x: spacingX, y: spacingY } = normalizeDuplicateSpacing(spacing);

  const quaternion =
    palletEulerToThreeQuaternion(
      Number(piece.rxDeg) || 0,
      Number(piece.ryDeg) || 0,
      Number(piece.rzDeg) || 0
    );

  const vertices =
    getPieceLocalVertices(piece);

  let minimumX = Infinity;
  let maximumX = -Infinity;
  let minimumZ = Infinity;
  let maximumZ = -Infinity;

  vertices.forEach((vertex) => {
    const rotated = vertex
      .clone()
      .applyQuaternion(
        quaternion
      );

    minimumX = Math.min(
      minimumX,
      rotated.x
    );

    maximumX = Math.max(
      maximumX,
      rotated.x
    );

    minimumZ = Math.min(
      minimumZ,
      rotated.z
    );

    maximumZ = Math.max(
      maximumZ,
      rotated.z
    );
  });

  const projectedSizeX =
    Math.max(
      maximumX - minimumX,
      0.001
    );

  const projectedSizeZ =
    Math.max(
      maximumZ - minimumZ,
      0.001
    );

  return {
    // X de Three.js = Y del palet
    stepX:
      projectedSizeX +
      REPLICATION_CLEARANCE +
      spacingY,

    // Z de Three.js = X del palet
    stepZ:
      projectedSizeZ +
      REPLICATION_CLEARANCE +
      spacingX
  };
}

/*
  Desplaçament en X del palet de la còpia que fa el botó
  Duplicar: just al costat de la peça (+X), separada per
  la distància de duplicació en X.
*/
export function getDuplicateOffsetX(piece, spacing) {
  return getProjectedStep(piece, spacing).stepZ;
}

export function buildReplicationCandidates({
  sourcePiece,
  startThreeX,
  startThreeZ,
  currentThreeX,
  currentThreeZ,
  spacing = null
}) {
  if (!sourcePiece) {
    return [];
  }

  const { stepX, stepZ } =
    getProjectedStep(sourcePiece, spacing);

  const deltaX = currentThreeX - startThreeX;
  const deltaZ = currentThreeZ - startThreeZ;

  const columnCount = Math.max(
    0,
    Math.round(Math.abs(deltaX) / stepX)
  );

  const rowCount = Math.max(
    0,
    Math.round(Math.abs(deltaZ) / stepZ)
  );

  const directionX = deltaX < 0 ? -1 : 1;
  const directionZ = deltaZ < 0 ? -1 : 1;

  const candidates = [];

  for (
    let columnIndex = 0;
    columnIndex <= columnCount;
    columnIndex += 1
  ) {
    for (
      let rowIndex = 0;
      rowIndex <= rowCount;
      rowIndex += 1
    ) {
      if (columnIndex === 0 && rowIndex === 0) {
        continue;
      }

      const threeX =
        startThreeX +
        columnIndex * stepX * directionX;

      const threeZ =
        startThreeZ +
        rowIndex * stepZ * directionZ;

      const palletPosition = threeToPallet(
        threeX,
        0,
        threeZ
      );

      candidates.push({
        previewId:
          `${columnIndex}-${rowIndex}`,
        columnIndex,
        rowIndex,
        // Les còpies són agafades individuals
        piece: {
          ...withoutGraspGroup(sourcePiece),
          x: palletPosition.x,
          y: palletPosition.y
        }
      });
    }
  }

  return candidates;
}
