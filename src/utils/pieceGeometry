//pieceGeometry

import * as THREE from "three";

import {
  getPieceCenter,
  palletEulerToThreeQuaternion
} from "./pieceUtils";

/*
  Retorna els 8 vèrtexs locals de la peça.

  Índexs:

  0, 1, 2, 3 = base inferior
  4, 5, 6, 7 = part superior
*/
export function getPieceLocalVertices(piece) {
  const bottomWidth =
    piece.width;

  const bottomDepth =
    piece.depth;

  const height =
    piece.height;

  /*
    En una peça rectangular:

    topWidth = width
    topDepth = depth

    En una peça trapezoidal utilitzem
    topWidth i topDepth.
  */
  const topWidth =
    piece.pieceType === "TRAPEZOIDAL"
      ? piece.topWidth ?? piece.width
      : piece.width;

  const topDepth =
    piece.pieceType === "TRAPEZOIDAL"
      ? piece.topDepth ?? piece.depth
      : piece.depth;

  const bottomHalfWidth =
    bottomWidth / 2;

  const bottomHalfDepth =
    bottomDepth / 2;

  const topHalfWidth =
    topWidth / 2;

  const topHalfDepth =
    topDepth / 2;

  const halfHeight =
    height / 2;

  return [
    /*
      Base inferior
    */

    new THREE.Vector3(
      -bottomHalfWidth,
      -halfHeight,
      -bottomHalfDepth
    ),

    new THREE.Vector3(
      bottomHalfWidth,
      -halfHeight,
      -bottomHalfDepth
    ),

    new THREE.Vector3(
      bottomHalfWidth,
      -halfHeight,
      bottomHalfDepth
    ),

    new THREE.Vector3(
      -bottomHalfWidth,
      -halfHeight,
      bottomHalfDepth
    ),

    /*
      Part superior
    */

    new THREE.Vector3(
      -topHalfWidth,
      halfHeight,
      -topHalfDepth
    ),

    new THREE.Vector3(
      topHalfWidth,
      halfHeight,
      -topHalfDepth
    ),

    new THREE.Vector3(
      topHalfWidth,
      halfHeight,
      topHalfDepth
    ),

    new THREE.Vector3(
      -topHalfWidth,
      halfHeight,
      topHalfDepth
    )
  ];
}

/*
  Transforma els vèrtexs locals en vèrtexs
  absoluts de Three.js.

  Utilitza el mateix centre i el mateix
  quaternion que la peça visual.
*/
export function getPieceWorldVertices(piece) {
  const center =
    getPieceCenter(piece);

  const quaternion =
    palletEulerToThreeQuaternion(
      piece.rxDeg ?? 0,
      piece.ryDeg ?? 0,
      piece.rzDeg ?? 0
    );

  const centerVector =
    new THREE.Vector3(
      center.x,
      center.y,
      center.z
    );

  const localVertices =
    getPieceLocalVertices(piece);

  return localVertices.map(
    (localVertex) =>
      localVertex
        .clone()
        .applyQuaternion(quaternion)
        .add(centerVector)
  );
}

/*
  Definició de les sis cares del volum.

  Cada cara conté els quatre índexs
  dels seus vèrtexs.
*/
export const PIECE_FACES = [
  [0, 3, 2, 1],
  [4, 5, 6, 7],
  [0, 1, 5, 4],
  [1, 2, 6, 5],
  [2, 3, 7, 6],
  [3, 0, 4, 7]
];

/*
  Definició de les dotze arestes del volum.
*/
export const PIECE_EDGES = [
  /*
    Base inferior
  */

  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],

  /*
    Part superior
  */

  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],

  /*
    Arestes que uneixen base i part superior
  */

  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7]
];


