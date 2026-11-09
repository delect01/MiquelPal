import {
  COLLISION_CONFIG
} from "../Config/geometryConfig";

import {
  getPieceBoundingBox
} from "./getPieceBoundingBox.js";

import {
  getPalletBoundingBox
} from "./palletGeometry";

import {
  arePiecesPreciselyColliding
} from "./preciseCollision.js";

function getAxisOverlap(
  minimumA,
  maximumA,
  minimumB,
  maximumB
) {
  return (
    Math.min(
      maximumA,
      maximumB
    ) -
    Math.max(
      minimumA,
      minimumB
    )
  );
}

export function isPieceCollidingWithPallet(
  piece,
  pallet
) {
  const pieceBox =
    getPieceBoundingBox(piece);

  const palletBox =
    getPalletBoundingBox(pallet);

  const overlapX =
    getAxisOverlap(
      pieceBox.min.x,
      pieceBox.max.x,
      palletBox.min.x,
      palletBox.max.x
    );

  const overlapY =
    getAxisOverlap(
      pieceBox.min.y,
      pieceBox.max.y,
      palletBox.min.y,
      palletBox.max.y
    );

  const overlapZ =
    getAxisOverlap(
      pieceBox.min.z,
      pieceBox.max.z,
      palletBox.min.z,
      palletBox.max.z
    );

  const tolerance =
    COLLISION_CONFIG.tolerance;

  return (
    overlapX > tolerance &&
    overlapY > tolerance &&
    overlapZ > tolerance
  );
}

export function isPieceOutsidePallet(
  piece,
  pallet
) {
  const pieceBox =
    getPieceBoundingBox(piece);

  const palletBox =
    getPalletBoundingBox(
      pallet
    );

  const tolerance =
    COLLISION_CONFIG.tolerance;

  return (
    pieceBox.min.x <
      palletBox.min.x -
        tolerance ||

    pieceBox.max.x >
      palletBox.max.x +
        tolerance ||

    pieceBox.min.z <
      palletBox.min.z -
        tolerance ||

    pieceBox.max.z >
      palletBox.max.z +
        tolerance
  );
}

export function isPieceCollidingWithPiece(
  pieceA,
  pieceB
) {
  const boxA =
    getPieceBoundingBox(pieceA);

  const boxB =
    getPieceBoundingBox(pieceB);

  if (
    !boxA.intersectsBox(boxB)
  ) {
    return false;
  }

  return arePiecesPreciselyColliding(
    pieceA,
    pieceB
  );
}