import { app, autoUpdater, BrowserView, BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent, nativeTheme } from 'electron'
import isDev from 'electron-is-dev'
import { ViewData } from '../background/services/os-service';
import { initContextMenu } from './context-menu';
import { onNavigation } from './helpers';
import { updateZoomLevels } from './main-window';

declare const LANDSCAPE_PRELOAD_WEBPACK_ENTRY: string;
declare const PROMPT_WEBPACK_ENTRY: string;

export const views = new Map<string, BrowserView>();
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
    const views = mainWindow.getBrowserViews()

    if (views) {
        views.forEach(view => view.webContents.openDevTools())
    }

    if (bgWindow) {
        if (bgWindow.isVisible()) {
            bgWindow.hide()
        } else {
            bgWindow.show()
        }

        bgWindow.webContents.toggleDevTools()
    }
}

async function createView(mainWindow: BrowserWindow, createNewWindow, onNewWindow, data: ViewData) {
    const { url } = data;
    let view = views.get(url);
    const newView = !view;

    if (newView) {
        view = new BrowserView({
            webPreferences: {
                devTools: true,
                preload: LANDSCAPE_PRELOAD_WEBPACK_ENTRY
            }
        });
        initContextMenu(createNewWindow, undefined, mainWindow.webContents.getURL(), view)
        
        try {
            await view.webContents.loadURL(url);
        } catch (err) {
            console.log(err);
            return { error: err.message }
        }

        view.webContents.on('will-navigate', (event, urlTarget) => {
            onNavigation({
                preventDefault: event.preventDefault,
                currentUrl: view.webContents.getURL(),
                urlTarget,
                createNewWindow,
                mainWindow
            })
        });
        view.webContents.on('new-window', onNewWindow(url));

        views.set(url, view);
        viewQueue.push(url);
    }

    const browserViews = mainWindow.getBrowserViews();
    if (browserViews.length > 0) {
        browserViews.forEach(browserView => {
            mainWindow.removeBrowserView(browserView)
        })
    }

    mainWindow.addBrowserView(view);

    //this is all hacks just to get zoomfactor to update correctly 🙄
    mainWindow.webContents.zoomFactor = mainWindow.webContents.zoomFactor + 0;
    view.webContents.zoomFactor = mainWindow.webContents.zoomFactor;
    const mainBounds = mainWindow.getBounds();
    mainWindow.setBounds({
        ...mainBounds,
        width: mainBounds.width + 1,
        height: mainBounds.height + 1
    });
    mainWindow.setBounds(mainBounds);

    setTimeout(() => {
        setViewBounds(view, mainWindow, data);
        updateZoomLevels(mainWindow);
    }, 10);

    return { success: true }
}

function setViewBounds(view: BrowserView, mainWindow: BrowserWindow, { bounds }: ViewData) {
    const { x, y, width, height } = bounds;
    const mainZoom = mainWindow.webContents.zoomFactor;
    const zoom = mainZoom;
    
    isDev && console.log({ zoom, bounds })
    view.setBounds({
        x: Math.round(x * zoom),
        y: Math.round(y * zoom),
        width: Math.round(width * zoom),
        height: Math.round(height * zoom)
    })
}

async function updateViewBounds(data: ViewData, mainWindow: BrowserWindow) {
    const view = views.get(data.url)
    if (view) {
        setViewBounds(view, mainWindow, data);
        updateZoomLevels(mainWindow)
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

function installUpdates(bgWindow: BrowserWindow) {
    if (!isDev) {
        bgWindow.close();
        autoUpdater.quitAndInstall();
    } else {
        console.log('quitting')
        bgWindow.close();
        app.quit();
    }
}

function prompt(event: IpcMainInvokeEvent, args: any) {
    promptResponse = null;

    let promptWindow = new BrowserWindow({
        width: 400,
        height: 144,
        show: false,
        resizable: false,
        movable: false,
        alwaysOnTop: true,
        frame: false,
        backgroundColor: nativeTheme.shouldUseDarkColors ? '#000000' : '#FFFFFF',
        webPreferences: {
            devTools: true,
            nodeIntegration: true
        }
    })

    promptWindow.loadURL(PROMPT_WEBPACK_ENTRY)
    promptWindow.moveTop()
    promptWindow.show()
    promptWindow.focus()
    promptWindow.on('closed', function() {
        event.returnValue = promptResponse
        promptWindow = null
    })

    // promptWindow.webContents.openDevTools();
    ipcMain.once('prompt-initialize', (event) => {
        event.returnValue = args;
    })
}

function respondToPrompt(event, arg) {
    if (arg === '') { 
        arg = null 
    }
    promptResponse = arg
}

let promptResponse;
export function start(mainWindow: BrowserWindow, createNewWindow, onNewWindow, bgWindow?: BrowserWindow): void {
    ipcMain.handle('quit', () => app.quit())
    ipcMain.handle('open-dialog', openDialog)
    ipcMain.handle('set-title', (event, args) => setTitle(mainWindow, event, args))
    ipcMain.handle('clear-data', () => clearData(mainWindow))
    ipcMain.handle('toggle-dev-tools', () => toggleDevTools(mainWindow, bgWindow))
    ipcMain.handle('create-view', (event, args) => createView(mainWindow, createNewWindow, onNewWindow, args))
    ipcMain.handle('update-view-bounds', (event, args) => updateViewBounds(args, mainWindow))
    ipcMain.handle('remove-view', (event, args) => removeView(mainWindow, args))
    ipcMain.handle('install-updates', () => installUpdates(bgWindow))

    ipcMain.on('prompt', prompt)
    ipcMain.on('prompt-response', respondToPrompt)
}