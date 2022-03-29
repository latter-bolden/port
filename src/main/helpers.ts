import { URL } from 'url'
import { app, BrowserWindow, WebContents } from "electron";
import { InputEvent } from 'electron/main';
import isDev from 'electron-is-dev';
import { getPlatform } from "../get-platform";

//Taken from https://github.com/nativefier/nativefier/blob/master/app/src/helpers/helpers.ts
export function isOSX(): boolean {
  return getPlatform() === 'mac';
}

export function nativeTabsSupported(): boolean {
  return isOSX();
}

export const URBIT_PROTOCOL = 'web+urbitgraph'

export function createUrbitUrl(viewUrl: URL, urbitUrl: string): string {
  const prefix = `${viewUrl.protocol}//${viewUrl.host}`
  return `${prefix}/apps/grid/perma?ext=${encodeURIComponent(urbitUrl)}`
}

export function showWindow(window: BrowserWindow): void {
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

export function onNewWindowHelper(
  urlToGo: string,
  targetUrl: string,
  preventDefault,
  createAboutBlankWindow,
  createNewWindow,
  mainWindow: BrowserWindow
): void {
  if (urlToGo === 'about:blank') {
    const newWindow = createAboutBlankWindow();
    preventDefault(newWindow);
  } else {
    onNavigation({
      preventDefault,
      urlTarget: urlToGo,
      currentUrl: targetUrl,
      createNewWindow,
      mainWindow
    })
  }
}

interface onNavigationParameters {
  preventDefault: () => void;
  currentUrl: string; 
  urlTarget: string;
  createNewWindow?: (url: string) => BrowserWindow;
  mainWindow: BrowserWindow;
}

export function onNavigation({ urlTarget, currentUrl, preventDefault, createNewWindow, mainWindow }: onNavigationParameters) {
  const url = new URL(currentUrl);
  let targetUrl = new URL(urlTarget);
  const isProtocolLink = targetUrl.protocol.startsWith(URBIT_PROTOCOL);

  if (isProtocolLink) {
    // fix protocol link being incorrectly parsed
    targetUrl = new URL(`${URBIT_PROTOCOL}://${url.host}/${targetUrl.host}${targetUrl.pathname}`)
  }

  const sameHost = targetUrl.hostname === url.hostname;
  const sameApp = sameHost && targetUrl.pathname.split('/')[1] === url.pathname.split('/')[1];
  isDev && console.log('navigating', url.pathname, targetUrl.pathname)

  if ((!sameHost || sameApp) && !isProtocolLink) {
      return;
  }

  if (isProtocolLink) {
    const view = mainWindow.getBrowserViews().find(v => {
      const viewUrl = new URL(v.webContents.getURL());
      return url.host === viewUrl.host;
    });
    const urbitUrl = createUrbitUrl(url, urlTarget);
    console.log('redirecting to', urbitUrl)

    preventDefault();
    if (view) {
      showWindow(mainWindow);
      return view.webContents.loadURL(urbitUrl);
    } else {
      return createNewWindow(urbitUrl);
    }
  }

  const targetWindow = BrowserWindow.getAllWindows().find(b => {
    const portPathSegment = targetUrl.port ? `:${targetUrl.port}` : ''
    const path = b.webContents.getURL()
      .replace(`${targetUrl.protocol}//${targetUrl.hostname}${portPathSegment}`, '');
    return path.startsWith(targetUrl.pathname);
  })

  if (targetWindow) {
    const targetWindowPort = (new URL(targetWindow.webContents.getURL())).port;
    if (!sameApp && targetWindowPort === targetUrl.port) {
      preventDefault();
      targetWindow.focus();

      if (targetUrl.searchParams.has('grid-note') || targetUrl.searchParams.has('grid-link')) {
        targetWindow.webContents.loadURL(targetUrl.toString());
      }
      return;
    }
  }

  if (createNewWindow) {
    preventDefault();
    createNewWindow(urlTarget)
  }
}

export function leap(mainWindow: BrowserWindow) {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  const mainView = mainWindow.getBrowserViews()[0]; 

  if ((!mainView && !focusedWindow) || (focusedWindow === mainWindow && !mainView)){
    return;
  }

  const isLandscape = focusedWindow?.webContents.getURL().includes('/apps/landscape');
  const contents = isLandscape ? focusedWindow.webContents : mainView.webContents;
  showWindow(isLandscape ? focusedWindow : mainWindow);

  setTimeout(() => {
    contents.focus();

    setTimeout(() => {
      sendKeybinding(contents, '/', ['ctrl']);
    }, 15)
  }, 15);
}

function sendKeybinding (contents: WebContents, keyCode: string, modifiers?: InputEvent["modifiers"]) {
  contents.sendInputEvent({ type: 'keyDown', modifiers, keyCode })
  contents.sendInputEvent({ type: 'char', modifiers, keyCode })
  contents.sendInputEvent({ type: 'keyUp', modifiers, keyCode })
}