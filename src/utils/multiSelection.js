import * as THREE from "three";
import { getPieceCenter } from "./pieceUtils.js";

export function normalizeScreenRectangle(rectangle) {
  return {
    left: Math.min(
      rectangle.startX,
      rectangle.currentX
    ),
    right: Math.max(
      rectangle.startX,
      rectangle.currentX
    ),
    top: Math.min(
      rectangle.startY,
      rectangle.currentY
    ),
    bottom: Math.max(
      rectangle.startY,
      rectangle.currentY
    )
  };
}

export function getPieceIdsInsideRectangle({
  pieces,
  rectangle,
  camera,
  canvasElement
}) {
  if (
    !camera ||
    !canvasElement ||
    !rectangle
  ) {
    return [];
  }

  const canvasBounds =
    canvasElement.getBoundingClientRect();

  const normalizedRectangle =
    normalizeScreenRectangle(rectangle);

  return pieces
    .filter((piece) => {
      const center = getPieceCenter(piece);

      const projectedCenter =
        new THREE.Vector3(
          center.x,
          center.y,
          center.z
        ).project(camera);

      if (
        projectedCenter.z < -1 ||
        projectedCenter.z > 1
      ) {
        return false;
      }

      const screenX =
        canvasBounds.left +
        (
          projectedCenter.x + 1
        ) *
        canvasBounds.width /
        2;

      const screenY =
        canvasBounds.top +
        (
          1 - projectedCenter.y
        ) *
        canvasBounds.height /
        2;

      return (
        screenX >=
          normalizedRectangle.left &&
        screenX <=
          normalizedRectangle.right &&
        screenY >=
          normalizedRectangle.top &&
        screenY <=
          normalizedRectangle.bottom
      );
    })
    .map((piece) => piece.id);
}

export function getSelectionCenter(
  pieces,
  selectedPieceIds
) {
  const selectedSet = new Set(
    selectedPieceIds
  );

  const selectedPieces = pieces.filter(
    (piece) => selectedSet.has(piece.id)
  );

  if (selectedPieces.length === 0) {
    return {
      x: 0,
      y: 0
    };
  }

  const totals = selectedPieces.reduce(
    (result, piece) => ({
      x:
        result.x +
        (Number(piece.x) || 0),
      y:
        result.y +
        (Number(piece.y) || 0)
    }),
    {
      x: 0,
      y: 0
    }
  );

  return {
    x:
      totals.x /
      selectedPieces.length,
    y:
      totals.y /
      selectedPieces.length
  };
}
