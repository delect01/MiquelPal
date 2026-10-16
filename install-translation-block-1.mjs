import {
  access,
  copyFile,
  readFile,
  writeFile
} from "node:fs/promises";
import {
  dirname,
  resolve
} from "node:path";
import {
  fileURLToPath
} from "node:url";

const root = process.cwd();
const installerDirectory = dirname(
  fileURLToPath(import.meta.url)
);

const files = {
  app: resolve(root, "src/App.jsx"),
  menu: resolve(
    root,
    "src/components/ProjectMenu.jsx"
  ),
  menuSource: resolve(
    installerDirectory,
    "ProjectMenu.jsx"
  )
};

await Promise.all([
  access(files.app),
  access(files.menu),
  access(files.menuSource)
]);

const originalApp = await readFile(
  files.app,
  "utf8"
);
const newMenu = await readFile(
  files.menuSource,
  "utf8"
);

let nextApp = originalApp;

/*
  1. ProjectMenu rep t.
*/
const projectMenuStart =
  nextApp.indexOf("<ProjectMenu");
const projectMenuEnd =
  nextApp.indexOf("/>", projectMenuStart);

if (
  projectMenuStart === -1 ||
  projectMenuEnd === -1
) {
  throw new Error(
    "[NO TROBAT] ProjectMenu a App.jsx. No s'ha modificat cap fitxer."
  );
}

const projectMenuBlock = nextApp.slice(
  projectMenuStart,
  projectMenuEnd + 2
);

if (!projectMenuBlock.includes("t={")) {
  const patchedBlock =
    projectMenuBlock.replace(
      /\s*\/>$/,
`  t={
    t
  }
/>`
    );

  nextApp =
    nextApp.slice(0, projectMenuStart) +
    patchedBlock +
    nextApp.slice(projectMenuEnd + 2);
}

/*
  2. Un projecte encara no guardat mostra el nom
  traduït actual. Els noms reals guardats no canvien.
*/
nextApp = nextApp.replace(
`  projectName={
    activeProject.name
  }`,
`  projectName={
    activeProject.id
      ? activeProject.name
      : t.project.unnamed
  }`
);

/*
  3. El panell principal de gripper deixa de tenir
  el títol literal i reutilitza la mateixa traducció
  del menú de configuradors.
*/
nextApp = nextApp.replace(
  "      Configurador pinça",
`      {
        t.configurators.gripper
      }`
);

/*
  Validació abans d'escriure res.
*/
const checks = {
  appHasTranslator:
    nextApp.includes('useTranslator("ca")'),
  projectMenuReceivesT:
    nextApp.slice(
      nextApp.indexOf("<ProjectMenu"),
      nextApp.indexOf(
        "/>",
        nextApp.indexOf("<ProjectMenu")
      ) + 2
    ).includes("t={"),
  configuratorMenuReceivesT:
    nextApp.slice(
      nextApp.indexOf("<ConfiguratorMenu"),
      nextApp.indexOf(
        "/>",
        nextApp.indexOf("<ConfiguratorMenu")
      ) + 2
    ).includes("t={"),
  languageButtonConnected:
    nextApp.includes("onChangeLanguage={"),
  noGlobalDomTranslator:
    !nextApp.includes("GlobalUiTranslator"),
  menuUsesTranslations:
    newMenu.includes("t?.project?.menu")
};

console.log("VERIFICACIO:", checks);

if (
  Object.values(checks)
    .some((value) => !value)
) {
  throw new Error(
    "La verificació ha fallat. No s'ha modificat cap fitxer."
  );
}

/*
  Només ara fem còpies i escrivim.
*/
await copyFile(
  files.app,
  `${files.app}.translation-block-1-backup`
);
await copyFile(
  files.menu,
  `${files.menu}.translation-block-1-backup`
);

await writeFile(
  files.app,
  nextApp,
  "utf8"
);
await writeFile(
  files.menu,
  newMenu,
  "utf8"
);

console.log(
  "[OK] Bloc 1 instal·lat sense traducció forçada del DOM."
);
console.log(
  "Fitxers modificats: App.jsx i ProjectMenu.jsx"
);
console.log(
  "ConfiguratorMenu.jsx ja utilitzava t.configurators i no s'ha substituït."
);
console.log(
  "LanguageJokeButton.jsx ja estava connectat a activeLanguage i no s'ha substituït."
);
