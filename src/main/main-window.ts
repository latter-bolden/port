import { BrowserWindow, shell, dialog, Event, BrowserWindowConstructorOptions, WebContents, nativeTheme } from 'electron';
import windowStateKeeper from 'electron-window-state';
import isDev from 'electron-is-dev';

import {
  isOSX,
  linkIsInternal,
  nativeTabsSupported,
  onNewWindowHelper
} from './helpers';
import { initContextMenu } from './context-menu';
import { start as osHelperStart, views } from './os-service-helper'
import { createMenu } from './menu';

const ZOOM_INTERVAL = 0.1;

function getWindowOrViewContents(focusedWindow: BrowserWindow): WebContents {
  const view = focusedWindow.getBrowserView();
  return view ? view.webContents : focusedWindow.webContents;
}

export function updateZoomLevels(mainWindow: BrowserWindow) {
  if (!isDev) {
    return;
  }

  const main = Math.trunc(mainWindow.webContents.zoomFactor * 10) / 10;
  const viewLevels = [];
  views.forEach(view => {
    viewLevels.push(Math.trunc(view.webContents.zoomFactor * 10) / 10)
  })
  mainWindow.webContents.send('zoom-levels', {
    main,
    views: viewLevels.join()
  })
}

function adjustZoom(mainWindow: BrowserWindow, adjuster: (contents: WebContents) => void): void {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    const view = focusedWindow.getBrowserView();
    
    if (focusedWindow === mainWindow && view) {
      adjuster(view.webContents);
    }

    adjuster(focusedWindow.webContents);
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
    title: 'Port',
    //tabbingIdentifier: nativeTabsSupported() ? 'port' : undefined,
    webPreferences: {
      javascript: true,
      plugins: true,
      nodeIntegration: false, // `true` is *insecure*, and cause trouble with messenger.com
      webSecurity: true,
      zoomFactor: 1,
      contextIsolation: false
    },
  };

  const mainWindow = new BrowserWindow({
    ...DEFAULT_WINDOW_OPTIONS,
    width: mainWindowState.width,
    height: mainWindowState.height,
    titleBarStyle: 'hidden',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#000000' : '#FFFFFF',
    //icon: getAppIcon(),
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  });

  mainWindowState.manage(mainWindow);

  const withFocusedView = <T>(block: (contents: WebContents) => T | undefined, target: 'window' | 'view' = 'view'): T | undefined => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      const windowContents = focusedWindow.webContents;
      const windowOrViewContents = getWindowOrViewContents(focusedWindow);
      return target === 'window' ? block(windowContents) : block(windowOrViewContents);
    }
    return undefined;
  };

  const onZoomIn = (): void => {
    adjustZoom(mainWindow, (contents) => {
      contents.zoomFactor += ZOOM_INTERVAL;
    })
    updateZoomLevels(mainWindow);
  };

  const onZoomOut = (): void => {
    adjustZoom(mainWindow, (contents) => {
      contents.zoomFactor += -ZOOM_INTERVAL;
    })
    updateZoomLevels(mainWindow);
  };

  const onZoomReset = (): void => {
    adjustZoom(mainWindow, (contents) => {
      contents.zoomFactor = 1;
    })
    updateZoomLevels(mainWindow);
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
    withFocusedView((contents) => {
      contents.goBack();
    });
  };

  const onGoForward = (): void => {
    withFocusedView((contents) => {
      contents.goForward();
    });
  };

  const getCurrentUrl = (): string =>
    withFocusedView((contents) => contents.getURL());

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
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (!focusedWindow) {
      return undefined;
    }

    const newTab = createNewWindow(url);
    focusedWindow.addTabbedWindow(newTab);
    if (!foreground) {
      focusedWindow.focus();
    }
    return newTab;    
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
    zoomBuildTimeValue: 1.0,
    goBack: onGoBack,
    goForward: onGoForward,
    getCurrentUrl,
    clearAppData,
    bgWindow
  };

  createMenu(menuOptions);
  initContextMenu(
    createNewWindow,
    undefined, //nativeTabsSupported() ? createNewTab : undefined,
    mainUrl
  );

  mainWindow.webContents.on('new-window', onNewWindow);
  mainWindow.webContents.on('will-navigate', onWillNavigate);
  mainWindow.webContents.on('did-start-loading', () => {
    const loadingUrl = mainWindow.webContents.getURL().split('#')[0]
    if (mainUrl === loadingUrl) {
      const view = mainWindow.getBrowserView();
      if (view) {
        view.webContents.reload();
      }
    }
  })
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
  osHelperStart(mainWindow, createNewWindow, bgWindow)
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
        hideOrCloseWindow.bind(this, mainWindow, bgWindow, event),
      );
    }
    hideOrCloseWindow(mainWindow, bgWindow, event);
  });

  return mainWindow;
}

function hideOrCloseWindow(
  window: BrowserWindow,
  bgWindow: BrowserWindow,
  event: Event
): void {
  if (isOSX()) {
    // this is called when exiting from clicking the cross button on the window
    event.preventDefault();
    window.hide();
  } else {
    bgWindow.close();
  }
}

async function clearCache(browserWindow: BrowserWindow): Promise<void> {
  const { session } = browserWindow.webContents;
  await session.clearStorageData();
  await session.clearCache();
}