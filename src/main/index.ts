import { app, autoUpdater, BrowserWindow } from 'electron';
import path from 'path';
import findOpenSocket from '../renderer/client/find-open-socket'
import isDev from 'electron-is-dev'
import { isOSX, onNavigation } from './helpers';
import { createMainWindow } from './main-window';
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const BACKGROUND_WINDOW_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

let mainWindow: BrowserWindow;

if (!isDev) {
  const server = 'https://update.electronjs.org'
  const feed = `${server}/urbit/port/${process.platform}-${process.arch}/${app.getVersion()}`

  autoUpdater.setFeedURL({
    url: feed
  })

  autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update-available');
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update-downloaded');
  })

  autoUpdater.on('error', message => {
    console.error('There was a problem updating the application')
    console.error(message)
  })
} else {
  setTimeout(() => {
    console.log('sending update available')
    mainWindow.webContents.send('update-available');

    setTimeout(() => {
      console.log('sending update downloaded')
      mainWindow.webContents.send('update-downloaded');
    }, 10 * 1000);
  }, 45 * 1000)
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
      webSecurity: false,
      contextIsolation: false
    }
  })

  isDev && win.webContents.openDevTools()
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


  if (!isDev) {
    autoUpdater.checkForUpdates()

    setInterval(() => {
      autoUpdater.checkForUpdates()
    }, 10 * 60 * 1000) //check every 10 mins for updates
  }
}


if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('urbit-port', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('urbit-port')
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
  return;
}

app.on('second-instance', (event, commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow.focus()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => start(true));

app.on('open-url', (event, url) => {
  let ticket = url.split('urbit-port://')[1];
  console.log('sending', ticket);
  mainWindow.webContents.send('navigate', { ticket })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (!isOSX()) {
    app.quit();
  }
});

function exitBeforeQuit() {
  if (isOSX()) {
    app.exit(0);
  }
}

app.on('before-quit', exitBeforeQuit);
autoUpdater.on('before-quit-for-update', exitBeforeQuit);

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
