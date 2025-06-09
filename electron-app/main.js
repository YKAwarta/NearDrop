const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const DiscoveryService = require('../core/discovery')
const FileTransferService = require('../core/transfer')

let discoveryService
let fileTransferService
let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true, // Enable DevTools for debugging
    },
  })
  mainWindow.loadURL('http://localhost:3000') //For now, dev server. Eventually, packaged file.
  mainWindow.webContents.openDevTools() //Temporarily, for debugging purposes.
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
  try{
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'All Files', extensions: ['*'] }],
  })
  return result.filePaths || []
  } catch(error) {
    console.error('Error picking file:', error)
    return []
  }
})

ipcMain.handle('file:send', async (event, device, filePath) => {
  try{
    if(!device){
      console.error('No device selected for file transfer')
      return false
    }
    if (!filePath || filePath.length === 0) {
      console.error('No file selected for transfer')
      return false
    }
    if (!fileTransferService) {
      fileTransferService = new FileTransferService()
    }
    console.log('Sending file to device:', {deviceName: device.name, deviceAddress: device.address, filePath: filePath})
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
