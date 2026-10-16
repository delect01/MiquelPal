import {
  copyFile,
  readFile,
  writeFile
} from "node:fs/promises";
import { resolve } from "node:path";

const appPath = resolve(process.cwd(), "src/App.jsx");
const menuPath = resolve(process.cwd(), "src/components/ProjectMenu.jsx");
const translatorPath = resolve(process.cwd(), "src/i18n/traductor.js");

const paths = [appPath, menuPath, translatorPath];

for (const path of paths) {
  await copyFile(path, `${path}.project-translation-backup`);
}

let app = await readFile(appPath, "utf8");
let menu = await readFile(menuPath, "utf8");
let translator = await readFile(translatorPath, "utf8");

function replaceOnce(source, pattern, replacement, label) {
  if (!pattern.test(source)) {
    throw new Error(`[NO TROBAT] ${label}`);
  }

  console.log(`[OK] ${label}`);
  return source.replace(pattern, replacement);
}

/* 1. ProjectMenu rep t. */
if (!/export default function ProjectMenu\s*\([\s\S]*?\bt\s*[,}]/.test(menu)) {
  menu = replaceOnce(
    menu,
    /(export default function ProjectMenu\s*\(\s*\{[\s\S]*?)(\n\s*\}\s*\)\s*\{)/,
    (match, props, end) => {
      const trimmed = props.replace(/\s*$/, "");
      const comma = trimmed.endsWith(",") ? "" : ",";
      return `${trimmed}${comma}\n  t${end}`;
    },
    "afegir la prop t a ProjectMenu"
  );
} else {
  console.log("[SKIP] ProjectMenu ja rep t");
}

/* 2. Nomes tres textos visibles. */
if (!menu.includes("t.project.menu")) {
  menu = replaceOnce(
    menu,
    />\s*Projecte\s*</,
    ">\n          {t.project.menu}\n        <",
    "traduir el boto Projecte"
  );
}

if (!menu.includes("t.project.unsavedChanges")) {
  menu = replaceOnce(
    menu,
    /\{hasUnsavedChanges\s*\?\s*["'](?:Canvis sense guardar|Projecte sense guardar)["']\s*:\s*["']Projecte guardat["']\s*\}/,
    `{hasUnsavedChanges
              ? t.project.unsavedChanges
              : t.project.saved}`,
    "traduir els estats guardat i sense guardar"
  );
}

/* 3. App passa t al ProjectMenu, sense tocar altres components. */
if (!/<ProjectMenu[\s\S]*?\bt=\{\s*t\s*\}[\s\S]*?\/>/.test(app)) {
  const start = app.indexOf("<ProjectMenu");
  if (start === -1) {
    throw new Error("[NO TROBAT] ProjectMenu a App.jsx");
  }

  const end = app.indexOf("/>", start);
  if (end === -1) {
    throw new Error("[NO TROBAT] tancament de ProjectMenu a App.jsx");
  }

  app =
    app.slice(0, end) +
    `  t={
    t
  }
` +
    app.slice(end);

  console.log("[OK] passar t des d'App a ProjectMenu");
} else {
  console.log("[SKIP] App ja passa t a ProjectMenu");
}

/* 4. Afegim project.menu als cinc idiomes. No canviem cap altra clau. */
const menuTranslations = [
  ["Projecte sense nom", "Projecte"],
  ["Proyecto sin nombre", "Proyecto"],
  ["Untitled project", "Project"],
  ["Projet sans nom", "Projet"],
  ["مشروع بدون اسم", "المشروع"]
];

for (const [unnamedText, menuText] of menuTranslations) {
  const escaped = unnamedText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const projectBlockHasMenu = new RegExp(
    `project\\s*:\\s*\\{[\\s\\S]*?menu\\s*:\\s*["']${menuText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][\\s\\S]*?unnamed\\s*:\\s*["']${escaped}["']`
  );

  if (projectBlockHasMenu.test(translator)) {
    continue;
  }

  const unnamedPattern = new RegExp(
    `(project\\s*:\\s*\\{\\s*\\n\\s*)(unnamed\\s*:\\s*["']${escaped}["']\\s*,)`
  );

  translator = replaceOnce(
    translator,
    unnamedPattern,
    `$1menu: "${menuText}",\n      $2`,
    `afegir project.menu: ${menuText}`
  );
}

await writeFile(appPath, app, "utf8");
await writeFile(menuPath, menu, "utf8");
await writeFile(translatorPath, translator, "utf8");

const verification = {
  appPassesT: /<ProjectMenu[\s\S]*?\bt=\{\s*t\s*\}[\s\S]*?\/>/.test(app),
  projectButton: menu.includes("t.project.menu"),
  projectSaved: menu.includes("t.project.saved"),
  projectUnsaved: menu.includes("t.project.unsavedChanges"),
  fiveLanguages: [
    'menu: "Projecte"',
    'menu: "Proyecto"',
    'menu: "Project"',
    'menu: "Projet"',
    'menu: "المشروع"'
  ].every((text) => translator.includes(text)),
  noGlobalTranslator:
    !app.includes("GlobalUiTranslator") &&
    !menu.includes("GlobalUiTranslator") &&
    !translator.includes("GlobalUiTranslator")
};

console.log("\nVERIFICACIO:", verification);

if (Object.values(verification).some((value) => !value)) {
  throw new Error("La verificacio final ha fallat.");
}

console.log("\n[FINALITZAT] Només s'han connectat al traductor:");
console.log("- Projecte");
console.log("- Projecte guardat");
console.log("- Projecte sense guardar / Canvis sense guardar");
