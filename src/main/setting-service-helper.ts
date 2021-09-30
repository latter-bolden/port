import { BrowserWindow, globalShortcut, ipcMain } from 'electron';
import { Settings } from '../background/db';
import { leap } from './helpers';
import { createMenu } from './menu';

function registerShortcuts(settings: Record<Settings, string>, mainWindow: BrowserWindow) {
  if (settings['global-leap'] === 'true') {
    globalShortcut.register('CommandOrControl+/', () => leap(mainWindow))
  } else {
    globalShortcut.unregister('CommandOrControl+/')
  }
}

export function start(mainWindow: BrowserWindow, menuOptions): void {
  ipcMain.handle('update-settings', (event, settings: Record<Settings, string>) => {
    registerShortcuts(settings, mainWindow);
    createMenu({...menuOptions, settings });
  })
}