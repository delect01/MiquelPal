import { useCallback, useEffect, useRef, useState } from "react";
import { getDefaultPallet } from "../utils/palletGeometry.js";
import {
  loadAutosave,
  saveAutosave,
  clearAutosave
} from "../utils/autosaveStorage.js";
import {
  areGripperOffsetsEqual,
  createEmptyGripperOffsets
} from "../utils/appModelUtils.js";

/*
  Una còpia de recuperació val la pena oferir-la si
  conté qualsevol dada de l'usuari, no només peces:
  capes, seqüència de paletitzat, configuracions de
  cinta, pinça, palet, mode o offsets de capa.
*/
function hasRecoverableData(savedData) {
  const hasItems = (value) => Array.isArray(value) && value.length > 0;

  const hasDifferentPallet =
    savedData.activePallet &&
    JSON.stringify(savedData.activePallet) !==
      JSON.stringify(getDefaultPallet());

  const hasLayerGripperOffsets =
    savedData.layerGripperOffsets &&
    !areGripperOffsetsEqual(
      savedData.layerGripperOffsets,
      createEmptyGripperOffsets()
    );

  return Boolean(
    hasItems(savedData.pieces) ||
      hasItems(savedData.layers) ||
      hasItems(savedData.palletizingSequence) ||
      hasItems(savedData.conveyorConfigurations) ||
      savedData.activeGripper ||
      hasDifferentPallet ||
      savedData.operationMode === "depalletizing" ||
      hasLayerGripperOffsets
  );
}

/*
  Còpia de recuperació automàtica:

  1. En obrir l'aplicació, ofereix recuperar la
     sessió anterior si en queda una.
  2. Cada canvi físic de la composició es desa.
  3. Abans de tancar la pàgina es fa un últim
     guardat.

  Els punts 2 i 3 desen exactament les mateixes dades
  (getAutosaveData), així cap camp es pot perdre en
  tancar la pàgina.
*/
export default function useAutosave({
  projectDocument,
  selectedPieceId,
  onRecover,
  t
}) {
  const {
    pieces,
    activePallet,
    activeGripper,
    operationMode,
    conveyorConfigurations,
    layers,
    activeLayerId,
    layerGripperOffsets,
    palletizingSequence,
    activeProject,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    suppressNextChangeDetectionRef
  } = projectDocument;

  const [
    hasHandledAutosaveRecovery,
    setHasHandledAutosaveRecovery
  ] = useState(false);

  const hasCompletedInitialRender = useRef(false);

  // L'últim autodesat ha fallat: la còpia de recuperació no està al dia
  const [autosaveFailed, setAutosaveFailed] = useState(false);

  const getAutosaveData = useCallback(
    () => ({
      pieces,
      activePallet,
      activeGripper,
      operationMode,
      conveyorConfigurations,
      layers,
      activeLayerId,
      layerGripperOffsets,
      palletizingSequence,
      selectedPieceId,
      activeProject
    }),
    [
      pieces,
      activePallet,
      activeGripper,
      operationMode,
      conveyorConfigurations,
      layers,
      activeLayerId,
      layerGripperOffsets,
      palletizingSequence,
      selectedPieceId,
      activeProject
    ]
  );

  // 1. Només una vegada, en obrir l'aplicació
  useEffect(() => {
    const savedData = loadAutosave();

    if (!savedData) {
      setHasHandledAutosaveRecovery(true);
      return;
    }

    if (!hasRecoverableData(savedData)) {
      clearAutosave();
      setHasHandledAutosaveRecovery(true);
      return;
    }

    /*
      La marca es posa ABANS d'obrir el confirm, així
      una segona execució de l'efecte (StrictMode) no
      pot obrir un altre popup. En recarregar la pàgina
      es crea un window nou i la marca es reinicia.
    */
    if (window.__palletAutosaveRecoveryPromptHandled === true) {
      setHasHandledAutosaveRecovery(true);
      return;
    }

    window.__palletAutosaveRecoveryPromptHandled = true;

    if (window.confirm(t.project.previousSession)) {
      onRecover(savedData);
    } else {
      clearAutosave();
    }

    setHasHandledAutosaveRecovery(true);
  }, []);

  // 2. Desa cada canvi de la composició
  useEffect(() => {
    if (!hasHandledAutosaveRecovery) {
      return;
    }

    // La primera execució no és un canvi de l'usuari
    if (!hasCompletedInitialRender.current) {
      hasCompletedInitialRender.current = true;
      return;
    }

    // Obrir o crear un projecte tampoc ho és
    if (suppressNextChangeDetectionRef.current) {
      suppressNextChangeDetectionRef.current = false;
      return;
    }

    setHasUnsavedChanges(true);

    // Si no es pot desar (p. ex. emmagatzematge ple), s'avisa a la vista
    setAutosaveFailed(!saveAutosave(getAutosaveData()));

    /*
      La selecció i el nom del projecte es desen,
      però per si sols no compten com a canvi.

      hasHandledAutosaveRecovery fa que la primera
      execució (la que s'ignora) passi just en acabar la
      comprovació inicial, i no amb el primer canvi real
      de l'usuari, que abans es perdia.
    */
  }, [
    hasHandledAutosaveRecovery,
    pieces,
    activePallet,
    activeGripper,
    operationMode,
    conveyorConfigurations,
    layers,
    activeLayerId,
    layerGripperOffsets,
    palletizingSequence
  ]);

  // 3. Últim guardat abans de tancar o recarregar
  useEffect(() => {
    function handleBeforeUnload() {
      if (hasUnsavedChanges) {
        saveAutosave(getAutosaveData());
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  }, [getAutosaveData, hasUnsavedChanges]);

  return { autosaveFailed };
}
