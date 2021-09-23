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
  createNewWindow,
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
  } else {
    onNavigation({
      preventDefault,
      urlTarget: urlToGo,
      currentUrl: targetUrl,
      createNewWindow
    })
  }
}

interface onNavigationParameters {
  preventDefault: () => void;
  currentUrl: string; 
  urlTarget: string;
  createNewWindow?: (url: string) => BrowserWindow;
}

export function onNavigation({ urlTarget, currentUrl, preventDefault, createNewWindow }: onNavigationParameters) {
  const url = new URL(currentUrl);
  const targetUrl = new URL(urlTarget);
  const sameHost = targetUrl.hostname === url.hostname;
  const sameApp = sameHost && url.pathname.startsWith(targetUrl.pathname);

  if (!sameHost || sameApp) {
      return;
  }

  const targetWindow = BrowserWindow.getAllWindows().find(b => {
    const path = b.webContents.getURL()
      .replace(`${targetUrl.protocol}//${targetUrl.hostname}`, '');
    return path.startsWith(targetUrl.pathname);
  })

  if (!sameApp && targetWindow) {
    preventDefault();
    targetWindow.focus();
    return;
  }

  if (createNewWindow) {
    preventDefault();
    createNewWindow(urlTarget)
  }
}