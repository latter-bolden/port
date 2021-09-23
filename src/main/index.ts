import { app, autoUpdater, BrowserWindow, globalShortcut, WebContents } from 'electron';
import findOpenSocket from '../renderer/client/find-open-socket'
import isDev from 'electron-is-dev'
import { isOSX } from './helpers';
import { createMainWindow } from './main-window';
import { portDBMigration } from '../background/migrations/port-migration';
import { InputEvent } from 'electron/main';
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const BACKGROUND_WINDOW_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

let mainWindow: BrowserWindow;

if (!isDev) {
  const server = 'https://update.electronjs.org'
  const feed = `${server}/arthyn/port/${process.platform}-${process.arch}/${app.getVersion()}`

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

  await portDBMigration();

  isDev && console.log('server socket', serverSocket)
  if (bootBg) {
    bgWindow = createBackgroundWindow(serverSocket)
  }

  mainWindow = createMainWindow(MAIN_WINDOW_WEBPACK_ENTRY, serverSocket, app.quit.bind(this), bgWindow)

  registerShortcuts(mainWindow);

  if (!isDev) {
    autoUpdater.checkForUpdates()

    setInterval(() => {
      autoUpdater.checkForUpdates()
    }, 10 * 60 * 1000) //check every 10 mins for updates
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

function showWindow(window: BrowserWindow): void {
  window.setAlwaysOnTop(true);
  if (window.isMaximized()) {
    window.maximize();
  } else {
    window.showInactive();
  }

  window.setAlwaysOnTop(false);
  window.focus();
  app.focus({
      steal: true
  });
}

function registerShortcuts(mainWindow: BrowserWindow) {
  globalShortcut.register('CommandOrControl+/', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow(); 
    const isLandscape = focusedWindow?.webContents.getURL().includes('/apps/landscape');
    const contents = isLandscape ? focusedWindow.webContents : mainWindow.getBrowserViews()[0].webContents;
    showWindow(isLandscape ? focusedWindow : mainWindow);

    setTimeout(() => {
      contents.focus();

      setTimeout(() => {
        sendKeybinding(contents, '/', ['ctrl']);
      }, 15)
    }, 15);
  })

  globalShortcut.register('Control+Tab', () => {
    const windows = BrowserWindow.getAllWindows().filter(win => win.title !== 'background');
    const focusedWindow = BrowserWindow.getFocusedWindow();

    const windowCount = windows.length;
    const focusedIndex = windows.indexOf(focusedWindow);

    showWindow(windows[(focusedIndex + 1) % windowCount])
  })
}

function sendKeybinding (contents: WebContents, keyCode: string, modifiers?: InputEvent["modifiers"]) {
  contents.sendInputEvent({ type: 'keyDown', modifiers, keyCode })
  contents.sendInputEvent({ type: 'char', modifiers, keyCode })
  contents.sendInputEvent({ type: 'keyUp', modifiers, keyCode })
}