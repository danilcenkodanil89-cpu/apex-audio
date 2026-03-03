const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  savePlaylist: (playlist) => ipcRenderer.invoke('save-playlist', playlist),
  loadPlaylist: () => ipcRenderer.invoke('load-playlist'),
  readMetadata: (filePath) => ipcRenderer.invoke('read-metadata', filePath)
});