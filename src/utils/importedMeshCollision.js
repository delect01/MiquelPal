import * as THREE from "three";
import { MeshBVH, ExtendedTriangle } from "three-mesh-bvh";
import {
  getPieceCenter,
  palletEulerToThreeQuaternion
} from "./pieceUtils";
import {
  getPieceWorldVertices,
  getPieceFaces
} from "./pieceGeometry";

const geometryCache = new WeakMap();

function getLocalMeshData(piece) {
  if (piece.pieceType === "IMPORTED_3D") {
    const exact = piece.collisionGeometry?.exact;
    if (exact?.vertices?.length && exact?.triangles?.length) return exact;
    return null;
  }

  const vertices = getPieceWorldVertices({ ...piece, x: 0, y: 0, z: 0 });
  const triangles = [];
  for (const face of getPieceFaces(piece)) {
    for (let index = 1; index < face.length - 1; index += 1) {
      triangles.push([face[0], face[index], face[index + 1]]);
    }
  }
  return {
    vertices: vertices.map((vertex) => ({ x: vertex.x, y: vertex.y, z: vertex.z })),
    triangles
  };
}

function buildGeometry(data) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      data.vertices.flatMap((vertex) => [vertex.x, vertex.y, vertex.z]),
      3
    )
  );
  geometry.setIndex(data.triangles.flat());
  geometry.computeBoundingBox();
  geometry.boundsTree = new MeshBVH(geometry, { maxLeafTris: 8 });
  return geometry;
}

function localGeometry(piece) {
  const key = piece.collisionGeometry;
  if (key && geometryCache.has(key)) return geometryCache.get(key);
  const data = getLocalMeshData(piece);
  if (!data) return null;
  const geometry = buildGeometry(data);
  if (key) geometryCache.set(key, geometry);
  return geometry;
}

function worldMatrix(piece) {
  const centerData = getPieceCenter(piece);
  const position = new THREE.Vector3(centerData.x, centerData.y, centerData.z);
  const quaternion = palletEulerToThreeQuaternion(
    piece.rxDeg ?? 0,
    piece.ryDeg ?? 0,
    piece.rzDeg ?? 0
  );
  return new THREE.Matrix4().compose(position, quaternion, new THREE.Vector3(1, 1, 1));
}

export function importedMeshCollision(pieceA, pieceB) {
  const geometryA = localGeometry(pieceA);
  const geometryB = localGeometry(pieceB);
  if (!geometryA || !geometryB) return null;

  const matrixA = worldMatrix(pieceA);
  const matrixB = worldMatrix(pieceB);
  const matrixBToA = matrixA.clone().invert().multiply(matrixB);
  const triangleA = new ExtendedTriangle();
  const triangleB = new ExtendedTriangle();

  return geometryA.boundsTree.bvhcast(
    geometryB.boundsTree,
    matrixBToA,
    {
      intersectsTriangles(triA, triB) {
        triangleA.copy(triA);
        triangleB.copy(triB);
        return triangleA.intersectsTriangle(triangleB, null, true);
      }
    }
  );
}
