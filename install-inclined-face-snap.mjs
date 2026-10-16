import {
  access,
  copyFile
} from "node:fs/promises";
import {
  dirname,
  resolve
} from "node:path";
import {
  fileURLToPath
} from "node:url";

const installerDirectory =
  dirname(
    fileURLToPath(import.meta.url)
  );

const sourcePath = resolve(
  installerDirectory,
  "magneticSnap.js"
);

const destinationPath = resolve(
  process.cwd(),
  "src/utils/magneticSnap.js"
);

const backupPath = resolve(
  process.cwd(),
  "src/utils/magneticSnap.js.inclined-face-backup"
);

await access(sourcePath);
await access(destinationPath);

await copyFile(
  destinationPath,
  backupPath
);

await copyFile(
  sourcePath,
  destinationPath
);

console.log(
  "[OK] magneticSnap.js actualitzat."
);
console.log(
  `Copia de seguretat: ${backupPath}`
);
console.log(
  "No s'ha modificat preciseCollision.js ni la tolerancia global."
);
