import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import { palletToThree } from "../utils/pieceUtils.js";
import Pallet from "./Pallet.jsx";
import PalletWorldAxes from "./PalletWorldAxes.jsx";
import DraggablePiece from "./DraggablePiece.jsx";
import ReplicationPreview from "./ReplicationPreview.jsx";
import PieceOrderIdLabels from "./PieceOrderIdLabels.jsx";
import PalletizedLayer from "./PalletizedLayer.jsx";
import AppliedGripper from "./AppliedGripper.jsx";
import GraspOverlay from "./GraspOverlay.jsx";
import FloorGrid from "./FloorGrid.jsx";
import OffsetSimulation from "./OffsetSimulation.jsx";
import LayerSimulation from "./LayerSimulation.jsx";
import {
  isPieceCollidingWithPallet,
  isPieceOutsidePallet,
  isPieceCollidingWithPiece
} from "../utils/collision.js";

// Botó esquerre sense acció de càmera (només clicar)
const SCENE_MOUSE_BUTTONS = {
  LEFT: null,
  MIDDLE: THREE.MOUSE.PAN,
  RIGHT: THREE.MOUSE.ROTATE
};

// Guies de centrat: per sobre del palet i de les peces
const CENTER_GUIDE_HEIGHT = 1;
const CENTER_GUIDE_MARGIN = 60;

/*
  GUIES DE CENTRAT DEL CONJUNT

  Amb tot el material seleccionat i centrat al palet:
  - centrat en X: línia blanca a X = mida X / 2 (al
    llarg de Y);
  - centrat en Y: línia blanca a Y = mida Y / 2 (al
    llarg de X);
  - centrat en tots dos: una creu.
  Es dibuixen sempre per sobre (sense test de
  profunditat), amb una vora fosca per contrast.
*/
function CenterGuides({ pallet, showX, showY }) {
  const sizeX = Number(pallet?.sizeX) || 0;
  const sizeY = Number(pallet?.sizeY) || 0;

  if (!(sizeX > 0) || !(sizeY > 0)) {
    return null;
  }

  const toPoint = (x, y) => {
    const point = palletToThree(x, y, 0);
    return [point.x, CENTER_GUIDE_HEIGHT, point.z];
  };

  const lines = [];

  if (showX) {
    lines.push({
      key: "x",
      points: [
        toPoint(sizeX / 2, -CENTER_GUIDE_MARGIN),
        toPoint(sizeX / 2, sizeY + CENTER_GUIDE_MARGIN)
      ]
    });
  }

  if (showY) {
    lines.push({
      key: "y",
      points: [
        toPoint(-CENTER_GUIDE_MARGIN, sizeY / 2),
        toPoint(sizeX + CENTER_GUIDE_MARGIN, sizeY / 2)
      ]
    });
  }

  return lines.map((line) => (
    <group key={line.key} raycast={() => null}>
      <Line
        points={line.points}
        color="#1f2937"
        lineWidth={3}
        transparent
        opacity={0.45}
        depthTest={false}
        renderOrder={998}
      />
      {/* També "transparent": així es pinta després de la vora fosca */}
      <Line
        points={line.points}
        color="#ffffff"
        lineWidth={1.5}
        transparent
        opacity={1}
        depthTest={false}
        renderOrder={999}
      />
    </group>
  ));
}

/*
  Escena 3D: palet, peces editables o capes
  paletitzades, pinça i controls de càmera.
*/
export default function PalletScene({
  activeConfigurator,
  activePallet,
  pieces,
  selectedPieceIds,
  selectedData,
  // Agafada múltiple seleccionada: pose de la pinça i peces del grup
  selectedGripperPose = null,
  selectedMemberIds = null,
  activeGripper,
  shouldShowAppliedGripper,
  gripperOffsetPreview,
  replicationPreview,
  showOrderIds,
  orderIdValidation,
  palletizedLayerInstances,
  selectedPalletizingInstanceId,
  offsetSimulation,
  layerSimulation,
  operationMode,
  centerGuides = null,
  graspOverlay = null,
  isDragging,
  sceneCameraRef,
  canvasElementRef,
  orbitControlsRef,
  orbitTarget,
  pieceHandlers,
  onChangeOrderId,
  onDefineOrderIdClick,
  onSelectPalletizingInstance,
  onCanvasPointerDown,
  onCanvasDoubleClick,
  t
}) {
  const isPalletizing = activeConfigurator === "palletizing";

  const isDepalletizing = operationMode === "depalletizing";

  /*
    Durant la simulació d'offsets, la peça simulada no
    es mostra a la seva posició, ni tampoc les que:
    - paletitzant, encara no s'han col·locat (ID més gran);
    - despaletitzant, ja s'han agafat (ID més petit).
  */
  const simulatedPiece = offsetSimulation?.piece ?? null;
  // Una agafada múltiple es simula sencera
  const simulatedMemberIds = new Set(
    (offsetSimulation?.pieces ?? (simulatedPiece ? [simulatedPiece] : [])).map(
      (piece) => piece.id
    )
  );

  /*
    La simulació de capa substitueix totes les peces
    de l'editor per les de la capa simulada.
  */
  const isLayerSimulation = Boolean(layerSimulation);

  const visiblePieces = isLayerSimulation
    ? []
    : simulatedPiece
    ? pieces.filter(
        (piece) =>
          !simulatedMemberIds.has(piece.id) &&
          (isDepalletizing
            ? Number(piece.orderId) >= Number(simulatedPiece.orderId)
            : Number(piece.orderId) <= Number(simulatedPiece.orderId))
      )
    : pieces;

  /*
    Amb la pinça visible, la resta de peces queden
    atenuades.
  */
  const shouldDimOtherPieces =
    shouldShowAppliedGripper &&
    Boolean(activeGripper) &&
    Boolean(selectedData);

  function isPieceColliding(piece) {
    return (
      isPieceCollidingWithPallet(piece, activePallet) ||
      pieces.some(
        (otherPiece) =>
          otherPiece.id !== piece.id &&
          isPieceCollidingWithPiece(piece, otherPiece)
      )
    );
  }

  return (
    <Canvas
      shadows
      style={{ width: "100vw", height: "100vh" }}
      // La roda premuda desplaça l'escena: sense l'autodesplaçament del navegador
      onMouseDown={(event) => {
        if (event.button === 1) {
          event.preventDefault();
        }
      }}
      camera={{
        position: [2800, 2100, 2800],
        fov: 35,
        near: 1,
        far: 20000
      }}
      onCreated={({ camera, gl }) => {
        sceneCameraRef.current = camera;
        canvasElementRef.current = gl.domElement;
      }}
      onPointerDown={onCanvasPointerDown}
      onDoubleClick={onCanvasDoubleClick}
    >
      <color attach="background" args={["white"]} />
      <ambientLight intensity={0.8} />

      <directionalLight
        castShadow
        position={[1000, 2000, 1000]}
        intensity={1.5}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={6000}
        shadow-camera-left={-2500}
        shadow-camera-right={2500}
        shadow-camera-top={2500}
        shadow-camera-bottom={-2500}
      />

      <Pallet pallet={activePallet} />
      <PalletWorldAxes length={100} />

      {/* Tot el material seleccionat i centrat al palet */}
      {!isPalletizing && centerGuides && (centerGuides.x || centerGuides.y) && (
        <CenterGuides
          pallet={activePallet}
          showX={centerGuides.x}
          showY={centerGuides.y}
        />
      )}

      {!isPalletizing &&
        visiblePieces.map((piece) => (
          <DraggablePiece
            key={piece.id}
            piece={piece}
            selected={selectedPieceIds.includes(piece.id)}
            colliding={isPieceColliding(piece)}
            outside={isPieceOutsidePallet(piece, activePallet)}
            dimmed={
              shouldDimOtherPieces &&
              piece.id !== selectedData.id &&
              !selectedMemberIds?.includes(piece.id)
            }
            onSelect={pieceHandlers.selectPiece}
            onMove={pieceHandlers.movePiece}
            onDragStart={pieceHandlers.startPieceDrag}
            onDragEnd={pieceHandlers.finishPieceDrag}
            onReplicationStart={pieceHandlers.startPieceReplication}
            onReplicationMove={pieceHandlers.movePieceReplication}
            onReplicationEnd={pieceHandlers.finishPieceReplication}
            onReplicationCancel={
              pieceHandlers.cancelPieceReplication
            }
          />
        ))}

      {/* Agafades múltiples: contorns, TCP del grup i proposta en curs */}
      {!isPalletizing &&
        !isLayerSimulation &&
        !simulatedPiece &&
        graspOverlay &&
        (graspOverlay.groups.length > 0 || graspOverlay.draft) && (
          <GraspOverlay
            pieces={pieces}
            groups={graspOverlay.groups}
            draft={graspOverlay.draft}
            gripper={graspOverlay.gripper}
          />
        )}

      {!isPalletizing && replicationPreview && (
        <ReplicationPreview
          candidates={replicationPreview.candidates}
        />
      )}

      {activeConfigurator === "layers" && showOrderIds && (
        <PieceOrderIdLabels
          pieces={visiblePieces}
          validation={orderIdValidation}
          onChangeOrderId={onChangeOrderId}
          onDefineClick={onDefineOrderIdClick}
          t={t}
        />
      )}

      {isPalletizing &&
        palletizedLayerInstances.map((layerInstance) => (
          <PalletizedLayer
            key={layerInstance.instanceId}
            layerInstance={layerInstance}
            selected={
              layerInstance.instanceId ===
              selectedPalletizingInstanceId
            }
            onSelect={onSelectPalletizingInstance}
          />
        ))}

      {!replicationPreview &&
        !isPalletizing &&
        !simulatedPiece &&
        !isLayerSimulation &&
        activeGripper &&
        selectedData &&
        shouldShowAppliedGripper && (
          <AppliedGripper
            gripper={activeGripper}
            piece={selectedData}
            pose={selectedGripperPose}
            offsetPreview={gripperOffsetPreview}
          />
        )}

      {!isPalletizing && isLayerSimulation && (
        <LayerSimulation
          key={layerSimulation.runId}
          pieces={layerSimulation.pieces}
          gripper={activeGripper}
          getPieceOffsets={layerSimulation.getPieceOffsets}
          operationMode={operationMode}
          speed={layerSimulation.speed}
        />
      )}

      {!isPalletizing && !isLayerSimulation && simulatedPiece && (
        <OffsetSimulation
          key={offsetSimulation.runId}
          piece={simulatedPiece}
          pieces={offsetSimulation.pieces}
          pose={offsetSimulation.pose}
          gripper={activeGripper}
          offset={offsetSimulation.offset}
          mode={offsetSimulation.mode}
          carriesPiece={
            isDepalletizing
              ? offsetSimulation.mode === "retreat"
              : offsetSimulation.mode === "approach"
          }
          speed={offsetSimulation.speed}
        />
      )}

      <FloorGrid palletHeight={activePallet.sizeZ} />

      {/*
        Ratolí: roda = zoom, roda premuda = desplaçar,
        botó dret = girar. El botó esquerre queda lliure
        per clicar (seleccionar i arrossegar peces).
      */}
      <OrbitControls
        makeDefault
        ref={orbitControlsRef}
        enabled={!isDragging}
        target={orbitTarget}
        mouseButtons={SCENE_MOUSE_BUTTONS}
      />
    </Canvas>
  );
}
