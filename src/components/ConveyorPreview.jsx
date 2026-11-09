import { useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  Edges,
  Html,
  OrbitControls
} from "@react-three/drei";
import * as THREE from "three";
import { StoredPreviewModel } from "./PiecePreview.jsx";
import { GripperModel } from "./AppliedGripper.jsx";
import { buildGripperTargetMatrix } from "../utils/gripperTransform.js";
import {
  getPalletToThreeBasisQuaternion,
  palletVectorToThree
} from "../utils/pieceUtils.js";
import {
  CONVEYOR_GEOMETRY,
  getContactFaceTriangles,
  getConveyorBeltWidth
} from "../utils/conveyorPlacement.js";

/*
  Colors propis d'aquest visualitzador. No coincideixen
  amb els de selecció (blanc), col·lisió (cian) o fora
  del palet (groc) de l'editor.
*/
const COLORS = {
  belt: "#2e9e44",
  beltEdge: "#1d6b2d",
  arrow: "#e8f7ec",
  piece: "#f28c28",
  hoverFace: "#ffd400",
  contactFace: "#1565c0",
  graspFace: "#ec4899",
  frameX: "#d62828",
  frameY: "#2a9d3a",
  frameZ: "#1d4ed8",
  tcp: "#d946ef",
  tcpX: "#ff8c00",
  tcpY: "#8b5cf6",
  tcpZ: "#00b8d9"
};

// Ignora el raycast: la cinta no bloqueja la selecció de cares
function noRaycast() {
  return null;
}

const BASIS_QUATERNION = getPalletToThreeBasisQuaternion();
const INVERSE_BASIS_QUATERNION = BASIS_QUATERNION.clone().invert();

function toTuple(quaternion) {
  return [quaternion.x, quaternion.y, quaternion.z, quaternion.w];
}

function useFaceGeometry(positions, triangleFaceIds, faceId) {
  const geometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();

    let selectedPositions = positions;

    if (faceId !== undefined) {
      selectedPositions = [];

      triangleFaceIds.forEach((triangleFaceId, triangleIndex) => {
        if (triangleFaceId === faceId) {
          selectedPositions.push(
            ...positions.slice(triangleIndex * 9, triangleIndex * 9 + 9)
          );
        }
      });
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(selectedPositions, 3)
    );
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();

    return geometry;
  }, [positions, triangleFaceIds, faceId]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return geometry;
}

function FaceHighlight({ positions, triangleFaceIds, faceId, color, opacity }) {
  const geometry = useFaceGeometry(positions, triangleFaceIds, faceId);

  return (
    <mesh geometry={geometry} raycast={noRaycast} renderOrder={4}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        // Només la cara visible: una cara que mira avall no surt per sobre
        side={THREE.FrontSide}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-4}
      />
    </mesh>
  );
}

/*
  Peça en coordenades locals de Three.js (com a la resta
  del programa). Permet passar el cursor per les cares
  i clicar-les per triar la cara de contacte.
*/
function PickablePiece({
  piece,
  contactFaceId,
  graspFaceId,
  onSelectContactFace,
  onImportedDimensions
}) {
  const [hoveredFaceId, setHoveredFaceId] = useState(null);

  const { positions, triangleFaceIds } = useMemo(
    () => getContactFaceTriangles(piece),
    [piece]
  );

  const pickGeometry = useFaceGeometry(positions, triangleFaceIds);
  const isImported = piece.pieceType === "IMPORTED_3D";

  useEffect(() => () => {
    document.body.style.cursor = "";
  }, []);

  function getFaceId(event) {
    return triangleFaceIds[event.faceIndex] ?? null;
  }

  return (
    <>
      {isImported && piece.modelId && (
        <StoredPreviewModel
          modelId={piece.modelId}
          bottomFace={piece.modelBottomFace ?? "NEGATIVE_Y"}
          onDimensions={onImportedDimensions}
        />
      )}

      <mesh
        geometry={pickGeometry}
        onPointerMove={(event) => {
          event.stopPropagation();
          setHoveredFaceId(getFaceId(event));
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHoveredFaceId(null);
          document.body.style.cursor = "";
        }}
        onClick={(event) => {
          // Un arrossegament de càmera no és un clic
          if (event.delta > 5) {
            return;
          }

          event.stopPropagation();

          const faceId = getFaceId(event);

          if (faceId !== null) {
            onSelectContactFace(faceId);
          }
        }}
      >
        <meshStandardMaterial
          color={COLORS.piece}
          roughness={0.55}
          metalness={0}
          // Importades: es veu el model; aquesta malla només serveix per clicar
          transparent={isImported}
          opacity={isImported ? 0 : 1}
          depthWrite={!isImported}
        />
        {!isImported && <Edges threshold={15} color="#202020" />}
      </mesh>

      {contactFaceId && (
        <FaceHighlight
          positions={positions}
          triangleFaceIds={triangleFaceIds}
          faceId={contactFaceId}
          color={COLORS.contactFace}
          opacity={0.55}
        />
      )}

      {/* Cara d'agafada: pot coincidir amb la de contacte, però és un altre concepte */}
      {graspFaceId && graspFaceId !== contactFaceId && (
        <FaceHighlight
          positions={positions}
          triangleFaceIds={triangleFaceIds}
          faceId={graspFaceId}
          color={COLORS.graspFace}
          opacity={0.5}
        />
      )}

      {hoveredFaceId && hoveredFaceId !== contactFaceId && (
        <FaceHighlight
          positions={positions}
          triangleFaceIds={triangleFaceIds}
          faceId={hoveredFaceId}
          color={COLORS.hoverFace}
          opacity={0.5}
        />
      )}
    </>
  );
}

function Arrow({ from, direction, length, color, label, labelColor }) {
  const arrow = useMemo(() => {
    const helper = new THREE.ArrowHelper(
      direction.clone().normalize(),
      from,
      length,
      color,
      Math.min(length * 0.22, 40),
      Math.min(length * 0.12, 22)
    );

    helper.traverse((child) => {
      child.raycast = noRaycast;
    });

    return helper;
  }, [from, direction, length, color]);

  const tip = from.clone().addScaledVector(direction.clone().normalize(), length * 1.12);

  return (
    <>
      <primitive object={arrow} />
      {label && (
        <Html position={[tip.x, tip.y, tip.z]} center>
          <div
            style={{
              color: labelColor ?? color,
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: "12px",
              fontWeight: 800,
              textShadow: "0 0 3px #ffffff, 0 0 3px #ffffff",
              pointerEvents: "none",
              whiteSpace: "nowrap"
            }}
          >
            {label}
          </div>
        </Html>
      )}
    </>
  );
}

const ORIGIN = new THREE.Vector3(0, 0, 0);
const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);
const AXIS_Z = new THREE.Vector3(0, 0, 1);

/*
  Cinta transportadora en coordenades del frame de la
  cinta: superfície a Z = 0, lateral dret a Y = 0,
  avanç cap a +X.
*/
function ConveyorBelt({ width, frontX, t }) {
  const rearX = -CONVEYOR_GEOMETRY.rearLength;
  const length = frontX - rearX;
  const thickness = CONVEYOR_GEOMETRY.thickness;

  // Fletxes d'avanç repartides sobre la cinta
  const arrowPositions = [];
  for (let x = rearX + 250; x < frontX - 120; x += 450) {
    arrowPositions.push(x);
  }

  const arrowGeometry = useMemo(() => {
    const size = Math.min(Math.max(width * 0.35, 40), 140);
    const shape = new THREE.Shape();
    shape.moveTo(size * 0.6, 0);
    shape.lineTo(-size * 0.4, size * 0.45);
    shape.lineTo(-size * 0.15, 0);
    shape.lineTo(-size * 0.4, -size * 0.45);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, [width]);

  useEffect(() => () => arrowGeometry.dispose(), [arrowGeometry]);

  const frameLength = Math.min(Math.max(width * 0.6, 120), 300);

  return (
    <group>
      <mesh
        position={[(rearX + frontX) / 2, width / 2, -thickness / 2]}
        raycast={noRaycast}
        receiveShadow
      >
        <boxGeometry args={[length, width, thickness]} />
        <meshStandardMaterial color={COLORS.belt} roughness={0.8} />
        <Edges threshold={15} color={COLORS.beltEdge} />
      </mesh>

      {arrowPositions.map((x) => (
        <mesh
          key={x}
          geometry={arrowGeometry}
          position={[x, width / 2, 0.6]}
          raycast={noRaycast}
        >
          <meshBasicMaterial color={COLORS.arrow} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Frame de la cinta: origen al lateral dret */}
      <mesh position={[0, 0, 0]} raycast={noRaycast}>
        <sphereGeometry args={[8, 16, 16]} />
        <meshBasicMaterial color="#111827" />
      </mesh>
      <Arrow from={ORIGIN} direction={AXIS_X} length={frameLength} color={COLORS.frameX} label="X" />
      {/* Dins del marge lateral, perquè la peça no el tapi */}
      <Arrow from={ORIGIN} direction={AXIS_Y} length={CONVEYOR_GEOMETRY.sideMargin * 0.85} color={COLORS.frameY} label="Y" />
      <Arrow from={ORIGIN} direction={AXIS_Z} length={frameLength} color={COLORS.frameZ} label="Z" />
      <Html position={[0, -30, -20]} center>
        <div
          style={{
            padding: "2px 6px",
            borderRadius: "4px",
            background: "rgba(255,255,255,0.85)",
            color: "#111827",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "11px",
            fontWeight: 700,
            pointerEvents: "none",
            whiteSpace: "nowrap"
          }}
        >
          {t.conveyor.frameLabel}
        </div>
      </Html>
    </group>
  );
}

/*
  TCP: esfera, eixos propis i línia fins al centre de
  la cara d'agafada (quan hi ha offsets).
*/
function TcpMarker({ tcpPose, axisLength, markerRadius, t }) {
  const offsetLine = useMemo(() => {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        tcpPose.graspFaceCenter,
        tcpPose.position
      ]),
      new THREE.LineDashedMaterial({
        color: COLORS.tcp,
        dashSize: 6,
        gapSize: 4
      })
    );

    // Necessari perquè la línia es vegi discontínua
    line.computeLineDistances();
    line.raycast = noRaycast;

    return line;
  }, [tcpPose]);

  useEffect(
    () => () => {
      offsetLine.geometry.dispose();
      offsetLine.material.dispose();
    },
    [offsetLine]
  );

  const axes = useMemo(
    () => ({
      x: AXIS_X.clone().applyQuaternion(tcpPose.quaternion),
      y: AXIS_Y.clone().applyQuaternion(tcpPose.quaternion),
      z: AXIS_Z.clone().applyQuaternion(tcpPose.quaternion)
    }),
    [tcpPose]
  );

  const hasOffset =
    tcpPose.graspFaceCenter.distanceTo(tcpPose.position) > 0.5;

  return (
    <group>
      <mesh position={tcpPose.position} raycast={noRaycast} renderOrder={6}>
        <sphereGeometry args={[markerRadius, 16, 16]} />
        <meshBasicMaterial color={COLORS.tcp} depthTest={false} />
      </mesh>

      {hasOffset && <primitive object={offsetLine} />}

      <Arrow from={tcpPose.position} direction={axes.x} length={axisLength} color={COLORS.tcpX} />
      <Arrow from={tcpPose.position} direction={axes.y} length={axisLength} color={COLORS.tcpY} />
      <Arrow from={tcpPose.position} direction={axes.z} length={axisLength} color={COLORS.tcpZ} />

      <Html position={[tcpPose.position.x, tcpPose.position.y, tcpPose.position.z]} center>
        <div
          style={{
            transform: "translate(18px, -18px)",
            padding: "2px 6px",
            borderRadius: "4px",
            background: COLORS.tcp,
            color: "#ffffff",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "11px",
            fontWeight: 800,
            pointerEvents: "none",
            whiteSpace: "nowrap"
          }}
        >
          {t.conveyor.tcpLabel}
        </div>
      </Html>
    </group>
  );
}

// Direcció de la càmera: vista elevada des del davant-dreta
const CAMERA_DIRECTION = new THREE.Vector3(1, 0.75, 1).normalize();

/*
  Enquadra la peça i un tros de cinta. Només es torna a
  fer quan canvia la peça (fitKey), no en girar-la, perquè
  l'operari no perdi el punt de vista.
*/
function CameraFramer({ fitKey, target, size }) {
  const getThreeState = useThree((state) => state.get);
  // Només per tornar a enquadrar quan els controls estan llestos
  const controlsReady = useThree((state) => Boolean(state.controls));

  useEffect(() => {
    const { camera, controls } = getThreeState();

    // Distància perquè l'objecte de mida "size" hi càpiga
    const distance =
      (size / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.2;

    camera.position
      .copy(target)
      .addScaledVector(CAMERA_DIRECTION, distance);
    camera.near = Math.max(distance / 1000, 0.5);
    camera.far = distance * 100;
    camera.updateProjectionMatrix();

    if (controls) {
      controls.target.copy(target);
      controls.update();
    } else {
      camera.lookAt(target);
    }
    // Només en canviar de peça o quan els controls estan llestos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, controlsReady]);

  return null;
}

/*
  Visualitzador de la peça sobre la cinta transportadora.

  Tot el contingut es dibuixa en coordenades del frame
  de la cinta dins d'un grup amb la base robot → Three.js
  (getPalletToThreeBasisQuaternion). La peça, que té la
  geometria en coordenades locals de Three.js, es posa
  dins d'un subgrup amb la base inversa.
*/
export default function ConveyorPreview({
  piece,
  placementResult,
  fitKey,
  graspFaceId = null,
  height = "380px",
  gripper = null,
  showGripper = false,
  onSelectContactFace,
  onImportedDimensions,
  t
}) {
  const { piecePose, tcpPose } = placementResult;
  const hasPose = piecePose.ok;

  const beltWidth = hasPose
    ? piecePose.beltWidth
    : getConveyorBeltWidth();

  const frontX = hasPose
    ? Math.max(CONVEYOR_GEOMETRY.frontLength, piecePose.footprint.maxX + 200)
    : CONVEYOR_GEOMETRY.frontLength;

  const pieceHeight = hasPose ? piecePose.footprint.height : Number(piece.height) || 100;

  /*
    Centre a enquadrar: la peça sobre la cinta, una mica
    desplaçat cap enrere per veure també la cinta.
  */
  const framingSize = Math.max(
    Number(piece.width) || 0,
    Number(piece.depth) || 0,
    pieceHeight,
    beltWidth,
    400
  ) * 1.15;

  const framingTarget = palletVectorToThree(
    new THREE.Vector3(
      hasPose ? (piecePose.footprint.minX + piecePose.footprint.maxX) / 2 - framingSize * 0.15 : 0,
      beltWidth / 2,
      pieceHeight / 2
    )
  );

  const largestDimension = Math.max(
    Number(piece.width) || 0,
    Number(piece.depth) || 0,
    Number(piece.height) || 0
  );

  // Marcador del TCP proporcional a la peça
  const tcpAxisLength = Math.min(Math.max(largestDimension * 0.55, 80), 260);
  const tcpMarkerRadius = Math.max(largestDimension * 0.035, 6);

  return (
    <div
      style={{
        width: "100%",
        height,
        position: "relative",
        background: "#eef1f4",
        border: "1px solid #aeb6bf",
        borderRadius: "8px",
        overflow: "hidden"
      }}
    >
      <Canvas
        shadows
        camera={{ position: [900, 650, 900], near: 1, far: 100000, fov: 45 }}
      >
        <color attach="background" args={["#eef1f4"]} />
        <ambientLight intensity={1.05} />
        <directionalLight castShadow position={[600, 1200, 800]} intensity={1.4} />
        <directionalLight position={[-500, 400, -600]} intensity={0.5} />

        <group quaternion={toTuple(BASIS_QUATERNION)}>
          <ConveyorBelt width={beltWidth} frontX={frontX} t={t} />

            {hasPose && (
              <group
                position={[
                  piecePose.position.x,
                  piecePose.position.y,
                  piecePose.position.z
                ]}
                quaternion={toTuple(piecePose.quaternion)}
              >
                <group quaternion={toTuple(INVERSE_BASIS_QUATERNION)}>
                  <PickablePiece
                    piece={piece}
                    contactFaceId={piecePose.placement.contactFaceId}
                    graspFaceId={graspFaceId}
                    onSelectContactFace={onSelectContactFace}
                    onImportedDimensions={onImportedDimensions}
                  />
                </group>
              </group>
            )}

          {/* Importada encara sense geometria: es carrega el model */}
          {!hasPose && piece.pieceType === "IMPORTED_3D" && piece.modelId && (
            <group visible={false}>
              <StoredPreviewModel
                modelId={piece.modelId}
                bottomFace={piece.modelBottomFace ?? "NEGATIVE_Y"}
                onDimensions={onImportedDimensions}
              />
            </group>
          )}

          {/*
            Pinça al TCP calculat, en coordenades de la cinta:
            la mateixa pinça (i "robot front") que sobre el palet.
          */}
          {tcpPose.valid && showGripper && gripper && (
            <GripperModel
              gripper={gripper}
              targetMatrix={buildGripperTargetMatrix(
                gripper,
                tcpPose.position,
                tcpPose.quaternion
              )}
            />
          )}

          {tcpPose.valid && (
            <TcpMarker
              tcpPose={tcpPose}
              axisLength={tcpAxisLength}
              markerRadius={tcpMarkerRadius}
              t={t}
            />
          )}
        </group>

        <CameraFramer
          fitKey={fitKey}
          target={framingTarget}
          size={framingSize}
        />

        <OrbitControls
          makeDefault
          enableRotate
          enableZoom
          enablePan
          minDistance={10}
          maxDistance={100000}
        />
      </Canvas>
    </div>
  );
}
