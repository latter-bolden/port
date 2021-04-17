import { BrowserWindow, shell, dialog, Event, BrowserWindowConstructorOptions } from 'electron';
import windowStateKeeper from 'electron-window-state';

import {
  isOSX,
  linkIsInternal,
  nativeTabsSupported,
  onNewWindowHelper
} from './helpers';
import { initContextMenu } from './context-menu';
import { start as osHelperStart } from './os-service-helper'
import { createMenu } from './menu';

const ZOOM_INTERVAL = 0.1;

function hideWindow(
  window: BrowserWindow,
  event: Event,
  fastQuit: boolean,
  tray,
): void {
  if (isOSX() && !fastQuit) {
    // this is called when exiting from clicking the cross button on the window
    event.preventDefault();
    window.hide();
  } else if (!fastQuit && tray) {
    event.preventDefault();
    window.hide();
  }
  // will close the window on other platforms
}

async function clearCache(browserWindow: BrowserWindow): Promise<void> {
  const { session } = browserWindow.webContents;
  await session.clearStorageData();
  await session.clearCache();
}

export function createMainWindow(
  mainUrl: string,
  socketName: string,
  onAppQuit: () => void,
  bgWindow?: BrowserWindow,
): BrowserWindow {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1280,
    defaultHeight: 800,
  });

  const DEFAULT_WINDOW_OPTIONS: BrowserWindowConstructorOptions = {
    // Convert dashes to spaces because on linux the app name is joined with dashes
    title: 'taisho',
    //tabbingIdentifier: nativeTabsSupported() ? 'taisho' : undefined,
    webPreferences: {
      javascript: true,
      plugins: true,
      nodeIntegration: false, // `true` is *insecure*, and cause trouble with messenger.com
      webSecurity: true,
      zoomFactor: 1,
    },
  };

  const mainWindow = new BrowserWindow({
    ...DEFAULT_WINDOW_OPTIONS,
    width: mainWindowState.width,
    height: mainWindowState.height,
    titleBarStyle: 'hidden',
    backgroundColor: '#000000',
    //icon: getAppIcon(),
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    }
  });

  mainWindowState.manage(mainWindow);

  const withFocusedWindow = (block: (window: BrowserWindow) => void): void => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      return block(focusedWindow);
    }
    return undefined;
  };

  const adjustWindowZoom = (
    window: BrowserWindow,
    adjustment: number,
  ): void => {
    window.webContents.zoomFactor = window.webContents.zoomFactor + adjustment;
  };

  const onZoomIn = (): void => {
    withFocusedWindow((focusedWindow: BrowserWindow) =>
      adjustWindowZoom(focusedWindow, ZOOM_INTERVAL),
    );
  };

  const onZoomOut = (): void => {
    withFocusedWindow((focusedWindow: BrowserWindow) =>
      adjustWindowZoom(focusedWindow, -ZOOM_INTERVAL),
    );
  };

  const onZoomReset = (): void => {
    withFocusedWindow((focusedWindow: BrowserWindow) => {
      focusedWindow.webContents.zoomFactor = 1;
    });
  };

  const clearAppData = async (): Promise<void> => {
    const response = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      buttons: ['Yes', 'Cancel'],
      defaultId: 1,
      title: 'Clear cache confirmation',
      message:
        'This will clear all data (cookies, local storage etc) from this app. Are you sure you wish to proceed?',
    });

    if (response.response !== 0) {
      return;
    }
    await clearCache(mainWindow);
  };

  const onGoBack = (): void => {
    withFocusedWindow((focusedWindow) => {
      focusedWindow.webContents.goBack();
    });
  };

  const onGoForward = (): void => {
    withFocusedWindow((focusedWindow) => {
      focusedWindow.webContents.goForward();
    });
  };

  const getCurrentUrl = (): void =>
    withFocusedWindow((focusedWindow) => focusedWindow.webContents.getURL());

  const onBlockedExternalUrl = (url: string) => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dialog.showMessageBox(mainWindow, {
      message: `Cannot navigate to external URL: ${url}`,
      type: 'error',
      title: 'Navigation blocked',
    });
  };

  const onWillNavigate = (event: Event, urlToGo: string): void => {
    if (!linkIsInternal(mainUrl, urlToGo)) {
      event.preventDefault();
      shell.openExternal(urlToGo);
    }
  };

  const createNewWindow: (url: string) => BrowserWindow = (url: string) => {
    const window = new BrowserWindow(DEFAULT_WINDOW_OPTIONS);

    window.webContents.on('new-window', onNewWindow);
    window.webContents.on('will-navigate', onWillNavigate);
    window.loadURL(url);
    return window;
  };

  const createNewTab = (url: string, foreground: boolean): BrowserWindow => {
    withFocusedWindow((focusedWindow) => {
      const newTab = createNewWindow(url);
      focusedWindow.addTabbedWindow(newTab);
      if (!foreground) {
        focusedWindow.focus();
      }
      return newTab;
    });
    return undefined;
  };

  const createAboutBlankWindow = (): BrowserWindow => {
    const window = createNewWindow('about:blank');
    window.hide();
    window.webContents.once('did-stop-loading', () => {
      if (window.webContents.getURL() === 'about:blank') {
        window.close();
      } else {
        window.show();
      }
    });
    return window;
  };

  const onNewWindow = (
    event: Event & { newGuest?: any },
    urlToGo: string,
    frameName: string,
    disposition,
  ): void => {
    const preventDefault = (newGuest: any): void => {
      event.preventDefault();
      if (newGuest) {
        event.newGuest = newGuest;
      }
    };
    onNewWindowHelper(
      urlToGo,
      disposition,
      mainUrl,
      preventDefault,
      shell.openExternal.bind(this),
      createAboutBlankWindow,
      nativeTabsSupported,
      createNewTab,
      false,
      onBlockedExternalUrl,
    );
  };

  const menuOptions = {
    appQuit: onAppQuit,
    zoomIn: onZoomIn,
    zoomOut: onZoomOut,
    zoomReset: onZoomReset,
    zoomBuildTimeValue: undefined,
    goBack: onGoBack,
    goForward: onGoForward,
    getCurrentUrl,
    clearAppData,
    bgWindow
  };

  createMenu(menuOptions);
  initContextMenu(
    createNewWindow,
    undefined //nativeTabsSupported() ? createNewTab : undefined,
  );

  mainWindow.webContents.on('new-window', onNewWindow);
  mainWindow.webContents.on('will-navigate', onWillNavigate);
  mainWindow.webContents.on('did-finish-load', () => {
    // Restore pinch-to-zoom, disabled by default in recent Electron.
    // See https://github.com/nativefier/nativefier/issues/379#issuecomment-598309817
    // and https://github.com/electron/electron/pull/12679
    mainWindow.webContents.setVisualZoomLevelLimits(1, 3);
  });
  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.webContents.send('set-socket', {
      name: socketName
    });
  })


  mainWindow.webContents.session.clearStorageData({
    storages: ['appcache', 'filesystem', 'indexdb', 'localstorage', 'cachestorage']
  });
  mainWindow.webContents.session.clearCache();
  osHelperStart(mainWindow, bgWindow)
  mainWindow.loadURL(mainUrl);

  //mainWindow.on('new-tab' as any, () => createNewTab(mainUrl, true));

  mainWindow.on('close', (event) => {
    if (mainWindow.isFullScreen()) {
      if (nativeTabsSupported()) {
        mainWindow.moveTabToNewWindow();
      }
      mainWindow.setFullScreen(false);
      mainWindow.once(
        'leave-full-screen',
        hideWindow.bind(this, mainWindow, event, false),
      );
    }
    hideWindow(mainWindow, event, false, false);
  });

  return mainWindow;
}
