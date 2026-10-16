import {
  copyFile,
  readFile,
  writeFile
} from "node:fs/promises";
import { resolve } from "node:path";

const appPath = resolve(process.cwd(), "src/App.jsx");
const menuPath = resolve(process.cwd(), "src/components/ProjectMenu.jsx");
const translatorPath = resolve(process.cwd(), "src/i18n/traductor.js");

for (const path of [appPath, menuPath, translatorPath]) {
  await copyFile(path, `${path}.project-menu-translation-backup`);
}

let app = await readFile(appPath, "utf8");
let menu = await readFile(menuPath, "utf8");
let translator = await readFile(translatorPath, "utf8");

function replaceRequired(source, oldText, newText, label) {
  if (source.includes(newText)) {
    console.log(`[SKIP] ${label}`);
    return source;
  }
  if (!source.includes(oldText)) {
    throw new Error(`[NO TROBAT] ${label}`);
  }
  console.log(`[OK] ${label}`);
  return source.replace(oldText, newText);
}

menu = replaceRequired(
  menu,
`  onSaveProject,
  onSaveProjectAs
}) {`,
`  onSaveProject,
  onSaveProjectAs,
  t
}) {`,
  "passar el traductor a ProjectMenu"
);

menu = replaceRequired(
  menu,
`          Projecte`,
`          {t.project.menu}`,
  "traduir el boto Projecte"
);

menu = replaceRequired(
  menu,
`            {hasUnsavedChanges
              ? "Canvis sense guardar"
              : "Projecte guardat"}`,
`            {hasUnsavedChanges
              ? t.project.unsavedChanges
              : t.project.saved}`,
  "traduir l'estat del projecte"
);

app = replaceRequired(
  app,
`  onSaveProjectAs={
    saveCurrentProjectAs
  }
/>`,
`  onSaveProjectAs={
    saveCurrentProjectAs
  }
  t={
    t
  }
/>`,
  "passar t des d'App"
);

const additions = {
  ca: { anchor: 'unnamed: "Projecte sense nom",', text: 'menu: "Projecte",\n      unnamed: "Projecte sense nom",' },
  es: { anchor: 'unnamed: "Proyecto sin nombre",', text: 'menu: "Proyecto",\n      unnamed: "Proyecto sin nombre",' },
  en: { anchor: 'unnamed: "Untitled project",', text: 'menu: "Project",\n      unnamed: "Untitled project",' },
  fr: { anchor: 'unnamed: "Projet sans nom",', text: 'menu: "Projet",\n      unnamed: "Projet sans nom",' },
  ar: { anchor: 'unnamed: "مشروع بدون اسم",', text: 'menu: "المشروع",\n      unnamed: "مشروع بدون اسم",' }
};

for (const [code, item] of Object.entries(additions)) {
  translator = replaceRequired(
    translator,
    item.anchor,
    item.text,
    `afegir project.menu (${code})`
  );
}

translator = translator
  .replace('unsavedChanges: "Canvis sense guardar"', 'unsavedChanges: "Projecte sense guardar"')
  .replace('unsavedChanges: "Cambios sin guardar"', 'unsavedChanges: "Proyecto sin guardar"')
  .replace('unsavedChanges: "Unsaved changes"', 'unsavedChanges: "Unsaved project"')
  .replace('unsavedChanges: "Modifications non enregistrées"', 'unsavedChanges: "Projet non enregistré"')
  .replace('unsavedChanges: "تغييرات غير محفوظة"', 'unsavedChanges: "مشروع غير محفوظ"');

await writeFile(appPath, app, "utf8");
await writeFile(menuPath, menu, "utf8");
await writeFile(translatorPath, translator, "utf8");

const checks = {
  appPassesT: app.includes("  t={\n    t\n  }"),
  buttonTranslated: menu.includes("{t.project.menu}"),
  statusTranslated: menu.includes("t.project.unsavedChanges") && menu.includes("t.project.saved"),
  catalanExact: translator.includes('unsavedChanges: "Projecte sense guardar"'),
  allMenus: ["Projecte", "Proyecto", "Project", "Projet", "المشروع"].every((value) => translator.includes(`menu: "${value}"`))
};

console.log("VERIFICACIO:", checks);
if (Object.values(checks).some((value) => !value)) {
  throw new Error("La verificacio final ha fallat.");
}
console.log("[OK] Traduccio aplicada nomes al boto Projecte i als dos estats.");
