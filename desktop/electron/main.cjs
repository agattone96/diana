const path = require("path");
const { app, BrowserWindow, ipcMain, shell } = require("electron");

function resolveRendererIndexPath() {
  return path.join(__dirname, "..", "renderer-dist", "index.html");
}

function createMainWindow() {
  const preloadPath = path.join(__dirname, "preload.cjs");

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    backgroundColor: "#0B0B10",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  win.once("ready-to-show", () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    // Keep users in the app; open external links in the system browser.
    shell.openExternal(url).catch(() => {});
    return { action: "deny" };
  });

  const indexPath = resolveRendererIndexPath();
  win.loadFile(indexPath);

  return win;
}

ipcMain.handle("diana:getRuntimeConfig", () => {
  const backendUrl = (process.env.DIANA_BACKEND_URL || "").trim() || null;
  return {
    appVersion: app.getVersion(),
    backendUrl
  };
});

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

