const { contextBridge, ipcRenderer } = require("electron");

async function getRuntimeConfig() {
  try {
    return await ipcRenderer.invoke("diana:getRuntimeConfig");
  } catch {
    return { appVersion: null, backendUrl: null };
  }
}

// Expose a single stable object for the renderer to read at runtime.
// The Expo web bundle can safely check for this in browser contexts too.
contextBridge.exposeInMainWorld("dianaDesktop", {
  getRuntimeConfig
});

