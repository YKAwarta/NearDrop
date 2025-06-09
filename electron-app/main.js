const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const os = require('os')
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
  logNetworkInfo() //Log network for debugging
}

function logNetworkInfo() {
  const interfaces = os.networkInterfaces()
  console.log('Network Interfaces:')
  Object.keys(interfaces).forEach(interfaceName => {
    console.log(`Interface: ${interfaceName}:`)
    interfaces[interfaceName].forEach(details => {
      console.log(
        `  Address: ${details.address}, Family: ${details.family}, Internal: ${details.internal}`
      )
    })
  })
}

// Handle device discovery IPC call
ipcMain.handle('discover:devices', async () => {
  try {
    if (!discoveryService) {
      discoveryService = new DiscoveryService()
    }

    const devices = await discoveryService.browseForDevices()
    console.log('Discovered devices:', devices)
    return devices
  } catch (error) {
    console.error('Error discovering devices:', error)
    return []
  }
})

ipcMain.handle('file:picker', async event => {
  console.log('IPC call to open file picker')
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'All Files', extensions: ['*'] }],
    })
    console.log('File picker result:', result)
    return result.filePaths || []
  } catch (error) {
    console.error('Error picking file:', error)
    return []
  }
})

// Helper function to show transfer approval dialog
async function showTransferApprovalDialog(requestInfo) {
  const response = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Accept', 'Decline'],
    defaultId: 0,
    title: 'Incoming File Transfer',
    message: `${requestInfo.senderName} wants to send you a file`,
    detail: `File: ${requestInfo.fileName}\nSize: ${(requestInfo.fileSize / 1024 / 1024).toFixed(2)} MB\n\nDo you want to accept this file?`
  })
  
  return response.response === 0 // 0 = Accept, 1 = Decline
}

// Helper function to show save dialog
async function showSaveDialog(fileName) {
  const response = await dialog.showSaveDialog(mainWindow, {
    title: 'Save File As...',
    defaultPath: fileName,
    filters: [
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  
  return response.canceled ? null : response.filePath
}

ipcMain.handle('file:send', async (event, device, filePath) => {
  console.log('IPC call to send file:', { device, filePath })

  try {
    if (!device) {
      console.error('No device selected for file transfer')
      return { success: false, message: 'No device selected' }
    }
    if (!filePath || filePath.length === 0) {
      console.error('No file selected for transfer')
      return { success: false, message: 'No file selected' }
    }
    const absoluteFilePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath)
    if (!fileTransferService) {
      fileTransferService = new FileTransferService()
    }
    console.log('Sending file to device:', {
      deviceName: device.name,
      deviceAddress: device.address,
      filePath: absoluteFilePath,
    })
    
    const result = await fileTransferService.sendFile(device, absoluteFilePath)
    console.log('File send result:', result)
    return result
  } catch (error) {
    console.error('Error sending file:', error)
    return { success: false, message: error.message }
  }
})

app.whenReady().then(() => {
  createWindow()

  // Start advertising this device
  discoveryService = new DiscoveryService()
  discoveryService.advertise(5001)

  fileTransferService = new FileTransferService({
    onFileReceived: (fileInfo) => {
      console.log('File received, sending notification to renderer:', fileInfo)
      if (mainWindow) {
        mainWindow.webContents.send('file:received', fileInfo)
      }
    },
    onTransferRequest: async (requestInfo) => {
      console.log('Transfer request received, showing approval dialog:', requestInfo)
      
      // Show approval dialog to user
      const approved = await showTransferApprovalDialog(requestInfo)
      
      if (approved) {
        // Show save dialog to choose location
        const savePath = await showSaveDialog(requestInfo.fileName)
        return { approved: true, savePath }
      } else {
        return { approved: false, savePath: null }
      }
    },
    onTransferRejected: (rejectionInfo) => {
      console.log('Transfer was rejected:', rejectionInfo)
      if (mainWindow) {
        mainWindow.webContents.send('transfer:rejected', rejectionInfo)
      }
    }
  })
  fileTransferService.startReceiver()
})

app.on('before-quit', () => {
  if (discoveryService) {
    discoveryService.stop()
  }
})
