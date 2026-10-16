import * as THREE from "three";
import { getPieceCenter, palletEulerToThreeQuaternion } from "./pieceUtils";

export function getPieceLocalVertices(piece) {
  if (piece.pieceType === "IMPORTED_3D") {
    const importedVertices = piece.collisionGeometry?.vertices;

    if (!Array.isArray(importedVertices) || importedVertices.length < 4) {
      console.error(
        "Peça 3D importada sense geometria de col·lisió:",
        {
          id: piece.id,
          name: piece.name,
          modelId: piece.modelId,
          pieceType: piece.pieceType,
          collisionGeometry: piece.collisionGeometry
        }
      );
      return [];
    }

    return importedVertices.map(
      (vertex) =>
        new THREE.Vector3(
          Number(vertex.x),
          Number(vertex.y),
          Number(vertex.z)
        )
    );
  }

  const bottomWidth = Number(piece.width);
  const bottomDepth = Number(piece.depth);
  const height = Number(piece.height);
  const topWidth = piece.pieceType === "TRAPEZOIDAL"
    ? Number(piece.topWidth ?? piece.width)
    : bottomWidth;
  const topDepth = piece.pieceType === "TRAPEZOIDAL"
    ? Number(piece.topDepth ?? piece.depth)
    : bottomDepth;

  const bw = bottomWidth / 2;
  const bd = bottomDepth / 2;
  const tw = topWidth / 2;
  const td = topDepth / 2;
  const hh = height / 2;

  return [
    new THREE.Vector3(-bw, -hh, -bd),
    new THREE.Vector3(bw, -hh, -bd),
    new THREE.Vector3(bw, -hh, bd),
    new THREE.Vector3(-bw, -hh, bd),
    new THREE.Vector3(-tw, hh, -td),
    new THREE.Vector3(tw, hh, -td),
    new THREE.Vector3(tw, hh, td),
    new THREE.Vector3(-tw, hh, td)
  ];
}

export function getPieceWorldVertices(piece) {
  const center = getPieceCenter(piece);
  const quaternion = palletEulerToThreeQuaternion(
    piece.rxDeg ?? 0,
    piece.ryDeg ?? 0,
    piece.rzDeg ?? 0
  );
  const centerVector = new THREE.Vector3(center.x, center.y, center.z);
  const localVertices = getPieceLocalVertices(piece);

  if (localVertices.length === 0) {
    return [];
  }

  return localVertices.map(
    (vertex) =>
      vertex
        .clone()
        .applyQuaternion(quaternion)
        .add(centerVector)
  );
}

export function getPieceFaces(piece) {
  if (
    piece.pieceType === "IMPORTED_3D" &&
    piece.collisionGeometry?.triangles
  ) {
    return piece.collisionGeometry.triangles;
  }

  return [
    [0, 3, 2, 1],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [1, 2, 6, 5],
    [2, 3, 7, 6],
    [3, 0, 4, 7]
  ];
}

export function getPieceEdges(piece) {
  if (
    piece.pieceType === "IMPORTED_3D" &&
    piece.collisionGeometry?.edges
  ) {
    return piece.collisionGeometry.edges;
  }

  return [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7]
  ];
}

export const PIECE_FACES = [
  [0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4],
  [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]
];

export const PIECE_EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7]
];
