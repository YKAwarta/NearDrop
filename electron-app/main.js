const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Isolate the context to prevent direct access to Node.js APIs
      nodeIntegration: false, // Disable Node.js integration in the renderer process
    },
  })
  window.loadURL('http://localhost:3000') //For now, dev server. Eventually, packaged file.
}

app.whenReady().then(createWindow)
