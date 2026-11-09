import { getDefaultPallet } from "./palletGeometry.js";
import { sanitizeConveyorConfigurations } from "./conveyorConfigurations.js";
import { withoutStoredCollisionGeometry } from "./collisionGeometryStore.js";
import {
  ensureOrderIds,
  cloneLayerPieces,
  normalizeGripperOffsets
} from "./appModelUtils.js";

/*
  Converteix un projecte desat (o una còpia
  d'autodesat) en l'estat que necessita l'editor.

  El fan servir "Obrir projecte" i la recuperació
  de la sessió anterior.
*/
export function restoreProjectState(data) {
  /*
    Els projectes antics porten el volum de col·lisió
    dins de cada peça: es treu (queda compartit en
    memòria per model).
  */
  const pieces = ensureOrderIds(data.pieces).map(
    withoutStoredCollisionGeometry
  );

  const layers = Array.isArray(data.layers)
    ? data.layers.map((layer) => ({
        ...layer,
        pieces: ensureOrderIds(layer.pieces).map(
          withoutStoredCollisionGeometry
        )
      }))
    : [];

  /*
    Només conservem les capes paletitzades que
    encara existeixen.
  */
  const palletizingSequence = Array.isArray(
    data.palletizingSequence
  )
    ? data.palletizingSequence
        .filter((item) =>
          layers.some(
            (layer) => layer.id === item.sourceLayerId
          )
        )
        .map((item) => ({ ...item }))
    : [];

  const activeLayer =
    layers.find(
      (layer) => layer.id === data.activeLayerId
    ) ?? null;

  const selectedPieceId = pieces.some(
    (piece) => piece.id === data.selectedPieceId
  )
    ? data.selectedPieceId
    : null;

  return {
    pieces,
    layers,
    palletizingSequence,
    activeLayer,
    selectedPieceId,
    activePallet: data.activePallet
      ? { ...data.activePallet }
      : getDefaultPallet(),
    activeGripper: data.activeGripper
      ? { ...data.activeGripper }
      : null,
    // Els projectes antics no en tenen: paletitzat
    operationMode:
      data.operationMode === "depalletizing"
        ? "depalletizing"
        : "palletizing",
    // Els projectes antics no en tenen: llista buida
    conveyorConfigurations: sanitizeConveyorConfigurations(
      data.conveyorConfigurations
    ),
    /*
      Offsets genèrics de la capa en edició. Els
      projectes antics no els tenen: es fan servir els de
      la capa activa o, si no n'hi ha, zeros.
    */
    layerGripperOffsets: normalizeGripperOffsets(
      data.layerGripperOffsets ?? activeLayer?.gripperOffsets
    )
  };
}

/*
  Peça tal com es desa:
  - sense la configuració de cinta antiga (ara és a
    conveyorConfigurations);
  - sense el volum de col·lisió (es calcula a partir del
    model 3D; desar-lo omplia l'emmagatzematge).
*/
function withoutConveyorPlacement(piece) {
  const pieceCopy = { ...withoutStoredCollisionGeometry(piece) };
  delete pieceCopy.conveyorPlacement;
  return pieceCopy;
}

/*
  Còpia completa i independent de l'estat actual,
  preparada per guardar-la com a projecte.
*/
export function buildProjectSnapshot({
  id,
  name,
  createdAt,
  pieces,
  activePallet,
  activeGripper,
  operationMode,
  conveyorConfigurations = [],
  layers,
  activeLayerId,
  layerGripperOffsets,
  palletizingSequence,
  selectedPieceId
}) {
  const currentDate = new Date().toISOString();

  return {
    id,
    name,
    createdAt: createdAt ?? currentDate,
    updatedAt: currentDate,
    activePallet: { ...activePallet },
    activeGripper: activeGripper
      ? { ...activeGripper }
      : null,
    operationMode,
    // Objectes plans: còpia profunda independent de l'estat
    conveyorConfigurations: JSON.parse(
      JSON.stringify(conveyorConfigurations)
    ),
    pieces: pieces.map(withoutConveyorPlacement),
    layers: layers.map((layer) => ({
      ...layer,
      pieces: cloneLayerPieces(layer.pieces).map(
        withoutConveyorPlacement
      )
    })),
    activeLayerId,
    layerGripperOffsets: normalizeGripperOffsets(layerGripperOffsets),
    palletizingSequence: palletizingSequence.map(
      (item) => ({ ...item })
    ),
    selectedPieceId
  };
}
