import { URL } from 'url'
import { app, BrowserWindow, WebContents } from "electron";
import { InputEvent } from 'electron/main';
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

export function linkIsInternal(
  currentUrl: string,
  newUrl: string,
  internalUrlRegex?: string | RegExp,
): boolean {
  if (newUrl === 'about:blank') {
    return true;
  }

  if (internalUrlRegex) {
    const regex = RegExp(internalUrlRegex);
    return regex.test(newUrl);
  }

  if (newUrl.startsWith(URBIT_PROTOCOL)) {
    return true;
  } 

  try {
    // Consider as "same domain-ish", without TLD/SLD list:
    // 1. app.foo.com and foo.com
    // 2. www.foo.com and foo.com
    // 3. www.foo.com and app.foo.com
    const currentDomain = new URL(currentUrl).hostname.replace(/^www\./, '');
    const newDomain = new URL(newUrl).hostname.replace(/^www./, '');
    const [longerDomain, shorterDomain] =
      currentDomain.length > newDomain.length
        ? [currentDomain, newDomain]
        : [newDomain, currentDomain];
    return longerDomain.endsWith(shorterDomain);
  } catch (err) {
    console.warn(
      'Failed to parse domains as determining if link is internal. From:',
      currentUrl,
      'To:',
      newUrl,
      err,
    );
    return false;
  }
}

export function onNewWindowHelper(
  urlToGo: string,
  disposition: string,
  targetUrl: string,
  preventDefault,
  openExternal,
  createAboutBlankWindow,
  createNewWindow,
  blockExternal: boolean,
  onBlockedExternalUrl: (url: string) => void,
  mainWindow: BrowserWindow
): void {
  if (!linkIsInternal(targetUrl, urlToGo)) {
    preventDefault();
    if (blockExternal) {
      onBlockedExternalUrl(urlToGo);
    } else {
      openExternal(urlToGo);
    }
  } else if (urlToGo === 'about:blank') {
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
  const targetUrl = new URL(urlTarget);
  const sameHost = targetUrl.hostname === url.hostname;
  const sameApp = sameHost && url.pathname.startsWith(targetUrl.pathname);
  const isProtocolLink = targetUrl.protocol.startsWith(URBIT_PROTOCOL);

  if ((!sameHost || sameApp) && !isProtocolLink) {
      return;
  }

  if (isProtocolLink) {
    const view = mainWindow.getBrowserViews().find(v => {
      const viewUrl = new URL(v.webContents.getURL());
      return url.host === viewUrl.host;
    });
    const urbitUrl = createUrbitUrl(url, urlTarget);

    preventDefault();
    if (view) {
      showWindow(mainWindow);
      return view.webContents.loadURL(urbitUrl);
    } else {
      return createNewWindow(urbitUrl);
    }
  }

  const targetWindow = BrowserWindow.getAllWindows().find(b => {
    const path = b.webContents.getURL()
      .replace(`${targetUrl.protocol}//${targetUrl.hostname}`, '');
    return path.startsWith(targetUrl.pathname);
  })

  if (!sameApp && targetWindow) {
    preventDefault();
    targetWindow.focus();

    if (targetUrl.searchParams.has('grid-note') || targetUrl.searchParams.has('grid-link')) {
      targetWindow.webContents.loadURL(targetUrl.toString());
    }
    return;
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