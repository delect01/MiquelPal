import { useRef } from "react";
import {
  getCompositionCenterOffset,
  getGroupMagneticSnapDelta
} from "../utils/magneticSnap.js";
import { roundToThreeDecimals } from "../utils/appModelUtils.js";
import { threeToPallet } from "../utils/pieceUtils.js";

/*
  Arrossegament d'una peça o de tota la selecció.

  Tot l'arrossegament és una sola transacció de
  l'historial: un Ctrl+Z el desfà sencer.
*/
export default function usePieceDrag({
  pieces,
  setPieces,
  beginPiecesTransaction,
  endPiecesTransaction,
  selectedPieceIds,
  applyPieceSelection,
  setIsDragging,
  activePallet,
  getSnapDistance,
  getSelectionIdsForPiece = (pieceId) => [pieceId]
}) {
  const groupDragRef = useRef(null);

  function startPieceDrag(
    pieceId,
    startThreeX,
    startThreeZ,
    selectionOptions = {}
  ) {
    beginPiecesTransaction();

    const sourcePiece = pieces.find(
      (piece) => piece.id === pieceId
    );

    if (!sourcePiece) {
      endPiecesTransaction();
      return;
    }

    const isSourceSelected =
      selectedPieceIds.includes(pieceId);

    // Una peça d'una agafada múltiple arrossega tot el grup (excepte amb Alt)
    const movingPieceIds = isSourceSelected
      ? selectedPieceIds
      : getSelectionIdsForPiece(pieceId, selectionOptions);

    if (!isSourceSelected) {
      applyPieceSelection(movingPieceIds);
    }

    const initialPositions = new Map(
      pieces
        .filter((piece) =>
          movingPieceIds.includes(piece.id)
        )
        .map((piece) => [
          piece.id,
          {
            x: Number(piece.x) || 0,
            y: Number(piece.y) || 0
          }
        ])
    );

    const startPalletPosition = threeToPallet(
      startThreeX,
      0,
      startThreeZ
    );

    groupDragRef.current = {
      // Distància d'atracció de l'imant segons el zoom actual (mm)
      snapDistance: getSnapDistance?.() ?? 10,
      sourcePieceId: pieceId,
      movingPieceIds,
      initialPositions,
      startPalletX: startPalletPosition.x,
      startPalletY: startPalletPosition.y
    };

    setIsDragging(true);
  }

  // Actualitza la posició durant l'arrossegament
  function movePiece(pieceId, threeX, threeZ) {
    const targetPosition = threeToPallet(threeX, 0, threeZ);
    const dragData = groupDragRef.current;

    if (
      !dragData ||
      dragData.sourcePieceId !== pieceId
    ) {
      setPieces((currentPieces) =>
        currentPieces.map((piece) =>
          piece.id === pieceId
            ? {
                ...piece,
                x: roundToThreeDecimals(targetPosition.x),
                y: roundToThreeDecimals(targetPosition.y)
              }
            : piece
        )
      );

      return;
    }

    const deltaX = targetPosition.x - dragData.startPalletX;
    const deltaY = targetPosition.y - dragData.startPalletY;
    const movingIdSet = new Set(dragData.movingPieceIds);

    setPieces((currentPieces) => {
      // Posició que demana el ratolí, abans de l'imant
      const movedPieces = currentPieces
        .filter((piece) => movingIdSet.has(piece.id))
        .map((piece) => {
          const initialPosition =
            dragData.initialPositions.get(piece.id);

          return initialPosition
            ? {
                ...piece,
                x: initialPosition.x + deltaX,
                y: initialPosition.y + deltaY
              }
            : piece;
        });

      /*
        Imant: tota la selecció es mou com un bloc amb
        el mateix desplaçament (cara amb cara, vores i
        cantonades amb peces veïnes i amb el palet).
      */
      const snap = getGroupMagneticSnapDelta({
        movingPieces: movedPieces,
        leadPieceId: dragData.sourcePieceId,
        allPieces: currentPieces,
        pallet: activePallet,
        snapDistance: dragData.snapDistance
      });

      /*
        Tot el material de la composició es mou junt:
        el centre del conjunt s'atrau al centre del palet
        (cada eix per separat), amb prioritat.
      */
      if (movedPieces.length === currentPieces.length) {
        const centerOffset = getCompositionCenterOffset(
          movedPieces,
          activePallet
        );

        if (centerOffset) {
          if (Math.abs(centerOffset.deltaX) <= dragData.snapDistance) {
            snap.deltaX = centerOffset.deltaX;
          }

          if (Math.abs(centerOffset.deltaY) <= dragData.snapDistance) {
            snap.deltaY = centerOffset.deltaY;
          }
        }
      }

      const movedById = new Map(
        movedPieces.map((piece) => [piece.id, piece])
      );

      return currentPieces.map((piece) => {
        const movedPiece = movedById.get(piece.id);

        if (!movedPiece) {
          return piece;
        }

        return {
          ...movedPiece,
          x: roundToThreeDecimals(movedPiece.x + snap.deltaX),
          y: roundToThreeDecimals(movedPiece.y + snap.deltaY),
          z: roundToThreeDecimals(movedPiece.z)
        };
      });
    });
  }

  function finishPieceDrag() {
    endPiecesTransaction();
    groupDragRef.current = null;
    setIsDragging(false);
  }

  return {
    startPieceDrag,
    movePiece,
    finishPieceDrag
  };
}
