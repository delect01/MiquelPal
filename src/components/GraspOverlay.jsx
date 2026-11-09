import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import {
  getGripperActiveZone,
  getPieceGripperPose,
  getPoseGripperMatrix,
  getToolPlaneExtents
} from "../utils/graspGeometry.js";
import { GRASP_COLOR } from "../utils/graspGroups.js";
import { GripperModel } from "./AppliedGripper.jsx";
import GripZonePlane from "./GripZonePlane.jsx";

// Peça que cal revisar dins una agafada (no és ni vermell ni blau)
const REVIEW_COLOR = "#d97706";
const OUTLINE_LIFT = 2;
const OUTLINE_MARGIN = 6;
const TCP_MARKER_RADIUS = 14;

const overlayLineProps = {
  transparent: true,
  depthTest: false,
  renderOrder: 990
};

/*
  Rectangle que envolta unes peces dins el pla de la
  cara agafada (eixos de l'eina de pose), just per fora
  de la peça més exterior: segueix les peces inclinades.
*/
function getFootprintPoints(pieces, pose, margin) {
  const extents = getToolPlaneExtents(pieces, pose.position, pose);

  if (!extents) {
    return null;
  }

  const z = extents.minZ - OUTLINE_LIFT;
  const minX = extents.minX - margin;
  const maxX = extents.maxX + margin;
  const minY = extents.minY - margin;
  const maxY = extents.maxY + margin;

  return [
    [minX, minY],
    [maxX, minY],
    [maxX, maxY],
    [minX, maxY],
    [minX, minY]
  ].map(([x, y]) => {
    const point = pose.position
      .clone()
      .addScaledVector(pose.tangentX, x)
      .addScaledVector(pose.tangentY, y)
      .addScaledVector(pose.toolZ, z);
    return [point.x, point.y, point.z];
  });
}

function Footprint({ pieces, pose, color, dashed = false, margin = OUTLINE_MARGIN, lineWidth = 2.5 }) {
  const points = getFootprintPoints(pieces, pose, margin);

  if (!points) {
    return null;
  }

  return (
    <Line
      points={points}
      color={color}
      lineWidth={lineWidth}
      dashed={dashed}
      dashSize={18}
      gapSize={10}
      {...overlayLineProps}
    />
  );
}

// Un sol TCP per a tota l'agafada: rombe del color de les agafades
function GraspTcpMarker({ position, color }) {
  return (
    <mesh
      position={[position.x, position.y, position.z]}
      renderOrder={991}
      raycast={() => null}
    >
      <octahedronGeometry args={[TCP_MARKER_RADIUS, 0]} />
      <meshBasicMaterial color={color} depthTest={false} transparent opacity={0.95} />
    </mesh>
  );
}

// Zona d'aspiració de la pinça, a la cara de l'eina
function ActiveZone({ gripper, pose }) {
  const points = useMemo(() => {
    const zone = getGripperActiveZone(gripper);

    if (!zone) {
      return null;
    }

    const matrix = getPoseGripperMatrix(gripper, pose);
    const halfX = zone.sizeX / 2;
    const halfY = zone.sizeY / 2;

    return [
      [-halfX, -halfY],
      [halfX, -halfY],
      [halfX, halfY],
      [-halfX, halfY],
      [-halfX, -halfY]
    ].map(([x, y]) => {
      const point = new THREE.Vector3(zone.centerX + x, zone.centerY + y, 0)
        .applyMatrix4(matrix);
      return [point.x, point.y + OUTLINE_LIFT, point.z];
    });
  }, [gripper, pose]);

  return points ? (
    <Line points={points} color={GRASP_COLOR} lineWidth={2} {...overlayLineProps} />
  ) : null;
}

/*
  AGAFADES MÚLTIPLES A L'ESCENA

  - Agafada confirmada: contorn continu violeta al
    voltant del grup i un sol TCP (rombe). Si cal
    revisar-la, en taronja.
  - Proposta en curs ("Definir agafades"): la pinça
    semitransparent a la seva posició, la zona
    d'aspiració, un contorn discontinu per peça i el TCP
    del grup. Les peces amb problemes, en taronja.
*/
export default function GraspOverlay({ pieces, groups, draft, gripper }) {
  const piecesById = new Map(pieces.map((piece) => [piece.id, piece]));
  const getPieces = (ids) => ids.map((id) => piecesById.get(id)).filter(Boolean);

  return (
    <group>
      {groups
        .filter((group) => group.groupId !== draft?.groupId)
        .map((group) => {
          const color = group.issues.length > 0 ? REVIEW_COLOR : GRASP_COLOR;

          return (
            <group key={group.groupId}>
              <Footprint pieces={getPieces(group.memberIds)} pose={group.pose} color={color} />
              <GraspTcpMarker position={group.pose.position} color={color} />
            </group>
          );
        })}

      {draft && (
        <group>
          {gripper && (
            <GripperModel
              gripper={gripper}
              targetMatrix={getPoseGripperMatrix(gripper, draft.pose)}
              ghost
            />
          )}

          {gripper && <ActiveZone gripper={gripper} pose={draft.pose} />}
          {gripper && (
            <group
              matrix={getPoseGripperMatrix(gripper, draft.pose)}
              matrixAutoUpdate={false}
            >
              <GripZonePlane zone={getGripperActiveZone(gripper)} opacity={0.3} />
            </group>
          )}

          {getPieces(draft.memberIds).map((piece) => (
            <Footprint
              key={piece.id}
              pieces={[piece]}
              pose={getPieceGripperPose(piece)}
              color={
                draft.issues.some((issue) => issue.pieceId === piece.id)
                  ? REVIEW_COLOR
                  : GRASP_COLOR
              }
              dashed
              margin={2}
              lineWidth={2}
            />
          ))}

          <GraspTcpMarker position={draft.pose.position} color={GRASP_COLOR} />
        </group>
      )}
    </group>
  );
}
