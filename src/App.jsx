import { useState } from "react";

import PalletScene from "./components/PalletScene.jsx";
import ViewCube from "./components/ViewCube.jsx";
import SelectionRectangle from "./components/SelectionRectangle.jsx";
import ProjectMenu from "./components/ProjectMenu.jsx";
import ConfiguratorMenu from "./components/ConfiguratorMenu.jsx";
import GripperPanel from "./components/GripperPanel.jsx";
import PieceActionPanel from "./components/PieceActionPanel.jsx";
import LayerConfigurator from "./components/LayerConfigurator.jsx";
import PalletizingConfigurator from "./components/PalletizingConfigurator.jsx";
import MultiSelectionPanel from "./components/MultiSelectionPanel.jsx";
import SelectedPiecePanel from "./components/SelectedPiecePanel.jsx";
import NewPieceDialog from "./components/NewPieceDialog.jsx";
import PalletDialog from "./components/PalletDialog.jsx";
import OpenProjectDialog from "./components/OpenProjectDialog.jsx";
import SaveProjectDialog from "./components/SaveProjectDialog.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import GripperDialog from "./components/GripperDialog.jsx";
import SeparatorDialog from "./components/SeparatorDialog.jsx";
import UnsavedLayerDialog from "./components/UnsavedLayerDialog.jsx";
import LayerOrderIdErrorDialog from "./components/LayerOrderIdErrorDialog.jsx";
import LanguageJokeButton from "./components/LanguageJokeButton.jsx";
import ConveyorConfiguratorPanel from "./components/ConveyorConfiguratorPanel.jsx";
import ConveyorConfigurationDialog from "./components/ConveyorConfigurationDialog.jsx";

import useTranslator from "./hooks/useTranslator.js";
import useConfirmDialog from "./hooks/useConfirmDialog.js";
import useProjectDocument from "./hooks/useProjectDocument.js";
import useSceneCamera from "./hooks/useSceneCamera.js";
import usePieceSelection from "./hooks/usePieceSelection.js";
import usePieceReplication from "./hooks/usePieceReplication.js";
import usePieceDrag from "./hooks/usePieceDrag.js";
import useRectangleSelection from "./hooks/useRectangleSelection.js";
import usePieceActions from "./hooks/usePieceActions.js";
import useGripperOffsets from "./hooks/useGripperOffsets.js";
import useSimulation from "./hooks/useSimulation.js";
import useLayers from "./hooks/useLayers.js";
import usePalletizing from "./hooks/usePalletizing.js";
import useProjectFile from "./hooks/useProjectFile.js";
import useAutosave from "./hooks/useAutosave.js";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts.js";
import usePieceLibrary from "./hooks/usePieceLibrary.js";
import useConveyorConfigurations from "./hooks/useConveyorConfigurations.js";
import useCollisionGeometryVersion from "./hooks/useCollisionGeometryVersion.js";
import useGraspGroupEditor from "./hooks/useGraspGroupEditor.js";
import { getGraspGroupMembers, getOperations } from "./utils/graspGroups.js";
import { evaluateGrasp, getOperationGripperPose } from "./utils/graspGeometry.js";
import { getOperationOrderId } from "./utils/orderIdUtils.js";

import { sidePanelStyle } from "./styles/appStyles.js";
import { sortPiecesByOrderId } from "./utils/orderIdUtils.js";
import { roundToThreeDecimals } from "./utils/appModelUtils.js";
import { findLibraryPieceForPlaced } from "./utils/conveyorConfigurations.js";
import { getCompositionCenteredAxes } from "./utils/magneticSnap.js";
import {
  loadDuplicateSpacing,
  normalizeDuplicateSpacing,
  saveDuplicateSpacing
} from "./utils/pieceReplication.js";

// Imant: distància d'atracció en píxels de pantalla i límits en mm
const SNAP_DISTANCE_PX = 12;
const SNAP_DISTANCE_MIN_MM = 3;
const SNAP_DISTANCE_MAX_MM = 300;
const SNAP_DISTANCE_MM_FALLBACK = 10;

function noop() {}

export default function App() {
  const {
    t,
    activeLanguage,
    setActiveLanguage,
    availableLanguages
  } = useTranslator("ca");

  const {
    confirmDialog,
    openConfirmDialog,
    closeConfirmDialog,
    confirmDialogAction,
    confirmDialogSecondaryAction
  } = useConfirmDialog();

  const projectDocument = useProjectDocument(t);

  const {
    pieces,
    setPieces,
    activePallet,
    setActivePallet,
    activeGripper,
    setActiveGripper,
    layers,
    activeLayerId,
    layerName,
    setLayerName,
    palletizingSequence,
    selectedPalletizingInstanceId,
    setSelectedPalletizingInstanceId,
    activeProject,
    hasUnsavedChanges
  } = projectDocument;

  /*
    Estat de la interfície (no es desa amb el
    projecte).
  */
  const [activeConfigurator, setActiveConfigurator] =
    useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGripperVisible, setIsGripperVisible] =
    useState(false);

  const [isNewPieceDialogOpen, setIsNewPieceDialogOpen] =
    useState(false);
  // Peça que s'edita amb el diàleg de peça (null = nova)
  const [editingPieceId, setEditingPieceId] = useState(null);
  const [editingSeparatorId, setEditingSeparatorId] = useState(null);
  const [isSeparatorDialogOpen, setIsSeparatorDialogOpen] =
    useState(false);
  const [isPalletDialogOpen, setIsPalletDialogOpen] =
    useState(false);
  const [isGripperDialogOpen, setIsGripperDialogOpen] =
    useState(false);
  const [
    isLanguageMessageVisible,
    setIsLanguageMessageVisible
  ] = useState(false);

  const camera = useSceneCamera(activePallet.sizeZ);

  /*
    Quan s'acaba de calcular el volum de col·lisió d'un
    model importat, l'escena es torna a dibuixar
    (col·lisions, cares i TCP amb la forma real).
  */
  useCollisionGeometryVersion();

  // Peces guardades (biblioteca) i configuracions de cinta
  const pieceLibrary = usePieceLibrary();
  const conveyor = useConveyorConfigurations({
    projectDocument,
    pieceLibrary,
    openConfirmDialog,
    t
  });

  const {
    selectedPieceId,
    selectedPieceIds,
    clearPieceSelection,
    applyPieceSelection,
    selectPiece
  } = usePieceSelection();

  /*
    Una peça d'una agafada múltiple se selecciona amb
    tot el grup; amb Alt, només ella.
  */
  function getSelectionIdsForPiece(pieceId, options = {}) {
    const piece = pieces.find((item) => item.id === pieceId);
    const members = options.single
      ? []
      : getGraspGroupMembers(pieces, piece?.graspGroupId ?? null);

    return members.length > 0
      ? members.map((member) => member.id)
      : [pieceId];
  }

  function selectPieceOrGrasp(pieceId, additive = false, options = {}) {
    const ids = getSelectionIdsForPiece(pieceId, options);

    if (ids.length === 1) {
      selectPiece(pieceId, additive);
      return;
    }

    if (!additive) {
      applyPieceSelection(ids);
      return;
    }

    const isGroupSelected = ids.every((id) => selectedPieceIds.includes(id));
    applyPieceSelection(
      isGroupSelected
        ? selectedPieceIds.filter((id) => !ids.includes(id))
        : [...selectedPieceIds, ...ids]
    );
  }

  const selectedData = pieces.find(
    (piece) => piece.id === selectedPieceId
  );

  /*
    Agafada múltiple seleccionada sencera: es tracta com
    una sola operació (pinça, offsets i simulació de la
    peça guia, amb el TCP del grup).
  */
  const selectedGraspMembers =
    selectedPieceIds.length > 1
      ? getGraspGroupMembers(
          pieces,
          pieces.find((piece) => piece.id === selectedPieceIds[0])
            ?.graspGroupId ?? null
        )
      : [];

  const selectedGraspLead =
    selectedGraspMembers.length === selectedPieceIds.length &&
    selectedGraspMembers.every((piece) => selectedPieceIds.includes(piece.id))
      ? selectedGraspMembers.find((piece) => piece.graspGroupLead) ??
        selectedGraspMembers[0]
      : null;

  // Peça sobre la qual es posa la pinça (sola o guia de l'agafada)
  const gripperTargetPiece = selectedData ?? selectedGraspLead;

  const selectedIsSeparator =
    selectedData?.pieceCategory === "SEPARATOR";

  const selectedIsRegularPiece = Boolean(
    selectedData && !selectedIsSeparator
  );

  // Cada configurador només mostra el seu tipus d'element
  /*
    Guies de centrat: només amb tot el material de la
    composició seleccionat. Indiquen en quins eixos el
    conjunt està centrat al palet (X, Y o tots dos: creu).
  */
  const isWholeCompositionSelected =
    pieces.length > 0 &&
    pieces.every((piece) => selectedPieceIds.includes(piece.id));

  const centerGuides = isWholeCompositionSelected
    ? getCompositionCenteredAxes(pieces, activePallet)
    : null;

  const shouldShowSelectedData =
    selectedData &&
    ((activeConfigurator === "pieces" &&
      selectedIsRegularPiece) ||
      (activeConfigurator === "separators" &&
        selectedIsSeparator));

  /*
    Distància de duplicació (X i Y del palet, mm): la fan
    servir Duplicar i Ctrl + arrossegar. Es desa al
    navegador i es manté entre sessions.
  */
  const [duplicateSpacing, setDuplicateSpacingState] = useState(
    loadDuplicateSpacing
  );

  function changeDuplicateSpacing(nextSpacing) {
    const normalized = normalizeDuplicateSpacing(nextSpacing);
    setDuplicateSpacingState(normalized);
    saveDuplicateSpacing(normalized);
  }

  const replication = usePieceReplication({
    pieces,
    setPieces,
    activePallet,
    duplicateSpacing
  });

  /*
    Distància d'atracció de l'imant: uns pocs píxels de
    pantalla convertits a mm segons el zoom actual (amb
    més zoom, l'imant és més precís; amb menys, abasta
    més).
  */
  function getSnapDistance() {
    const sceneCamera = camera.sceneCameraRef.current;
    const canvasElement = camera.canvasElementRef.current;
    const controls = camera.orbitControlsRef.current;

    if (!sceneCamera || !canvasElement || !canvasElement.clientHeight) {
      return SNAP_DISTANCE_MM_FALLBACK;
    }

    const lookAtDistance = controls?.target
      ? sceneCamera.position.distanceTo(controls.target)
      : sceneCamera.position.length();
    const visibleHeight =
      2 * lookAtDistance * Math.tan(((sceneCamera.fov ?? 35) * Math.PI) / 360);
    const millimetresPerPixel = visibleHeight / canvasElement.clientHeight;

    return Math.min(
      SNAP_DISTANCE_MAX_MM,
      Math.max(SNAP_DISTANCE_MIN_MM, SNAP_DISTANCE_PX * millimetresPerPixel)
    );
  }

  const drag = usePieceDrag({
    pieces,
    setPieces,
    beginPiecesTransaction:
      projectDocument.beginPiecesTransaction,
    endPiecesTransaction: projectDocument.endPiecesTransaction,
    selectedPieceIds,
    applyPieceSelection,
    setIsDragging,
    activePallet,
    getSnapDistance,
    getSelectionIdsForPiece
  });

  const rectangle = useRectangleSelection({
    pieces,
    activeConfigurator,
    applyPieceSelection,
    cancelPieceReplication: replication.cancelPieceReplication,
    setIsDragging,
    sceneCameraRef: camera.sceneCameraRef,
    canvasElementRef: camera.canvasElementRef
  });

  const pieceActions = usePieceActions({
    pieces,
    setPieces,
    selectedData,
    selectedPieceIds,
    applyPieceSelection,
    clearPieceSelection,
    duplicateSpacing
  });

  const gripperOffsets = useGripperOffsets({
    projectDocument,
    setPieces,
    selectedData: gripperTargetPiece,
    setIsGripperVisible
  });

  const shouldShowAppliedGripper =
    isGripperVisible ||
    Boolean(gripperOffsets.gripperOffsetPreviewMode);

  const simulation = useSimulation({
    selectedPieceId: gripperTargetPiece?.id ?? null,
    activeConfigurator
  });

  const simulatedPiece = simulation.offsetSimulation
    ? pieces.find(
        (piece) =>
          piece.id === simulation.offsetSimulation.pieceId
      )
    : null;

  const simulatedMembers = simulatedPiece
    ? getGraspGroupMembers(pieces, simulatedPiece.graspGroupId ?? null)
    : [];

  // Offsets propis de la peça o, si no en té, els de la capa
  const sceneOffsetSimulation = simulatedPiece
    ? {
        ...simulation.offsetSimulation,
        piece: simulatedPiece,
        // Agafada múltiple: tot el grup es mou amb la pinça
        pieces: simulatedMembers.length > 0 ? simulatedMembers : [simulatedPiece],
        pose: getOperationGripperPose(pieces, simulatedPiece),
        offset: (simulatedPiece.gripperOffsets ??
          gripperOffsets.currentLayerGripperOffsets)[
          simulation.offsetSimulation.mode
        ]
      }
    : null;

  const simulatedLayer = simulation.layerSimulation
    ? layers.find(
        (layer) => layer.id === simulation.layerSimulation.layerId
      )
    : null;

  /*
    La capa activa es simula amb les peces i els offsets
    que hi ha ara a l'editor (encara que no s'hagin
    desat), així els orderId nous es respecten de
    seguida. Les altres capes, amb la seva còpia desada.
  */
  const isSimulatingActiveLayer =
    simulatedLayer?.id === activeLayerId;

  const layerGenericOffsets = isSimulatingActiveLayer
    ? gripperOffsets.currentLayerGripperOffsets
    : simulatedLayer?.gripperOffsets ??
      gripperOffsets.currentLayerGripperOffsets;

  // Cada peça fa servir els seus offsets o els de la capa
  const sceneLayerSimulation = simulatedLayer
    ? {
        runId: simulation.layerSimulation.runId,
        speed: simulation.layerSimulation.speed,
        pieces: sortPiecesByOrderId(
          isSimulatingActiveLayer ? pieces : simulatedLayer.pieces
        ),
        getPieceOffsets: (piece) =>
          piece.gripperOffsets ?? layerGenericOffsets
      }
    : null;

  // Prémer el títol de l'offset torna a la vista estàtica
  function changeGripperOffsetPreviewMode(nextMode) {
    simulation.stopSimulation();
    gripperOffsets.changeGripperOffsetPreviewMode(nextMode);
  }

  const layerEditor = useLayers({
    projectDocument,
    clearPieceSelection,
    currentLayerGripperOffsets:
      gripperOffsets.currentLayerGripperOffsets,
    loadLayerGripperOffsets:
      gripperOffsets.loadLayerGripperOffsets,
    openConfirmDialog,
    t
  });

  const graspEditor = useGraspGroupEditor({
    pieces,
    setPieces,
    gripper: activeGripper,
    onStart: () => {
      simulation.stopSimulation();
      layerEditor.stopDefiningOrderIds();
      clearPieceSelection();

      if (!layerEditor.showOrderIds) {
        layerEditor.toggleOrderIds();
      }
    },
    t
  });

  /*
    Agafades múltiples de la composició i el seu estat
    (pose de la pinça i motius per revisar-les).
  */
  const graspGroupStatuses = getOperations(pieces)
    .filter((operation) => operation.groupId !== null)
    .map((operation) => ({
      groupId: operation.groupId,
      orderId: getOperationOrderId(operation),
      memberIds: operation.pieces.map((piece) => piece.id),
      ...evaluateGrasp(
        operation.pieces,
        operation.lead,
        activeGripper,
        operation.lead.graspAdjust
      )
    }));

  const palletizing = usePalletizing({ projectDocument });

  const projectFile = useProjectFile({
    projectDocument,
    selectedPieceId,
    applyPieceSelection,
    clearPieceSelection,
    cancelPieceReplication: replication.cancelPieceReplication,
    cancelPendingLayerSelection:
      layerEditor.cancelPendingLayerSelection,
    commitCurrentLayer: layerEditor.commitCurrentLayer,
    openConfirmDialog,
    t
  });

  const autosave = useAutosave({
    projectDocument,
    selectedPieceId,
    onRecover: projectFile.applyRecoveredAutosave,
    t
  });

  useKeyboardShortcuts({
    activeConfigurator,
    pieces,
    setPieces,
    undoPieces: projectDocument.undoPieces,
    redoPieces: projectDocument.redoPieces,
    selectedPieceIds,
    applyPieceSelection,
    clearPieceSelection,
    deleteSelectedPieces: pieceActions.deleteSelectedPieces,
    selectedPalletizingInstanceId,
    setSelectedPalletizingInstanceId,
    deletePalletizingLayer: palletizing.deletePalletizingLayer,
    hasActiveSelectionRectangle:
      rectangle.hasActiveSelectionRectangle,
    cancelSelectionRectangle: rectangle.cancelSelectionRectangle,
    isSimulating: simulation.isSimulating,
    stopSimulation: simulation.stopSimulation,
    isDefiningOrderIds: layerEditor.isDefiningOrderIds,
    stopDefiningOrderIds: layerEditor.stopDefiningOrderIds
  });

  function selectConfigurator(configuratorName) {
    replication.cancelPieceReplication();
    rectangle.resetSelectionRectangle();
    layerEditor.stopDefiningOrderIds();
    graspEditor.stopDefiningGrasps();
    // La pinça torna a la posició final de la peça
    gripperOffsets.resetGripperOffsetPreview();

    setActiveConfigurator(configuratorName);

    if (configuratorName !== "palletizing") {
      setSelectedPalletizingInstanceId(null);
    }
  }

  function handleConfiguratorSelection(configuratorName) {
    // El palet es configura des d'un diàleg
    if (configuratorName === "pallet") {
      setActiveConfigurator("pallet");
      setIsPalletDialogOpen(true);
      return;
    }

    selectConfigurator(configuratorName);
  }

  // Canviar de sentit atura qualsevol simulació en curs
  function changeOperationMode(nextMode) {
    simulation.stopSimulation();
    projectDocument.setOperationMode(nextMode);
  }

  function toggleDefiningOrderIds() {
    simulation.stopSimulation();
    graspEditor.stopDefiningGrasps();
    layerEditor.toggleDefiningOrderIds();
  }

  /*
    Normalment, clicar una peça la selecciona i permet
    arrossegar-la. Mentre es defineixen els ID, el clic
    només li assigna el número següent.
  */
  const pieceHandlers = graspEditor.isDefiningGrasps
    ? {
        // "Definir agafades": el clic tria o treu peces de l'agafada
        selectPiece: noop,
        movePiece: noop,
        startPieceDrag: (pieceId) => graspEditor.clickGraspPiece(pieceId),
        finishPieceDrag: noop,
        startPieceReplication: noop,
        movePieceReplication: noop,
        finishPieceReplication: noop,
        cancelPieceReplication: noop
      }
    : layerEditor.isDefiningOrderIds
    ? {
        selectPiece: noop,
        movePiece: noop,
        startPieceDrag: (pieceId) =>
          layerEditor.assignNextOrderId(pieceId),
        finishPieceDrag: noop,
        startPieceReplication: noop,
        movePieceReplication: noop,
        finishPieceReplication: noop,
        cancelPieceReplication: noop
      }
    : {
        selectPiece: selectPieceOrGrasp,
        ...drag,
        startPieceReplication: replication.startPieceReplication,
        movePieceReplication: replication.movePieceReplication,
        finishPieceReplication: replication.finishPieceReplication,
        cancelPieceReplication: replication.cancelPieceReplication
      };

  function createPieceFromDialog(pieceDefinition) {
    // Si la plantilla té agafada configurada a la cinta, la peça neix amb aquest TCP
    const grasp = pieceDefinition.libraryPieceId
      ? conveyor.getGraspForLibraryPiece(pieceDefinition.libraryPieceId)
      : null;

    pieceActions.createPiece({ ...pieceDefinition, ...grasp });
    setIsNewPieceDialogOpen(false);
  }

  const editingPiece = editingPieceId === null
    ? null
    : pieces.find((piece) => piece.id === editingPieceId) ?? null;

  function openPieceEditor() {
    if (!selectedIsRegularPiece) {
      return;
    }

    setEditingPieceId(selectedData.id);
    setIsNewPieceDialogOpen(true);
  }

  function closePieceDialog() {
    setIsNewPieceDialogOpen(false);
    setEditingPieceId(null);
  }

  /*
    Desar l'edició d'una peça (només el nom):
    - si ve d'una plantilla, el nom nou va a la plantilla
      i a totes les peces d'aquest producte;
    - si no és a la biblioteca i l'operari ho ha triat,
      es desa a la biblioteca amb el nom nou;
    - si no, només canvia el nom d'aquesta peça.

    Retorna { error } si no es pot desar (el popup el
    mostra i es queda obert).
  */
  function updatePieceFromDialog(pieceId, changes, { saveToLibrary = false } = {}) {
    const piece = pieces.find((item) => item.id === pieceId);
    const libraryPiece = piece
      ? findLibraryPieceForPlaced(piece, pieceLibrary)
      : null;

    if (libraryPiece) {
      const result = conveyor.renameLibraryPiece(libraryPiece.id, changes.name);

      if (result.error) {
        return result;
      }
    } else if (piece && saveToLibrary) {
      const template = conveyor.saveLibraryPieceFromPlaced(
        { ...piece, ...changes },
        { name: changes.name, renamePieces: true }
      );

      if (!template) {
        return { error: t.pieceDialog.saveError };
      }
    } else {
      pieceActions.updatePiece(pieceId, changes);
    }

    closePieceDialog();
    return {};
  }

  // Plantilla de la biblioteca de la peça que s'edita (o null)
  const editingLibraryPiece = editingPiece
    ? findLibraryPieceForPlaced(editingPiece, pieceLibrary)
    : null;

  function createSeparatorFromDialog(separatorDefinition) {
    pieceActions.createSeparator(separatorDefinition);
    setActiveConfigurator("separators");
    setIsSeparatorDialogOpen(false);
  }

  const editingSeparator = editingSeparatorId === null
    ? null
    : pieces.find((piece) => piece.id === editingSeparatorId) ?? null;

  function openSeparatorEditor() {
    if (!selectedIsSeparator) {
      return;
    }

    setEditingSeparatorId(selectedData.id);
    setIsSeparatorDialogOpen(true);
  }

  function closeSeparatorDialog() {
    setIsSeparatorDialogOpen(false);
    setEditingSeparatorId(null);
  }

  /*
    Desar l'edició d'un separador: nom, mides i color.
    La cara inferior es manté on era, de manera que un
    gruix nou no el fa entrar dins la capa de sota.
  */
  function saveSeparatorFromDialog(separatorDefinition) {
    if (!editingSeparator) {
      return;
    }

    const heightChange =
      Number(separatorDefinition.height) -
      Number(editingSeparator.height);

    pieceActions.updatePiece(editingSeparator.id, {
      name: separatorDefinition.name || editingSeparator.name,
      width: separatorDefinition.width,
      depth: separatorDefinition.depth,
      height: separatorDefinition.height,
      topWidth: separatorDefinition.width,
      topDepth: separatorDefinition.depth,
      color: separatorDefinition.color,
      z: roundToThreeDecimals(
        Number(editingSeparator.z) + heightChange / 2
      )
    });
  }

  function applyGripper(gripperDefinition) {
    setActiveGripper({ ...gripperDefinition });
    setIsGripperVisible(true);
  }

  return (
    <>
      <PalletScene
        activeConfigurator={activeConfigurator}
        activePallet={activePallet}
        centerGuides={centerGuides}
        pieces={pieces}
        selectedPieceIds={selectedPieceIds}
        selectedData={gripperTargetPiece}
        selectedGripperPose={
          selectedGraspLead
            ? getOperationGripperPose(pieces, selectedGraspLead)
            : null
        }
        selectedMemberIds={
          selectedGraspLead
            ? selectedGraspMembers.map((piece) => piece.id)
            : null
        }
        activeGripper={activeGripper}
        shouldShowAppliedGripper={shouldShowAppliedGripper}
        gripperOffsetPreview={
          gripperOffsets.activeGripperOffsetPreview
        }
        replicationPreview={replication.replicationPreview}
        showOrderIds={layerEditor.showOrderIds}
        orderIdValidation={layerEditor.orderIdValidation}
        palletizedLayerInstances={
          palletizing.palletizedLayerInstances
        }
        selectedPalletizingInstanceId={
          selectedPalletizingInstanceId
        }
        offsetSimulation={sceneOffsetSimulation}
        layerSimulation={sceneLayerSimulation}
        operationMode={projectDocument.operationMode}
        isDragging={isDragging}
        sceneCameraRef={camera.sceneCameraRef}
        canvasElementRef={camera.canvasElementRef}
        orbitControlsRef={camera.orbitControlsRef}
        orbitTarget={camera.orbitTarget}
        pieceHandlers={pieceHandlers}
        onChangeOrderId={layerEditor.updatePieceOrderId}
        onDefineOrderIdClick={
          graspEditor.isDefiningGrasps
            ? graspEditor.clickGraspPiece
            : layerEditor.isDefiningOrderIds
            ? layerEditor.assignNextOrderId
            : null
        }
        graspOverlay={{
          groups: graspGroupStatuses,
          gripper: activeGripper,
          draft: graspEditor.graspDraftEvaluation
            ? {
                groupId: graspEditor.graspDraft.groupId,
                memberIds: graspEditor.graspDraft.memberIds,
                ...graspEditor.graspDraftEvaluation
              }
            : null
        }}
        onSelectPalletizingInstance={
          setSelectedPalletizingInstanceId
        }
        onCanvasPointerDown={rectangle.handleCanvasPointerDown}
        onCanvasDoubleClick={rectangle.handleCanvasDoubleClick}
        t={t}
      />

      <ViewCube
        cameraRef={camera.sceneCameraRef}
        controlsRef={camera.orbitControlsRef}
        fallbackTarget={camera.orbitTarget}
      />

      <SelectionRectangle rectangle={rectangle.selectionRectangle} />

      <div style={sidePanelStyle}>
        <ProjectMenu
          projectName={
            activeProject.id
              ? activeProject.name
              : t.project.unnamed
          }
          hasUnsavedChanges={hasUnsavedChanges}
          autosaveFailed={autosave.autosaveFailed}
          onNewProject={projectFile.createNewProject}
          onOpenProject={projectFile.openProjectDialog}
          onSaveProject={projectFile.saveCurrentProject}
          onSaveProjectAs={projectFile.saveCurrentProjectAs}
          onExportProject={projectFile.exportCurrentProject}
          onImportFile={projectFile.importFromFile}
          onExportBackup={projectFile.exportBackup}
          t={t}
        />

        <ConfiguratorMenu
          activeConfigurator={activeConfigurator}
          onSelectConfigurator={handleConfiguratorSelection}
          t={t}
        />

        {activeConfigurator === "gripper" && (
          <GripperPanel
            activeGripper={activeGripper}
            isGripperVisible={isGripperVisible}
            onNewGripper={() => setIsGripperDialogOpen(true)}
            onToggleGripperVisible={() =>
              setIsGripperVisible((currentValue) => !currentValue)
            }
            t={t}
          />
        )}

        {activeConfigurator === "separators" && (
          <PieceActionPanel
            type="separator"
            canAct={selectedIsSeparator}
            onCreate={() => {
              setEditingSeparatorId(null);
              setIsSeparatorDialogOpen(true);
            }}
            onEdit={openSeparatorEditor}
            onDuplicate={pieceActions.duplicatePiece}
            duplicateSpacing={duplicateSpacing}
            onChangeDuplicateSpacing={changeDuplicateSpacing}
            onDelete={pieceActions.deleteSelectedPieces}
            t={t}
          />
        )}

        {activeConfigurator === "pieces" && (
          <PieceActionPanel
            type="piece"
            canAct={selectedIsRegularPiece}
            onCreate={() => {
              setEditingPieceId(null);
              setIsNewPieceDialogOpen(true);
            }}
            onEdit={openPieceEditor}
            onDuplicate={pieceActions.duplicatePiece}
            duplicateSpacing={duplicateSpacing}
            onChangeDuplicateSpacing={changeDuplicateSpacing}
            onDelete={pieceActions.deleteSelectedPieces}
            t={t}
          />
        )}

        {activeConfigurator === "conveyor" && (
          <ConveyorConfiguratorPanel
            items={conveyor.listItems}
            onConfigure={conveyor.openConfiguration}
            onSaveAndConfigure={conveyor.saveAndConfigure}
            onDelete={conveyor.deleteConfiguration}
            t={t}
          />
        )}

        {activeConfigurator === "layers" && (
          <LayerConfigurator
            layerName={layerName}
            onNewLayer={layerEditor.requestNewEmptyLayer}
            operationMode={projectDocument.operationMode}
            onOperationModeChange={changeOperationMode}
            onLayerNameChange={setLayerName}
            onSaveLayer={() => {
              layerEditor.saveCurrentLayer();
            }}
            layers={layers}
            activeLayerId={activeLayerId}
            onSelectLayer={layerEditor.requestLayerSelection}
            onDeleteLayer={layerEditor.requestDeleteSavedLayer}
            isCurrentLayerDirty={layerEditor.isCurrentLayerDirty}
            showOrderIds={layerEditor.showOrderIds}
            onToggleOrderIds={layerEditor.toggleOrderIds}
            isDefiningOrderIds={layerEditor.isDefiningOrderIds}
            definedOrderIdCount={layerEditor.definedCount}
            pieceCount={pieces.length}
            operationCount={layerEditor.operationCount}
            onToggleDefineOrderIds={toggleDefiningOrderIds}
            showGripperOffsets={gripperOffsets.showGripperOffsets}
            onToggleGripperOffsets={
              gripperOffsets.toggleGripperOffsets
            }
            selectedPiece={gripperTargetPiece}
            genericGripperOffsets={
              gripperOffsets.currentLayerGripperOffsets
            }
            gripperOffsetPreviewMode={
              gripperOffsets.gripperOffsetPreviewMode
            }
            onGripperOffsetPreviewModeChange={
              changeGripperOffsetPreviewMode
            }
            onChangeGenericGripperOffset={
              gripperOffsets.updateGenericGripperOffset
            }
            onChangePieceGripperOffset={
              gripperOffsets.updatePieceGripperOffset
            }
            onUseGenericGripperOffsets={
              gripperOffsets.clearPieceGripperOffsets
            }
            hasGripper={Boolean(activeGripper)}
            offsetSimulationMode={
              simulatedPiece
                ? simulation.offsetSimulation.mode
                : null
            }
            onSimulateOffset={simulation.startOffsetSimulation}
            simulationSpeed={simulation.simulationSpeed}
            simulatingLayerId={simulatedLayer?.id ?? null}
            onSimulateLayer={simulation.startLayerSimulation}
            graspPanel={{
              pieces,
              disabled: pieces.length === 0,
              isDefining: graspEditor.isDefiningGrasps,
              draft: graspEditor.graspDraft,
              draftMembers: graspEditor.graspDraftMembers,
              evaluation: graspEditor.graspDraftEvaluation,
              message: graspEditor.graspMessage,
              reviewGroups: graspGroupStatuses.filter(
                (status) => status.issues.length > 0
              ),
              onToggle: graspEditor.toggleDefiningGrasps,
              onAdjust: graspEditor.changeGraspAdjust,
              onConfirm: graspEditor.confirmGraspDraft,
              onCancel: graspEditor.cancelGraspDraft,
              onDissolve: graspEditor.dissolveGraspDraft
            }}
            t={t}
          />
        )}

        {activeConfigurator === "palletizing" && (
          <PalletizingConfigurator
            layers={layers}
            sequence={palletizingSequence}
            selectedInstanceId={selectedPalletizingInstanceId}
            onAddLayer={palletizing.addLayerToPalletizing}
            onSelectInstance={setSelectedPalletizingInstanceId}
            t={t}
          />
        )}

        {activeConfigurator !== "palletizing" &&
          selectedPieceIds.length > 1 && (
            <MultiSelectionPanel
              selectedCount={selectedPieceIds.length}
              onMoveSelection={pieceActions.moveSelectedPieces}
              t={t}
            />
          )}

        {shouldShowSelectedData && (
          <SelectedPiecePanel
            piece={selectedData}
            isSeparator={selectedIsSeparator}
            setPieces={setPieces}
            t={t}
          />
        )}
      </div>

      <NewPieceDialog
        open={isNewPieceDialogOpen}
        onClose={closePieceDialog}
        onCreatePiece={createPieceFromDialog}
        editingPiece={editingPiece}
        onUpdatePiece={updatePieceFromDialog}
        editingLibraryPiece={editingLibraryPiece}
        requestPieceDeletion={conveyor.requestPieceDeletion}
        t={t}
      />

      {conveyor.dialogPiece && (
        <ConveyorConfigurationDialog
          key={conveyor.dialogPiece.id}
          piece={conveyor.dialogPiece}
          configuration={conveyor.dialogConfiguration}
          activeGripper={activeGripper}
          onSave={conveyor.saveConfiguration}
          onClose={conveyor.closeDialog}
          t={t}
        />
      )}

      <PalletDialog
        open={isPalletDialogOpen}
        activePallet={activePallet}
        onClose={() => setIsPalletDialogOpen(false)}
        onApplyPallet={(palletDefinition) =>
          setActivePallet({ ...palletDefinition })
        }
        t={t}
      />

      <OpenProjectDialog
        open={projectFile.isOpenProjectDialogOpen}
        onClose={projectFile.closeOpenProjectDialog}
        onOpenProject={projectFile.applyOpenedProject}
      />

      <LanguageJokeButton
        visible={isLanguageMessageVisible}
        onToggle={() =>
          setIsLanguageMessageVisible(
            (currentValue) => !currentValue
          )
        }
        onHide={() => setIsLanguageMessageVisible(false)}
        activeLanguage={activeLanguage}
        availableLanguages={availableLanguages}
        onChangeLanguage={setActiveLanguage}
        t={t}
      />

      <SaveProjectDialog
        open={projectFile.isSaveProjectDialogOpen}
        initialName={projectFile.saveProjectSuggestedName}
        onCancel={projectFile.cancelSaveProjectAs}
        onSave={projectFile.confirmSaveCurrentProjectAs}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={confirmDialog.cancelLabel}
        destructive={confirmDialog.destructive}
        onConfirm={confirmDialogAction}
        onCancel={closeConfirmDialog}
        secondaryLabel={confirmDialog.secondaryLabel}
        onSecondary={confirmDialogSecondaryAction}
      />

      <GripperDialog
        open={isGripperDialogOpen}
        activeGripper={activeGripper}
        onClose={() => setIsGripperDialogOpen(false)}
        onApplyGripper={applyGripper}
        t={t}
      />

      <SeparatorDialog
        open={isSeparatorDialogOpen}
        editingSeparator={editingSeparator}
        onClose={closeSeparatorDialog}
        onCreateSeparator={createSeparatorFromDialog}
        onSaveSeparator={saveSeparatorFromDialog}
        t={t}
      />

      <UnsavedLayerDialog
        open={layerEditor.isUnsavedLayerDialogOpen}
        currentLayerName={
          layerEditor.activeLayer?.name ?? layerName
        }
        onSave={layerEditor.savePendingLayerChanges}
        onDiscard={layerEditor.discardPendingLayerChanges}
        onCancel={layerEditor.cancelPendingLayerSelection}
        t={t}
      />

      <LayerOrderIdErrorDialog
        open={layerEditor.orderIdErrorDialog.open}
        message={layerEditor.orderIdErrorDialog.message}
        onAccept={layerEditor.closeOrderIdErrorDialog}
        t={t}
      />
    </>
  );
}
