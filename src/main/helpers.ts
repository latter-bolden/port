import { URL } from 'url'
import { BrowserWindow, WebContents } from "electron";
import { getPlatform } from "../get-platform";

//Taken from https://github.com/nativefier/nativefier/blob/master/app/src/helpers/helpers.ts
export function isOSX(): boolean {
  return getPlatform() === 'mac';
}

export function nativeTabsSupported(): boolean {
  return isOSX();
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
  nativeTabsSupported,
  createNewTab,
  blockExternal: boolean,
  onBlockedExternalUrl: (url: string) => void,
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
  } else if (nativeTabsSupported()) {
    if (disposition === 'background-tab') {
      const newTab = createNewTab(urlToGo, false);
      preventDefault(newTab);
    } else if (disposition === 'foreground-tab') {
      const newTab = createNewTab(urlToGo, true);
      preventDefault(newTab);
    }
  }
}

function getAppFromPath(path: string) {
  const parts = path.split('/').filter(el => !!el);
  return parts[0] || '';
}

interface onNavigationParameters {
  event: Event;
  webContents: WebContents; 
  urlTarget: string; 
  mainWindow: BrowserWindow;
  createNewWindow: (url: string) => BrowserWindow;
}

export function onNavigation({ event, urlTarget, ...params }: onNavigationParameters) {
  const currentUrl = new URL(params.webContents.getURL());
  const targetUrl = new URL(urlTarget);
  const sameHost = targetUrl.hostname === currentUrl.hostname;
  
  const currentApp = getAppFromPath(currentUrl.pathname);
  const targetApp = getAppFromPath(targetUrl.pathname);
  const sameApp = sameHost && currentApp === targetApp;
  const targetIsLandscape = targetApp === '' || targetApp === '~landscape';

  console.log({ urlTarget, targetApp, currentUrl });
  
  if (!sameHost || sameApp) {
      return;
  }

  if (!sameApp && targetIsLandscape) {
      event.preventDefault();
      params.mainWindow.focus();
      return;
  }

  event.preventDefault();
  params.createNewWindow(urlTarget)
}