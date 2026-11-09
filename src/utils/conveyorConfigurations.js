import * as THREE from "three";
import { getReferenceOffset } from "./pieceUtils.js";
import {
  computeConveyorPlacement,
  getConveyorContactFaces,
  getConveyorBeltWidth,
  isValidBeltWidth,
  normalizeRotationDeg,
  roundNumber,
  serializeVector,
  serializeQuaternion
} from "./conveyorPlacement.js";
import {
  getPieceCollisionGeometry,
  isCollisionGeometryPending
} from "./collisionGeometryStore.js";

/*
  CONFIGURACIONS DE CINTA

  Una peça de la biblioteca té zero o una configuració
  de cinta. La clau única és pieceId (l'id estable de la
  peça); la configuració no té nom ni id propis.

  Cada configuració guarda:
  - placement: com està la peça sobre la cinta;
  - grasp: com l'agafa el robot (mateixos conceptes que
    el TCP del palet: cara, face offsets, face rotation);
  - tcpPoseInConveyorFrame: TCP en el frame de la cinta;
  - pieceGeometryVersion: empremta de la geometria amb
    què es va calcular, per detectar canvis.

  La unicitat per pieceId es garanteix en guardar
  (upsertConveyorConfiguration), en carregar
  (sanitizeConveyorConfigurations, que migra duplicats) i
  en desar el projecte (refreshConveyorConfigurations).

  La peça original no es modifica mai: els càlculs es
  fan sobre una peça de treball (buildConfiguredPiece).
*/

export const CONVEYOR_CONFIGURATION_STATUS = {
  VALID: "valid",
  NEEDS_REVIEW: "needsReview"
};

// Tolerància per retrobar una cara (normal i centre)
const FACE_NORMAL_TOLERANCE = 0.999;
const FACE_CENTER_TOLERANCE = 1;

function toFiniteNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function nowIso() {
  return new Date().toISOString();
}

/*
  Valors inicials en prémer "Configurar". No es guarda
  res fins que l'operari prem "Guardar".
*/
export function createConveyorConfiguration(pieceId) {
  return {
    pieceId,
    placement: {
      contactFaceId: null,
      contactFaceReference: null,
      rotationDeg: 0,
      // Amplada de la cinta amb què s'ha calculat (la global)
      beltWidth: getConveyorBeltWidth(),
      position: { x: 0, y: 0, z: 0 },
      piecePoseInConveyorFrame: null
    },
    grasp: {
      graspFaceId: null,
      graspFaceReference: null,
      faceOffsetX: 0,
      faceOffsetY: 0,
      faceRotationDeg: 0
    },
    tcpPoseInConveyorFrame: { valid: false, reason: "notCalculated" },
    status: CONVEYOR_CONFIGURATION_STATUS.NEEDS_REVIEW,
    pieceGeometryVersion: null,
    createdAt: null,
    updatedAt: null
  };
}

/*
  Empremta estable de la geometria d'una peça (FNV-1a).
  Canvia si canvien el tipus, les mides, el model o el
  seu casc de col·lisió; no canvia amb el nom.
*/
export function getPieceGeometryVersion(piece) {
  // Sense el volum calculat, l'empremta encara no es coneix
  if (!piece || isCollisionGeometryPending(piece)) {
    return null;
  }

  const round = (value) => Math.round(Number(value) * 1000) / 1000;

  const parts = [
    piece.pieceType,
    round(piece.width),
    round(piece.height),
    round(piece.depth),
    round(piece.topWidth ?? piece.width),
    round(piece.topDepth ?? piece.depth),
    piece.modelId ?? null,
    piece.modelBottomFace ?? null,
    (getPieceCollisionGeometry(piece)?.vertices ?? []).map((vertex) =>
      [round(vertex.x), round(vertex.y), round(vertex.z)]
    )
  ];

  const text = JSON.stringify(parts);
  let hash = 0x811c9dc5;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `g1-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

// Peça amb valors numèrics (la biblioteca els guarda així)
function getNumericPiece(piece) {
  return {
    ...piece,
    width: Number(piece.width),
    height: Number(piece.height),
    depth: Number(piece.depth),
    topWidth: Number(piece.topWidth ?? piece.width),
    topDepth: Number(piece.topDepth ?? piece.depth)
  };
}

/*
  Peça de treball per als càlculs: la definició de la
  peça + l'agafada i la col·locació d'aquesta
  configuració. No es guarda enlloc.

  beltWidth: amplada de la cinta (per defecte, la global;
  el popup hi passa la que s'està editant).
*/
export function buildConfiguredPiece(
  configuration,
  piece,
  beltWidth = getConveyorBeltWidth()
) {
  return {
    ...getNumericPiece(piece),
    referencePoint: configuration.grasp.graspFaceId ?? "CENTER",
    faceOffsetX: configuration.grasp.faceOffsetX,
    faceOffsetY: configuration.grasp.faceOffsetY,
    faceRotationDeg: configuration.grasp.faceRotationDeg,
    conveyorPlacement: {
      contactFaceId: configuration.placement.contactFaceId,
      rotationDeg: configuration.placement.rotationDeg,
      beltWidth,
      autoCenter: true
    }
  };
}

/*
  Referència d'una cara independent del seu id: normal i
  centre en el frame local de la peça. Permet retrobar
  una cara importada si l'ordre de les cares canvia.
*/
export function getFaceReference(piece, faceId) {
  if (!piece || !faceId) {
    return null;
  }

  const numericPiece = getNumericPiece(piece);
  const face = getConveyorContactFaces(numericPiece).find(
    (candidate) => candidate.id === faceId
  );

  if (!face) {
    return null;
  }

  const center = getReferenceOffset({
    ...numericPiece,
    referencePoint: faceId,
    faceOffsetX: 0,
    faceOffsetY: 0
  });

  return {
    normal: serializeVector(face.normal),
    center: serializeVector(center)
  };
}

function toVector(value) {
  return new THREE.Vector3(
    toFiniteNumber(value?.x),
    toFiniteNumber(value?.y),
    toFiniteNumber(value?.z)
  );
}

/*
  Comprova que una cara guardada encara existeix i és la
  mateixa (normal i centre). Si no, intenta retrobar-la
  per la seva referència. Retorna l'id vàlid o null.
*/
export function resolveFaceId(piece, faceId, faceReference) {
  if (!piece || !faceId) {
    return null;
  }

  const numericPiece = getNumericPiece(piece);
  const faces = getConveyorContactFaces(numericPiece);

  const matchesReference = (face) => {
    if (!faceReference) {
      return true;
    }

    const center = getReferenceOffset({
      ...numericPiece,
      referencePoint: face.id,
      faceOffsetX: 0,
      faceOffsetY: 0
    });

    return (
      face.normal.dot(toVector(faceReference.normal).normalize()) >
        FACE_NORMAL_TOLERANCE &&
      center.distanceTo(toVector(faceReference.center)) <
        FACE_CENTER_TOLERANCE
    );
  };

  const sameFace = faces.find((face) => face.id === faceId);

  if (sameFace && matchesReference(sameFace)) {
    return faceId;
  }

  if (!faceReference) {
    return null;
  }

  return faces.find(matchesReference)?.id ?? null;
}

/*
  Estat actual d'una configuració respecte de la seva
  peça. És la font de veritat per mostrar-la:
  - geometryChanged: la peça ha canviat des del càlcul;
  - migrationReview: venia de diverses configuracions de
    la mateixa peça i cal confirmar-la;
  - missing: el que falta per poder guardar;
  - status: "valid" o "needsReview".
*/
export function evaluateConveyorConfiguration(
  configuration,
  piece,
  { geometryReviewed = false, beltWidth = getConveyorBeltWidth() } = {}
) {
  const pieceMissing = !piece;
  const beltWidthValid = isValidBeltWidth(beltWidth);
  const currentVersion = getPieceGeometryVersion(piece);

  /*
    Volum d'una peça importada encara en càlcul: no es
    pot dir si la geometria ha canviat ni calcular el
    TCP. Es torna a avaluar quan arriba.
  */
  const geometryPending =
    Boolean(piece) && isCollisionGeometryPending(piece);

  const geometryChanged =
    Boolean(piece) &&
    !geometryPending &&
    Boolean(configuration.pieceGeometryVersion) &&
    configuration.pieceGeometryVersion !== currentVersion &&
    !geometryReviewed;

  const migrationReview = Boolean(configuration.migrationReview);

  const result = piece
    ? computeConveyorPlacement(
        buildConfiguredPiece(
          configuration,
          piece,
          beltWidthValid ? Number(beltWidth) : getConveyorBeltWidth()
        )
      )
    : null;

  // Amb la geometria canviada, el TCP no és fiable
  const tcpPose =
    !result || geometryChanged
      ? {
          valid: false,
          reason: pieceMissing ? "missingPiece" : "geometryChanged"
        }
      : result.tcpPose;

  const graspValuesValid = [
    configuration.grasp.faceOffsetX,
    configuration.grasp.faceOffsetY,
    configuration.grasp.faceRotationDeg
  ].every((value) => Number.isFinite(Number(value)));

  // Dades mínimes per guardar
  const missing = [];

  if (geometryChanged) {
    missing.push("review");
  }

  if (!configuration.placement.contactFaceId) {
    missing.push("contactFace");
  }

  if (!beltWidthValid) {
    missing.push("beltWidth");
  }

  if (!configuration.grasp.graspFaceId) {
    missing.push("graspFace");
  }

  if (!graspValuesValid) {
    missing.push("invalidGrasp");
  }

  if (missing.length === 0 && !tcpPose.valid) {
    missing.push("tcp");
  }

  const status =
    tcpPose.valid &&
    beltWidthValid &&
    !geometryChanged &&
    !migrationReview
      ? CONVEYOR_CONFIGURATION_STATUS.VALID
      : CONVEYOR_CONFIGURATION_STATUS.NEEDS_REVIEW;

  return {
    piece,
    pieceMissing,
    geometryPending,
    geometryChanged,
    migrationReview,
    currentVersion,
    result,
    tcpPose,
    missing,
    canSave: !pieceMissing && !geometryPending && missing.length === 0,
    // Mentre es calcula el volum, es manté l'estat desat
    status: geometryPending
      ? configuration.status ?? CONVEYOR_CONFIGURATION_STATUS.NEEDS_REVIEW
      : status
  };
}

/*
  Configuració llesta per guardar: objectes plans (sense
  Vector3 ni Quaternion) i poses en el frame de la cinta.
  Només es crida amb dades completes (canSave), però mai
  guarda una pose zero com si fos vàlida.
*/
/*
  Poses calculades (peça i TCP) en objectes plans, per
  desar-les a la configuració.
*/
function getStoredPoses(configuration, evaluation) {
  const piecePose = evaluation.result?.piecePose;
  const hasPiecePose =
    !evaluation.geometryChanged &&
    Boolean(piecePose?.ok && piecePose.contactFaceSelected);
  const tcpPose = evaluation.tcpPose;

  return {
    position: hasPiecePose
      ? serializeVector(piecePose.position)
      : configuration.placement.position,
    piecePoseInConveyorFrame: hasPiecePose
      ? {
          position: serializeVector(piecePose.position),
          quaternion: serializeQuaternion(piecePose.quaternion)
        }
      : null,
    tcpPoseInConveyorFrame: tcpPose.valid
      ? {
          valid: true,
          position: serializeVector(tcpPose.position),
          quaternion: serializeQuaternion(tcpPose.quaternion),
          euler: {
            x: roundNumber(tcpPose.euler.x),
            y: roundNumber(tcpPose.euler.y),
            z: roundNumber(tcpPose.euler.z),
            order: tcpPose.euler.order,
            unit: tcpPose.euler.unit
          },
          frame: "conveyor",
          calculatedFrom: tcpPose.calculatedFrom
        }
      : { valid: false, reason: tcpPose.reason }
  };
}

export function finalizeConveyorConfiguration(
  configuration,
  piece,
  { geometryReviewed = false, beltWidth = getConveyorBeltWidth() } = {}
) {
  const evaluation = evaluateConveyorConfiguration(configuration, piece, {
    geometryReviewed,
    beltWidth
  });

  const poses = getStoredPoses(configuration, evaluation);
  const tcpPose = evaluation.tcpPose;
  const updatedAt = nowIso();

  // Camp de la versió anterior (distància al lateral), ja no s'usa
  const placement = { ...configuration.placement };
  delete placement.edgeDistanceY;

  return {
    pieceId: configuration.pieceId,
    placement: {
      ...placement,
      rotationDeg: normalizeRotationDeg(configuration.placement.rotationDeg),
      // Amplada de la cinta amb què s'ha calculat el TCP
      beltWidth: Number(beltWidth),
      contactFaceReference: getFaceReference(
        piece,
        configuration.placement.contactFaceId
      ) ?? configuration.placement.contactFaceReference,
      position: poses.position,
      piecePoseInConveyorFrame: poses.piecePoseInConveyorFrame
    },
    grasp: {
      ...configuration.grasp,
      faceOffsetX: toFiniteNumber(configuration.grasp.faceOffsetX),
      faceOffsetY: toFiniteNumber(configuration.grasp.faceOffsetY),
      faceRotationDeg: toFiniteNumber(configuration.grasp.faceRotationDeg),
      graspFaceReference: getFaceReference(
        piece,
        configuration.grasp.graspFaceId
      ) ?? configuration.grasp.graspFaceReference
    },
    tcpPoseInConveyorFrame: poses.tcpPoseInConveyorFrame,
    // Guardar resol la migració: ja no hi ha variants
    status:
      tcpPose.valid && !evaluation.geometryChanged
        ? CONVEYOR_CONFIGURATION_STATUS.VALID
        : CONVEYOR_CONFIGURATION_STATUS.NEEDS_REVIEW,
    // Es manté la versió antiga mentre la revisió estigui pendent
    pieceGeometryVersion: evaluation.geometryChanged
      ? configuration.pieceGeometryVersion
      : evaluation.currentVersion,
    createdAt: configuration.createdAt ?? updatedAt,
    updatedAt
  };
}

/*
  Tipus, mides i model: per reconèixer peces sense vincle
  i per agrupar les peces iguals del palet.
*/
export function getPlacedPieceKey(piece) {
  const round = (value) => Math.round(Number(value) * 1000) / 1000;

  return JSON.stringify([
    piece.pieceType,
    round(piece.width),
    round(piece.height),
    round(piece.depth),
    round(piece.topWidth ?? piece.width),
    round(piece.topDepth ?? piece.depth),
    piece.pieceType === "IMPORTED_3D" ? piece.modelId ?? null : null
  ]);
}

/*
  Peces de la biblioteca que es fan servir al palet
  (composició actual i totes les capes guardades).

  Cada peça col·locada es relaciona amb la seva plantilla:
  1. per libraryPieceId (peces creades des d'una plantilla);
  2. si no en té (projectes anteriors), per tipus, mides i
     model, i amb el mateix nom si n'hi ha diverses.
  Els separadors no compten.
*/
export function findLibraryPieceForPlaced(piece, pieceLibrary) {
  if (!piece || piece.pieceCategory === "SEPARATOR") {
    return null;
  }

  if (piece.libraryPieceId) {
    const linked = pieceLibrary.find(
      (template) => template.id === piece.libraryPieceId
    );

    if (linked) {
      return linked;
    }
  }

  const key = getPlacedPieceKey(piece);
  const candidates = pieceLibrary.filter(
    (template) => getPlacedPieceKey(template) === key
  );
  const name = String(piece.name ?? "").trim().toLowerCase();

  return (
    candidates.find(
      (template) => String(template.name ?? "").trim().toLowerCase() === name
    ) ??
    candidates[0] ??
    null
  );
}

/*
  Peces del palet (composició i capes) que no es poden
  relacionar amb cap plantilla de la biblioteca,
  agrupades per tipus, mides i model: cada grup és una
  referència diferent.

  Retorna [{ key, piece (la primera del grup), names,
  count, templateMissing }]. templateMissing indica que
  alguna peça del grup estava vinculada a una plantilla
  que ja no existeix.
*/
export function getUnsavedPlacedPieceGroups(placedPieces, pieceLibrary) {
  const groups = new Map();

  placedPieces.forEach((piece) => {
    if (
      !piece ||
      piece.pieceCategory === "SEPARATOR" ||
      findLibraryPieceForPlaced(piece, pieceLibrary)
    ) {
      return;
    }

    const key = getPlacedPieceKey(piece);

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        piece,
        names: [],
        count: 0,
        templateMissing: false
      });
    }

    const group = groups.get(key);
    const name = String(piece.name ?? "").trim();

    if (name && !group.names.includes(name)) {
      group.names.push(name);
    }

    group.count += 1;
    group.templateMissing ||= Boolean(piece.libraryPieceId);
  });

  return [...groups.values()];
}

export function getUsedLibraryPieceIds(placedPieces, pieceLibrary) {
  const usedIds = new Set();

  placedPieces.forEach((piece) => {
    const match = findLibraryPieceForPlaced(piece, pieceLibrary);

    if (match) {
      usedIds.add(match.id);
    }
  });

  return usedIds;
}

/*
  Agafada del robot d'una configuració de cinta en els
  camps TCP d'una peça del simulador (els mateixos que
  fa servir el palet).
*/
export function getPieceGraspFields(configuration) {
  return {
    referencePoint: configuration.grasp.graspFaceId,
    faceOffsetX: toFiniteNumber(configuration.grasp.faceOffsetX),
    faceOffsetY: toFiniteNumber(configuration.grasp.faceOffsetY),
    faceRotationDeg: toFiniteNumber(configuration.grasp.faceRotationDeg)
  };
}

/*
  Aplica l'agafada configurada a totes les peces del
  simulador que surten de la peça de la biblioteca. Les
  peces sense vincle que es reconeixen queden vinculades.
  Retorna la mateixa llista si no canvia res.
*/
export function applyGraspToPlacedPieces(
  placedPieces,
  libraryPiece,
  configuration,
  pieceLibrary
) {
  const graspFields = getPieceGraspFields(configuration);
  let changed = false;

  const next = placedPieces.map((piece) => {
    if (findLibraryPieceForPlaced(piece, pieceLibrary)?.id !== libraryPiece.id) {
      return piece;
    }

    const alreadyApplied =
      piece.libraryPieceId === libraryPiece.id &&
      Object.entries(graspFields).every(
        ([field, value]) => piece[field] === value
      );

    if (alreadyApplied) {
      return piece;
    }

    changed = true;
    return { ...piece, ...graspFields, libraryPieceId: libraryPiece.id };
  });

  return changed ? next : placedPieces;
}

export function findConveyorConfiguration(configurations, pieceId) {
  return (
    configurations.find(
      (configuration) => configuration.pieceId === pieceId
    ) ?? null
  );
}

/*
  Crea o actualitza la configuració d'una peça. Mai n'hi
  afegeix una segona amb el mateix pieceId.
*/
export function upsertConveyorConfiguration(configurations, configuration) {
  let replaced = false;

  const next = configurations
    .map((item) => {
      if (item.pieceId !== configuration.pieceId) {
        return item;
      }

      if (replaced) {
        return null;
      }

      replaced = true;
      return configuration;
    })
    .filter(Boolean);

  return replaced ? next : [...next, configuration];
}

export function removeConveyorConfiguration(configurations, pieceId) {
  return configurations.filter(
    (configuration) => configuration.pieceId !== pieceId
  );
}

/*
  En desar el projecte: estat i poses al dia respecte de
  la biblioteca i, com a última garantia, una sola
  configuració per peça.
*/
export function refreshConveyorConfigurations(configurations, pieceLibrary) {
  return sanitizeConveyorConfigurations(configurations).map((configuration) => {
    const piece = pieceLibrary.find(
      (candidate) => candidate.id === configuration.pieceId
    );

    /*
      Es conserva tal qual sense la peça (p. ex.
      biblioteca d'un altre equip) o si el volum d'una
      peça importada encara no està calculat.
    */
    if (
      !piece ||
      configuration.migrationReview ||
      isCollisionGeometryPending(piece)
    ) {
      return configuration;
    }

    const evaluation = evaluateConveyorConfiguration(configuration, piece);

    if (!evaluation.tcpPose.valid) {
      return {
        ...configuration,
        status: evaluation.status,
        tcpPoseInConveyorFrame: {
          valid: false,
          reason: evaluation.tcpPose.reason
        }
      };
    }

    /*
      Poses recalculades amb l'amplada de cinta vigent
      (és global: si ha canviat, totes les peces es
      tornen a centrar).
    */
    const poses = getStoredPoses(configuration, evaluation);

    return {
      ...configuration,
      status: evaluation.status,
      placement: {
        ...configuration.placement,
        beltWidth: getConveyorBeltWidth(),
        position: poses.position,
        piecePoseInConveyorFrame: poses.piecePoseInConveyorFrame
      },
      tcpPoseInConveyorFrame: poses.tcpPoseInConveyorFrame
    };
  });
}

function sanitizeVector(value) {
  return {
    x: toFiniteNumber(value?.x),
    y: toFiniteNumber(value?.y),
    z: toFiniteNumber(value?.z)
  };
}

// Quaternion guardat: normalitzat, o null si és corrupte
function sanitizeQuaternion(value) {
  const quaternion = new THREE.Quaternion(
    Number(value?.x),
    Number(value?.y),
    Number(value?.z),
    Number(value?.w)
  );

  const components = [quaternion.x, quaternion.y, quaternion.z, quaternion.w];

  if (!components.every(Number.isFinite) || quaternion.length() < 1e-9) {
    return null;
  }

  return serializeQuaternion(quaternion.normalize());
}

function sanitizeFaceReference(value) {
  return value && typeof value === "object"
    ? {
        normal: sanitizeVector(value.normal),
        center: sanitizeVector(value.center)
      }
    : null;
}

function sanitizeTcpPose(value) {
  if (!value?.valid) {
    return { valid: false, reason: value?.reason ?? "notCalculated" };
  }

  const quaternion = sanitizeQuaternion(value.quaternion);
  const position = value.position;

  const positionValid = ["x", "y", "z"].every((axis) =>
    Number.isFinite(Number(position?.[axis]))
  );

  // Dades corruptes: el TCP es marca com a invàlid
  if (!quaternion || !positionValid) {
    return { valid: false, reason: "invalidTransform" };
  }

  return {
    ...value,
    valid: true,
    position: sanitizeVector(position),
    quaternion
  };
}

function sanitizeConfiguration(item) {
  const piecePose = item.placement?.piecePoseInConveyorFrame;
  const piecePoseQuaternion = piecePose
    ? sanitizeQuaternion(piecePose.quaternion)
    : null;

  const tcpPose = sanitizeTcpPose(item.tcpPoseInConveyorFrame);

  return {
    pieceId: item.pieceId,
    placement: {
      contactFaceId: item.placement?.contactFaceId ?? null,
      contactFaceReference: sanitizeFaceReference(
        item.placement?.contactFaceReference
      ),
      rotationDeg: normalizeRotationDeg(item.placement?.rotationDeg),
      /*
        Amplada de la cinta amb què es va calcular el TCP
        desat (només informativa: els càlculs fan servir
        sempre l'amplada global vigent). Les versions
        anteriors en lloc d'això guardaven la distància al
        lateral (edgeDistanceY), que ja no s'utilitza.
      */
      beltWidth: isValidBeltWidth(item.placement?.beltWidth)
        ? Number(item.placement.beltWidth)
        : null,
      position: sanitizeVector(item.placement?.position),
      piecePoseInConveyorFrame:
        piecePose && piecePoseQuaternion
          ? {
              position: sanitizeVector(piecePose.position),
              quaternion: piecePoseQuaternion
            }
          : null
    },
    grasp: {
      graspFaceId: item.grasp?.graspFaceId ?? null,
      graspFaceReference: sanitizeFaceReference(
        item.grasp?.graspFaceReference
      ),
      faceOffsetX: toFiniteNumber(item.grasp?.faceOffsetX),
      faceOffsetY: toFiniteNumber(item.grasp?.faceOffsetY),
      faceRotationDeg: toFiniteNumber(item.grasp?.faceRotationDeg)
    },
    tcpPoseInConveyorFrame: tcpPose,
    /*
      Només "valid" o "needsReview". Els esborranys de la
      versió anterior (incomplets) passen a revisió.
    */
    status:
      item.status === CONVEYOR_CONFIGURATION_STATUS.VALID && tcpPose.valid
        ? CONVEYOR_CONFIGURATION_STATUS.VALID
        : CONVEYOR_CONFIGURATION_STATUS.NEEDS_REVIEW,
    pieceGeometryVersion: item.pieceGeometryVersion ?? null,
    createdAt: item.createdAt ?? null,
    updatedAt: item.updatedAt ?? null,
    // Dades de la migració (es conserven fins que es guarda)
    ...(item.migrationReview ? { migrationReview: true } : {}),
    ...(Array.isArray(item.legacyConfigurations) &&
    item.legacyConfigurations.length > 0
      ? { legacyConfigurations: item.legacyConfigurations }
      : {})
  };
}

function getTimestamp(configuration) {
  const timestamp = Date.parse(configuration.updatedAt ?? "");
  return Number.isFinite(timestamp) ? timestamp : null;
}

/*
  Configuracions carregades d'un projecte o de
  l'autodesat.

  - Projectes antics sense configuracions: [].
  - Configuracions sense peça (esborranys de la versió
    anterior): no es poden mostrar en una llista de peces
    i es descarten.
  - Diverses configuracions per a la mateixa peça (versió
    anterior): es conserva la més recent si totes tenen
    una data fiable i n'hi ha una de més nova; si no, la
    primera, marcada "migrationReview" (Necessita
    revisió). Les altres es guarden a legacyConfigurations
    fins que l'operari torna a guardar la peça.
*/
export function sanitizeConveyorConfigurations(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const groups = new Map();

  value
    .filter((item) => item && typeof item === "object" && item.pieceId)
    .forEach((item) => {
      const pieceId = item.pieceId;

      if (!groups.has(pieceId)) {
        groups.set(pieceId, []);
      }

      groups.get(pieceId).push(item);
    });

  return [...groups.values()].map((group) => {
    if (group.length === 1) {
      return sanitizeConfiguration(group[0]);
    }

    const timestamps = group.map(getTimestamp);
    const allDated = timestamps.every((timestamp) => timestamp !== null);
    const newest = Math.max(...timestamps.filter((timestamp) => timestamp !== null));
    const newestCount = timestamps.filter((timestamp) => timestamp === newest).length;
    const reliable = allDated && newestCount === 1;

    const chosenIndex = reliable ? timestamps.indexOf(newest) : 0;
    const chosen = group[chosenIndex];
    const others = group.filter((_, index) => index !== chosenIndex);

    return sanitizeConfiguration({
      ...chosen,
      migrationReview: !reliable || Boolean(chosen.migrationReview),
      legacyConfigurations: [
        ...(chosen.legacyConfigurations ?? []),
        ...others.map((other) => JSON.parse(JSON.stringify(other)))
      ]
    });
  });
}
