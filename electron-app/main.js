const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const DiscoveryService = require('../core/discovery')
const FileTransferService = require('../core/transfer')


let discoveryService
let fileTransferService

function createWindow() {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  window.loadURL('http://localhost:3000')
}

// Handle device discovery IPC call
ipcMain.handle('discover:devices', async () => {
  try {
    if (!discoveryService) {
      discoveryService = new DiscoveryService()
    }

    const devices = await discoveryService.browseForDevices()
    return devices
  } catch (error) {
    console.error('Error discovering devices:', error)
    return []
  }
})

ipcMain.handle('file:picker', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'All Files', extensions: ['*'] }],
  })
  return result.filePaths
})

ipcMain.handle('file:send', async (event, device, filePaths) => {
  try{
    if (!fileTransferService) {
      fileTransferService = new FileTransferService()
    }
    await fileTransferService.sendFile(device, filePath)
    return true
  } catch(error) {
    console.error('Error sending file:', error)
    return false
  }
})

app.whenReady().then(() => {
  createWindow()

  // Start advertising this device
  discoveryService = new DiscoveryService()
  discoveryService.advertise(5000)

  fileTransferService = new FileTransferService()
  fileTransferService.startReceiver()
})

app.on('before-quit', () => {
  if (discoveryService) {
    discoveryService.stop()
  }
})
