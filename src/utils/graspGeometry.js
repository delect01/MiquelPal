import * as THREE from "three";
import {
  getReferenceAxes,
  getReferenceWorldPositionThree
} from "./pieceUtils.js";
import { getPieceWorldVertices } from "./pieceGeometry.js";
import {
  hasImportedConvexGeometry,
  getImportedConvexWorldVertices
} from "./importedConvexGeometry.js";
import { buildGripperTargetMatrix } from "./gripperTransform.js";
import {
  getGraspGroupId,
  getGraspGroupLead,
  getGraspGroupMembers
} from "./graspGroups.js";

// Diferència d'altura màxima entre les cares agafades (mm)
export const GRASP_HEIGHT_TOLERANCE_MM = 1;
// Marge per al TCP que cau just a la vora de la zona (mm)
const ZONE_EDGE_TOLERANCE_MM = 0.5;
const PARALLEL_DOT = 0.999;

/*
  POSE DE LA PINÇA

  { position, tangentX, tangentY, toolZ } en Three.js.
  - Agafada individual: el TCP de la peça (com sempre).
  - Agafada múltiple: la direcció de l'eina de la peça
    guia, al centre del rectangle que envolta el grup i
    a l'altura de la cara agafada de la guia, més
    l'ajust manual (sobre els eixos de l'eina).
*/
export function getPieceGripperPose(piece) {
  const axes = getReferenceAxes(piece, true, true);

  return {
    position: getReferenceWorldPositionThree(piece),
    tangentX: axes.tangentX.clone().normalize(),
    tangentY: axes.tangentY.clone().normalize(),
    toolZ: axes.toolZ.clone().normalize()
  };
}

// Vèrtexs reals de la peça (forma importada o capsa) en Three.js
function getPieceVertices(piece) {
  return hasImportedConvexGeometry(piece)
    ? getImportedConvexWorldVertices(piece)
    : getPieceWorldVertices(piece);
}

/*
  Extensió d'unes peces mesurada en els eixos de
  l'eina, des d'un punt d'origen:
  - minX/maxX, minY/maxY: dins el pla de la cara agafada;
  - minZ: el punt més exterior (contra la pinça).
  Així els rectangles i el centre segueixen el pla de
  les peces encara que estiguin inclinades.
*/
export function getToolPlaneExtents(pieces, origin, pose) {
  const extents = {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity,
    minZ: Infinity
  };
  const offset = new THREE.Vector3();

  pieces.forEach((piece) => {
    getPieceVertices(piece).forEach((vertex) => {
      offset.copy(vertex).sub(origin);
      const x = offset.dot(pose.tangentX);
      const y = offset.dot(pose.tangentY);
      const z = offset.dot(pose.toolZ);

      extents.minX = Math.min(extents.minX, x);
      extents.maxX = Math.max(extents.maxX, x);
      extents.minY = Math.min(extents.minY, y);
      extents.maxY = Math.max(extents.maxY, y);
      extents.minZ = Math.min(extents.minZ, z);
    });
  });

  return Number.isFinite(extents.minX) ? extents : null;
}

export function getGraspPose(members, lead, adjust = null) {
  const leadPose = getPieceGripperPose(lead);

  if (members.length < 2) {
    return leadPose;
  }

  // Centre del grup dins el pla de la cara agafada (també inclinada)
  const extents = getToolPlaneExtents(members, leadPose.position, leadPose);
  const position = leadPose.position.clone();

  if (extents) {
    position
      .addScaledVector(leadPose.tangentX, (extents.minX + extents.maxX) / 2)
      .addScaledVector(leadPose.tangentY, (extents.minY + extents.maxY) / 2);
  }

  position
    .addScaledVector(leadPose.tangentX, Number(adjust?.x) || 0)
    .addScaledVector(leadPose.tangentY, Number(adjust?.y) || 0);

  return { ...leadPose, position };
}

// Pose de l'agafada a què pertany la peça (individual o múltiple)
export function getOperationGripperPose(pieces, piece) {
  const groupId = getGraspGroupId(piece);

  if (groupId === null) {
    return getPieceGripperPose(piece);
  }

  const lead = getGraspGroupLead(pieces, groupId);
  return getGraspPose(
    getGraspGroupMembers(pieces, groupId),
    lead,
    lead?.graspAdjust
  );
}

export function getPoseQuaternion(pose) {
  const basis = new THREE.Matrix4().makeBasis(
    pose.tangentX,
    pose.tangentY,
    pose.toolZ
  );
  return new THREE.Quaternion().setFromRotationMatrix(basis).normalize();
}

// Matriu de la pinça (amb el "robot front") per a una pose
export function getPoseGripperMatrix(gripper, pose) {
  return buildGripperTargetMatrix(
    gripper,
    pose.position.clone(),
    getPoseQuaternion(pose)
  );
}

/*
  ZONA ACTIVA (aspiració)

  Rectangle a la cara de l'eina, en els eixos de la
  pinça (després del "robot front"):
  { centerX, centerY, sizeX, sizeY } en mm.
  - Pinça de caixa: la seva cara inferior.
  - Pinça importada: la zona definida al configurador;
    si no en té, no pot fer agafades múltiples.
*/
export function getGripperActiveZone(gripper) {
  if (!gripper) {
    return null;
  }

  if (gripper.modelType === "IMPORTED_3D") {
    const zone = gripper.activeZone;
    const sizeX = Number(zone?.sizeX);
    const sizeY = Number(zone?.sizeY);

    return sizeX > 0 && sizeY > 0
      ? {
          centerX: Number(zone.centerX) || 0,
          centerY: Number(zone.centerY) || 0,
          sizeX,
          sizeY
        }
      : null;
  }

  return {
    centerX: -(Number(gripper.offsetX) || 0),
    centerY: -(Number(gripper.offsetY) || 0),
    sizeX: Math.max(Number(gripper.sizeX) || 1, 1),
    sizeY: Math.max(Number(gripper.sizeY) || 1, 1)
  };
}

/*
  Zona d'agafada automàtica d'una pinça importada:
  centrada al TCP i tan gran com la pinça mesurada en
  les direccions X i Y del TCP (la llargada màxima del
  model en cada direcció). object és el model preparat
  (loadStoredModel), on es defineix el TCP local.
*/
export function computeAutoGripZone(object, tcpPosition, tcpQuaternion) {
  const toTcp = new THREE.Matrix4()
    .compose(
      new THREE.Vector3(
        Number(tcpPosition?.x) || 0,
        Number(tcpPosition?.y) || 0,
        Number(tcpPosition?.z) || 0
      ),
      new THREE.Quaternion(
        Number(tcpQuaternion?.x) || 0,
        Number(tcpQuaternion?.y) || 0,
        Number(tcpQuaternion?.z) || 0,
        Number.isFinite(Number(tcpQuaternion?.w)) ? Number(tcpQuaternion.w) : 1
      ).normalize(),
      new THREE.Vector3(1, 1, 1)
    )
    .invert();

  const vertex = new THREE.Vector3();
  const vertexMatrix = new THREE.Matrix4();
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  object.updateMatrixWorld(true);
  object.traverse((child) => {
    const positions = child.isMesh ? child.geometry?.attributes?.position : null;

    if (!positions) {
      return;
    }

    vertexMatrix.multiplyMatrices(toTcp, child.matrixWorld);

    for (let index = 0; index < positions.count; index += 1) {
      vertex.fromBufferAttribute(positions, index).applyMatrix4(vertexMatrix);
      minX = Math.min(minX, vertex.x);
      maxX = Math.max(maxX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxY = Math.max(maxY, vertex.y);
    }
  });

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return null;
  }

  const round = (value) => Math.round(value * 1000) / 1000;

  return {
    sizeX: round(maxX - minX),
    sizeY: round(maxY - minY),
    centerX: 0,
    centerY: 0
  };
}

/*
  Per què una peça no encaixa en una agafada amb
  aquesta pose (null si encaixa):
  - SEPARATOR: els separadors no s'agrupen;
  - ORIENTATION: la cara agafada no mira on la de la guia;
  - HEIGHT: la cara agafada no és a la mateixa altura;
  - OUTSIDE_ZONE: el TCP queda fora de la zona activa.
*/
export function getGraspMemberIssue(piece, pose, gripper, zone) {
  if (piece.pieceCategory === "SEPARATOR") {
    return "SEPARATOR";
  }

  const piecePose = getPieceGripperPose(piece);

  if (piecePose.toolZ.dot(pose.toolZ) < PARALLEL_DOT) {
    return "ORIENTATION";
  }

  const heightDifference = piecePose.position
    .clone()
    .sub(pose.position)
    .dot(pose.toolZ);

  if (Math.abs(heightDifference) > GRASP_HEIGHT_TOLERANCE_MM) {
    return "HEIGHT";
  }

  if (!zone) {
    return null;
  }

  const local = piecePose.position
    .clone()
    .applyMatrix4(getPoseGripperMatrix(gripper, pose).invert());

  const isInside =
    Math.abs(local.x - zone.centerX) <=
      zone.sizeX / 2 + ZONE_EDGE_TOLERANCE_MM &&
    Math.abs(local.y - zone.centerY) <=
      zone.sizeY / 2 + ZONE_EDGE_TOLERANCE_MM;

  return isInside ? null : "OUTSIDE_ZONE";
}

/*
  Peces que la pinça podria agafar juntament amb la guia,
  amb la pinça posada al TCP de la guia: mateixa
  orientació, mateixa altura, TCP dins la zona activa i
  no pertanyen a cap altra agafada (excepte editingGroupId).
*/
export function proposeGraspMembers(pieces, lead, gripper, editingGroupId = null) {
  const zone = getGripperActiveZone(gripper);

  if (!zone) {
    return [lead.id];
  }

  const pose = getPieceGripperPose(lead);

  return pieces
    .filter((piece) => {
      if (piece.id === lead.id) {
        return true;
      }

      const groupId = getGraspGroupId(piece);

      return (
        (groupId === null || groupId === editingGroupId) &&
        getGraspMemberIssue(piece, pose, gripper, zone) === null
      );
    })
    .map((piece) => piece.id);
}

/*
  Estat d'una agafada múltiple:
  { pose, issues: [{ pieceId, reason }] }.
  NO_ZONE: la pinça no té zona activa definida.
*/
export function evaluateGrasp(members, lead, gripper, adjust = null) {
  const pose = getGraspPose(members, lead, adjust);

  if (!gripper) {
    return { pose, issues: [{ pieceId: lead.id, reason: "NO_GRIPPER" }] };
  }

  const zone = getGripperActiveZone(gripper);

  if (!zone) {
    return { pose, issues: [{ pieceId: lead.id, reason: "NO_ZONE" }] };
  }

  const issues = [];

  members.forEach((piece) => {
    const reason = getGraspMemberIssue(piece, pose, gripper, zone);

    if (reason) {
      issues.push({ pieceId: piece.id, reason });
    }
  });

  return { pose, issues };
}
