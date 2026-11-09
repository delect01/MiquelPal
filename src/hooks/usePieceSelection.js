import { useState } from "react";

/*
  Selecció de peces i separadors.

  selectedPieceId només té valor quan hi ha
  exactament un element seleccionat.
*/
export default function usePieceSelection() {
  const [selectedPieceId, setSelectedPieceId] =
    useState(null);
  const [selectedPieceIds, setSelectedPieceIds] =
    useState([]);

  function clearPieceSelection() {
    setSelectedPieceIds([]);
    setSelectedPieceId(null);
  }

  function applyPieceSelection(pieceIds) {
    const uniqueIds = Array.from(new Set(pieceIds));

    setSelectedPieceIds(uniqueIds);
    setSelectedPieceId(
      uniqueIds.length === 1 ? uniqueIds[0] : null
    );
  }

  function selectPiece(pieceId, additive = false) {
    if (!additive) {
      applyPieceSelection([pieceId]);
      return;
    }

    setSelectedPieceIds((currentIds) => {
      const nextIds = currentIds.includes(pieceId)
        ? currentIds.filter(
            (currentId) => currentId !== pieceId
          )
        : [...currentIds, pieceId];

      setSelectedPieceId(
        nextIds.length === 1 ? nextIds[0] : null
      );

      return nextIds;
    });
  }

  return {
    selectedPieceId,
    selectedPieceIds,
    clearPieceSelection,
    applyPieceSelection,
    selectPiece
  };
}
