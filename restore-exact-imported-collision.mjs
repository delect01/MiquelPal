#!/usr/bin/env node
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
