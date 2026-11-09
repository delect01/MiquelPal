import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Edges } from "@react-three/drei";
import {
  getPieceCenter,
  getReferenceAxes,
  palletEulerToThreeQuaternion,
  getReferenceWorldPositionThree
} from "../utils/pieceUtils.js";
import { getPieceLocalVertices } from "../utils/pieceGeometry.js";
import { getPieceCollisionGeometry } from "../utils/collisionGeometryStore.js";
import ImportedPieceModel from "./ImportedPieceModel.jsx";
import ImportedCollisionOutline from "./ImportedCollisionOutline.jsx";

const DRAG_START_DISTANCE_PX = 6;
const DIMMED_OPACITY = 0.24;

export default function DraggablePiece({
  piece,
  selected,
  colliding,
  outside,
  dimmed = false,
  onSelect,
  onMove,
  onDragStart,
  onDragEnd,
  onReplicationStart,
  onReplicationMove,
  onReplicationEnd,
  onReplicationCancel
}) {
  const isPointerDown = useRef(false);
  const hasStartedDrag = useRef(false);
  const isReplicating = useRef(false);
  const wantsReplication = useRef(false);
  const capturedTarget = useRef(null);
  const capturedPointerId = useRef(null);
  const pointerDownScreenPosition = useRef({ x: 0, y: 0 });

  const dragPlane = useMemo(() => new THREE.Plane(), []);
  const intersectionPoint = useMemo(() => new THREE.Vector3(), []);
  const dragOffset = useMemo(() => new THREE.Vector3(), []);

  const pieceCenter = getPieceCenter(piece);
  const referenceWorldPosition = getReferenceWorldPositionThree(piece);
  const pieceThreeQuaternion = palletEulerToThreeQuaternion(
    piece.rxDeg,
    piece.ryDeg,
    piece.rzDeg
  );
  const referenceAxes = getReferenceAxes(piece, true, true);

  const isImportedPiece =
    piece.pieceType === "IMPORTED_3D" && Boolean(piece.modelId);

  // Volum compartit del model (null mentre es calcula)
  const collisionGeometry = getPieceCollisionGeometry(piece);

  const importedVisualState = selected
    ? "selected"
    : colliding
      ? "colliding"
      : outside
        ? "outside"
        : "normal";

  const stateColor = selected
    ? "white"
    : colliding
      ? "cyan"
      : outside
        ? "#d6a900"
        : "black";

  const arrowDependencies = [
    piece.referencePoint,
    piece.faceRotationDeg,
    piece.rxDeg,
    piece.ryDeg,
    piece.rzDeg,
    piece.pieceType,
    piece.width,
    piece.height,
    piece.depth,
    piece.topWidth,
    piece.topDepth,
    collisionGeometry
  ];

  const xArrow = useMemo(
    () => new THREE.ArrowHelper(
      referenceAxes.tangentX.clone().normalize(),
      new THREE.Vector3(0, 0, 0),
      150,
      0xff0000
    ),
    arrowDependencies
  );

  const yArrow = useMemo(
    () => new THREE.ArrowHelper(
      referenceAxes.tangentY.clone().normalize(),
      new THREE.Vector3(0, 0, 0),
      150,
      0x00ff00
    ),
    arrowDependencies
  );

  const zArrow = useMemo(
    () => new THREE.ArrowHelper(
      referenceAxes.toolZ.clone().normalize(),
      new THREE.Vector3(0, 0, 0),
      150,
      0x0000ff
    ),
    arrowDependencies
  );

  function getSourceEvent(event) {
    return event.nativeEvent ?? event.sourceEvent ?? event;
  }

  function releasePointerCapture() {
    const target = capturedTarget.current;
    const pointerId = capturedPointerId.current;

    if (
      target &&
      pointerId !== null &&
      typeof target.hasPointerCapture === "function" &&
      target.hasPointerCapture(pointerId)
    ) {
      target.releasePointerCapture(pointerId);
    }

    capturedTarget.current = null;
    capturedPointerId.current = null;
  }

  function resetInteraction() {
    isPointerDown.current = false;
    hasStartedDrag.current = false;
    isReplicating.current = false;
    wantsReplication.current = false;
    releasePointerCapture();
  }

  function finishInteraction() {
    const interactionWasActive = isPointerDown.current;
    resetInteraction();
    if (interactionWasActive) onDragEnd();
  }

  useEffect(() => {
    function handleEscape(event) {
      if (event.key !== "Escape" || !isPointerDown.current) return;
      event.preventDefault();
      event.stopPropagation();
      if (isReplicating.current) onReplicationCancel();
      finishInteraction();
    }

    window.addEventListener("keydown", handleEscape, true);
    return () => window.removeEventListener("keydown", handleEscape, true);
  }, [onReplicationCancel, onDragEnd]);

  function handlePointerDown(event) {
    const sourceEvent = getSourceEvent(event);

    /*
      Només el botó esquerre selecciona i arrossega
      peces. El dret (girar) i la roda (desplaçar) són
      per a la càmera, encara que es premin sobre una
      peça.
    */
    if (sourceEvent.button !== undefined && sourceEvent.button !== 0) {
      return;
    }

    event.stopPropagation();
    sourceEvent.piecePointerHandled = true;

    dragPlane.set(new THREE.Vector3(0, 1, 0), -pieceCenter.y);
    const intersection = event.ray.intersectPlane(dragPlane, intersectionPoint);
    if (!intersection) return;

    const canReplicate =
      sourceEvent.ctrlKey && piece.pieceCategory !== "SEPARATOR";
    const additiveSelection =
      sourceEvent.shiftKey ||
      (sourceEvent.ctrlKey && piece.pieceCategory === "SEPARATOR");

    // Alt: només aquesta peça, encara que sigui d'una agafada múltiple
    const selectionOptions = { single: Boolean(sourceEvent.altKey) };

    if (canReplicate) onSelect(piece.id, false, selectionOptions);
    else if (additiveSelection) onSelect(piece.id, true, selectionOptions);
    else if (!selected) onSelect(piece.id, false, selectionOptions);

    dragOffset.set(
      pieceCenter.x - intersection.x,
      0,
      pieceCenter.z - intersection.z
    );

    pointerDownScreenPosition.current = {
      x: Number(sourceEvent.clientX) || 0,
      y: Number(sourceEvent.clientY) || 0
    };

    isPointerDown.current = true;
    hasStartedDrag.current = false;
    isReplicating.current = false;
    wantsReplication.current = canReplicate;

    onDragStart(piece.id, pieceCenter.x, pieceCenter.z, selectionOptions);
    capturedTarget.current = event.currentTarget;
    capturedPointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!isPointerDown.current) return;
    event.stopPropagation();
    const sourceEvent = getSourceEvent(event);

    if (!hasStartedDrag.current) {
      const deltaScreenX =
        (Number(sourceEvent.clientX) || 0) - pointerDownScreenPosition.current.x;
      const deltaScreenY =
        (Number(sourceEvent.clientY) || 0) - pointerDownScreenPosition.current.y;

      if (Math.hypot(deltaScreenX, deltaScreenY) < DRAG_START_DISTANCE_PX) {
        return;
      }

      hasStartedDrag.current = true;
      if (wantsReplication.current) {
        isReplicating.current = true;
        onReplicationStart(piece.id, pieceCenter.x, pieceCenter.z);
      }
    }

    const intersection = event.ray.intersectPlane(dragPlane, intersectionPoint);
    if (!intersection) return;

    const nextThreeX = intersection.x + dragOffset.x;
    const nextThreeZ = intersection.z + dragOffset.z;

    if (isReplicating.current) {
      onReplicationMove(nextThreeX, nextThreeZ);
      return;
    }

    onMove(piece.id, nextThreeX, nextThreeZ);
  }

  function handlePointerUp(event) {
    if (!isPointerDown.current) return;
    event.stopPropagation();
    if (hasStartedDrag.current && isReplicating.current) onReplicationEnd();
    finishInteraction();
  }

  function handlePointerCancel(event) {
    if (!isPointerDown.current) return;
    event.stopPropagation();
    if (isReplicating.current) onReplicationCancel();
    finishInteraction();
  }

  const trapezoidGeometry = useMemo(() => {
    if (piece.pieceType !== "TRAPEZOIDAL") return null;

    const vertices = getPieceLocalVertices(piece).flatMap(
      (vertex) => [vertex.x, vertex.y, vertex.z]
    );
    const indices = [
      0, 1, 2, 0, 2, 3,
      4, 6, 5, 4, 7, 6,
      0, 4, 5, 0, 5, 1,
      1, 5, 6, 1, 6, 2,
      2, 6, 7, 2, 7, 3,
      3, 7, 4, 3, 4, 0
    ];

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }, [
    piece.width,
    piece.depth,
    piece.height,
    piece.topWidth,
    piece.topDepth,
    piece.pieceType
  ]);

  useEffect(() => () => trapezoidGeometry?.dispose(), [trapezoidGeometry]);

  const parametricOpacity = dimmed ? DIMMED_OPACITY : 1;

  return (
    <>
      <group
        position={[pieceCenter.x, pieceCenter.y, pieceCenter.z]}
        quaternion={[
          pieceThreeQuaternion.x,
          pieceThreeQuaternion.y,
          pieceThreeQuaternion.z,
          pieceThreeQuaternion.w
        ]}
      >
        {isImportedPiece && (
          <>
            <ImportedPieceModel
              modelId={piece.modelId}
              bottomFace={piece.modelBottomFace ?? "NEGATIVE_Y"}
              visualState={importedVisualState}
              dimmed={dimmed}
              color={piece.color || "orange"}
            />

            {/* Contorn sempre visible, com a les peces creades */}
            <ImportedCollisionOutline
              collisionGeometry={collisionGeometry}
              color={stateColor}
            />
          </>
        )}

        <mesh
          castShadow={!isImportedPiece && !dimmed}
          receiveShadow={!isImportedPiece}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          {piece.pieceType === "TRAPEZOIDAL" ? (
            <primitive object={trapezoidGeometry} attach="geometry" />
          ) : (
            <boxGeometry args={[piece.width, piece.height, piece.depth]} />
          )}

          {/*
            La key fa un material nou en atenuar-se: three
            no recompila el shader quan només canvia
            transparent, i la peça quedaria opaca.
          */}
          <meshStandardMaterial
            key={dimmed ? "dimmed" : "solid"}
            color={
              selected
                ? "red"
                : colliding
                  ? "blue"
                  : outside
                    ? "yellow"
                    : piece.color || "orange"
            }
            transparent={isImportedPiece || dimmed}
            opacity={isImportedPiece ? 0 : parametricOpacity}
            depthWrite={!isImportedPiece && !dimmed}
            colorWrite={!isImportedPiece}
            roughness={piece.pieceCategory === "SEPARATOR" ? 0.82 : 0.65}
            metalness={0}
          />

          <Edges
            threshold={15}
            color={stateColor}
            visible={!isImportedPiece}
          />
        </mesh>
      </group>

      <mesh
        position={[
          referenceWorldPosition.x,
          referenceWorldPosition.y,
          referenceWorldPosition.z
        ]}
      >
        <sphereGeometry args={[15, 16, 16]} />
        <meshStandardMaterial color="lime" />
      </mesh>

      <group position={[
        referenceWorldPosition.x,
        referenceWorldPosition.y,
        referenceWorldPosition.z
      ]}>
        <primitive object={xArrow} />
      </group>

      <group position={[
        referenceWorldPosition.x,
        referenceWorldPosition.y,
        referenceWorldPosition.z
      ]}>
        <primitive object={yArrow} />
      </group>

      <group position={[
        referenceWorldPosition.x,
        referenceWorldPosition.y,
        referenceWorldPosition.z
      ]}>
        <primitive object={zArrow} />
      </group>
    </>
  );
}
