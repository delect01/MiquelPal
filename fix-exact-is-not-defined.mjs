#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const utils = fs.existsSync(path.join(root, "src", "utils"))
  ? path.join(root, "src", "utils")
  : path.join(root, "utils");
const file = path.join(utils, "importedGeometry.js");

if (!fs.existsSync(file)) {
  throw new Error("No s'ha trobat src/utils/importedGeometry.js");
}

const before = fs.readFileSync(file, "utf8");
const backup = `${file}.before-fix-exact-is-not-defined.bak`;
fs.copyFileSync(file, backup);

let after = before;

// Error introduced by v2: version/exact were inserted in the return of
// collectExactWorldMesh, where the variable exact does not exist.
const wrongReturn = `  return {
    version: 2,
    exact,
    vertices: vertices.map(serializeVector),
    triangles
  };
}

export function buildImportedCollisionGeometry`;

const correctedCollectorReturn = `  return {
    vertices: vertices.map(serializeVector),
    triangles
  };
}

export function buildImportedCollisionGeometry`;

if (after.includes(wrongReturn)) {
  after = after.replace(wrongReturn, correctedCollectorReturn);
}

// Add version/exact only to the final return of buildImportedCollisionGeometry.
const buildStart = after.indexOf("export function buildImportedCollisionGeometry");
const createStart = after.indexOf("export function createCollisionBufferGeometry", buildStart);
if (buildStart < 0 || createStart < 0) {
  fs.copyFileSync(backup, file);
  throw new Error("No s'ha pogut localitzar buildImportedCollisionGeometry.");
}

let buildBlock = after.slice(buildStart, createStart);
if (!buildBlock.includes("const exact = collectExactWorldMesh(object);")) {
  fs.copyFileSync(backup, file);
  throw new Error("No s'ha trobat la recollida exacta de triangles.");
}

if (!buildBlock.includes("version: 2")) {
  const finalReturn = "  return {\n    vertices:";
  if (!buildBlock.includes(finalReturn)) {
    fs.copyFileSync(backup, file);
    throw new Error("No s'ha trobat el return final de buildImportedCollisionGeometry.");
  }
  buildBlock = buildBlock.replace(
    finalReturn,
    "  return {\n    version: 2,\n    exact,\n    vertices:"
  );
  after = after.slice(0, buildStart) + buildBlock + after.slice(createStart);
}

// Strong consistency checks.
const collectorStart = after.indexOf("function collectExactWorldMesh");
const collectorEnd = after.indexOf("export function buildImportedCollisionGeometry", collectorStart);
const collectorBlock = after.slice(collectorStart, collectorEnd);
const correctedBuildBlock = after.slice(
  after.indexOf("export function buildImportedCollisionGeometry"),
  after.indexOf("export function createCollisionBufferGeometry")
);

if (collectorBlock.includes("exact,")) {
  fs.copyFileSync(backup, file);
  throw new Error("La variable exact encara apareix dins collectExactWorldMesh.");
}
if (!correctedBuildBlock.includes("version: 2") || !correctedBuildBlock.includes("exact,")) {
  fs.copyFileSync(backup, file);
  throw new Error("version/exact no han quedat al return final correcte.");
}

fs.writeFileSync(file, after, "utf8");
const check = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
if (check.status !== 0) {
  fs.copyFileSync(backup, file);
  throw new Error(`Error de sintaxi. S'ha restaurat el backup.\n${check.stderr}`);
}

console.log("[OK] importedGeometry.js corregit");
console.log(`[BACKUP] ${path.relative(root, backup)}`);
console.log("Atura i reinicia npm run dev, i torna a importar l'STL del tub.");
