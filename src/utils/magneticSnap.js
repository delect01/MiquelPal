import * as THREE from "three";
import {
  arePiecesPreciselyColliding
} from "./preciseCollision";
import {
  getPieceWorldVertices,
  PIECE_FACES
} from "./pieceGeometry";
import {
  getPieceCenter
} from "./pieceUtils";

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

function getFaceData(piece) {
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
    })
    .filter(Boolean);
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
    movingPiece.pieceType !==
      "TRAPEZOIDAL" ||
    targetPiece.pieceType !==
      "TRAPEZOIDAL"
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
  directionY
}) {
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
    let distance = SEARCH_STEP;
    distance <=
      SNAP_DISTANCE +
      SEARCH_STEP / 2;
    distance += SEARCH_STEP
  ) {
    const checkedDistance =
      Math.min(
        distance,
        SNAP_DISTANCE
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
  targetPieces
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
                direction.y
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
  axis
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
                direction.y
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
  secondAxis
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
      axis: firstAxis
    });

  if (firstSnap) {
    candidatePiece =
      translatePiece(
        candidatePiece,
        firstSnap.deltaX,
        firstSnap.deltaY
      );

    appliedX =
      firstSnap.deltaX !== 0;
    appliedY =
      firstSnap.deltaY !== 0;
  }

  const secondSnap =
    findBestAxisSnap({
      movingPiece:
        candidatePiece,
      targetPieces,
      axis: secondAxis
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
        appliedX ||
        secondSnap.deltaX !== 0;
      appliedY =
        appliedY ||
        secondSnap.deltaY !== 0;
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
    distance:
      Math.hypot(
        deltaX,
        deltaY
      ),
    inclined: false
  };
}

export function applyMagneticSnap({
  movingPiece,
  allPieces,
  excludedPieceIds = []
}) {
  if (
    !movingPiece ||
    !Array.isArray(allPieces)
  ) {
    return movingPiece;
  }

  const excludedIdSet =
    new Set([
      movingPiece.id,
      ...excludedPieceIds
    ]);

  const targetPieces =
    allPieces.filter(
      (piece) =>
        !excludedIdSet.has(
          piece.id
        )
    );

  if (targetPieces.length === 0) {
    return movingPiece;
  }

  /*
    PRIORITAT 1:
    Un sol moviment segons la normal real de les
    cares inclinades complementaries.
  */
  const inclinedSnap =
    findBestInclinedSnap({
      movingPiece,
      targetPieces
    });

  if (inclinedSnap) {
    return inclinedSnap.piece;
  }

  /*
    PRIORITAT 2:
    Comportament tradicional per a cares alineades
    amb els eixos del palet.
  */
  const candidates = [
    buildAxisSnapCandidate({
      movingPiece,
      targetPieces,
      firstAxis: "x",
      secondAxis: "y"
    }),
    buildAxisSnapCandidate({
      movingPiece,
      targetPieces,
      firstAxis: "y",
      secondAxis: "x"
    })
  ].filter(Boolean);

  if (candidates.length === 0) {
    return movingPiece;
  }

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

  return candidates[0].piece;
}
