import { useEffect, useRef, useState } from "react";
import { getPieceIdsInsideRectangle } from "../utils/multiSelection.js";

/*
  Selecció per rectangle sobre el canvas.

  S'inicia amb Ctrl + arrossegar, o arrossegant
  després d'un doble clic al fons.
*/
export default function useRectangleSelection({
  pieces,
  activeConfigurator,
  applyPieceSelection,
  cancelPieceReplication,
  setIsDragging,
  sceneCameraRef,
  canvasElementRef
}) {
  const [selectionRectangle, setSelectionRectangle] =
    useState(null);
  const [
    isRectangleSelectionArmed,
    setIsRectangleSelectionArmed
  ] = useState(false);

  /*
    Valor actual per als listeners de window.
  */
  const selectionRectangleRef = useRef(null);

  function updateSelectionRectangle(nextRectangle) {
    selectionRectangleRef.current = nextRectangle;
    setSelectionRectangle(nextRectangle);
  }

  function hasActiveSelectionRectangle() {
    return selectionRectangleRef.current !== null;
  }

  // Escape: cancel·la el rectangle en curs
  function cancelSelectionRectangle() {
    updateSelectionRectangle(null);
    setIsDragging(false);
  }

  // Canvi de configurador: oblida qualsevol rectangle
  function resetSelectionRectangle() {
    updateSelectionRectangle(null);
    setIsRectangleSelectionArmed(false);
  }

  function startRectangleSelection(clientX, clientY) {
    cancelPieceReplication();

    updateSelectionRectangle({
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY
    });

    setIsDragging(true);
  }

  function getNativeEvent(event) {
    return event.nativeEvent ?? event.sourceEvent ?? event;
  }

  function handleCanvasPointerDown(event) {
    if (activeConfigurator === "palletizing") {
      return;
    }

    const nativeEvent = getNativeEvent(event);

    // Només el botó esquerre selecciona (dret i roda: càmera)
    if (nativeEvent.button !== undefined && nativeEvent.button !== 0) {
      return;
    }

    /*
      Si el clic ha començat sobre una peça,
      DraggablePiece ja ha gestionat la selecció.
    */
    if (nativeEvent.piecePointerHandled === true) {
      return;
    }

    /*
      Sense Ctrl ni doble clic previ, el botó
      esquerre sobre el fons no fa res (la càmera es
      mou amb el botó dret i la roda).
    */
    if (
      !nativeEvent.ctrlKey &&
      !isRectangleSelectionArmed
    ) {
      return;
    }

    nativeEvent.preventDefault();
    setIsRectangleSelectionArmed(false);
    startRectangleSelection(
      nativeEvent.clientX,
      nativeEvent.clientY
    );
  }

  function handleCanvasDoubleClick(event) {
    if (activeConfigurator === "palletizing") {
      return;
    }

    if (
      getNativeEvent(event).piecePointerHandled === true
    ) {
      return;
    }

    setIsRectangleSelectionArmed(true);
  }

  useEffect(() => {
    function handlePointerMove(event) {
      const currentRectangle =
        selectionRectangleRef.current;

      if (!currentRectangle) {
        return;
      }

      updateSelectionRectangle({
        ...currentRectangle,
        currentX: event.clientX,
        currentY: event.clientY
      });
    }

    function handlePointerUp() {
      const currentRectangle =
        selectionRectangleRef.current;

      if (!currentRectangle) {
        return;
      }

      const width = Math.abs(
        currentRectangle.currentX - currentRectangle.startX
      );
      const height = Math.abs(
        currentRectangle.currentY - currentRectangle.startY
      );

      // Un clic sense moviment no selecciona res
      if (width >= 4 || height >= 4) {
        applyPieceSelection(
          getPieceIdsInsideRectangle({
            pieces,
            rectangle: currentRectangle,
            camera: sceneCameraRef.current,
            canvasElement: canvasElementRef.current
          })
        );
      }

      updateSelectionRectangle(null);
      setIsDragging(false);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );
      window.removeEventListener(
        "pointerup",
        handlePointerUp
      );
    };
  }, [pieces]);

  return {
    selectionRectangle,
    hasActiveSelectionRectangle,
    cancelSelectionRectangle,
    resetSelectionRectangle,
    handleCanvasPointerDown,
    handleCanvasDoubleClick
  };
}
