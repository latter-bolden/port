import { app, BrowserWindow, ipcMain } from "electron";

export class Cleanup {
    finished: boolean;
    started: boolean;
    private mainWindow: BrowserWindow;
    private bgWindow: BrowserWindow;

    constructor() {
        this.started = false;
        this.finished = false;
    }

    setWindows(main: BrowserWindow, bg: BrowserWindow) {
        this.mainWindow = main;
        this.bgWindow = bg;
    }

    handleEvent(e: Electron.Event): boolean {
        if (this.finished)
            return true;

        e.preventDefault();
        if (this.started)
            return false;

        this.started = true;
        try {
            // acknowledge cleanup in UI
            this.mainWindow.webContents.send('cleanup');
            const allWindows = BrowserWindow.getAllWindows();
            allWindows.forEach(window => {
                if (window !== this.mainWindow && window !== this.bgWindow && !window.isDestroyed()) {
                    window.destroy();
                }
            })
            this.mainWindow.focus();
            
            // clean up background
            this.bgWindow.webContents.send('cleanup')
            ipcMain.on('cleanup-done', (e) => {
                this.bgWindow.destroy();
                this.mainWindow.destroy();
                this.finished = true;
                console.log('Cleanup complete.');
                app.quit();
            })
        } catch (err) {
            console.log('Cleanup failed.')
            console.error(err.message)
            return true; // despite failing, we shouldn't require the user to force quit
        }

        return false;
    }
}