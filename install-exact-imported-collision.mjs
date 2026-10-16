#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const candidates = [path.join(root, "src"), root];
const src = candidates.find((dir) => fs.existsSync(path.join(dir, "utils")));
if (!src) throw new Error("No s'ha trobat src/utils. Executa l'instal·lador des de l'arrel del projecte.");

const utils = path.join(src, "utils");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const required = ["importedGeometry.js", "pieceGeometry.js", "preciseCollision.js", "collision.js"];
for (const name of required) {
  const file = path.join(utils, name);
  if (!fs.existsSync(file)) throw new Error(`Falta ${file}`);
}

function backup(file) {
  if (!fs.existsSync(file)) return null;
  const copy = `${file}.before-exact-imported-collision-${stamp}.bak`;
  fs.copyFileSync(file, copy);
  return copy;
}
function write(file, text) {
  backup(file);
  fs.writeFileSync(file, text, "utf8");
  console.log(`[OK] ${path.relative(root, file)}`);
}
function patch(file, transform) {
  const before = fs.readFileSync(file, "utf8");
  const after = transform(before);
  if (after === before) {
    console.log(`[SKIP] ${path.relative(root, file)} ja estava preparat`);
    return;
  }
  write(file, after);
}

const exactRuntime = String.raw`import * as THREE from "three";
import { getPieceCenter, palletEulerToThreeQuaternion } from "./pieceUtils";

const EPSILON = 1e-7;
const cache = new WeakMap();

function localExact(piece) {
  const exact = piece.collisionGeometry?.exact;
  if (!exact?.vertices?.length || !exact?.triangles?.length) return null;
  return exact;
}

export function getExactWorldMesh(piece) {
  const exact = localExact(piece);
  if (!exact) return null;
  const centerData = getPieceCenter(piece);
  const center = new THREE.Vector3(centerData.x, centerData.y, centerData.z);
  const quaternion = palletEulerToThreeQuaternion(piece.rxDeg ?? 0, piece.ryDeg ?? 0, piece.rzDeg ?? 0);
  const vertices = exact.vertices.map((v) => new THREE.Vector3(Number(v.x), Number(v.y), Number(v.z)).applyQuaternion(quaternion).add(center));
  return { vertices, triangles: exact.triangles };
}

function triangleBox(vertices, triangle) {
  return new THREE.Box3().setFromPoints(triangle.map((index) => vertices[index]));
}
function triangleNormal(a, b, c) {
  return new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a));
}
function interval(points, axis) {
  let min = Infinity, max = -Infinity;
  for (const point of points) { const d = point.dot(axis); min = Math.min(min, d); max = Math.max(max, d); }
  return { min, max };
}
function separated(a, b, axis, tolerance) {
  if (axis.lengthSq() < EPSILON) return false;
  const n = axis.clone().normalize();
  const ia = interval(a, n), ib = interval(b, n);
  return ia.max < ib.min - tolerance || ib.max < ia.min - tolerance;
}
function trianglesIntersect(a0, a1, a2, b0, b1, b2, tolerance) {
  const a = [a0,a1,a2], b = [b0,b1,b2];
  const ae = [a1.clone().sub(a0), a2.clone().sub(a1), a0.clone().sub(a2)];
  const be = [b1.clone().sub(b0), b2.clone().sub(b1), b0.clone().sub(b2)];
  const axes = [triangleNormal(a0,a1,a2), triangleNormal(b0,b1,b2)];
  for (const ea of ae) for (const eb of be) axes.push(new THREE.Vector3().crossVectors(ea, eb));
  for (const axis of axes) if (separated(a, b, axis, tolerance)) return false;
  return true;
}

function pointInsideMesh(point, mesh) {
  const direction = new THREE.Vector3(1, 0.371390676, 0.173205081).normalize();
  let hits = 0;
  for (const tri of mesh.triangles) {
    const a = mesh.vertices[tri[0]], b = mesh.vertices[tri[1]], c = mesh.vertices[tri[2]];
    const edge1 = b.clone().sub(a), edge2 = c.clone().sub(a);
    const p = new THREE.Vector3().crossVectors(direction, edge2);
    const determinant = edge1.dot(p);
    if (Math.abs(determinant) < EPSILON) continue;
    const inv = 1 / determinant;
    const tvec = point.clone().sub(a);
    const u = tvec.dot(p) * inv;
    if (u < -EPSILON || u > 1 + EPSILON) continue;
    const q = new THREE.Vector3().crossVectors(tvec, edge1);
    const v = direction.dot(q) * inv;
    if (v < -EPSILON || u + v > 1 + EPSILON) continue;
    const distance = edge2.dot(q) * inv;
    if (distance > EPSILON) hits += 1;
  }
  return hits % 2 === 1;
}

export function exactMeshesCollide(pieceA, pieceB, tolerance = 0) {
  const meshA = getExactWorldMesh(pieceA), meshB = getExactWorldMesh(pieceB);
  if (!meshA || !meshB) return null;
  const boxesB = meshB.triangles.map((triangle) => triangleBox(meshB.vertices, triangle));
  for (const ta of meshA.triangles) {
    const boxA = triangleBox(meshA.vertices, ta);
    for (let index = 0; index < meshB.triangles.length; index += 1) {
      if (!boxA.clone().expandByScalar(tolerance).intersectsBox(boxesB[index])) continue;
      const tb = meshB.triangles[index];
      if (trianglesIntersect(meshA.vertices[ta[0]],meshA.vertices[ta[1]],meshA.vertices[ta[2]],meshB.vertices[tb[0]],meshB.vertices[tb[1]],meshB.vertices[tb[2]],tolerance)) return true;
    }
  }
  if (meshA.vertices.length && pointInsideMesh(meshA.vertices[0], meshB)) return true;
  if (meshB.vertices.length && pointInsideMesh(meshB.vertices[0], meshA)) return true;
  return false;
}
`;
write(path.join(utils, "exactImportedCollision.js"), exactRuntime);

patch(path.join(utils, "importedGeometry.js"), (source) => {
  if (source.includes("function collectExactWorldMesh")) return source;
  const anchor = "export function buildImportedCollisionGeometry(\n  object\n) {";
  if (!source.includes(anchor)) throw new Error("No s'ha trobat buildImportedCollisionGeometry a importedGeometry.js");
  const helper = String.raw`
function collectExactWorldMesh(object) {
  const vertices = [];
  const triangles = [];
  const vertexMap = new Map();
  object.updateMatrixWorld(true);
  const addVertex = (vector) => {
    const key = vertexKey(vector);
    if (!vertexMap.has(key)) { vertexMap.set(key, vertices.length); vertices.push(vector.clone()); }
    return vertexMap.get(key);
  };
  object.traverse((child) => {
    if (!child.isMesh || !isEffectivelyVisible(child) || !meshHasVisibleMaterial(child) || isAuxiliaryMesh(child)) return;
    const geometry = child.geometry;
    const position = geometry?.attributes?.position;
    if (!position) return;
    const index = geometry.index;
    const count = index ? index.count : position.count;
    for (let offset = 0; offset + 2 < count; offset += 3) {
      const triangle = [];
      for (let corner = 0; corner < 3; corner += 1) {
        const vertexIndex = index ? index.getX(offset + corner) : offset + corner;
        const vector = new THREE.Vector3().fromBufferAttribute(position, vertexIndex).applyMatrix4(child.matrixWorld);
        triangle.push(addVertex(vector));
      }
      if (new Set(triangle).size === 3) triangles.push(triangle);
    }
  });
  const edgeMap = new Map();
  for (const [a,b,c] of triangles) for (const [u,v] of [[a,b],[b,c],[c,a]]) {
    const key = u < v ? u + ":" + v : v + ":" + u;
    if (!edgeMap.has(key)) edgeMap.set(key, u < v ? [u,v] : [v,u]);
  }
  return { vertices: vertices.map(serializeVector), triangles, edges: [...edgeMap.values()] };
}

`;
  source = source.replace(anchor, helper + anchor + "\n  const exact = collectExactWorldMesh(object);");
  const returnAnchor = "  return {\n    vertices:";
  if (!source.includes(returnAnchor)) throw new Error("No s'ha trobat el return de importedGeometry.js");
  source = source.replace(returnAnchor, "  return {\n    version: 2,\n    exact,\n    vertices:");
  return source;
});

patch(path.join(utils, "pieceGeometry.js"), (source) => {
  if (source.includes("collisionGeometry?.exact?.vertices")) return source;
  source = source.replace("piece.collisionGeometry\n      ?.vertices", "piece.collisionGeometry?.exact?.vertices ??\n    piece.collisionGeometry?.vertices");
  source = source.replace("piece.collisionGeometry?.triangles", "piece.collisionGeometry?.exact?.triangles ?? piece.collisionGeometry?.triangles");
  source = source.replace("piece.collisionGeometry?.edges", "piece.collisionGeometry?.exact?.edges ?? piece.collisionGeometry?.edges");
  return source;
});

const preciseCollision = String.raw`import * as THREE from "three";
import { COLLISION_CONFIG } from "../Config/geometryConfig";
import { getPieceWorldVertices, getPieceFaces, getPieceEdges } from "./pieceGeometry";
import { exactMeshesCollide } from "./exactImportedCollision";

const EPS = 1e-10;
function addAxis(axes, axis) {
  if (axis.lengthSq() < EPS) return;
  axis = axis.clone().normalize();
  if (!axes.some((existing) => Math.abs(existing.dot(axis)) > 0.999999)) axes.push(axis);
}
function normals(vertices, faces) {
  const result = [];
  for (const face of faces) {
    if (face.length < 3) continue;
    addAxis(result, new THREE.Vector3().crossVectors(vertices[face[1]].clone().sub(vertices[face[0]]), vertices[face[2]].clone().sub(vertices[face[0]])));
  }
  return result;
}
function directions(vertices, edges) {
  const result = [];
  for (const [a,b] of edges) addAxis(result, vertices[b].clone().sub(vertices[a]));
  return result;
}
function project(vertices, axis) {
  let minimum = Infinity, maximum = -Infinity;
  for (const vertex of vertices) { const value = vertex.dot(axis); minimum = Math.min(minimum,value); maximum = Math.max(maximum,value); }
  return { minimum, maximum };
}
function sat(pieceA, pieceB) {
  const a = getPieceWorldVertices(pieceA), b = getPieceWorldVertices(pieceB);
  if (a.length < 4 || b.length < 4) return false;
  const na = normals(a, getPieceFaces(pieceA)), nb = normals(b, getPieceFaces(pieceB));
  const ea = directions(a, getPieceEdges(pieceA)), eb = directions(b, getPieceEdges(pieceB));
  const axes = [];
  [...na,...nb].forEach((axis) => addAxis(axes,axis));
  for (const x of ea) for (const y of eb) addAxis(axes,new THREE.Vector3().crossVectors(x,y));
  const tolerance = COLLISION_CONFIG.tolerance;
  for (const axis of axes) {
    const pa=project(a,axis), pb=project(b,axis);
    if (pa.maximum < pb.minimum - tolerance || pb.maximum < pa.minimum - tolerance) return false;
  }
  return true;
}
export function arePiecesPreciselyColliding(pieceA, pieceB) {
  if (pieceA.pieceType === "IMPORTED_3D" || pieceB.pieceType === "IMPORTED_3D") {
    const exact = exactMeshesCollide(pieceA, pieceB, COLLISION_CONFIG.tolerance);
    if (exact !== null) return exact;
  }
  return sat(pieceA, pieceB);
}
`;
write(path.join(utils, "preciseCollision.js"), preciseCollision);

console.log("\nInstal·lació completada.");
console.log("IMPORTANT: torna a importar els STL/GLB antics perquè collisionGeometry.version 2 guardi els triangles exactes.");
console.log("Per restaurar, utilitza els fitxers .bak creats amb la marca:", stamp);
