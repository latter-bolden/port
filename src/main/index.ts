import { app, BrowserWindow } from 'electron';
import { ChildProcess } from 'child_process'
import findOpenSocket from '../renderer/client/find-open-socket'
import isDev from 'electron-is-dev'
import { start as osHelperStart } from './os-service-helper'
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const BACKGROUND_WINDOW_WEBPACK_ENTRY: string;
let serverProcess: ChildProcess;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

async function createWindow(socketName: string): Promise<BrowserWindow> {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    }
  });
  // Open the DevTools. isDev && 
  mainWindow.webContents.openDevTools();
  await mainWindow.webContents.session.clearStorageData();
  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.webContents.send('set-socket', {
      name: socketName
    });
  })
  
  // and load the index.html of the app.
  await mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  return mainWindow
}

function createBackgroundWindow(socketName: string) {
  const win = new BrowserWindow({
    title: 'background',
    x: 500,
    y: 300,
    width: 700,
    height: 500,
    show: isDev,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true,
      webSecurity: false
    }
  })
  win.loadURL(BACKGROUND_WINDOW_WEBPACK_ENTRY)
  win.webContents.openDevTools();
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('set-socket', { name: socketName })
  })
}

// function createBackgroundProcess(socketName: string) {
//   serverProcess = fork('.webpack/renderer/background/index.js', [
//     '--subprocess',
//     app.getVersion(),
//     socketName
//   ], {
//     execArgv: ['--inspect']
//   })

//   serverProcess.on('message', msg => {
//     console.log(msg)
//   })
// }

async function start(bootBg: boolean) {
  const serverSocket = await findOpenSocket()

  const main = await createWindow(serverSocket)
  osHelperStart(main)
  if (bootBg) {
    createBackgroundWindow(serverSocket)
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => start(true));

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill()
    serverProcess = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open. except background
  const windows = BrowserWindow.getAllWindows();
  const hasBackground = !!windows.find(win => win.title === 'background')
  if (windows.length === 1 && hasBackground) {
    start(false);
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
