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
  onSendProgress: (callback) => {
    ipcRenderer.on('transfer:send-progress', (event, progressInfo) => callback(progressInfo))
  },
  onReceiveProgress: (callback) => {
    ipcRenderer.on('transfer:receive-progress', (event, progressInfo) => callback(progressInfo))
  },
  removeFileReceivedListener: () => {
    ipcRenderer.removeAllListeners('file:received')
  },
  removeTransferRejectedListener: () => {
    ipcRenderer.removeAllListeners('transfer:rejected')
  },
  removeSendProgressListener: () => {
    ipcRenderer.removeAllListeners('transfer:send-progress')
  },
  removeReceiveProgressListener: () => {
    ipcRenderer.removeAllListeners('transfer:receive-progress')
  }
})
