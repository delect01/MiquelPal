import { copyFile } from "node:fs/promises";
import { resolve } from "node:path";

const paths = [
  resolve(process.cwd(), "src/App.jsx"),
  resolve(process.cwd(), "src/components/ProjectMenu.jsx"),
  resolve(process.cwd(), "src/i18n/traductor.js")
];

for (const path of paths) {
  await copyFile(`${path}.project-translation-backup`, path);
}

console.log("[OK] Els tres fitxers han estat restaurats.");
