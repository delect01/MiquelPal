import { useEffect, useRef, useState } from "react";
import { getDefaultPallet } from "../utils/palletGeometry.js";
import { getLastGripper, setLastGripper } from "../utils/lastGripper.js";
import useUndoRedoState from "./useUndoRedoState.js";
import { createEmptyGripperOffsets } from "../utils/appModelUtils.js";

/*
  Estat que forma el projecte: és el que es desa,
  s'obre i es recupera de l'autodesat.
*/
export default function useProjectDocument(t) {
  const {
    state: pieces,
    setState: setPieces,
    undo: undoPieces,
    redo: redoPieces,
    beginTransaction: beginPiecesTransaction,
    endTransaction: endPiecesTransaction,
    resetHistory: resetPiecesHistory
  } = useUndoRedoState([], { historyLimit: 100 });

  // En obrir l'aplicació: la plantilla "Palet predeterminat"
  const [activePallet, setActivePallet] = useState(getDefaultPallet);
  // Comença amb la darrera pinça que es feia servir
  const [activeGripper, setActiveGripper] = useState(getLastGripper);

  // Es recorda per al proper projecte nou
  useEffect(() => {
    setLastGripper(activeGripper);
  }, [activeGripper]);

  // "palletizing" (apilar) o "depalletizing" (desapilar)
  const [operationMode, setOperationMode] =
    useState("palletizing");

  // Configuracions de cinta (entitat independent de les peces)
  const [conveyorConfigurations, setConveyorConfigurations] =
    useState([]);

  const [layers, setLayers] = useState([]);
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [layerName, setLayerName] = useState("");

  /*
    Offsets genèrics de pinça de la capa que s'està
    editant. Formen part del document: es desen amb el
    projecte i l'autodesat, encara que la capa no s'hagi
    guardat.
  */
  const [layerGripperOffsets, setLayerGripperOffsets] =
    useState(createEmptyGripperOffsets);

  const [palletizingSequence, setPalletizingSequence] =
    useState([]);
  const [
    selectedPalletizingInstanceId,
    setSelectedPalletizingInstanceId
  ] = useState(null);

  const [activeProject, setActiveProject] = useState(() => ({
    id: null,
    name: t.project.unnamed,
    createdAt: null
  }));
  const [hasUnsavedChanges, setHasUnsavedChanges] =
    useState(false);

  /*
    Crear o obrir un projecte, o aplicar una capa,
    no és una modificació de l'usuari: aquesta marca
    evita que l'autodesat ho compti com a canvi.
  */
  const suppressNextChangeDetectionRef = useRef(false);

  return {
    pieces,
    setPieces,
    undoPieces,
    redoPieces,
    beginPiecesTransaction,
    endPiecesTransaction,
    resetPiecesHistory,
    activePallet,
    setActivePallet,
    activeGripper,
    setActiveGripper,
    operationMode,
    setOperationMode,
    conveyorConfigurations,
    setConveyorConfigurations,
    layers,
    setLayers,
    activeLayerId,
    setActiveLayerId,
    layerName,
    setLayerName,
    layerGripperOffsets,
    setLayerGripperOffsets,
    palletizingSequence,
    setPalletizingSequence,
    selectedPalletizingInstanceId,
    setSelectedPalletizingInstanceId,
    activeProject,
    setActiveProject,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    suppressNextChangeDetectionRef
  };
}
