'use strict'

import * as path from 'path';

import {
  app,
  BrowserWindow,
} from 'electron';


let mainWindow

app.on('ready', async () => {
  createMainWindow();
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {

  if (process.platform !== 'darwin') { 
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) { createMainWindow(); }
})


// https://www.electronjs.org/blog/web-preferences-fix#mitigation

const enforceInheritance = (topWebContents) => {
  const handle = (webContents) => {
    webContents.on('new-window', (event, url, frameName, disposition, options) => {
      if (!options.webPreferences) {
        options.webPreferences = {}
      }
      Object.assign(options.webPreferences, topWebContents.getLastWebPreferences())
      if (options.webContents) {
        handle(options.webContents)
      }
    })
  }
  handle(topWebContents)
}


function createMainWindow () {

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "./preload/preload.js"),
    }
  })

  enforceInheritance(mainWindow.webContents)

  const ses = mainWindow.webContents.session;

  let mainFilePath = path.join(__dirname, '../index.html');

    mainWindow.loadURL(`file://${mainFilePath}`).finally(() => {
      console.log("mainWindow loaded");
    });

  // Open the DevTools only once DOM is ready
  mainWindow.webContents.once("dom-ready", async() => {
    mainWindow.webContents.openDevTools();
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    mainWindow = null
  })

}

