import path from 'path';
import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron';
import { getPlatform } from '../get-platform';
import { Settings } from '../background/db';
import { leap, URBIT_PROTOCOL } from './helpers';
import { createMenu, MenuOptions } from './menu';

function registerShortcuts(settings: Record<Settings, string>, mainWindow: BrowserWindow) {
  const hasView = mainWindow.getBrowserViews()?.length > 0;
  
  if (settings['global-leap'] === 'true' && hasView) {
    globalShortcut.register('CommandOrControl+/', () => leap(mainWindow))
  } else {
    globalShortcut.unregister('CommandOrControl+/')
  }
}

function registerProtocolHandler(settings: Record<Settings, string>) {
  const updateHandling = settings['protocol-handling'] === 'true' ? app.setAsDefaultProtocolClient : app.removeAsDefaultProtocolClient;

    if (getPlatform() === 'mac') {
      updateHandling(URBIT_PROTOCOL);
    } else {
      const args = process.argv[1] ? [path.resolve(process.argv[1])] : [];
      updateHandling(URBIT_PROTOCOL, process.execPath, args);
    } 
}

interface SettingsServiceHelperParams {
  mainWindow: BrowserWindow;
  menuOptions: MenuOptions;
}

export function start({ mainWindow, menuOptions }: SettingsServiceHelperParams): void {
  ipcMain.handle('update-settings', (event, settings: Record<Settings, string>) => {
    registerShortcuts(settings, mainWindow);
    registerProtocolHandler(settings)
    createMenu({...menuOptions, settings });
  })
}