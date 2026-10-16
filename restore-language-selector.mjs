rimport { copyFile } from "node:fs/promises";
import { resolve } from "node:path";

const paths = [
  resolve(process.cwd(), "src/App.jsx"),
  resolve(process.cwd(), "src/components/LanguageJokeButton.jsx"),
  resolve(process.cwd(), "src/hooks/useTranslator.js"),
  resolve(process.cwd(), "src/i18n/traductor.js")
];

for (const path of paths) {
  await copyFile(`${path}.language-selector-v2-backup`, path);
}

console.log("[OK] Selector anterior restaurat.");
