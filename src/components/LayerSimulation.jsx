import { useState } from "react";
import OffsetSimulation from "./OffsetSimulation.jsx";
import StaticPiece from "./StaticPiece.jsx";
import { getOperations } from "../utils/graspGroups.js";
import { getGraspPose } from "../utils/graspGeometry.js";

// Pauses curtes perquè la seqüència no s'allargui massa
const APPROACH_START_PAUSE_SECONDS = 0.3;
const RETREAT_START_PAUSE_SECONDS = 0.1;

/*
  Simula tota una capa, operació per operació en ordre
  d'ID (una agafada múltiple és una sola operació: totes
  les seves peces es mouen juntes).

  Paletitzat (dipositar):
  1. aproximació: peça i pinça baixen juntes;
  2. allunyament: la pinça se'n va i la peça queda.
  Les peces ja col·locades es veuen; les pendents no.

  Despaletitzat (agafar):
  1. aproximació: la pinça sola va fins a la peça;
  2. allunyament: la pinça se l'emporta.
  Les peces encara no agafades es veuen; les ja
  agafades desapareixen.

  En acabar, la pinça es queda al punt d'allunyament
  de l'última peça fins que es prem Esc.
*/
export default function LayerSimulation({
  pieces,
  gripper,
  getPieceOffsets,
  operationMode = "palletizing",
  speed = 1
}) {
  const [step, setStep] = useState({
    index: 0,
    mode: "approach"
  });

  const isDepalletizing = operationMode === "depalletizing";

  const operations = getOperations(pieces);
  const currentOperation = operations[step.index];
  const currentPiece = currentOperation?.lead;

  // Peces que es veuen quietes al palet
  const restingPieces = (
    isDepalletizing
      ? operations.slice(step.index + 1)
      : operations.slice(0, step.index)
  ).flatMap((operation) => operation.pieces);

  function advance() {
    setStep((current) => {
      if (current.mode === "approach") {
        return { ...current, mode: "retreat" };
      }

      // L'última peça es queda amb la pinça retirada
      if (current.index >= operations.length - 1) {
        return current;
      }

      return { index: current.index + 1, mode: "approach" };
    });
  }

  return (
    <>
      {restingPieces.map((piece) => (
        <StaticPiece
          key={piece.id}
          piece={piece}
          selected={false}
        />
      ))}

      {currentPiece && (
        <OffsetSimulation
          key={`${currentPiece.id}-${step.mode}`}
          piece={currentPiece}
          pieces={currentOperation.pieces}
          pose={getGraspPose(
            currentOperation.pieces,
            currentPiece,
            currentPiece.graspAdjust
          )}
          gripper={gripper}
          offset={getPieceOffsets(currentPiece)[step.mode]}
          mode={step.mode}
          carriesPiece={
            isDepalletizing
              ? step.mode === "retreat"
              : step.mode === "approach"
          }
          speed={speed}
          startPauseSeconds={
            step.mode === "approach"
              ? APPROACH_START_PAUSE_SECONDS
              : RETREAT_START_PAUSE_SECONDS
          }
          onFinished={advance}
        />
      )}
    </>
  );
}
