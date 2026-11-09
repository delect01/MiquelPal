import { useRef, useState } from "react";
import { buildReplicationCandidates } from "../utils/pieceReplication.js";
import {
  isPieceCollidingWithPallet,
  isPieceCollidingWithPiece
} from "../utils/collision.js";
import { getNextOrderId } from "../utils/orderIdUtils.js";
import { getNextPieceId } from "../utils/pieceFactory.js";

/*
  Replicació d'una peça arrossegant: mostra una
  previsualització de les còpies i les crea en
  deixar anar.
*/
export default function usePieceReplication({
  pieces,
  setPieces,
  activePallet,
  duplicateSpacing
}) {
  const [replicationPreview, setReplicationPreview] =
    useState(null);

  /*
    Els esdeveniments del punter necessiten el valor
    actual sense esperar el següent render.
  */
  const replicationPreviewRef = useRef(null);

  function updateReplicationPreview(nextPreview) {
    replicationPreviewRef.current = nextPreview;
    setReplicationPreview(nextPreview);
  }

  function startPieceReplication(
    pieceId,
    startThreeX,
    startThreeZ
  ) {
    const sourcePiece = pieces.find(
      (piece) => piece.id === pieceId
    );

    if (
      !sourcePiece ||
      sourcePiece.pieceCategory === "SEPARATOR"
    ) {
      return;
    }

    updateReplicationPreview({
      sourcePieceId: pieceId,
      startThreeX,
      startThreeZ,
      currentThreeX: startThreeX,
      currentThreeZ: startThreeZ,
      candidates: []
    });
  }

  function movePieceReplication(
    currentThreeX,
    currentThreeZ
  ) {
    const currentPreview = replicationPreviewRef.current;

    if (!currentPreview) {
      return;
    }

    const sourcePiece = pieces.find(
      (piece) => piece.id === currentPreview.sourcePieceId
    );

    if (!sourcePiece) {
      updateReplicationPreview(null);
      return;
    }

    const rawCandidates = buildReplicationCandidates({
      sourcePiece,
      startThreeX: currentPreview.startThreeX,
      startThreeZ: currentPreview.startThreeZ,
      currentThreeX,
      currentThreeZ,
      // Separació entre còpies (0 = enganxades)
      spacing: duplicateSpacing
    });

    const candidates = rawCandidates.map(
      (candidate, candidateIndex) => {
        const collidesWithExistingPiece = pieces.some(
          (existingPiece) =>
            isPieceCollidingWithPiece(
              candidate.piece,
              existingPiece
            )
        );

        const collidesWithPreviewPiece =
          rawCandidates.some(
            (otherCandidate, otherIndex) =>
              otherIndex !== candidateIndex &&
              isPieceCollidingWithPiece(
                candidate.piece,
                otherCandidate.piece
              )
          );

        const collidesWithPallet =
          isPieceCollidingWithPallet(
            candidate.piece,
            activePallet
          );

        return {
          ...candidate,
          colliding:
            collidesWithExistingPiece ||
            collidesWithPreviewPiece ||
            collidesWithPallet
        };
      }
    );

    updateReplicationPreview({
      ...currentPreview,
      currentThreeX,
      currentThreeZ,
      candidates
    });
  }

  function finishPieceReplication() {
    const currentPreview = replicationPreviewRef.current;

    if (
      !currentPreview ||
      currentPreview.candidates.length === 0
    ) {
      updateReplicationPreview(null);
      return;
    }

    setPieces((currentPieces) => {
      let nextId = getNextPieceId(currentPieces);
      let nextOrderId = getNextOrderId(currentPieces);

      const definitiveCopies =
        currentPreview.candidates.map((candidate) => {
          const definitivePiece = {
            ...candidate.piece,
            id: nextId,
            orderId: nextOrderId
          };

          nextId += 1;
          nextOrderId += 1;

          return definitivePiece;
        });

      return [...currentPieces, ...definitiveCopies];
    });

    updateReplicationPreview(null);
  }

  function cancelPieceReplication() {
    updateReplicationPreview(null);
  }

  return {
    replicationPreview,
    startPieceReplication,
    movePieceReplication,
    finishPieceReplication,
    cancelPieceReplication
  };
}
