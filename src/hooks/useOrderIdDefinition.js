import { useState } from "react";
import {
  getNextOrderId,
  getOperationOrderId,
  hasValidOrderId,
  reverseOperationOrderIds
} from "../utils/orderIdUtils.js";
import {
  getGraspGroupId,
  getOperations
} from "../utils/graspGroups.js";

/*
  "Definir ID's": les peces reben l'orderId segons
  l'ordre en què es clica cadascuna (1, 2, 3...).

  Si totes ja tenen ID, primer es demana confirmació
  i s'esborren. El mode acaba sol quan totes en tenen,
  o amb Esc / tornant a prémer el botó.
*/
export default function useOrderIdDefinition({
  pieces,
  setPieces,
  onStart,
  openConfirmDialog,
  t
}) {
  const [isDefiningOrderIds, setIsDefiningOrderIds] =
    useState(false);

  // Es compten operacions: una agafada múltiple és un sol clic
  const operations = getOperations(pieces);
  const operationCount = operations.length;
  const definedCount = operations.filter(
    (operation) => getOperationOrderId(operation) !== null
  ).length;
  const allPiecesDefined =
    operationCount > 0 && definedCount === operationCount;

  // Última peça clicada: ja estan totes ordenades
  if (isDefiningOrderIds && allPiecesDefined) {
    setIsDefiningOrderIds(false);
  }

  function beginDefinition() {
    onStart();
    setIsDefiningOrderIds(true);
  }

  function startDefiningOrderIds() {
    if (pieces.length === 0) {
      return;
    }

    if (!allPiecesDefined) {
      beginDefinition();
      return;
    }

    openConfirmDialog({
      title: t.layer.defineIdsTitle,
      message: t.layer.defineIdsWarning,
      confirmLabel: t.layer.defineIdsConfirm,
      cancelLabel: t.common.cancel,
      destructive: true,
      secondaryLabel: t.layer.defineIdsReverse,
      onSecondary: reverseOrderIds,
      onConfirm: () => {
        setPieces((currentPieces) =>
          currentPieces.map((piece) => ({
            ...piece,
            orderId: null
          }))
        );

        beginDefinition();
      }
    });
  }

  /*
    Inverteix l'ordre (útil per despaletitzar): la
    primera peça rep l'ID de l'última i a l'inrevés,
    mantenint els mateixos valors d'ID.
  */
  function reverseOrderIds() {
    setPieces(reverseOperationOrderIds);
  }

  function stopDefiningOrderIds() {
    setIsDefiningOrderIds(false);
  }

  function toggleDefiningOrderIds() {
    if (isDefiningOrderIds) {
      stopDefiningOrderIds();
      return;
    }

    startDefiningOrderIds();
  }

  /*
    Clic sobre una peça sense ID: rep el número següent.
    Si és d'una agafada múltiple, el rep tot el grup.
  */
  function assignNextOrderId(pieceId) {
    setPieces((currentPieces) => {
      const piece = currentPieces.find(
        (currentPiece) => currentPiece.id === pieceId
      );

      if (!piece || hasValidOrderId(piece)) {
        return currentPieces;
      }

      const groupId = getGraspGroupId(piece);
      const nextOrderId = getNextOrderId(currentPieces);

      return currentPieces.map((currentPiece) =>
        currentPiece.id === pieceId ||
        (groupId !== null && getGraspGroupId(currentPiece) === groupId)
          ? { ...currentPiece, orderId: nextOrderId }
          : currentPiece
      );
    });
  }

  return {
    isDefiningOrderIds,
    definedCount,
    operationCount,
    toggleDefiningOrderIds,
    stopDefiningOrderIds,
    assignNextOrderId
  };
}
