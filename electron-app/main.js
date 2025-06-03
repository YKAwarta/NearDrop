const {app, BrowserWindow} = require('electron');
const path = require('path');

function createWindow(){
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences:{
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    window.loadURL('http://localhost:3000');
}

app.whenReady().then(createWindow);