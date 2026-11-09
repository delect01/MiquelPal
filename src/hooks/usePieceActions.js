import { roundToThreeDecimals } from "../utils/appModelUtils.js";
import {
  getNextOrderId,
  normalizeOrderIdsAfterDeletion
} from "../utils/orderIdUtils.js";
import { cleanupGraspGroups } from "../utils/graspGroups.js";
import {
  getNextPieceId,
  createPieceFromDefinition,
  createSeparatorFromDefinition,
  createDuplicatedPiece
} from "../utils/pieceFactory.js";
import { getDuplicateOffsetX } from "../utils/pieceReplication.js";

/*
  Crear, duplicar, moure i eliminar peces i
  separadors.
*/
export default function usePieceActions({
  pieces,
  setPieces,
  selectedData,
  selectedPieceIds,
  applyPieceSelection,
  clearPieceSelection,
  duplicateSpacing
}) {
  function addPiece(newPiece) {
    setPieces((currentPieces) => [
      ...currentPieces,
      newPiece
    ]);

    applyPieceSelection([newPiece.id]);
  }

  function createPiece(pieceDefinition) {
    addPiece(
      createPieceFromDefinition(
        pieceDefinition,
        getNextPieceId(pieces),
        getNextOrderId(pieces)
      )
    );
  }

  function createSeparator(separatorDefinition) {
    addPiece(
      createSeparatorFromDefinition(
        separatorDefinition,
        getNextPieceId(pieces),
        getNextOrderId(pieces)
      )
    );
  }

  // Canvis des del diàleg d'edició
  function updatePiece(pieceId, changes) {
    setPieces((currentPieces) =>
      currentPieces.map((piece) =>
        piece.id === pieceId ? { ...piece, ...changes } : piece
      )
    );
  }

  function duplicatePiece() {
    if (!selectedData) {
      return;
    }

    // Al costat de la peça (+X), a la distància de duplicació
    addPiece(
      createDuplicatedPiece(
        selectedData,
        getNextPieceId(pieces),
        getNextOrderId(pieces),
        getDuplicateOffsetX(selectedData, duplicateSpacing)
      )
    );
  }

  /*
    Elimina la selecció i renumera els orderId
    restants.
  */
  function deleteSelectedPieces() {
    if (selectedPieceIds.length === 0) {
      return;
    }

    const selectedIdSet = new Set(selectedPieceIds);

    setPieces((currentPieces) =>
      normalizeOrderIdsAfterDeletion(
        // Les agafades que es queden amb una sola peça es desfan
        cleanupGraspGroups(
          currentPieces.filter(
            (piece) => !selectedIdSet.has(piece.id)
          )
        )
      )
    );

    clearPieceSelection();
  }

  function moveSelectedPieces(deltaX, deltaY) {
    const moveX = Number(deltaX);
    const moveY = Number(deltaY);

    if (
      !Number.isFinite(moveX) ||
      !Number.isFinite(moveY)
    ) {
      return;
    }

    const selectedIdSet = new Set(selectedPieceIds);

    setPieces((currentPieces) =>
      currentPieces.map((piece) =>
        selectedIdSet.has(piece.id)
          ? {
              ...piece,
              x: roundToThreeDecimals(piece.x + moveX),
              y: roundToThreeDecimals(piece.y + moveY)
            }
          : piece
      )
    );
  }

  return {
    createPiece,
    createSeparator,
    updatePiece,
    duplicatePiece,
    deleteSelectedPieces,
    moveSelectedPieces
  };
}
