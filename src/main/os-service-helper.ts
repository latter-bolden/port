import { BrowserWindow, dialog, ipcMain, IpcMainEvent } from 'electron'

async function openDialog(event: IpcMainEvent, options: Electron.OpenDialogOptions) {
    const result = await dialog.showOpenDialog({
        title: 'Select a Directory',
        properties: ['openDirectory', 'createDirectory'],
        ...options
    });

    event.returnValue = result
}

async function setTitle(window: BrowserWindow, event:IpcMainEvent, title: string) {
    window.setTitle(title)

    event.returnValue = title
}

export function start(mainWindow: BrowserWindow): void {
    ipcMain.on('open-dialog', openDialog)
    ipcMain.on('set-title', (event, args) => {
        setTitle(mainWindow, event, args);
    })
}