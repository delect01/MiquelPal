import * as THREE from "three";
import {
  arePiecesPreciselyColliding
} from "./preciseCollision.js";
import {
  getPieceWorldVertices,
  PIECE_FACES
} from "./pieceGeometry.js";
import {
  getPieceCenter
} from "./pieceUtils.js";
import { getPieceBoundingBox } from "./getPieceBoundingBox.js";
import {
  hasImportedConvexGeometry,
  getImportedConvexWorldFaces
} from "./importedConvexGeometry.js";

const SNAP_DISTANCE = 10;
const SEARCH_STEP = 0.5;
const BINARY_SEARCH_ITERATIONS = 14;

/*
  Marge addicional abans del punt matematic de contacte.
  Evita que l'arrodoniment posterior a 3 decimals torni
  a introduir una penetracio microscopica.
*/
const CONTACT_CLEARANCE = 0.002;

/*
  Criteris per considerar dues cares complementaries.
*/
const OPPOSITE_NORMAL_DOT = -0.992;
const MIN_HORIZONTAL_NORMAL = 0.08;
const DIRECTION_DUPLICATE_DOT = 0.9999;
const AXIS_EPSILON = 1e-10;

function translatePiece(
  piece,
  deltaX,
  deltaY
) {
  return {
    ...piece,
    x:
      Number(piece.x) +
      deltaX,
    y:
      Number(piece.y) +
      deltaY
  };
}

function collidesWithTarget(
  movingPiece,
  targetPiece
) {
  return arePiecesPreciselyColliding(
    movingPiece,
    targetPiece
  );
}

function collidesWithAnyTarget(
  piece,
  targetPieces
) {
  return targetPieces.some(
    (targetPiece) =>
      collidesWithTarget(
        piece,
        targetPiece
      )
  );
}

/*
  Calcula com es transformen els eixos X/Y de dades
  de la peça en vectors WORLD de Three.js.

  Així no depenem d'assumir manualment la conversio
  pallet X/Y -> Three X/Z.
*/
function getPalletTranslationBasis(
  piece
) {
  const center =
    getPieceCenter(piece);

  const centerX =
    getPieceCenter({
      ...piece,
      x:
        Number(piece.x) + 1
    });

  const centerY =
    getPieceCenter({
      ...piece,
      y:
        Number(piece.y) + 1
    });

  const origin =
    new THREE.Vector3(
      center.x,
      center.y,
      center.z
    );

  const basisX =
    new THREE.Vector3(
      centerX.x,
      centerX.y,
      centerX.z
    )
      .sub(origin);

  const basisY =
    new THREE.Vector3(
      centerY.x,
      centerY.y,
      centerY.z
    )
      .sub(origin);

  basisX.y = 0;
  basisY.y = 0;

  if (
    basisX.lengthSq() <
      AXIS_EPSILON ||
    basisY.lengthSq() <
      AXIS_EPSILON
  ) {
    return null;
  }

  return {
    x:
      basisX.normalize(),
    y:
      basisY.normalize()
  };
}

function worldDirectionToPalletDirection(
  worldDirection,
  basis
) {
  const horizontal =
    worldDirection.clone();

  horizontal.y = 0;

  if (
    horizontal.lengthSq() <
    AXIS_EPSILON
  ) {
    return null;
  }

  horizontal.normalize();

  const directionX =
    horizontal.dot(basis.x);

  const directionY =
    horizontal.dot(basis.y);

  const length = Math.hypot(
    directionX,
    directionY
  );

  if (length < AXIS_EPSILON) {
    return null;
  }

  return {
    x:
      directionX / length,
    y:
      directionY / length
  };
}

function describeFace(
  faceIndex,
  normal,
  center
) {
  const horizontalStrength =
    Math.hypot(
      normal.x,
      normal.z
    );

  return {
    faceIndex,
    normal,
    center,
    horizontalStrength,

    /*
      Una cara lateral inclinada te component
      vertical i component horitzontal.
      Les cares verticals continuen utilitzant
      el snap X/Y tradicional.
    */
    inclined:
      horizontalStrength >
        MIN_HORIZONTAL_NORMAL &&
      Math.abs(normal.y) >
        MIN_HORIZONTAL_NORMAL
  };
}

function getFaceData(piece) {
  /*
    Peces importades: cares reals del model.
  */
  if (
    hasImportedConvexGeometry(piece)
  ) {
    return getImportedConvexWorldFaces(
      piece
    ).map((face, faceIndex) =>
      describeFace(
        faceIndex,
        face.normal.normalize(),
        face.center
      )
    );
  }

  const vertices =
    getPieceWorldVertices(piece);

  return PIECE_FACES
    .map((indices, faceIndex) => {
      const pointA =
        vertices[indices[0]];
      const pointB =
        vertices[indices[1]];
      const pointC =
        vertices[indices[2]];

      if (
        !pointA ||
        !pointB ||
        !pointC
      ) {
        return null;
      }

      const normal =
        new THREE.Vector3()
          .crossVectors(
            pointB
              .clone()
              .sub(pointA),
            pointC
              .clone()
              .sub(pointA)
          );

      if (
        normal.lengthSq() <
        AXIS_EPSILON
      ) {
        return null;
      }

      normal.normalize();

      const center =
        indices.reduce(
          (sum, vertexIndex) =>
            sum.add(
              vertices[vertexIndex]
            ),
          new THREE.Vector3()
        )
          .multiplyScalar(
            1 / indices.length
          );

      return describeFace(
        faceIndex,
        normal,
        center
      );
    })
    .filter(Boolean);
}

/*
  Peces que poden tenir cares laterals
  inclinades.
*/
function canHaveInclinedFaces(piece) {
  return (
    piece.pieceType === "TRAPEZOIDAL" ||
    hasImportedConvexGeometry(piece)
  );
}

function directionsAreEquivalent(
  directionA,
  directionB
) {
  return (
    directionA.x *
      directionB.x +
    directionA.y *
      directionB.y
  ) > DIRECTION_DUPLICATE_DOT;
}

function addUniqueDirection(
  directions,
  candidate
) {
  if (!candidate) {
    return;
  }

  const exists =
    directions.some(
      (direction) =>
        directionsAreEquivalent(
          direction,
          candidate
        )
    );

  if (!exists) {
    directions.push(candidate);
  }
}

/*
  Crea direccions de snap a partir de parelles de
  cares inclinades amb normals oposades.
*/
function getInclinedSnapDirections(
  movingPiece,
  targetPiece
) {
  if (
    !canHaveInclinedFaces(movingPiece) ||
    !canHaveInclinedFaces(targetPiece)
  ) {
    return [];
  }

  const basis =
    getPalletTranslationBasis(
      movingPiece
    );

  if (!basis) {
    return [];
  }

  const movingFaces =
    getFaceData(movingPiece)
      .filter(
        (face) => face.inclined
      );

  const targetFaces =
    getFaceData(targetPiece)
      .filter(
        (face) => face.inclined
      );

  const directions = [];

  movingFaces.forEach(
    (movingFace) => {
      targetFaces.forEach(
        (targetFace) => {
          const normalDot =
            movingFace.normal.dot(
              targetFace.normal
            );

          if (
            normalDot >
            OPPOSITE_NORMAL_DOT
          ) {
            return;
          }

          const centerDifference =
            targetFace.center
              .clone()
              .sub(
                movingFace.center
              );

          centerDifference.y = 0;

          if (
            centerDifference.lengthSq() <
            AXIS_EPSILON
          ) {
            return;
          }

          const horizontalNormal =
            movingFace.normal.clone();

          horizontalNormal.y = 0;

          if (
            horizontalNormal.lengthSq() <
            AXIS_EPSILON
          ) {
            return;
          }

          horizontalNormal.normalize();

          /*
            Orientem la normal cap a la cara objectiu.
          */
          if (
            horizontalNormal.dot(
              centerDifference
            ) < 0
          ) {
            horizontalNormal.negate();
          }

          const palletDirection =
            worldDirectionToPalletDirection(
              horizontalNormal,
              basis
            );

          addUniqueDirection(
            directions,
            palletDirection
          );
        }
      );
    }
  );

  return directions;
}

function findContactDistance({
  movingPiece,
  targetPiece,
  directionX,
  directionY,
  snapDistance = SNAP_DISTANCE
}) {
  // Pas de cerca proporcional a la distància d'atracció
  const searchStep = Math.max(SEARCH_STEP, snapDistance / 20);

  if (
    collidesWithTarget(
      movingPiece,
      targetPiece
    )
  ) {
    return null;
  }

  let previousSafeDistance = 0;

  for (
    let distance = searchStep;
    distance <=
      snapDistance +
      searchStep / 2;
    distance += searchStep
  ) {
    const checkedDistance =
      Math.min(
        distance,
        snapDistance
      );

    const candidatePiece =
      translatePiece(
        movingPiece,
        directionX *
          checkedDistance,
        directionY *
          checkedDistance
      );

    if (
      !collidesWithTarget(
        candidatePiece,
        targetPiece
      )
    ) {
      previousSafeDistance =
        checkedDistance;
      continue;
    }

    let safeDistance =
      previousSafeDistance;
    let collidingDistance =
      checkedDistance;

    for (
      let iteration = 0;
      iteration <
        BINARY_SEARCH_ITERATIONS;
      iteration += 1
    ) {
      const middleDistance =
        (
          safeDistance +
          collidingDistance
        ) / 2;

      const middlePiece =
        translatePiece(
          movingPiece,
          directionX *
            middleDistance,
          directionY *
            middleDistance
        );

      if (
        collidesWithTarget(
          middlePiece,
          targetPiece
        )
      ) {
        collidingDistance =
          middleDistance;
      } else {
        safeDistance =
          middleDistance;
      }
    }

    return Math.max(
      0,
      safeDistance -
        CONTACT_CLEARANCE
    );
  }

  return null;
}

function findBestInclinedSnap({
  movingPiece,
  targetPieces,
  snapDistance
}) {
  let bestSnap = null;

  targetPieces.forEach(
    (targetPiece) => {
      const directions =
        getInclinedSnapDirections(
          movingPiece,
          targetPiece
        );

      directions.forEach(
        (direction) => {
          const distance =
            findContactDistance({
              movingPiece,
              targetPiece,
              directionX:
                direction.x,
              directionY:
                direction.y,
              snapDistance
            });

          if (
            distance === null ||
            distance <= 0
          ) {
            return;
          }

          const candidatePiece =
            translatePiece(
              movingPiece,
              direction.x * distance,
              direction.y * distance
            );

          if (
            collidesWithAnyTarget(
              candidatePiece,
              targetPieces
            )
          ) {
            return;
          }

          if (
            bestSnap === null ||
            distance <
              bestSnap.distance
          ) {
            bestSnap = {
              piece:
                candidatePiece,
              deltaX:
                direction.x *
                distance,
              deltaY:
                direction.y *
                distance,
              distance,
              snappedAxes: 2,
              inclined: true
            };
          }
        }
      );
    }
  );

  return bestSnap;
}

function findBestAxisSnap({
  movingPiece,
  targetPieces,
  axis,
  snapDistance
}) {
  const directions =
    axis === "x"
      ? [
          { x: 1, y: 0 },
          { x: -1, y: 0 }
        ]
      : [
          { x: 0, y: 1 },
          { x: 0, y: -1 }
        ];

  let bestSnap = null;

  targetPieces.forEach(
    (targetPiece) => {
      directions.forEach(
        (direction) => {
          const distance =
            findContactDistance({
              movingPiece,
              targetPiece,
              directionX:
                direction.x,
              directionY:
                direction.y,
              snapDistance
            });

          if (distance === null) {
            return;
          }

          const deltaX =
            direction.x * distance;
          const deltaY =
            direction.y * distance;

          if (
            bestSnap === null ||
            distance <
              bestSnap.distance
          ) {
            bestSnap = {
              deltaX,
              deltaY,
              distance
            };
          }
        }
      );
    }
  );

  return bestSnap;
}

function buildAxisSnapCandidate({
  movingPiece,
  targetPieces,
  firstAxis,
  secondAxis,
  snapDistance
}) {
  let candidatePiece = {
    ...movingPiece
  };

  let appliedX = false;
  let appliedY = false;

  const firstSnap =
    findBestAxisSnap({
      movingPiece:
        candidatePiece,
      targetPieces,
      axis: firstAxis,
      snapDistance
    });

  if (firstSnap) {
    candidatePiece =
      translatePiece(
        candidatePiece,
        firstSnap.deltaX,
        firstSnap.deltaY
      );

    // Cara en contacte en aquest eix (encara que ja hi fos)
    appliedX = firstAxis === "x";
    appliedY = firstAxis === "y";
  }

  const secondSnap =
    findBestAxisSnap({
      movingPiece:
        candidatePiece,
      targetPieces,
      axis: secondAxis,
      snapDistance
    });

  if (secondSnap) {
    const secondCandidate =
      translatePiece(
        candidatePiece,
        secondSnap.deltaX,
        secondSnap.deltaY
      );

    /*
      El segon eix nomes s'accepta si no destrueix
      el contacte segur aconseguit pel primer.
    */
    if (
      !collidesWithAnyTarget(
        secondCandidate,
        targetPieces
      )
    ) {
      candidatePiece =
        secondCandidate;

      appliedX =
        appliedX || secondAxis === "x";
      appliedY =
        appliedY || secondAxis === "y";
    }
  }

  if (!appliedX && !appliedY) {
    return null;
  }

  if (
    collidesWithAnyTarget(
      candidatePiece,
      targetPieces
    )
  ) {
    return null;
  }

  const deltaX =
    Number(candidatePiece.x) -
    Number(movingPiece.x);

  const deltaY =
    Number(candidatePiece.y) -
    Number(movingPiece.y);

  return {
    piece: candidatePiece,
    deltaX,
    deltaY,
    snappedAxes:
      Number(appliedX) +
      Number(appliedY),
    contactAxes: { x: appliedX, y: appliedY },
    distance:
      Math.hypot(
        deltaX,
        deltaY
      ),
    inclined: false
  };
}

/*
  PETJADA D'UNA PEÇA EN COORDENADES DEL PALET

  Rectangle que ocupa en planta (X i Y del palet) i
  alçades mínima i màxima. Es calcula amb la caixa
  envolupant real (casc convex per a les importades).
  En Three.js: X = -Y del palet, Z = -X del palet.
*/
function getPalletFootprint(piece) {
  const box = getPieceBoundingBox(piece);

  if (box.isEmpty()) {
    return null;
  }

  return {
    minX: -box.max.z,
    maxX: -box.min.z,
    minY: -box.max.x,
    maxY: -box.min.x,
    minZ: box.min.y,
    maxZ: box.max.y
  };
}

function getAxisRange(footprint, axis) {
  return axis === "x"
    ? { min: footprint.minX, max: footprint.maxX }
    : { min: footprint.minY, max: footprint.maxY };
}

function getRangeGap(rangeA, rangeB) {
  return Math.max(rangeB.min - rangeA.max, rangeA.min - rangeB.max, 0);
}

/*
  Només les peces properes poden atraure: en planta, a
  menys de la distància d'atracció. Evita comprovar
  col·lisions contra tot el palet a cada moviment.
*/
function getNearbyTargets(movingPiece, targetPieces, snapDistance) {
  const moving = getPalletFootprint(movingPiece);

  if (!moving) {
    return targetPieces;
  }

  const margin = snapDistance + 1;

  return targetPieces.filter((targetPiece) => {
    const target = getPalletFootprint(targetPiece);

    return (
      target &&
      getRangeGap(getAxisRange(moving, "x"), getAxisRange(target, "x")) <= margin &&
      getRangeGap(getAxisRange(moving, "y"), getAxisRange(target, "y")) <= margin
    );
  });
}

// Tolerància vertical: peces que només es toquen en alçada no compten
const COLLISION_HEIGHT_EPSILON = 0.5;

// Les vores pesen més que els centres en l'alineació
const CENTER_ALIGNMENT_WEIGHT = 1.5;

/*
  ALINEACIÓ DE VORES, CANTONADES I CENTRES

  En cada eix lliure (sense cara en contacte), busca el
  desplaçament més petit (dins la distància d'atracció)
  que deixa alineada una vora de la peça amb:
  - la mateixa vora d'una peça veïna (al costat o a
    tocar en l'altre eix): vora amb vora, i per tant
    cantonada amb cantonada si també hi ha contacte;
  - el centre de la peça veïna (amb menys prioritat);
  - les vores del palet (X = 0, X = mida X, Y = 0,
    Y = mida Y): les vores i cantonades del palet.

  Només compten les peces que comparteixen alçada amb
  la que es mou (no els separadors de sota).
*/
function findAlignmentOffsets({
  movingPiece,
  targetPieces,
  pallet,
  snapDistance,
  lockedAxes
}) {
  const footprint = getPalletFootprint(movingPiece);

  if (!footprint) {
    return { x: null, y: null };
  }

  const best = { x: null, y: null };

  function consider(axis, offset, weight = 1) {
    if (!Number.isFinite(offset) || Math.abs(offset) > snapDistance) {
      return;
    }

    const score = Math.abs(offset) * weight;

    if (best[axis] === null || score < best[axis].score) {
      best[axis] = { offset, score };
    }
  }

  const targetFootprints = targetPieces
    .map(getPalletFootprint)
    .filter(
      (target) =>
        target &&
        target.maxZ > footprint.minZ + COLLISION_HEIGHT_EPSILON &&
        target.minZ < footprint.maxZ - COLLISION_HEIGHT_EPSILON
    );

  ["x", "y"].forEach((axis) => {
    if (lockedAxes[axis]) {
      return;
    }

    const otherAxis = axis === "x" ? "y" : "x";
    const range = getAxisRange(footprint, axis);
    const center = (range.min + range.max) / 2;

    // Vores del palet
    if (pallet) {
      const palletSize = Number(axis === "x" ? pallet.sizeX : pallet.sizeY);

      if (Number.isFinite(palletSize) && palletSize > 0) {
        consider(axis, 0 - range.min);
        consider(axis, palletSize - range.max);
      }
    }

    // Peces veïnes: al costat o a tocar en l'altre eix
    targetFootprints.forEach((target) => {
      const gapOtherAxis = getRangeGap(
        getAxisRange(footprint, otherAxis),
        getAxisRange(target, otherAxis)
      );

      if (gapOtherAxis > snapDistance) {
        return;
      }

      const targetRange = getAxisRange(target, axis);

      consider(axis, targetRange.min - range.min);
      consider(axis, targetRange.max - range.max);
      consider(
        axis,
        (targetRange.min + targetRange.max) / 2 - center,
        CENTER_ALIGNMENT_WEIGHT
      );
    });
  });

  return {
    x: best.x?.offset ?? null,
    y: best.y?.offset ?? null
  };
}

/*
  Aplica l'alineació si no provoca cap col·lisió:
  primer als dos eixos, i si no és possible, a un sol.
*/
function applyAlignment(piece, offsets, targetPieces) {
  const options = [
    { x: offsets.x, y: offsets.y },
    { x: offsets.x, y: null },
    { x: null, y: offsets.y }
  ].filter((option) => option.x !== null || option.y !== null);

  for (const option of options) {
    const candidate = translatePiece(piece, option.x ?? 0, option.y ?? 0);

    if (!collidesWithAnyTarget(candidate, targetPieces)) {
      return candidate;
    }
  }

  return piece;
}

/*
  Desplaçament (dx, dy) que l'imant aplica a una peça:

  1. Cares inclinades complementàries (trapezis i
     peces importades): un sol moviment segons la
     normal real.
  2. Cara amb cara en els eixos del palet.
  3. Alineació de vores/cantonades/centres amb les
     peces veïnes i amb les vores del palet, en els
     eixos que no tenen cara en contacte.

  snapDistance (mm): distància d'atracció. L'escena la
  calcula a partir del zoom perquè sigui sempre uns
  pocs píxels de pantalla.
*/
export function getMagneticSnapDelta({
  movingPiece,
  allPieces,
  excludedPieceIds = [],
  pallet = null,
  snapDistance = SNAP_DISTANCE
}) {
  const noMove = { deltaX: 0, deltaY: 0 };

  if (
    !movingPiece ||
    !Array.isArray(allPieces) ||
    !(snapDistance > 0)
  ) {
    return noMove;
  }

  const excludedIdSet =
    new Set([
      movingPiece.id,
      ...excludedPieceIds
    ]);

  const targetPieces = getNearbyTargets(
    movingPiece,
    allPieces.filter(
      (piece) =>
        !excludedIdSet.has(
          piece.id
        )
    ),
    snapDistance
  );

  let snappedPiece = movingPiece;
  let lockedAxes = { x: false, y: false };

  if (targetPieces.length > 0) {
    /*
      PRIORITAT 1:
      Un sol moviment segons la normal real de les
      cares inclinades complementaries.
    */
    const inclinedSnap =
      findBestInclinedSnap({
        movingPiece,
        targetPieces,
        snapDistance
      });

    if (inclinedSnap) {
      return {
        deltaX: inclinedSnap.deltaX,
        deltaY: inclinedSnap.deltaY
      };
    }

    /*
      PRIORITAT 2:
      Cara amb cara en els eixos del palet.
    */
    const candidates = [
      buildAxisSnapCandidate({
        movingPiece,
        targetPieces,
        firstAxis: "x",
        secondAxis: "y",
        snapDistance
      }),
      buildAxisSnapCandidate({
        movingPiece,
        targetPieces,
        firstAxis: "y",
        secondAxis: "x",
        snapDistance
      })
    ].filter(Boolean);

    if (candidates.length > 0) {
      candidates.sort(
        (
          candidateA,
          candidateB
        ) => {
          if (
            candidateA.snappedAxes !==
            candidateB.snappedAxes
          ) {
            return (
              candidateB.snappedAxes -
              candidateA.snappedAxes
            );
          }

          return (
            candidateA.distance -
            candidateB.distance
          );
        }
      );

      snappedPiece = candidates[0].piece;
      lockedAxes = candidates[0].contactAxes;
    }
  }

  /*
    PRIORITAT 3:
    Alineació de vores, cantonades i centres (amb les
    peces veïnes i amb el palet).
  */
  const offsets = findAlignmentOffsets({
    movingPiece: snappedPiece,
    targetPieces,
    pallet,
    snapDistance,
    lockedAxes
  });

  if (offsets.x !== null || offsets.y !== null) {
    snappedPiece = applyAlignment(snappedPiece, offsets, targetPieces);
  }

  return {
    deltaX: Number(snappedPiece.x) - Number(movingPiece.x),
    deltaY: Number(snappedPiece.y) - Number(movingPiece.y)
  };
}

export function applyMagneticSnap(options) {
  const { deltaX, deltaY } = getMagneticSnapDelta(options);

  return deltaX === 0 && deltaY === 0
    ? options.movingPiece
    : translatePiece(options.movingPiece, deltaX, deltaY);
}

/*
  IMANT D'UN GRUP

  Quan s'arrossega una selecció de diverses peces, el
  grup es mou com un bloc: es calcula l'imant de cada
  peça del grup (començant per la que s'arrossega) i
  s'aplica a tot el grup el desplaçament més petit que
  no fa xocar cap peça del grup amb la resta.
*/
export function getGroupMagneticSnapDelta({
  movingPieces,
  leadPieceId,
  allPieces,
  pallet = null,
  snapDistance = SNAP_DISTANCE,
  maxCandidates = 8
}) {
  const movingIds = movingPieces.map((piece) => piece.id);
  const fixedPieces = allPieces.filter(
    (piece) => !movingIds.includes(piece.id)
  );

  const orderedPieces = [
    ...movingPieces.filter((piece) => piece.id === leadPieceId),
    ...movingPieces.filter((piece) => piece.id !== leadPieceId)
  ].slice(0, maxCandidates);

  const options = orderedPieces
    .map((piece) =>
      getMagneticSnapDelta({
        movingPiece: piece,
        allPieces: fixedPieces,
        pallet,
        snapDistance
      })
    )
    .filter((delta) => delta.deltaX !== 0 || delta.deltaY !== 0)
    .sort(
      (deltaA, deltaB) =>
        Math.hypot(deltaA.deltaX, deltaA.deltaY) -
        Math.hypot(deltaB.deltaX, deltaB.deltaY)
    );

  for (const option of options) {
    const groupCollides = movingPieces.some((piece) => {
      const moved = translatePiece(piece, option.deltaX, option.deltaY);

      return collidesWithAnyTarget(
        moved,
        getNearbyTargets(moved, fixedPieces, 1)
      );
    });

    if (!groupCollides) {
      return option;
    }
  }

  return { deltaX: 0, deltaY: 0 };
}

/*
  CENTRAT DEL CONJUNT AL PALET

  Quan es mou tot el material de la composició, el seu
  centre (de la petjada total) s'atrau al centre del
  palet en X i en Y.
*/

// Distància (mm) per considerar el conjunt centrat en un eix
export const PALLET_CENTER_TOLERANCE = 0.01;

// Petjada total (planta) d'unes quantes peces, o null
export function getPiecesPalletFootprint(pieces) {
  const footprints = pieces.map(getPalletFootprint).filter(Boolean);

  if (footprints.length === 0) {
    return null;
  }

  return footprints.reduce((total, footprint) => ({
    minX: Math.min(total.minX, footprint.minX),
    maxX: Math.max(total.maxX, footprint.maxX),
    minY: Math.min(total.minY, footprint.minY),
    maxY: Math.max(total.maxY, footprint.maxY)
  }));
}

/*
  Desplaçament que deixa el conjunt centrat al palet:
  centre del palet menys centre de la petjada total.
  Retorna null si no hi ha peces o palet.
*/
export function getCompositionCenterOffset(pieces, pallet) {
  const footprint = getPiecesPalletFootprint(pieces);
  const sizeX = Number(pallet?.sizeX);
  const sizeY = Number(pallet?.sizeY);

  if (!footprint || !(sizeX > 0) || !(sizeY > 0)) {
    return null;
  }

  return {
    deltaX: sizeX / 2 - (footprint.minX + footprint.maxX) / 2,
    deltaY: sizeY / 2 - (footprint.minY + footprint.maxY) / 2
  };
}

// En quins eixos el conjunt està centrat (per a les guies)
export function getCompositionCenteredAxes(pieces, pallet) {
  const offset = getCompositionCenterOffset(pieces, pallet);

  return {
    x: Boolean(offset) && Math.abs(offset.deltaX) <= PALLET_CENTER_TOLERANCE,
    y: Boolean(offset) && Math.abs(offset.deltaY) <= PALLET_CENTER_TOLERANCE
  };
}
