import * as THREE from "three";
import { COLLISION_CONFIG } from "../Config/geometryConfig";
import {
  getPieceWorldVertices,
  getPieceFaces,
  getPieceEdges
} from "./pieceGeometry";
import { importedMeshCollision } from "./importedMeshCollision";

const AXIS_EPSILON = 1e-10;
const PARALLEL_EPSILON = 1e-6;

function addUniqueAxis(axes, axis) {
  if (axis.lengthSq() < AXIS_EPSILON) return;
  const normalized = axis.clone().normalize();
  if (!axes.some((existing) => Math.abs(existing.dot(normalized)) > 1 - PARALLEL_EPSILON)) {
    axes.push(normalized);
  }
}
function faceNormals(vertices, faces) {
  const result = [];
  for (const face of faces) {
    if (face.length < 3) continue;
    addUniqueAxis(result, new THREE.Vector3().crossVectors(
      vertices[face[1]].clone().sub(vertices[face[0]]),
      vertices[face[2]].clone().sub(vertices[face[0]])
    ));
  }
  return result;
}
function edgeDirections(vertices, edges) {
  const result = [];
  for (const [start, end] of edges) {
    if (!vertices[start] || !vertices[end]) continue;
    addUniqueAxis(result, vertices[end].clone().sub(vertices[start]));
  }
  return result;
}
function project(vertices, axis) {
  let minimum = Infinity;
  let maximum = -Infinity;
  for (const vertex of vertices) {
    const value = vertex.dot(axis);
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
  }
  return { minimum, maximum };
}
function parametricSat(pieceA, pieceB) {
  const verticesA = getPieceWorldVertices(pieceA);
  const verticesB = getPieceWorldVertices(pieceB);
  if (verticesA.length < 4 || verticesB.length < 4) return false;

  const axes = [];
  [...faceNormals(verticesA, getPieceFaces(pieceA)), ...faceNormals(verticesB, getPieceFaces(pieceB))]
    .forEach((axis) => addUniqueAxis(axes, axis));
  const edgesA = edgeDirections(verticesA, getPieceEdges(pieceA));
  const edgesB = edgeDirections(verticesB, getPieceEdges(pieceB));
  for (const edgeA of edgesA) {
    for (const edgeB of edgesB) {
      addUniqueAxis(axes, new THREE.Vector3().crossVectors(edgeA, edgeB));
    }
  }

  const tolerance = COLLISION_CONFIG.tolerance;
  for (const axis of axes) {
    const projectionA = project(verticesA, axis);
    const projectionB = project(verticesB, axis);
    if (
      projectionA.maximum < projectionB.minimum - tolerance ||
      projectionB.maximum < projectionA.minimum - tolerance
    ) return false;
  }
  return true;
}

export function arePiecesPreciselyColliding(pieceA, pieceB) {
  if (pieceA.pieceType === "IMPORTED_3D" || pieceB.pieceType === "IMPORTED_3D") {
    const exact = importedMeshCollision(pieceA, pieceB);
    if (exact !== null) return exact;
  }
  return parametricSat(pieceA, pieceB);
}
