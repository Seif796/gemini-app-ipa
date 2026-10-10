const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,
  version: process.versions.electron,
  sendNotification: (payload) => ipcRenderer.send('show-native-notification', payload),
  minimizeToTray: () => ipcRenderer.send('minimize-to-tray')
});

