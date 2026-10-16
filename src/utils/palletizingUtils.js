import * as THREE from "three";
import {
  getPieceLocalVertices
} from "./pieceGeometry";
import {
  palletEulerToThreeQuaternion
} from "./pieceUtils";

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

  let accumulatedHeight = 0;

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

      const verticalOffset =
        accumulatedHeight -
        bounds.minimumZ;

      const layerNumber =
        sequenceIndex + 1;

      const sourcePieces =
        Array.isArray(
          sourceLayer.pieces
        )
          ? sourceLayer.pieces
          : [];

      const layerInstance = {
        instanceId:
          sequenceItem.instanceId,

        sourceLayerId:
          sourceLayer.id,

        name:
          sourceLayer.name,

        layerNumber,

        baseZ:
          accumulatedHeight,

        height:
          bounds.height,

        topZ:
          accumulatedHeight +
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

      accumulatedHeight +=
        bounds.height;

      return [layerInstance];
    }
  );
}
