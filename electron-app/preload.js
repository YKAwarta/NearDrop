const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  discoverDevices: () => ipcRenderer.invoke('discover:devices'),
  showFilePicker: () => ipcRenderer.invoke('file:picker'),
  sendFile: (device, filePath) => ipcRenderer.invoke('file:send', device, filePath),
  onFileReceived: (callback) => {
    ipcRenderer.on('file:received', (event, fileInfo) => callback(fileInfo))
  },
  onTransferRejected: (callback) => {
    ipcRenderer.on('transfer:rejected', (event, rejectionInfo) => callback(rejectionInfo))
  },
  removeFileReceivedListener: () => {
    ipcRenderer.removeAllListeners('file:received')
  },
  removeTransferRejectedListener: () => {
    ipcRenderer.removeAllListeners('transfer:rejected')
  }
})
