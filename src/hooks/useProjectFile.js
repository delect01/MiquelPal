import { useRef, useState } from "react";
import { getDefaultPallet } from "../utils/palletGeometry.js";
import { getLastGripper } from "../utils/lastGripper.js";
import {
  createProjectId,
  saveProject
} from "../utils/projectStorage.js";
import { clearAutosave } from "../utils/autosaveStorage.js";
import { refreshConveyorConfigurations } from "../utils/conveyorConfigurations.js";
import { loadPieceLibrary } from "../utils/pieceLibrary.js";
import { createEmptyGripperOffsets } from "../utils/appModelUtils.js";
import {
  restoreProjectState,
  buildProjectSnapshot
} from "../utils/projectSnapshot.js";
import {
  BACKUP_FILE_FORMAT,
  createBackupFile,
  createProjectFile,
  downloadJsonFile,
  importBackupFile,
  importProjectFile,
  readTransferFile
} from "../utils/projectTransfer.js";

/*
  Projecte nou, obrir, desar, desar com i
  recuperar la sessió anterior.
*/
export default function useProjectFile({
  projectDocument,
  selectedPieceId,
  applyPieceSelection,
  clearPieceSelection,
  cancelPieceReplication,
  cancelPendingLayerSelection,
  commitCurrentLayer,
  openConfirmDialog,
  t
}) {
  const {
    pieces,
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
    setLayerName,
    layerGripperOffsets,
    setLayerGripperOffsets,
    palletizingSequence,
    setPalletizingSequence,
    setSelectedPalletizingInstanceId,
    activeProject,
    setActiveProject,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    suppressNextChangeDetectionRef
  } = projectDocument;

  const [isOpenProjectDialogOpen, setIsOpenProjectDialogOpen] =
    useState(false);
  const [isSaveProjectDialogOpen, setIsSaveProjectDialogOpen] =
    useState(false);
  const [saveProjectSuggestedName, setSaveProjectSuggestedName] =
    useState("");

  /*
    Evita guardats simultanis si l'usuari prem
    el botó diverses vegades.
  */
  const isSavingProjectRef = useRef(false);

  /*
    Carrega a l'editor un projecte desat o una
    sessió recuperada.
  */
  function loadProjectState(data) {
    const restored = restoreProjectState(data);

    resetPiecesHistory(restored.pieces);

    setLayers(restored.layers);
    setActiveLayerId(restored.activeLayer?.id ?? null);
    setLayerName(restored.activeLayer?.name ?? "");
    setLayerGripperOffsets(restored.layerGripperOffsets);

    setPalletizingSequence(restored.palletizingSequence);
    setSelectedPalletizingInstanceId(null);

    setActivePallet(restored.activePallet);
    setActiveGripper(restored.activeGripper);
    setOperationMode(restored.operationMode);
    setConveyorConfigurations(restored.conveyorConfigurations);

    if (restored.selectedPieceId !== null) {
      applyPieceSelection([restored.selectedPieceId]);
    } else {
      clearPieceSelection();
    }
  }

  function applyOpenedProject(project) {
    suppressNextChangeDetectionRef.current = true;
    cancelPieceReplication();

    loadProjectState(project);

    setActiveProject({
      id: project.id,
      name: project.name,
      createdAt: project.createdAt ?? null
    });

    setHasUnsavedChanges(false);
    clearAutosave();
    setIsOpenProjectDialogOpen(false);
  }

  function applyRecoveredAutosave(autosaveData) {
    loadProjectState(autosaveData);

    const savedProject = autosaveData.activeProject;

    setActiveProject({
      id: savedProject?.id ?? null,
      name: savedProject?.name ?? t.project.recovered,
      createdAt: savedProject?.createdAt ?? null
    });

    // La sessió recuperada encara no està desada
    setHasUnsavedChanges(true);
  }

  // Projecte amb l'estat actual de l'editor
  function buildCurrentSnapshot(
    { id, name, createdAt },
    layerState = { layers, activeLayerId }
  ) {
    return buildProjectSnapshot({
      id,
      name,
      createdAt,
      pieces,
      activePallet,
      activeGripper,
      operationMode,
      // Estat i TCP al dia respecte de la biblioteca de peces
      conveyorConfigurations: refreshConveyorConfigurations(
        conveyorConfigurations,
        loadPieceLibrary()
      ),
      layers: layerState.layers,
      activeLayerId: layerState.activeLayerId,
      layerGripperOffsets,
      palletizingSequence,
      selectedPieceId
    });
  }

  /*
    Escriu el projecte a l'emmagatzematge i el
    marca com a desat. Retorna si ha anat bé.
  */
  function writeProject(
    { id, name, createdAt },
    layerState = { layers, activeLayerId, layerChanged: false }
  ) {
    try {
      const savedProject = saveProject(
        buildCurrentSnapshot({ id, name, createdAt }, layerState)
      );

      if (!savedProject) {
        window.alert(t.project.saveError);
        return false;
      }

      /*
        Desar no canvia cap dada de la composició, per
        tant no es marca suppressNextChangeDetection: si
        es marqués, ningú la consumiria i el primer canvi
        real de l'usuari es perdria (sense "canvis sense
        guardar" ni autodesat).
      */
      setActiveProject({
        id: savedProject.id,
        name: savedProject.name,
        createdAt: savedProject.createdAt
      });

      /*
        Si s'acaba de desar la capa, les capes canvien
        en aquest mateix render: ja estan guardades al
        projecte i no han de comptar com a canvi.
      */
      if (layerState.layerChanged) {
        suppressNextChangeDetectionRef.current = true;
      }

      setHasUnsavedChanges(false);
      clearAutosave();

      return true;
    } catch (error) {
      console.error("Error guardant el projecte:", error);
      window.alert(t.project.saveError);
      return false;
    }
  }

  function saveCurrentProjectAs() {
    if (isSavingProjectRef.current) {
      return;
    }

    // Guardar el projecte també desa la capa en edició
    if (!commitCurrentLayer()) {
      return;
    }

    let suggestedName = activeProject.name;

    if (activeProject.id) {
      suggestedName = `${activeProject.name} ${t.project.copySuffix}`;
    } else if (activeProject.name === t.project.unnamed) {
      suggestedName = "";
    }

    setSaveProjectSuggestedName(suggestedName);
    setIsSaveProjectDialogOpen(true);
  }

  function confirmSaveCurrentProjectAs(projectName) {
    if (isSavingProjectRef.current) {
      return;
    }

    const cleanProjectName = String(projectName ?? "").trim();

    if (!cleanProjectName) {
      window.alert(t.project.saveNameRequired);
      return;
    }

    isSavingProjectRef.current = true;

    // Tanquem el diàleg de seguida per evitar dobles clics
    setIsSaveProjectDialogOpen(false);

    try {
      const saved = writeProject({
        id: createProjectId(),
        name: cleanProjectName,
        createdAt: null
      });

      if (!saved) {
        setIsSaveProjectDialogOpen(true);
      }
    } finally {
      isSavingProjectRef.current = false;
    }
  }

  function cancelSaveProjectAs() {
    if (isSavingProjectRef.current) {
      return;
    }

    setIsSaveProjectDialogOpen(false);
  }

  function saveCurrentProject() {
    if (isSavingProjectRef.current) {
      return;
    }

    // Un projecte mai desat necessita un nom
    if (
      activeProject.id === null ||
      activeProject.id === undefined ||
      activeProject.id === ""
    ) {
      saveCurrentProjectAs();
      return;
    }

    // Guardar el projecte també desa la capa en edició
    const layerState = commitCurrentLayer();

    if (!layerState) {
      return;
    }

    isSavingProjectRef.current = true;

    try {
      writeProject(activeProject, layerState);
    } finally {
      isSavingProjectRef.current = false;
    }
  }

  function resetToNewProject() {
    suppressNextChangeDetectionRef.current = true;
    cancelPieceReplication();

    resetPiecesHistory([]);
    clearPieceSelection();

    setLayers([]);
    setActiveLayerId(null);
    setLayerName("");
    setLayerGripperOffsets(createEmptyGripperOffsets());
    cancelPendingLayerSelection();

    setPalletizingSequence([]);
    setSelectedPalletizingInstanceId(null);

    setActivePallet(getDefaultPallet());
    // La pinça del projecte anterior: no cal tornar-la a triar
    setActiveGripper(getLastGripper());
    setOperationMode("palletizing");
    setConveyorConfigurations([]);

    setActiveProject({
      id: null,
      name: t.project.unnamed,
      createdAt: null
    });

    setHasUnsavedChanges(false);
    clearAutosave();
  }

  function createNewProject() {
    if (!hasUnsavedChanges) {
      resetToNewProject();
      return;
    }

    openConfirmDialog({
      title: t.project.newTitle,
      message: t.project.newDiscardMessage,
      confirmLabel: t.project.discardAndContinue,
      destructive: true,
      onConfirm: resetToNewProject
    });
  }

  function showOpenProjectDialog() {
    setIsOpenProjectDialogOpen(true);
  }

  function closeOpenProjectDialog() {
    setIsOpenProjectDialogOpen(false);
  }

  function openProjectDialog() {
    if (!hasUnsavedChanges) {
      showOpenProjectDialog();
      return;
    }

    openConfirmDialog({
      title: t.project.openTitle,
      message: t.project.openDiscardMessage,
      confirmLabel: t.project.discardAndOpen,
      destructive: true,
      onConfirm: showOpenProjectDialog
    });
  }

  /*
    Exporta a un fitxer el projecte tal com és ara a
    l'editor (també els canvis encara no guardats), amb
    els models 3D que fa servir.
  */
  async function exportCurrentProject() {
    try {
      const { fileName, data } = await createProjectFile(
        buildCurrentSnapshot({
          id: activeProject.id || createProjectId(),
          name: activeProject.id ? activeProject.name : t.project.unnamed,
          createdAt: activeProject.createdAt ?? null
        })
      );

      downloadJsonFile(fileName, data);
    } catch (error) {
      console.error("Error exportant el projecte:", error);
      window.alert(t.transfer.exportError);
    }
  }

  async function exportBackup() {
    try {
      const { fileName, data } = await createBackupFile();
      downloadJsonFile(fileName, data);
    } catch (error) {
      console.error("Error fent la còpia de seguretat:", error);
      window.alert(t.transfer.exportError);
    }
  }

  async function openImportedProject(data) {
    try {
      const savedProject = await importProjectFile(
        data,
        t.transfer.importedSuffix
      );

      if (!savedProject) {
        window.alert(t.transfer.importError);
        return;
      }

      applyOpenedProject(savedProject);
    } catch (error) {
      console.error("Error important el projecte:", error);
      window.alert(t.transfer.importError);
    }
  }

  /*
    Les biblioteques que ja s'han carregat a la vista no
    es refresquen soles: en acabar es recarrega el
    programa (la composició queda a la còpia de
    recuperació).
  */
  async function restoreBackup(data) {
    try {
      const result = await importBackupFile(data);
      window.alert(t.transfer.backupDone(result));
      window.location.reload();
    } catch (error) {
      console.error("Error important la còpia de seguretat:", error);
      window.alert(t.transfer.importError);
    }
  }

  // Fitxer de projecte o còpia de seguretat
  async function importFromFile(file) {
    let data;

    try {
      data = await readTransferFile(file);
    } catch (error) {
      console.error("Fitxer no vàlid:", error);
      window.alert(t.transfer.invalidFile);
      return;
    }

    if (data.format === BACKUP_FILE_FORMAT) {
      openConfirmDialog({
        title: t.transfer.backupTitle,
        message: t.transfer.backupMessage,
        confirmLabel: t.transfer.backupConfirm,
        onConfirm: () => {
          restoreBackup(data);
        }
      });
      return;
    }

    if (!hasUnsavedChanges) {
      openImportedProject(data);
      return;
    }

    openConfirmDialog({
      title: t.transfer.importTitle,
      message: t.project.openDiscardMessage,
      confirmLabel: t.project.discardAndOpen,
      destructive: true,
      onConfirm: () => {
        openImportedProject(data);
      }
    });
  }

  return {
    exportCurrentProject,
    exportBackup,
    importFromFile,
    isOpenProjectDialogOpen,
    isSaveProjectDialogOpen,
    saveProjectSuggestedName,
    applyOpenedProject,
    applyRecoveredAutosave,
    saveCurrentProject,
    saveCurrentProjectAs,
    confirmSaveCurrentProjectAs,
    cancelSaveProjectAs,
    createNewProject,
    openProjectDialog,
    closeOpenProjectDialog
  };
}
