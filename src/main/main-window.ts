import { BrowserWindow, shell, dialog, Event, BrowserWindowConstructorOptions, WebContents, nativeTheme, app, ipcMain } from 'electron';
import windowStateKeeper from 'electron-window-state';
import isDev from 'electron-is-dev';

import {
  isOSX,
  nativeTabsSupported,
  onNavigation,
  onNewWindowHelper,
  URBIT_PROTOCOL
} from './helpers';
import { initContextMenu } from './context-menu';
import { start as osHelperStart, views } from './os-service-helper'
import { start as settingsHelperStart } from './setting-service-helper'
import { start as terminalServiceStart } from './terminal-service';
import { Settings } from '../background/db';

declare const LANDSCAPE_PRELOAD_WEBPACK_ENTRY: string;
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
      zoomFactor: 1,
      preload: LANDSCAPE_PRELOAD_WEBPACK_ENTRY
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
      contextIsolation: false
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

  const onWillNavigate = (event: Event, webContents: WebContents, urlTarget: string): void => {
    isDev && console.log('will-navigate', urlTarget)
    onNavigation({
      preventDefault: event.preventDefault,
      currentUrl: webContents.getURL(),
      urlTarget,
      createNewWindow,
      mainWindow
    })
  };

  const createNewWindow: (url: string) => BrowserWindow = (url: string) => {
    const window = new BrowserWindow(DEFAULT_WINDOW_OPTIONS);

    window.webContents.on('new-window', onNewWindow(url));
    window.webContents.on('will-navigate', (e, url) => onWillNavigate(e, window.webContents, url));
    window.webContents.on('did-finish-load', () => {
      configureWindowTitle(window)
      console.log('finished load')
    })
    window.webContents.loadURL(url);
    return window;
  };

  const configureWindowTitle = (window: BrowserWindow) => {
    mainWindow.webContents.send('current-ship')
    ipcMain.on('current-ship', (_, { shouldDisplay, displayName }: { shouldDisplay: boolean, displayName: string}) => {
      ipcMain.removeAllListeners('current-ship')

      if (!shouldDisplay || !displayName) {
        return
      }

      const titlePrefix = ` (${displayName})`
      window.setTitle(`${window.webContents.getTitle()}${titlePrefix}`)

      // webContents cannot detect in-page navigations (which may change the title), so we inject that behavior
      const setTitleScript = `
        new MutationObserver( () => {
            if (!document.title.includes("${displayName}")) {
              document.title = document.title + "${titlePrefix}"
            }
        }).observe(
            document.querySelector('title'),
            { subtree: true, characterData: true, childList: true }
        );
      `
      window.webContents.executeJavaScript(setTitleScript)
    })
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

  const onNewWindow = (targetUrl: string) =>
  (
    event: Event & { newGuest?: any },
    urlToGo: string,
    frameName: string,
    disposition,
  ): void => {
    isDev && console.log('creating new window', targetUrl, urlToGo, frameName, disposition);
    const preventDefault = (newGuest: any): void => {
      event.preventDefault();
      if (newGuest) {
        event.newGuest = newGuest;
      }
    };
    onNewWindowHelper(
      urlToGo,
      targetUrl,
      preventDefault,
      createAboutBlankWindow,
      createNewWindow,
      mainWindow
    );
  };

  const handleProtocolLink = (url: string) => {
    const view = mainWindow.getBrowserViews()[0];
    if (!view) {
      mainWindow.webContents.send('protocol-link', url);
      return;
    }

    const currentUrl = view.webContents.getURL();
    console.log('deeplink', url, currentUrl);
    onNavigation({
      preventDefault: () => {}, //eslint-disable-line @typescript-eslint/no-empty-function
      urlTarget: url,
      currentUrl,
      mainWindow,
      createNewWindow
    })
  }

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
    mainWindow,
    bgWindow,
    settings: {} as Record<Settings, string>
  };

  initContextMenu(
    createNewWindow,
    undefined, //nativeTabsSupported() ? createNewTab : undefined,
    mainUrl
  );

  mainWindow.webContents.on('new-window', onNewWindow(mainUrl));
  mainWindow.webContents.on('will-navigate', (e, url) => onWillNavigate(e, mainWindow.webContents, url));
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

  // mainWindow.webContents.session.clearStorageData({
  //   storages: ['appcache', 'filesystem', 'indexdb', 'localstorage', 'cachestorage']
  // });
  // mainWindow.webContents.session.clearCache();
  osHelperStart(mainWindow, createNewWindow, onNewWindow, bgWindow)
  settingsHelperStart({ mainWindow, menuOptions });
  terminalServiceStart();
  isDev && mainWindow.webContents.openDevTools();
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
  
  // Force single application instance
  const gotTheLock = app.requestSingleInstanceLock();
  
  if (!gotTheLock && !isDev) {
    app.quit();
    return;
  } else {
    app.on('second-instance', (e, argv) => {
      if (process.platform !== 'darwin') {
        console.log('handling protocol link');
        handleProtocolLink(argv.find((arg) => arg.startsWith(`${URBIT_PROTOCOL}://`)))
      }
  
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();
      }
    });
  }

  app.on('open-url', (event, url) => {
    console.log('handling protocol link', url);
    handleProtocolLink(url);
  })

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
    bgWindow.destroy();
    isDev && console.log('closing bg and main, and everything else')
  }
}

async function clearCache(browserWindow: BrowserWindow): Promise<void> {
  const { session } = browserWindow.webContents;
  await session.clearStorageData();
  await session.clearCache();
}