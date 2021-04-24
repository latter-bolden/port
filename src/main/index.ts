import { app, BrowserWindow } from 'electron';
import findOpenSocket from '../renderer/client/find-open-socket'
import isDev from 'electron-is-dev'
import { isOSX } from './helpers';
import { createMainWindow } from './main-window';
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const BACKGROUND_WINDOW_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

let mainWindow: BrowserWindow;

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
      webSecurity: false,
      contextIsolation: false
    }
  })

  //make sure isVisible is false for devtools toggle
  win.hide()
  isDev && win.webContents.openDevTools();
  win.webContents.on('did-finish-load', () => {
    isDev && console.log('background finished loading')
    win.webContents.send('set-socket', { name: socketName })
  })
  win.loadURL(BACKGROUND_WINDOW_WEBPACK_ENTRY)

  win.on('close', (event) => {
    event.preventDefault();
    win.hide();
  });

  return win;
}

async function start(bootBg: boolean) {
  const serverSocket = await findOpenSocket()
  let bgWindow;

  isDev && console.log('server socket', serverSocket)
  if (bootBg) {
    bgWindow = createBackgroundWindow(serverSocket)
  }

  mainWindow = createMainWindow(MAIN_WINDOW_WEBPACK_ENTRY, serverSocket, app.quit.bind(this), bgWindow)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => start(true));

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (!isOSX()) {
    app.quit();
  }
});

app.on('before-quit', () => {
  // not fired when the close button on the window is clicked
  if (isOSX()) {
    // need to force a quit as a workaround here to simulate the osx app hiding behaviour
    // Somehow sokution at https://github.com/atom/electron/issues/444#issuecomment-76492576 does not work,
    // e.prevent default appears to persist

    // might cause issues in the future as before-quit and will-quit events are not called
    app.exit(0);
  }
})

app.on('activate', (event, hasVisibleWindows) => {
  if (isOSX()) {
    // this is called when the dock is clicked
    if (!hasVisibleWindows) {
      mainWindow.show();
    } else {
      const windows = BrowserWindow.getAllWindows();
      const hasBackground = !!windows.find(win => win.title === 'background')
      if (windows.length === 1 && hasBackground) {
        start(false);
      }
    }
  }
});