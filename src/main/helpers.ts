import { URL } from 'url'
import { app, BrowserWindow, WebContents, InputEvent, BrowserWindowConstructorOptions, BrowserView, Session } from "electron";
import isDev from 'electron-is-dev';
import { getPlatform } from "../get-platform";
import { Pier } from '../background/services/pier-service';

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

type OnNewWindowReturn = { action: 'deny' } | { action: 'allow', overrideBrowserWindowOptions?: BrowserWindowConstructorOptions };

export function onNewWindowHelper(
  urlToGo: string,
  currentUrl: string,
  createAboutBlankWindow,
  createNewWindow,
  mainWindow: BrowserWindow,
  piers: Pier[],
  partition?: string | Session,
): OnNewWindowReturn {
  const hosts = mainWindow.getBrowserViews().map(view => (new URL(view.webContents.getURL()).host));
  const current = new URL(currentUrl).host;
  const target = new URL(urlToGo).host;

  const pierHosts = piers.map(pier => {
    if (pier.type === 'remote') {
      return new URL(pier.directory).host;
    } else if (pier.webPort) {
      return new URL(`http://localhost:${pier.webPort}`).host;
    } else {
      return null;
    }
  });

  isDev && console.log(currentUrl, urlToGo, hosts, current, pierHosts, target)

  if (urlToGo === 'about:blank') {
    createAboutBlankWindow();
    return { action: 'deny' };
  } else if (!hosts.includes(current) && pierHosts.includes(target)) {
    return { action: 'deny' };
  } else {
    let action: 'allow' | 'deny' = 'allow';
    onNavigation({
      preventDefault: () => {
        action = 'deny'
      },
      urlTarget: urlToGo,
      currentUrl: currentUrl,
      createNewWindow,
      mainWindow,
      partition
    })

    isDev && console.log('onNavigation', action);
    return { action };
  }
}

interface onNavigationParameters {
  preventDefault: (newWindow?: BrowserWindow) => void;
  currentUrl: string; 
  urlTarget: string;
  createNewWindow?: (url: string, partition?: string | Session) => BrowserWindow;
  mainWindow: BrowserWindow;
  partition?: string | Session;
}

function matchView(view: BrowserWindow | BrowserView, targetUrl: URL) {
  const path = view.webContents.getURL()
      .replace(`${targetUrl.protocol}//${targetUrl.host}`, '');
  isDev && console.log('attempting match', path, targetUrl.pathname)
  return targetUrl.pathname === path;
}

export function onNavigation({ urlTarget, currentUrl, preventDefault, createNewWindow, mainWindow, partition }: onNavigationParameters) {
  const url = new URL(currentUrl);
  let targetUrl = new URL(urlTarget);
  const isProtocolLink = targetUrl.protocol.startsWith(URBIT_PROTOCOL);

  if (url.href === targetUrl.href) {
    // could be a POST/PUT, don't interfere
    return;
  }

  if (isProtocolLink) {
    // fix protocol link being incorrectly parsed
    targetUrl = new URL(`${URBIT_PROTOCOL}://${url.host}/${targetUrl.host}${targetUrl.pathname}`)
  }

  isDev && console.log('navigating', url.pathname, targetUrl.pathname)

  if (isProtocolLink) {    
    const view = mainWindow.getBrowserViews().find(v => {
      const viewUrl = new URL(v.webContents.getURL());
      return url.host === viewUrl.host;
    });
    const urbitUrl = createUrbitUrl(url, urlTarget);
    isDev && console.log(targetUrl, 'is protocol link, redirecting to', urbitUrl);

    if (view) {
      preventDefault();
      showWindow(mainWindow);
      return view.webContents.loadURL(urbitUrl);
    } else {
      const newWindow = createNewWindow(urbitUrl);
      preventDefault(newWindow);
      return newWindow;
    }
  }

  const targetWindow = BrowserWindow.getAllWindows().find(b => {
    return matchView(b, targetUrl)
  });
  const targetView = mainWindow.getBrowserViews().find(b => matchView(b, targetUrl));

  if (targetWindow || targetView) {
    isDev && console.log(urlTarget, 'have window, focusing');
    preventDefault();
    (targetWindow || mainWindow).focus();
    (targetWindow || targetView).webContents.loadURL(targetUrl.toString());
    return;
  }

  if (createNewWindow) {
    isDev && console.log(urlTarget, 'window doesn\'t exist, creating');
    const newWindow = createNewWindow(urlTarget, partition)
    preventDefault(newWindow);
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