import { useState } from "react";
import { normalizeGripperOffsets } from "../utils/appModelUtils.js";

function toOffsetValue(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

/*
  Offsets d'aproximació i retirada de la pinça.

  La capa té uns offsets genèrics; cada peça pot
  tenir-ne uns de propis que els substitueixen.

  Els genèrics formen part del document del projecte
  (layerGripperOffsets): es desen, s'obren i es
  recuperen amb la resta de dades.
*/
export default function useGripperOffsets({
  projectDocument,
  setPieces,
  selectedData,
  setIsGripperVisible
}) {
  const {
    layerGripperOffsets: currentLayerGripperOffsets,
    setLayerGripperOffsets: setCurrentLayerGripperOffsets
  } = projectDocument;

  const [showGripperOffsets, setShowGripperOffsets] =
    useState(false);
  const [
    gripperOffsetPreviewMode,
    setGripperOffsetPreviewMode
  ] = useState(null);
  const [previewTargetId, setPreviewTargetId] = useState(
    selectedData?.id ?? null
  );

  /*
    La vista d'offset és només per a la peça on s'ha
    activat: si canvia la selecció, la pinça torna a la
    posició final de la peça.
  */
  const targetId = selectedData?.id ?? null;

  if (targetId !== previewTargetId) {
    setPreviewTargetId(targetId);
    setGripperOffsetPreviewMode(null);
  }

  const effectiveGripperOffsets =
    selectedData?.gripperOffsets ??
    currentLayerGripperOffsets;

  const activeGripperOffsetPreview =
    gripperOffsetPreviewMode
      ? effectiveGripperOffsets[gripperOffsetPreviewMode] ??
        null
      : null;

  // Tancar el panell també apaga la vista d'offset
  function toggleGripperOffsets() {
    if (showGripperOffsets) {
      setGripperOffsetPreviewMode(null);
    }

    setShowGripperOffsets(!showGripperOffsets);
  }

  function resetGripperOffsetPreview() {
    setGripperOffsetPreviewMode(null);
  }

  function updateGenericGripperOffset(
    offsetType,
    axis,
    value
  ) {
    setCurrentLayerGripperOffsets((currentOffsets) => ({
      ...currentOffsets,
      [offsetType]: {
        ...currentOffsets[offsetType],
        [axis]: toOffsetValue(value)
      }
    }));
  }

  function updatePieceGripperOffset(
    pieceId,
    offsetType,
    axis,
    value
  ) {
    setPieces((currentPieces) =>
      currentPieces.map((piece) => {
        if (piece.id !== pieceId) {
          return piece;
        }

        const baseOffsets =
          piece.gripperOffsets ??
          currentLayerGripperOffsets;

        return {
          ...piece,
          gripperOffsets: {
            approach: { ...baseOffsets.approach },
            retreat: { ...baseOffsets.retreat },
            [offsetType]: {
              ...baseOffsets[offsetType],
              [axis]: toOffsetValue(value)
            }
          }
        };
      })
    );
  }

  // La peça torna a fer servir els offsets de la capa
  function clearPieceGripperOffsets(pieceId) {
    setPieces((currentPieces) =>
      currentPieces.map((piece) =>
        piece.id === pieceId
          ? { ...piece, gripperOffsets: null }
          : piece
      )
    );
  }

  function changeGripperOffsetPreviewMode(nextMode) {
    setGripperOffsetPreviewMode(nextMode);

    if (nextMode) {
      setIsGripperVisible(true);
    }
  }

  // En aplicar una capa desada
  function loadLayerGripperOffsets(layer) {
    setCurrentLayerGripperOffsets(
      normalizeGripperOffsets(layer.gripperOffsets)
    );

    setGripperOffsetPreviewMode(null);
  }

  return {
    showGripperOffsets,
    toggleGripperOffsets,
    gripperOffsetPreviewMode,
    currentLayerGripperOffsets,
    activeGripperOffsetPreview,
    updateGenericGripperOffset,
    updatePieceGripperOffset,
    clearPieceGripperOffsets,
    changeGripperOffsetPreviewMode,
    resetGripperOffsetPreview,
    loadLayerGripperOffsets
  };
}
