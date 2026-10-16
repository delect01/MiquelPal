import * as THREE from "three";

import {
  COLLISION_CONFIG
} from "../Config/geometryConfig";

import {
  getPieceWorldVertices,
  PIECE_FACES,
  PIECE_EDGES
} from "./pieceGeometry";

const AXIS_EPSILON = 1e-10;
const PARALLEL_EPSILON = 1e-6;

function getFaceNormals(vertices) {
  return PIECE_FACES
    .map((face) => {
      const pointA = vertices[face[0]];
      const pointB = vertices[face[1]];
      const pointC = vertices[face[2]];
      const edgeAB = pointB.clone().sub(pointA);
      const edgeAC = pointC.clone().sub(pointA);
      const normal = new THREE.Vector3().crossVectors(edgeAB, edgeAC);

      if (normal.lengthSq() < AXIS_EPSILON) {
        return null;
      }

      return normal.normalize();
    })
    .filter((normal) => normal !== null);
}

function getEdgeDirections(vertices) {
  return PIECE_EDGES
    .map(([startIndex, endIndex]) => {
      const direction = vertices[endIndex]
        .clone()
        .sub(vertices[startIndex]);

      if (direction.lengthSq() < AXIS_EPSILON) {
        return null;
      }

      return direction.normalize();
    })
    .filter((direction) => direction !== null);
}

function areAxesEquivalent(axisA, axisB) {
  const absoluteDot = Math.abs(axisA.dot(axisB));
  return absoluteDot > 1 - PARALLEL_EPSILON;
}

function addUniqueAxis(axes, candidateAxis) {
  if (candidateAxis.lengthSq() < AXIS_EPSILON) {
    return;
  }

  const normalizedAxis = candidateAxis.clone().normalize();
  const alreadyExists = axes.some((existingAxis) =>
    areAxesEquivalent(existingAxis, normalizedAxis)
  );

  if (!alreadyExists) {
    axes.push(normalizedAxis);
  }
}

function getSeparatingAxes(verticesA, verticesB) {
  const axes = [];

  getFaceNormals(verticesA).forEach((normal) => {
    addUniqueAxis(axes, normal);
  });

  getFaceNormals(verticesB).forEach((normal) => {
    addUniqueAxis(axes, normal);
  });

  const edgeDirectionsA = getEdgeDirections(verticesA);
  const edgeDirectionsB = getEdgeDirections(verticesB);

  edgeDirectionsA.forEach((edgeA) => {
    edgeDirectionsB.forEach((edgeB) => {
      const crossAxis = new THREE.Vector3().crossVectors(edgeA, edgeB);
      addUniqueAxis(axes, crossAxis);
    });
  });

  return axes;
}

function projectVerticesOntoAxis(vertices, axis) {
  let minimum = Infinity;
  let maximum = -Infinity;

  vertices.forEach((vertex) => {
    const projection = vertex.dot(axis);
    minimum = Math.min(minimum, projection);
    maximum = Math.max(maximum, projection);
  });

  return { minimum, maximum };
}

function projectionsAreSeparated(projectionA, projectionB) {
  const tolerance = COLLISION_CONFIG.tolerance;

  return (
    projectionA.maximum < projectionB.minimum - tolerance ||
    projectionB.maximum < projectionA.minimum - tolerance
  );
}

export function arePiecesPreciselyColliding(pieceA, pieceB) {
  const verticesA = getPieceWorldVertices(pieceA);
  const verticesB = getPieceWorldVertices(pieceB);
  const separatingAxes = getSeparatingAxes(verticesA, verticesB);

  for (const axis of separatingAxes) {
    const projectionA = projectVerticesOntoAxis(verticesA, axis);
    const projectionB = projectVerticesOntoAxis(verticesB, axis);

    if (verticesA.length < 4 || verticesB.length < 4) {
      return false;
    }

    if (projectionsAreSeparated(projectionA, projectionB)) {
      return false;
    }
  }

  return true;
}
