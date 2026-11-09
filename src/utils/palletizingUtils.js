import * as THREE from "three";
import { getPieceBoundingBox } from "./getPieceBoundingBox.js";
import { arePiecesPreciselyColliding } from "./preciseCollision.js";
import {
  getPieceLocalVertices
} from "./pieceGeometry.js";
import {
  palletEulerToThreeQuaternion
} from "./pieceUtils.js";

function getPieceVerticalBounds(piece) {
  const quaternion =
    palletEulerToThreeQuaternion(
      Number(piece.rxDeg) || 0,
      Number(piece.ryDeg) || 0,
      Number(piece.rzDeg) || 0
    );

  const localVertices =
    getPieceLocalVertices(piece);

  let minimumZ = Infinity;
  let maximumZ = -Infinity;

  localVertices.forEach((vertex) => {
    const rotatedVertex = vertex
      .clone()
      .applyQuaternion(quaternion);

    const worldZ =
      (Number(piece.z) || 0) +
      rotatedVertex.y;

    minimumZ = Math.min(
      minimumZ,
      worldZ
    );

    maximumZ = Math.max(
      maximumZ,
      worldZ
    );
  });

  if (
    !Number.isFinite(minimumZ) ||
    !Number.isFinite(maximumZ)
  ) {
    const halfHeight =
      Math.abs(
        Number(piece.height) || 0
      ) / 2;

    return {
      minimumZ:
        (Number(piece.z) || 0) -
        halfHeight,

      maximumZ:
        (Number(piece.z) || 0) +
        halfHeight
    };
  }

  return {
    minimumZ,
    maximumZ
  };
}

export function getLayerVerticalBounds(
  layer
) {
  const sourcePieces =
    Array.isArray(layer?.pieces)
      ? layer.pieces
      : [];

  if (sourcePieces.length === 0) {
    return {
      minimumZ: 0,
      maximumZ: 0,
      height: 0
    };
  }

  let minimumZ = Infinity;
  let maximumZ = -Infinity;

  sourcePieces.forEach((piece) => {
    const pieceBounds =
      getPieceVerticalBounds(piece);

    minimumZ = Math.min(
      minimumZ,
      pieceBounds.minimumZ
    );

    maximumZ = Math.max(
      maximumZ,
      pieceBounds.maximumZ
    );
  });

  return {
    minimumZ,
    maximumZ,

    height: Math.max(
      0,
      maximumZ - minimumZ
    )
  };
}

/*
  ASSENTAMENT DE LES CAPES

  Cada capa baixa (sense deformar-se) des de sobre de
  la pila fins que alguna peça toca les capes ja
  col·locades o el palet. Així una capa no queda
  flotant per culpa d'una peça alta (inclinada) de la
  capa de sota.

  - Es deixa una separació mínima perquè les peces no
    es marquin com a col·lisió.
  - Mai baixa per sota de la cara superior més baixa de
    la capa anterior (no s'encaixa dins seu).
  - El valor es calcula sempre: si una capa de sota
    canvia, les de sobre s'hi tornen a assentar.
*/
export const LAYER_SETTLE_CLEARANCE_MM = 0.5;
const MAX_SETTLE_STEP_MM = 5;
const SETTLE_REFINE_ITERATIONS = 16;

function getPieceZOffsetCopy(piece, offset) {
  return { ...piece, z: (Number(piece.z) || 0) + offset };
}

// Capsa en Three.js (Y amunt = Z del palet) desplaçada verticalment
function shiftBox(box, offset) {
  return box.clone().translate(new THREE.Vector3(0, offset, 0));
}

function boxesOverlapInPlan(firstBox, secondBox) {
  return (
    firstBox.min.x < secondBox.max.x &&
    firstBox.max.x > secondBox.min.x &&
    firstBox.min.z < secondBox.max.z &&
    firstBox.max.z > secondBox.min.z
  );
}

/*
  Desplaçament vertical més baix (entre minOffset i
  startOffset) al qual la capa arriba baixant des de
  startOffset sense tocar res. Per cada parella de
  peces que coincideixen en planta: es baixa a passos
  (més curts que la peça més prima, perquè no la
  travessi) i, en trobar el contacte, s'afina.
*/
function getSettledOffset(layerPieces, placedPieces, startOffset, minOffset) {
  if (placedPieces.length === 0) {
    return minOffset;
  }

  if (startOffset <= minOffset) {
    return startOffset;
  }

  const placedWithBoxes = placedPieces.map((piece) => ({
    piece,
    box: getPieceBoundingBox(piece)
  }));

  let settledOffset = minOffset;

  layerPieces.forEach((piece) => {
    const baseBox = getPieceBoundingBox(piece);
    const pieceThickness = baseBox.max.y - baseBox.min.y;

    placedWithBoxes.forEach(({ piece: placedPiece, box: placedBox }) => {
      if (!boxesOverlapInPlan(baseBox, placedBox)) {
        return;
      }

      // La peça de sota no arriba a la zona on pot baixar la de sobre
      if (placedBox.max.y <= baseBox.min.y + settledOffset - LAYER_SETTLE_CLEARANCE_MM) {
        return;
      }

      const collidesAt = (offset) => {
        const testOffset = offset - LAYER_SETTLE_CLEARANCE_MM;
        const shifted = shiftBox(baseBox, testOffset);

        return (
          shifted.min.y < placedBox.max.y &&
          shifted.max.y > placedBox.min.y &&
          arePiecesPreciselyColliding(
            getPieceZOffsetCopy(piece, testOffset),
            placedPiece
          )
        );
      };

      const thickness = Math.min(
        pieceThickness,
        placedBox.max.y - placedBox.min.y
      );
      const step = Math.max(
        0.25,
        Math.min(MAX_SETTLE_STEP_MM, thickness / 2)
      );

      let freeOffset = startOffset;

      while (freeOffset > settledOffset) {
        const nextOffset = Math.max(settledOffset, freeOffset - step);

        if (collidesAt(nextOffset)) {
          // Contacte entre nextOffset i freeOffset: s'afina
          let low = nextOffset;
          let high = freeOffset;

          for (let iteration = 0; iteration < SETTLE_REFINE_ITERATIONS; iteration += 1) {
            const middle = (low + high) / 2;

            if (collidesAt(middle)) {
              low = middle;
            } else {
              high = middle;
            }
          }

          settledOffset = Math.max(settledOffset, high);
          return;
        }

        freeOffset = nextOffset;
      }
    });
  });

  return settledOffset;
}

function getPieceTopZ(piece) {
  return getPieceVerticalBounds(piece).maximumZ;
}

export function buildPalletizingLayers(
  sequence,
  savedLayers
) {
  const safeSequence =
    Array.isArray(sequence)
      ? sequence
      : [];

  const safeSavedLayers =
    Array.isArray(savedLayers)
      ? savedLayers
      : [];

  const layerMap = new Map(
    safeSavedLayers.map(
      (layer) => [
        layer.id,
        layer
      ]
    )
  );

  // Peces ja col·locades (amb la seva Z final) i capa anterior
  const placedPieces = [];
  let stackTopZ = 0;
  let previousLayerPieces = null;

  return safeSequence.flatMap(
    (
      sequenceItem,
      sequenceIndex
    ) => {
      const sourceLayer =
        layerMap.get(
          sequenceItem.sourceLayerId
        );

      if (!sourceLayer) {
        return [];
      }

      const bounds =
        getLayerVerticalBounds(
          sourceLayer
        );

      const sourcePieces =
        Array.isArray(
          sourceLayer.pieces
        )
          ? sourceLayer.pieces
          : [];

      // Sobre de tota la pila, amb la separació (sempre lliure): punt de partida
      const startOffset =
        stackTopZ -
        bounds.minimumZ +
        (placedPieces.length > 0 ? LAYER_SETTLE_CLEARANCE_MM : 0);

      // Límits: el palet i la cara superior més baixa de la capa anterior
      const lowestPreviousTopZ = previousLayerPieces?.length
        ? Math.min(...previousLayerPieces.map(getPieceTopZ))
        : 0;
      const minOffset =
        Math.max(0, lowestPreviousTopZ) - bounds.minimumZ;

      const verticalOffset = getSettledOffset(
        sourcePieces,
        placedPieces,
        startOffset,
        minOffset
      );

      const baseZ = bounds.minimumZ + verticalOffset;

      const layerNumber =
        sequenceIndex + 1;

      const layerInstance = {
        instanceId:
          sequenceItem.instanceId,

        sourceLayerId:
          sourceLayer.id,

        name:
          sourceLayer.name,

        layerNumber,

        baseZ,

        height:
          bounds.height,

        topZ:
          baseZ +
          bounds.height,

        pieces:
          sourcePieces.map(
            (piece) => ({
              ...piece,

              id:
                `${sequenceItem.instanceId}-${piece.id}`,

              sourcePieceId:
                piece.id,

              sourceLayerId:
                sourceLayer.id,

              palletizingInstanceId:
                sequenceItem.instanceId,

              palletizingLayerNumber:
                layerNumber,

              z:
                (Number(piece.z) || 0) +
                verticalOffset
            })
          )
      };

      placedPieces.push(...layerInstance.pieces);
      previousLayerPieces = layerInstance.pieces;
      stackTopZ = Math.max(stackTopZ, layerInstance.topZ);

      return [layerInstance];
    }
  );
}
