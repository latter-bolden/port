import { BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent } from 'electron'

async function openDialog(event: IpcMainInvokeEvent, options: Electron.OpenDialogOptions) {
    return await dialog.showOpenDialog({
        title: 'Select a Directory',
        properties: ['openDirectory', 'createDirectory'],
        ...options
    });
}

function setTitle(window: BrowserWindow, event: IpcMainInvokeEvent, title: string) {
    window.setTitle(title)
    return title;
}

async function clearData(window: BrowserWindow) {
    const session = window.webContents.session;
    //possibly clear everything not sure what's the issue
    //await session.clearAuthCache()
    await session.clearCache()
    await session.clearStorageData()
    //await session.clearHostResolverCache()
}

async function toggleDevTools(mainWindow: BrowserWindow, bgWindow?: BrowserWindow) {
    mainWindow.webContents.toggleDevTools()
    bgWindow && bgWindow.webContents.toggleDevTools()
}

export function start(mainWindow: BrowserWindow, bgWindow?: BrowserWindow): void {
    ipcMain.handle('open-dialog', openDialog)
    ipcMain.handle('set-title', (event, args) => setTitle(mainWindow, event, args))
    ipcMain.handle('clear-data', () => clearData(mainWindow))
    ipcMain.handle('toggle-dev-tools', () => toggleDevTools(mainWindow, bgWindow))
}