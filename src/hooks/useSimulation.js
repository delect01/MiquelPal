import { useState } from "react";

const MAX_SPEED = 10;

function isSameSimulation(current, next) {
  if (!current || current.kind !== next.kind) {
    return false;
  }

  return next.kind === "layer"
    ? current.layerId === next.layerId
    : current.pieceId === next.pieceId &&
        current.mode === next.mode;
}

/*
  Simulacions visuals del moviment de la pinça:

  - { kind: "offset", pieceId, mode }: aproximació o
    allunyament de la peça seleccionada.
  - { kind: "layer", layerId }: tota una capa desada,
    peça per peça.

  No modifiquen cap peça. S'aturen amb Esc, en
  canviar la selecció o en canviar de configurador.
*/
export default function useSimulation({
  selectedPieceId,
  activeConfigurator
}) {
  const [simulation, setSimulation] = useState(null);

  const [previousContext, setPreviousContext] = useState({
    selectedPieceId,
    activeConfigurator
  });

  if (
    previousContext.selectedPieceId !== selectedPieceId ||
    previousContext.activeConfigurator !== activeConfigurator
  ) {
    setPreviousContext({ selectedPieceId, activeConfigurator });
    setSimulation(null);
  }

  /*
    Prémer ▶ d'una simulació que ja està en marxa
    l'accelera (×2, ×3... fins a ×10) sense reiniciar-la;
    a ×10, el següent clic torna a ×1.
    Qualsevol altra ▶ en comença una de nova a ×1.
  */
  function start(nextSimulation) {
    setSimulation((current) => {
      if (isSameSimulation(current, nextSimulation)) {
        return {
          ...current,
          speed: current.speed >= MAX_SPEED ? 1 : current.speed + 1
        };
      }

      return {
        ...nextSimulation,
        speed: 1,
        runId: (current?.runId ?? 0) + 1
      };
    });
  }

  function startOffsetSimulation(mode) {
    if (selectedPieceId === null) {
      return;
    }

    start({ kind: "offset", pieceId: selectedPieceId, mode });
  }

  function startLayerSimulation(layerId) {
    start({ kind: "layer", layerId });
  }

  function stopSimulation() {
    setSimulation(null);
  }

  return {
    offsetSimulation:
      simulation?.kind === "offset" ? simulation : null,
    layerSimulation:
      simulation?.kind === "layer" ? simulation : null,
    isSimulating: simulation !== null,
    simulationSpeed: simulation?.speed ?? 1,
    startOffsetSimulation,
    startLayerSimulation,
    stopSimulation
  };
}
