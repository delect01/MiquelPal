import { useEffect } from "react";
import { moveSelectionWithKeyboard } from "../utils/keyboardMovement.js";

function isWritingInField() {
  const activeElement = document.activeElement;

  return (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement instanceof HTMLSelectElement ||
    activeElement?.isContentEditable === true
  );
}

function isModalDialogOpen() {
  return Boolean(
    document.querySelector(
      '[role="dialog"][aria-modal="true"]'
    )
  );
}

/*
  Dreceres de teclat globals:

  Ctrl+Z / Ctrl+Y (o Ctrl+Shift+Z): desfer / refer
  Fletxes: moure la selecció
  Ctrl+A: seleccionar-ho tot
  Escape: cancel·lar el rectangle o la selecció
  Supr: eliminar la selecció
*/
export default function useKeyboardShortcuts({
  activeConfigurator,
  pieces,
  setPieces,
  undoPieces,
  redoPieces,
  selectedPieceIds,
  applyPieceSelection,
  clearPieceSelection,
  deleteSelectedPieces,
  selectedPalletizingInstanceId,
  setSelectedPalletizingInstanceId,
  deletePalletizingLayer,
  hasActiveSelectionRectangle,
  cancelSelectionRectangle,
  isSimulating,
  stopSimulation,
  isDefiningOrderIds,
  stopDefiningOrderIds
}) {
  useEffect(() => {
    function handlePalletizingKey(event) {
      if (selectedPalletizingInstanceId === null) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedPalletizingInstanceId(null);
        return;
      }

      if (event.key === "Delete") {
        event.preventDefault();
        deletePalletizingLayer(selectedPalletizingInstanceId);
      }
    }

    function handleGlobalKeyDown(event) {
      if (isWritingInField() || isModalDialogOpen()) {
        return;
      }

      // Esc surt de la simulació sense tocar la selecció
      if (event.key === "Escape" && isSimulating) {
        event.preventDefault();
        stopSimulation();
        return;
      }

      // Esc acaba la definició d'ID's (els ja assignats es queden)
      if (event.key === "Escape" && isDefiningOrderIds) {
        event.preventDefault();
        stopDefiningOrderIds();
        return;
      }

      const pressedKey = event.key.toLowerCase();

      if (
        event.ctrlKey &&
        !event.shiftKey &&
        pressedKey === "z"
      ) {
        event.preventDefault();
        undoPieces();
        return;
      }

      if (
        event.ctrlKey &&
        (pressedKey === "y" ||
          (event.shiftKey && pressedKey === "z"))
      ) {
        event.preventDefault();
        redoPieces();
        return;
      }

      if (
        moveSelectionWithKeyboard({
          event,
          selectedPieceIds,
          setPieces
        })
      ) {
        return;
      }

      if (
        event.ctrlKey &&
        pressedKey === "a" &&
        activeConfigurator !== "palletizing"
      ) {
        event.preventDefault();
        applyPieceSelection(
          pieces.map((piece) => piece.id)
        );
        return;
      }

      if (activeConfigurator === "palletizing") {
        handlePalletizingKey(event);
        return;
      }

      if (event.key === "Escape") {
        if (hasActiveSelectionRectangle()) {
          event.preventDefault();
          cancelSelectionRectangle();
          return;
        }

        if (selectedPieceIds.length > 0) {
          event.preventDefault();
          clearPieceSelection();
        }

        return;
      }

      // Els orderId restants es renumeren sols
      if (
        event.key === "Delete" &&
        selectedPieceIds.length > 0
      ) {
        event.preventDefault();
        deleteSelectedPieces();
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleGlobalKeyDown
      );
    };
  }, [
    activeConfigurator,
    pieces,
    selectedPieceIds,
    selectedPalletizingInstanceId,
    undoPieces,
    redoPieces,
    setPieces,
    isSimulating,
    isDefiningOrderIds
  ]);
}
