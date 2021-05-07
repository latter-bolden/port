import { app, autoUpdater, BrowserView, BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent } from 'electron'
import isDev from 'electron-is-dev'
import { ViewData } from '../background/services/os-service';
import { initContextMenu } from './context-menu';

const views = new Map<string, BrowserView>();
const viewQueue: string[] = [];

async function openDialog(event: IpcMainInvokeEvent, options: Electron.OpenDialogOptions) {
    return await dialog.showOpenDialog(options);
}

function setTitle(window: BrowserWindow, event: IpcMainInvokeEvent, title: string) {
    window.setTitle(title)
    return title;
}

async function clearData(window: BrowserWindow) {
    const session = window.webContents.session;
    //possibly clear everything not sure what's the issue
    await session.clearCache()
    await session.clearStorageData({
        storages: ['appcache', 'filesystem', 'indexdb', 'localstorage', 'cachestorage']
    })
}

export async function toggleDevTools(mainWindow: BrowserWindow, bgWindow?: BrowserWindow) {
    mainWindow.webContents.toggleDevTools()

    if (bgWindow) {
        if (bgWindow.isVisible()) {
            bgWindow.hide()
        } else {
            bgWindow.show()
        }

        bgWindow.webContents.toggleDevTools()
    }
}

async function createView(mainWindow: BrowserWindow, createNewWindow, data: ViewData) {
    const { url, bounds } = data;
    let view = views.get(url);
    const newView = !view;

    if (newView) {
        view = new BrowserView();
        initContextMenu(createNewWindow, undefined, mainWindow.webContents.getURL(), view)
        view.webContents.loadURL(url);
        views.set(url, view);
        viewQueue.push(url);
    }

    mainWindow.addBrowserView(view);
    setViewBounds(view, data, mainWindow.webContents.getZoomFactor());
}

function setViewBounds(view: BrowserView, { bounds }: ViewData, zoomFactor?: number) {
    const { x, y, width, height } = bounds;
    const zoom = zoomFactor || view.webContents.getZoomFactor() || 1;
    
    view.setBounds({
        x: Math.round(x * zoom),
        y: Math.round(y * zoom),
        width: Math.round(width * zoom),
        height: Math.round(height * zoom)
    })
}

async function updateViewBounds(data: ViewData) {
    const view = views.get(data.url)
    if (view) {
        setViewBounds(view, data);
    }
}

async function removeView(mainWindow: BrowserWindow, url: string) {
    const view = views.get(url)

    if (view) {
        isDev && console.log('removing', url)
        mainWindow.removeBrowserView(view)

        if (viewQueue.length >= 5) {
            const oldUrl = viewQueue.shift()
            const oldView = views.get(oldUrl);
            (oldView.webContents as any).destroy();
            views.delete(oldUrl)
        }
    }
}

function installUpdates() {
    if (!isDev) {
        autoUpdater.quitAndInstall();
    } else {
        console.log('quitting')
        app.quit();
    }
}

export function start(mainWindow: BrowserWindow, createNewWindow, bgWindow?: BrowserWindow): void {
    ipcMain.handle('open-dialog', openDialog)
    ipcMain.handle('set-title', (event, args) => setTitle(mainWindow, event, args))
    ipcMain.handle('clear-data', () => clearData(mainWindow))
    ipcMain.handle('toggle-dev-tools', () => toggleDevTools(mainWindow, bgWindow))
    ipcMain.handle('create-view', (event, args) => createView(mainWindow, createNewWindow, args))
    ipcMain.handle('update-view-bounds', (event, args) => updateViewBounds(args))
    ipcMain.handle('remove-view', (event, args) => removeView(mainWindow, args))
    ipcMain.handle('install-updates', installUpdates)
}