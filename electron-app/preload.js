const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  discoverDevices: () => ipcRenderer.invoke('discover:devices'),
  showFilePicker: () => ipcRenderer.invoke('file:picker'),
  sendFile: (device, filePath) => ipcRenderer.invoke('file:send', device, filePath),
})
