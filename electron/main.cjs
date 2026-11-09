/*
  MIQUELPAL (versió d'escriptori)

  Obre l'aplicació web compilada (dist/) dins una finestra
  pròpia. Es serveix amb el protocol app://miquelpal: així
  l'origen és sempre el mateix (les dades de
  l'emmagatzematge es conserven entre execucions) i el
  programa funciona sense connexió.

  Les dades de l'usuari queden a %APPDATA%\MiquelPal.
*/
const { app, BrowserWindow, Menu, net, protocol, shell } = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const APP_SCHEME = "app";
const APP_HOST = "miquelpal";
const DIST_DIRECTORY = path.join(__dirname, "..", "dist");

protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
]);

let mainWindow = null;

// Un sol programa obert: dues finestres es trepitjarien les dades
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) {
      return;
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.focus();
  });

  app.whenReady().then(() => {
    protocol.handle(APP_SCHEME, (request) => {
      const { pathname } = new URL(request.url);
      const relativePath =
        pathname === "/" ? "index.html" : decodeURIComponent(pathname);
      const filePath = path.normalize(path.join(DIST_DIRECTORY, relativePath));

      // Només fitxers de dins de dist/
      if (!filePath.startsWith(DIST_DIRECTORY)) {
        return new Response("Not found", { status: 404 });
      }

      return net.fetch(pathToFileURL(filePath).toString());
    });

    Menu.setApplicationMenu(null);
    createWindow();
  });

  app.on("window-all-closed", () => {
    app.quit();
  });
}

function isExternalUrl(url) {
  return /^https?:\/\//i.test(url);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1000,
    minHeight: 650,
    title: "MiquelPal",
    backgroundColor: "#ffffff",
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false
    }
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // El títol de la finestra és sempre el del programa
  mainWindow.on("page-title-updated", (event) => {
    event.preventDefault();
  });

  // Els enllaços externs s'obren al navegador
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalUrl(url)) {
      shell.openExternal(url);
    }

    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith(`${APP_SCHEME}://${APP_HOST}/`)) {
      return;
    }

    event.preventDefault();

    if (isExternalUrl(url)) {
      shell.openExternal(url);
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.loadURL(`${APP_SCHEME}://${APP_HOST}/index.html`);
}
