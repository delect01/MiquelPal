import * as THREE from "three";

import {
  getPieceCenter,
  palletEulerToThreeQuaternion
} from "./pieceUtils.js";
import { getPieceCollisionGeometry } from "./collisionGeometryStore.js";

/*
  Geometria real (casc convex) de les peces
  3D importades.

  collisionGeometry.vertices / faces / edges
  estan expressats en el mateix marc local que
  la capsa width x height x depth: centrats a
  l'origen i abans d'aplicar la rotació de la
  peça. Per tant, només cal aplicar el mateix
  quaternion i el mateix centre que la peça
  visual.
*/

const AXIS_EPSILON = 1e-10;
const PARALLEL_EPSILON = 1e-6;

/*
  Les dades locals no canvien mentre la peça
  es mou, així que les guardem per objecte
  collisionGeometry.
*/
const localDataCache = new WeakMap();

function toVector(vertex) {
  return new THREE.Vector3(
    Number(vertex?.x ?? 0),
    Number(vertex?.y ?? 0),
    Number(vertex?.z ?? 0)
  );
}

function addUniqueDirection(
  directions,
  candidate
) {
  if (
    candidate.lengthSq() <
    AXIS_EPSILON
  ) {
    return;
  }

  const normalized =
    candidate
      .clone()
      .normalize();

  const exists =
    directions.some(
      (direction) =>
        Math.abs(
          direction.dot(normalized)
        ) >
        1 - PARALLEL_EPSILON
    );

  if (!exists) {
    directions.push(normalized);
  }
}

function buildLocalFaces(
  collisionGeometry,
  vertices
) {
  /*
    Cares agrupades per pla (format actual).
  */
  if (
    Array.isArray(
      collisionGeometry.faces
    ) &&
    collisionGeometry.faces.length > 0
  ) {
    return collisionGeometry.faces
      .map((face) => ({
        normal:
          toVector(face.normal),
        center:
          toVector(face.center)
      }))
      .filter(
        (face) =>
          face.normal.lengthSq() >
          AXIS_EPSILON
      )
      .map((face) => ({
        normal:
          face.normal.normalize(),
        center: face.center
      }));
  }

  /*
    Alternativa: una cara per triangle.
  */
  return (collisionGeometry.triangles ?? [])
    .map((triangle) => {
      const pointA = vertices[triangle[0]];
      const pointB = vertices[triangle[1]];
      const pointC = vertices[triangle[2]];

      if (!pointA || !pointB || !pointC) {
        return null;
      }

      const normal =
        new THREE.Vector3()
          .crossVectors(
            pointB.clone().sub(pointA),
            pointC.clone().sub(pointA)
          );

      if (
        normal.lengthSq() <
        AXIS_EPSILON
      ) {
        return null;
      }

      return {
        normal: normal.normalize(),
        center:
          pointA
            .clone()
            .add(pointB)
            .add(pointC)
            .multiplyScalar(1 / 3)
      };
    })
    .filter(Boolean);
}

function buildLocalEdgeDirections(
  collisionGeometry,
  vertices
) {
  const directions = [];

  const edges =
    Array.isArray(
      collisionGeometry.edges
    ) &&
    collisionGeometry.edges.length > 0
      ? collisionGeometry.edges
      : (collisionGeometry.triangles ?? [])
          .flatMap((triangle) => [
            [triangle[0], triangle[1]],
            [triangle[1], triangle[2]],
            [triangle[2], triangle[0]]
          ]);

  edges.forEach(([startIndex, endIndex]) => {
    const start = vertices[startIndex];
    const end = vertices[endIndex];

    if (!start || !end) {
      return;
    }

    addUniqueDirection(
      directions,
      end.clone().sub(start)
    );
  });

  return directions;
}

function getLocalData(collisionGeometry) {
  if (localDataCache.has(collisionGeometry)) {
    return localDataCache.get(
      collisionGeometry
    );
  }

  const vertices =
    collisionGeometry.vertices.map(
      toVector
    );

  const faces =
    buildLocalFaces(
      collisionGeometry,
      vertices
    );

  const faceNormals = [];

  faces.forEach((face) => {
    addUniqueDirection(
      faceNormals,
      face.normal
    );
  });

  const data = {
    vertices,
    faces,
    faceNormals,
    edgeDirections:
      buildLocalEdgeDirections(
        collisionGeometry,
        vertices
      )
  };

  localDataCache.set(
    collisionGeometry,
    data
  );

  return data;
}

function getPieceTransform(piece) {
  const center =
    getPieceCenter(piece);

  return {
    centerVector:
      new THREE.Vector3(
        center.x,
        center.y,
        center.z
      ),
    quaternion:
      palletEulerToThreeQuaternion(
        piece.rxDeg ?? 0,
        piece.ryDeg ?? 0,
        piece.rzDeg ?? 0
      )
  };
}

/*
  Només les peces importades amb geometria de
  col·lisió vàlida utilitzen la forma real.
  La resta continuen amb la capsa paramètrica.
*/
export function hasImportedConvexGeometry(piece) {
  return (
    piece?.pieceType === "IMPORTED_3D" &&
    Array.isArray(
      getPieceCollisionGeometry(piece)?.vertices
    ) &&
    getPieceCollisionGeometry(piece).vertices.length >= 4
  );
}

export function getImportedConvexWorldVertices(piece) {
  const { vertices } =
    getLocalData(getPieceCollisionGeometry(piece));

  const {
    centerVector,
    quaternion
  } = getPieceTransform(piece);

  return vertices.map(
    (vertex) =>
      vertex
        .clone()
        .applyQuaternion(quaternion)
        .add(centerVector)
  );
}

/*
  Vèrtexs, normals de cara i direccions
  d'aresta en coordenades WORLD, tal com els
  necessita el SAT.
*/
export function getImportedConvexSatData(piece) {
  const {
    faceNormals,
    edgeDirections
  } = getLocalData(getPieceCollisionGeometry(piece));

  const { quaternion } =
    getPieceTransform(piece);

  return {
    vertices:
      getImportedConvexWorldVertices(piece),
    faceNormals:
      faceNormals.map((normal) =>
        normal
          .clone()
          .applyQuaternion(quaternion)
      ),
    edgeDirections:
      edgeDirections.map((direction) =>
        direction
          .clone()
          .applyQuaternion(quaternion)
      )
  };
}

/*
  Cares reals en coordenades WORLD (normal i
  centre) per al snap magnètic.
*/
export function getImportedConvexWorldFaces(piece) {
  const { faces } =
    getLocalData(getPieceCollisionGeometry(piece));

  const {
    centerVector,
    quaternion
  } = getPieceTransform(piece);

  return faces.map((face) => ({
    normal:
      face.normal
        .clone()
        .applyQuaternion(quaternion),
    center:
      face.center
        .clone()
        .applyQuaternion(quaternion)
        .add(centerVector)
  }));
}
