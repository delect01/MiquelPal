import * as THREE from "three";
import {
  getPieceLocalVertices,
  PIECE_FACES
} from "./pieceGeometry.js";
import {
  threeToPallet,
  getReferenceNormal,
  getReferenceOffset,
  getReferenceAxesPallet,
  quaternionToRobotEuler
} from "./pieceUtils.js";
import {
  getImportedFace,
  getImportedFaceNormalPallet,
  isImportedFaceReference
} from "./importedFaceUtils.js";
import { getPieceCollisionGeometry } from "./collisionGeometryStore.js";

/*
  COL·LOCACIÓ DE LA PEÇA SOBRE LA CINTA

  Frame de la cinta (frame de robot, mm):
  - +X: sentit d'avanç de la cinta.
  - +Y: transversal, des del lateral dret cap a dins
        (Y = 0 és el lateral dret).
  - +Z: amunt; la superfície de la cinta és Z = 0.

  És la mateixa convenció que el frame del palet
  (X endavant, Y esquerra, Z amunt), per tant les
  conversions existents de pieceUtils.js serveixen
  igual per renderitzar-lo a Three.js.

  El frame local de la peça és el mateix que fa servir
  la resta del programa per al TCP: X = profunditat,
  Y = amplada, Z = alçada, origen al centre.

  Pose de la peça respecte de la cinta:
    q_peça = Rz(rotationDeg) · q_contacte
    on q_contacte gira la normal de la cara de contacte
    fins a -Z (mirant cap a la cinta).
    p_peça: X centrada a l'origen; Y centrada a l'amplada
    de la cinta (beltWidth / 2, valor global de la
    instal·lació); i Z tal que el punt més baix de la
    geometria quedi exactament a Z = 0.

  TCP respecte de la cinta (mateixa cadena que el TCP
  sobre el palet, getReferenceWorldPositionThree i
  getReferenceAxesPallet):
    T_cinta_tcp = T(p_peça) · R(q_peça)
                  · T(offset de la cara d'agafada)
                  · R(base de la cara amb face rotation)
*/

export const CONVEYOR_PLACEMENT_VERSION = 1;

export const CONVEYOR_GEOMETRY = {
  // Tram de cinta per darrere de la peça (-X)
  rearLength: 2000,
  // Tram curt per davant de la peça (+X)
  frontLength: 400,
  // Mida de referència per dibuixar l'eix Y del frame
  sideMargin: 100,
  thickness: 40
};

// Tolerància de contacte amb Z = 0 (mm)
const CONTACT_TOLERANCE = 0.01;
const UNIT_TOLERANCE = 1e-6;

/*
  Component vertical màxim de la direcció d'atac de
  l'eina (cosinus): per sobre, l'agafada ve de sota la
  cinta. Les agafades laterals (horitzontals) són
  vàlides.
*/
const GRASP_FROM_BELOW_TOLERANCE = 0.001;

export const PARAMETRIC_CONTACT_FACE_IDS = [
  "BOTTOM_CENTER",
  "TOP_CENTER",
  "FRONT_CENTER",
  "BACK_CENTER",
  "LEFT_CENTER",
  "RIGHT_CENTER"
];

/*
  "CENTER" és el centre de la peça, no una cara: no
  defineix cap cara d'agafada.
*/
const NO_GRASP_FACE = "CENTER";

/*
  AMPLADA DE LA CINTA

  Un sol valor per a totes les peces i tots els
  projectes (és una característica de la instal·lació):
  es desa al navegador i es manté fins que l'operari el
  canvia. La peça sempre queda centrada en aquesta
  amplada.
*/
export const DEFAULT_CONVEYOR_BELT_WIDTH = 600;

const BELT_WIDTH_STORAGE_KEY = "pallet-simulator-conveyor-belt-width";
const beltWidthListeners = new Set();

export function isValidBeltWidth(value) {
  const numericValue = Number(value);
  return value !== "" && value !== null && Number.isFinite(numericValue) && numericValue > 0;
}

function loadConveyorBeltWidth() {
  try {
    const savedValue = window.localStorage.getItem(BELT_WIDTH_STORAGE_KEY);
    return isValidBeltWidth(savedValue)
      ? Number(savedValue)
      : DEFAULT_CONVEYOR_BELT_WIDTH;
  } catch {
    return DEFAULT_CONVEYOR_BELT_WIDTH;
  }
}

let currentBeltWidth = null;

export function getConveyorBeltWidth() {
  if (currentBeltWidth === null) {
    currentBeltWidth = loadConveyorBeltWidth();
  }

  return currentBeltWidth;
}

export function setConveyorBeltWidth(value) {
  if (!isValidBeltWidth(value) || Number(value) === getConveyorBeltWidth()) {
    return;
  }

  currentBeltWidth = Number(value);

  try {
    window.localStorage.setItem(BELT_WIDTH_STORAGE_KEY, String(currentBeltWidth));
  } catch (error) {
    console.error("No s'ha pogut desar l'amplada de la cinta:", error);
  }

  beltWidthListeners.forEach((listener) => listener());
}

export function subscribeConveyorBeltWidth(listener) {
  beltWidthListeners.add(listener);
  return () => beltWidthListeners.delete(listener);
}

export function createDefaultConveyorPlacement() {
  return {
    version: CONVEYOR_PLACEMENT_VERSION,
    contactFaceId: null,
    rotationDeg: 0,
    // Centrada a X = 0 i al mig de l'amplada de la cinta
    autoCenter: true,
    beltWidth: getConveyorBeltWidth(),
    position: { x: 0, y: 0, z: 0 }
  };
}

export function normalizeRotationDeg(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  let normalized = THREE.MathUtils.euclideanModulo(
    numericValue,
    360
  );

  if (Math.abs(normalized - 360) < 1e-9) {
    normalized = 0;
  }

  return Number(normalized.toFixed(6));
}

function toFiniteNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

/*
  Col·locació (contactFaceId, rotationDeg, autoCenter)
  amb valors per defecte. Els càlculs la llegeixen de
  piece.conveyorPlacement d'una peça de treball que
  munta conveyorConfigurations.js; no es guarda a les
  peces del projecte.
*/
export function resolveConveyorPlacement(piece) {
  const stored = piece?.conveyorPlacement;
  const defaults = createDefaultConveyorPlacement();

  if (!stored || typeof stored !== "object") {
    return defaults;
  }

  return {
    ...defaults,
    ...stored,
    version: CONVEYOR_PLACEMENT_VERSION,
    contactFaceId: stored.contactFaceId ?? null,
    rotationDeg: normalizeRotationDeg(stored.rotationDeg),
    autoCenter: stored.autoCenter !== false,
    beltWidth: isValidBeltWidth(stored.beltWidth)
      ? Number(stored.beltWidth)
      : getConveyorBeltWidth(),
    position: {
      x: toFiniteNumber(stored.position?.x),
      y: toFiniteNumber(stored.position?.y),
      z: toFiniteNumber(stored.position?.z)
    }
  };
}

function threeLocalToRobot(vertex) {
  const converted = threeToPallet(
    Number(vertex.x),
    Number(vertex.y),
    Number(vertex.z)
  );

  return new THREE.Vector3(converted.x, converted.y, converted.z);
}

/*
  Vèrtexs de la peça en el seu frame local de robot.
  Importades: casc convex real (no la capsa).
*/
function getLocalRobotVertices(piece) {
  if (piece?.pieceType === "IMPORTED_3D") {
    const vertices = getPieceCollisionGeometry(piece)?.vertices;

    if (!Array.isArray(vertices) || vertices.length < 4) {
      return [];
    }

    return vertices.map(threeLocalToRobot);
  }

  return getPieceLocalVertices(piece).map(threeLocalToRobot);
}

/*
  Cares que poden recolzar-se sobre la cinta, amb un
  identificador estable (el mateix que fa servir el TCP):
  - paramètriques: TOP_CENTER, BOTTOM_CENTER, ...
  - importades: IMPORTED_FACE_n del casc convex.
  normal: normal exterior en el frame local de robot.
*/
export function getConveyorContactFaces(piece) {
  if (piece?.pieceType === "IMPORTED_3D") {
    const faces = getPieceCollisionGeometry(piece)?.faces;

    if (!Array.isArray(faces)) {
      return [];
    }

    return faces
      .map((face, index) => ({
        id: face.id,
        number: index + 1,
        normal: getImportedFaceNormalPallet(piece, face.id)
      }))
      .filter((face) => face.normal);
  }

  return PARAMETRIC_CONTACT_FACE_IDS.map((id, index) => {
    const normal = getReferenceNormal({
      ...piece,
      referencePoint: id
    });

    return {
      id,
      number: index + 1,
      normal: new THREE.Vector3(
        normal.x,
        normal.y,
        normal.z
      ).normalize()
    };
  });
}

/*
  Triangles en coordenades locals de Three.js amb la
  cara a què pertany cadascun. Serveix per seleccionar
  i ressaltar cares al visualitzador.
*/
export function getContactFaceTriangles(piece) {
  const faces = getConveyorContactFaces(piece);
  const positions = [];
  const triangleFaceIds = [];

  if (piece?.pieceType === "IMPORTED_3D") {
    const vertices = getPieceCollisionGeometry(piece)?.vertices ?? [];
    const triangles = getPieceCollisionGeometry(piece)?.triangles ?? [];
    const faceByTriangle = new Map();

    (getPieceCollisionGeometry(piece)?.faces ?? []).forEach((face) => {
      (face.triangleIndices ?? []).forEach((triangleIndex) => {
        faceByTriangle.set(triangleIndex, face.id);
      });
    });

    triangles.forEach((triangle, triangleIndex) => {
      const faceId = faceByTriangle.get(triangleIndex);

      if (!faceId) {
        return;
      }

      triangle.forEach((vertexIndex) => {
        const vertex = vertices[vertexIndex];
        positions.push(
          Number(vertex.x),
          Number(vertex.y),
          Number(vertex.z)
        );
      });

      triangleFaceIds.push(faceId);
    });

    return { positions, triangleFaceIds };
  }

  const vertices = getPieceLocalVertices(piece);

  PIECE_FACES.forEach((quad) => {
    let corners = quad.map((index) => vertices[index]);
    const centroid = corners
      .reduce((sum, corner) => sum.add(corner), new THREE.Vector3())
      .multiplyScalar(1 / corners.length);

    // Normal exterior: la peça és convexa i té l'origen a dins
    const normal = new THREE.Vector3().crossVectors(
      corners[1].clone().sub(corners[0]),
      corners[2].clone().sub(corners[0])
    );

    /*
      Ordre dels vèrtexs cap a fora: la selecció amb el
      ratolí només detecta la cara frontal dels triangles.
    */
    if (normal.dot(centroid) < 0) {
      normal.negate();
      corners = [...corners].reverse();
    }

    const robotNormal = threeLocalToRobot(normal).normalize();

    let bestFace = null;
    let bestDot = -Infinity;

    faces.forEach((face) => {
      const dot = face.normal.dot(robotNormal);

      if (dot > bestDot) {
        bestDot = dot;
        bestFace = face;
      }
    });

    [
      [0, 1, 2],
      [0, 2, 3]
    ].forEach((triangle) => {
      triangle.forEach((cornerIndex) => {
        const corner = corners[cornerIndex];
        positions.push(corner.x, corner.y, corner.z);
      });

      triangleFaceIds.push(bestFace?.id ?? null);
    });
  });

  return { positions, triangleFaceIds };
}

/*
  Rotació que fa mirar la normal de la cara de
  contacte cap a la cinta (-Z).
*/
function getContactAlignmentQuaternion(normal) {
  const down = new THREE.Vector3(0, 0, -1);
  const dot = normal.dot(down);

  if (dot > 1 - 1e-9) {
    return new THREE.Quaternion();
  }

  // Cara superior: mitja volta al voltant de +X
  if (dot < -1 + 1e-9) {
    return new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      Math.PI
    );
  }

  return new THREE.Quaternion().setFromUnitVectors(normal, down);
}

function isFiniteVector(vector) {
  return ["x", "y", "z"].every((axis) =>
    Number.isFinite(vector[axis])
  );
}

function isFiniteQuaternion(quaternion) {
  return ["x", "y", "z", "w"].every((axis) =>
    Number.isFinite(quaternion[axis])
  );
}

/*
  Pose de la peça respecte del frame de la cinta.

  Sense cara seleccionada, la peça es mostra en la seva
  orientació natural (contactFaceSelected = false).
*/
export function computePiecePoseOnConveyor(piece) {
  const placement = resolveConveyorPlacement(piece);
  const vertices = getLocalRobotVertices(piece);

  if (vertices.length === 0) {
    return { ok: false, reason: "geometryNotLoaded", placement };
  }

  let alignment = new THREE.Quaternion();
  let contactFaceSelected = false;

  if (placement.contactFaceId !== null) {
    const contactFace = getConveyorContactFaces(piece).find(
      (face) => face.id === placement.contactFaceId
    );

    if (!contactFace) {
      return { ok: false, reason: "unknownContactFace", placement };
    }

    alignment = getContactAlignmentQuaternion(contactFace.normal);
    contactFaceSelected = true;
  }

  const rotation = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1),
    THREE.MathUtils.degToRad(placement.rotationDeg)
  );

  const quaternion = rotation.multiply(alignment).normalize();

  const bounds = new THREE.Box3().setFromPoints(
    vertices.map((vertex) => vertex.clone().applyQuaternion(quaternion))
  );

  /*
    En Y, la peça queda centrada a l'amplada de la cinta:
    el centre de la seva petjada és a beltWidth / 2 del
    lateral dret (Y = 0).
  */
  const beltWidth = placement.beltWidth;

  const position = new THREE.Vector3(
    placement.autoCenter
      ? -(bounds.min.x + bounds.max.x) / 2
      : placement.position.x,
    placement.autoCenter
      ? beltWidth / 2 - (bounds.min.y + bounds.max.y) / 2
      : placement.position.y,
    // El punt més baix toca exactament la cinta
    -bounds.min.z
  );

  if (!isFiniteVector(position) || !isFiniteQuaternion(quaternion)) {
    return { ok: false, reason: "invalidTransform", placement };
  }

  return {
    ok: true,
    placement,
    contactFaceSelected,
    position,
    quaternion,
    beltWidth,
    footprint: {
      minX: bounds.min.x + position.x,
      maxX: bounds.max.x + position.x,
      minY: bounds.min.y + position.y,
      maxY: bounds.max.y + position.y,
      height: bounds.max.z - bounds.min.z
    }
  };
}

/*
  Pose final del TCP respecte del frame de la cinta.

  Reutilitza la definició actual del punt d'agafada:
  getReferenceOffset (centre de la cara + face offsets)
  i getReferenceAxesPallet (base de la cara amb la
  face rotation al voltant de la Z de l'eina).
*/
export function computeTcpPoseOnConveyor(piece, piecePose) {
  const graspFaceId = piece?.referencePoint ?? null;
  const contactFaceId = piecePose?.placement?.contactFaceId ?? null;

  const invalid = (reason) => ({
    valid: false,
    reason,
    calculatedFrom: { graspFaceId, contactFaceId }
  });

  if (!piecePose?.ok) {
    return invalid(piecePose?.reason ?? "invalidTransform");
  }

  if (!piecePose.contactFaceSelected) {
    return invalid("missingContactFace");
  }

  // La peça ha de cabre a l'amplada de la cinta
  if (
    piecePose.footprint.minY < -CONTACT_TOLERANCE ||
    piecePose.footprint.maxY > piecePose.beltWidth + CONTACT_TOLERANCE
  ) {
    return invalid("beltTooNarrow");
  }

  if (!graspFaceId || graspFaceId === NO_GRASP_FACE) {
    return invalid("missingGraspFace");
  }

  if (
    isImportedFaceReference(graspFaceId) &&
    !getImportedFace(piece, graspFaceId)
  ) {
    return invalid("missingGraspFace");
  }

  const graspValues = [
    piece.faceOffsetX ?? 0,
    piece.faceOffsetY ?? 0,
    piece.faceRotationDeg ?? 0
  ].map(Number);

  if (!graspValues.every(Number.isFinite)) {
    return invalid("invalidGraspOffsets");
  }

  const graspPiece = {
    ...piece,
    faceOffsetX: graspValues[0],
    faceOffsetY: graspValues[1],
    faceRotationDeg: graspValues[2]
  };

  // Punt i base del TCP en el frame local de la peça
  const localOffset = getReferenceOffset(graspPiece);
  const localAxes = getReferenceAxesPallet(graspPiece, true, false);

  const localQuaternion = new THREE.Quaternion()
    .setFromRotationMatrix(
      new THREE.Matrix4().makeBasis(
        localAxes.tangentX,
        localAxes.tangentY,
        localAxes.toolZ
      )
    )
    .normalize();

  const position = localOffset
    .clone()
    .applyQuaternion(piecePose.quaternion)
    .add(piecePose.position);

  const quaternion = piecePose.quaternion
    .clone()
    .multiply(localQuaternion)
    .normalize();

  if (!isFiniteVector(position) || !isFiniteQuaternion(quaternion)) {
    return invalid("invalidTransform");
  }

  /*
    La Z de l'eina és la direcció d'atac (cap a dins de
    la peça). Si té component cap amunt, la pinça hauria
    d'entrar des de sota la superfície de la cinta (per
    exemple, agafant per la mateixa cara de contacte):
    és físicament impossible.
  */
  const toolZ = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion);

  if (toolZ.z > GRASP_FROM_BELOW_TOLERANCE) {
    return invalid("graspFromBelow");
  }

  const euler = quaternionToRobotEuler(quaternion);

  return {
    valid: true,
    position,
    quaternion,
    euler: {
      x: euler.rx,
      y: euler.ry,
      z: euler.rz,
      order: "ZYX",
      unit: "deg"
    },
    // Punt de la cara d'agafada sense offsets (per dibuixar-lo)
    graspFaceCenter: getReferenceOffset({
      ...graspPiece,
      faceOffsetX: 0,
      faceOffsetY: 0
    })
      .applyQuaternion(piecePose.quaternion)
      .add(piecePose.position),
    calculatedFrom: { graspFaceId, contactFaceId }
  };
}

/*
  Tot el càlcul d'una peça: pose sobre la cinta, TCP i
  estat global ("valid", "incomplete" o "error").
*/
export function computeConveyorPlacement(piece) {
  const piecePose = computePiecePoseOnConveyor(piece);
  const tcpPose = computeTcpPoseOnConveyor(piece, piecePose);

  let status = "valid";

  if (!tcpPose.valid) {
    status = [
      "missingContactFace",
      "missingGraspFace",
      "geometryNotLoaded",
      "unknownContactFace"
    ].includes(tcpPose.reason)
      ? "incomplete"
      : "error";
  }

  return { piecePose, tcpPose, status };
}

/*
  Comprovacions abans de crear o guardar una peça.
  Retorna la clau de traducció de l'error, o null.
*/
export function validateConveyorPlacement(piece) {
  const placement = resolveConveyorPlacement(piece);

  if (placement.contactFaceId === null) {
    return "contactFaceRequired";
  }

  if (!Number.isFinite(Number(piece?.conveyorPlacement?.rotationDeg ?? 0))) {
    return "invalidRotation";
  }

  const piecePose = computePiecePoseOnConveyor(piece);

  if (!piecePose.ok || !piecePose.contactFaceSelected) {
    return "invalidPlacement";
  }

  if (Math.abs(piecePose.quaternion.length() - 1) > UNIT_TOLERANCE) {
    return "invalidPlacement";
  }

  // Ni flotant ni travessant la cinta
  const lowestZ = Math.min(
    ...getLocalRobotVertices(piece).map(
      (vertex) =>
        vertex
          .clone()
          .applyQuaternion(piecePose.quaternion)
          .add(piecePose.position).z
    )
  );

  if (Math.abs(lowestZ) > CONTACT_TOLERANCE) {
    return "invalidPlacement";
  }

  return null;
}

export function roundNumber(value) {
  const rounded = Number(Number(value).toFixed(6));
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function serializeVector(vector) {
  return {
    x: roundNumber(vector.x),
    y: roundNumber(vector.y),
    z: roundNumber(vector.z)
  };
}

export function serializeQuaternion(quaternion) {
  return {
    x: roundNumber(quaternion.x),
    y: roundNumber(quaternion.y),
    z: roundNumber(quaternion.z),
    w: roundNumber(quaternion.w)
  };
}
