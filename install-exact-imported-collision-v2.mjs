#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const srcRoot = fs.existsSync(path.join(root, "src", "utils"))
  ? path.join(root, "src")
  : root;
const utilsDir = path.join(srcRoot, "utils");
const packageFile = path.join(root, "package.json");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(root, `collision-backup-${timestamp}`);

const files = {
  package: packageFile,
  importedGeometry: path.join(utilsDir, "importedGeometry.js"),
  pieceGeometry: path.join(utilsDir, "pieceGeometry.js"),
  preciseCollision: path.join(utilsDir, "preciseCollision.js"),
  collision: path.join(utilsDir, "collision.js"),
  runtime: path.join(utilsDir, "importedMeshCollision.js")
};

function fail(message) {
  throw new Error(message);
}
function read(file) {
  return fs.readFileSync(file, "utf8");
}
function write(file, content) {
  fs.writeFileSync(file, content, "utf8");
}
function assertIncludes(source, token, fileName) {
  if (!source.includes(token)) {
    fail(`${fileName}: no s'ha trobat l'element esperat: ${token}`);
  }
}
function syntaxCheck(file) {
  const result = spawnSync(process.execPath, ["--check", file], {
    cwd: root,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    fail(`Error de sintaxi a ${path.relative(root, file)}:\n${result.stderr}`);
  }
}
function restoreFromBackup() {
  if (!fs.existsSync(backupDir)) return;
  for (const name of ["package.json", "importedGeometry.js", "pieceGeometry.js", "preciseCollision.js", "collision.js"]) {
    const source = path.join(backupDir, name);
    if (!fs.existsSync(source)) continue;
    const destination = name === "package.json"
      ? packageFile
      : path.join(utilsDir, name);
    fs.copyFileSync(source, destination);
  }
  if (fs.existsSync(files.runtime)) fs.rmSync(files.runtime);
}

try {
  if (!fs.existsSync(utilsDir)) fail("Executa aquest instal·lador des de l'arrel del projecte.");
  for (const key of ["package", "importedGeometry", "pieceGeometry", "preciseCollision", "collision"]) {
    if (!fs.existsSync(files[key])) fail(`Falta ${files[key]}`);
  }

  const packageJson = JSON.parse(read(files.package));
  if (packageJson.dependencies?.["three-mesh-bvh"] && read(files.preciseCollision).includes("importedMeshCollision")) {
    console.log("La modificació ja sembla instal·lada. No s'ha canviat res.");
    process.exit(0);
  }

  const importedBefore = read(files.importedGeometry);
  const pieceBefore = read(files.pieceGeometry);
  const preciseBefore = read(files.preciseCollision);
  const collisionBefore = read(files.collision);

  assertIncludes(importedBefore, "export function buildImportedCollisionGeometry", "importedGeometry.js");
  assertIncludes(importedBefore, "new ConvexGeometry(points)", "importedGeometry.js");
  assertIncludes(pieceBefore, "export function getPieceWorldVertices", "pieceGeometry.js");
  assertIncludes(pieceBefore, "piece.collisionGeometry", "pieceGeometry.js");
  assertIncludes(preciseBefore, "export function arePiecesPreciselyColliding", "preciseCollision.js");
  assertIncludes(collisionBefore, "!boxA.intersectsBox(boxB)", "collision.js");

  fs.mkdirSync(backupDir, { recursive: false });
  fs.copyFileSync(files.package, path.join(backupDir, "package.json"));
  fs.copyFileSync(files.importedGeometry, path.join(backupDir, "importedGeometry.js"));
  fs.copyFileSync(files.pieceGeometry, path.join(backupDir, "pieceGeometry.js"));
  fs.copyFileSync(files.preciseCollision, path.join(backupDir, "preciseCollision.js"));
  fs.copyFileSync(files.collision, path.join(backupDir, "collision.js"));

  packageJson.dependencies ??= {};
  packageJson.dependencies["three-mesh-bvh"] = "^0.9.16";
  write(files.package, JSON.stringify(packageJson, null, 2) + "\n");

  const exactCollector = String.raw`
function collectExactWorldMesh(object) {
  const vertices = [];
  const triangles = [];
  const vertexMap = new Map();
  object.updateMatrixWorld(true);

  const addVertex = (vector) => {
    const key = vertexKey(vector);
    if (!vertexMap.has(key)) {
      vertexMap.set(key, vertices.length);
      vertices.push(vector.clone());
    }
    return vertexMap.get(key);
  };

  object.traverse((child) => {
    if (
      !child.isMesh ||
      !isEffectivelyVisible(child) ||
      !meshHasVisibleMaterial(child) ||
      isAuxiliaryMesh(child)
    ) return;

    const geometry = child.geometry;
    const position = geometry?.attributes?.position;
    if (!position) return;
    const index = geometry.index;
    const count = index ? index.count : position.count;

    for (let offset = 0; offset + 2 < count; offset += 3) {
      const triangle = [];
      for (let corner = 0; corner < 3; corner += 1) {
        const vertexIndex = index ? index.getX(offset + corner) : offset + corner;
        const vector = new THREE.Vector3()
          .fromBufferAttribute(position, vertexIndex)
          .applyMatrix4(child.matrixWorld);
        triangle.push(addVertex(vector));
      }
      if (new Set(triangle).size === 3) triangles.push(triangle);
    }
  });

  return {
    vertices: vertices.map(serializeVector),
    triangles
  };
}

`;

  let importedAfter = importedBefore;
  const functionAnchor = "export function buildImportedCollisionGeometry(\n  object\n) {";
  assertIncludes(importedAfter, functionAnchor, "importedGeometry.js");
  importedAfter = importedAfter.replace(
    functionAnchor,
    exactCollector + functionAnchor + "\n  const exact = collectExactWorldMesh(object);"
  );
  const returnAnchor = "  return {\n    vertices:";
  assertIncludes(importedAfter, returnAnchor, "importedGeometry.js");
  importedAfter = importedAfter.replace(
    returnAnchor,
    "  return {\n    version: 2,\n    exact,\n    vertices:"
  );
  write(files.importedGeometry, importedAfter);

  let pieceAfter = pieceBefore;
  const oldVerticesA = "piece.collisionGeometry\n      ?.vertices";
  const oldVerticesB = "piece.collisionGeometry?.vertices";
  if (pieceAfter.includes(oldVerticesA)) {
    pieceAfter = pieceAfter.replace(
      oldVerticesA,
      "piece.collisionGeometry?.exact?.vertices ??\n    piece.collisionGeometry?.vertices"
    );
  } else if (pieceAfter.includes(oldVerticesB)) {
    pieceAfter = pieceAfter.replace(
      oldVerticesB,
      "piece.collisionGeometry?.exact?.vertices ?? piece.collisionGeometry?.vertices"
    );
  } else {
    fail("pieceGeometry.js: no s'ha trobat l'accés als vèrtexs importats.");
  }
  write(files.pieceGeometry, pieceAfter);

  const runtime = String.raw`import * as THREE from "three";
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
`;
  write(files.runtime, runtime);

  const preciseAfter = String.raw`import * as THREE from "three";
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
`;
  write(files.preciseCollision, preciseAfter);

  const restoreScript = String.raw`#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const backup = process.argv[2];
if (!backup) throw new Error("Ús: node restore-exact-imported-collision.mjs collision-backup-...");
const backupDir = path.resolve(root, backup);
const utils = fs.existsSync(path.join(root, "src", "utils"))
  ? path.join(root, "src", "utils")
  : path.join(root, "utils");
for (const name of ["importedGeometry.js", "pieceGeometry.js", "preciseCollision.js", "collision.js"]) {
  fs.copyFileSync(path.join(backupDir, name), path.join(utils, name));
  console.log("[RESTAURAT] " + name);
}
fs.copyFileSync(path.join(backupDir, "package.json"), path.join(root, "package.json"));
const runtime = path.join(utils, "importedMeshCollision.js");
if (fs.existsSync(runtime)) fs.rmSync(runtime);
console.log("Restauració completada. Executa npm install i reinicia npm run dev.");
`;
  write(path.join(root, "restore-exact-imported-collision.mjs"), restoreScript);

  for (const file of [files.importedGeometry, files.pieceGeometry, files.preciseCollision, files.collision, files.runtime]) {
    syntaxCheck(file);
  }
  JSON.parse(read(files.package));

  console.log("\n[OK] Instal·lació preparada sense executar npm install.");
  console.log(`Backup: ${path.basename(backupDir)}`);
  console.log("Ara executa: npm install");
  console.log("Després: npm run build");
  console.log("Finalment: npm run dev");
  console.log("IMPORTANT: torna a importar els STL/GLB perquè incorporin collisionGeometry.version = 2.");
} catch (error) {
  console.error("\n[ERROR]", error.message);
  restoreFromBackup();
  console.error("S'han restaurat automàticament els fitxers originals.");
  process.exit(1);
}
