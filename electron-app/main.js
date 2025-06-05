const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const DiscoveryService = require('../core/discovery')

let discoveryService

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

app.whenReady().then(() => {
  createWindow()

  // Start advertising this device
  discoveryService = new DiscoveryService()
  discoveryService.advertise(5000)
})

app.on('before-quit', () => {
  if (discoveryService) {
    discoveryService.stop()
  }
})
