import {
  copyFile
} from "node:fs/promises";
import {
  dirname,
  resolve
} from "node:path";
import {
  fileURLToPath
} from "node:url";

const packageDirectory = dirname(
  fileURLToPath(import.meta.url)
);

const buttonPath = resolve(
  process.cwd(),
  "src/components/LanguageJokeButton.jsx"
);
const hookPath = resolve(
  process.cwd(),
  "src/hooks/useTranslator.js"
);

await copyFile(
  buttonPath,
  `${buttonPath}.language-fix-backup`
);
await copyFile(
  hookPath,
  `${hookPath}.language-fix-backup`
);

await copyFile(
  resolve(
    packageDirectory,
    "LanguageJokeButton.jsx"
  ),
  buttonPath
);
await copyFile(
  resolve(
    packageDirectory,
    "useTranslator.js"
  ),
  hookPath
);

console.log(
  "[OK] Selector d'idioma corregit."
);
console.log(
  "Ara no depen de props noves d'App.jsx."
);
