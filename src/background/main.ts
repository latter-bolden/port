import db from './db';
import { platform, arch } from 'os';
import { Handler, HandlerEntry, HandlerMap, init } from './server/ipc';
import { OSHandlers, OSService } from './services/os-service';
import { PierHandlers, PierService } from './services/pier-service';
import { ipcRenderer } from 'electron';
import { SettingsHandlers, SettingsService } from './services/settings-service';
import { TerminalHandlers, TerminalService } from './services/terminal-service';

start();

export type Handlers = 
    & OSHandlers 
    & PierHandlers 
    & SettingsHandlers 
    & TerminalHandlers
    & { 
        connected: Handler,
        disconnected: Handler
    }

async function start() {
    const handlerMap: HandlerMap<Handlers> = {} as HandlerMap<Handlers>;
    const osService = new OSService();
    const pierService = new PierService(db);
    const settingsService = new SettingsService(db);
    const terminalService = new TerminalService();

    addHandlers(handlerMap, osService.handlers());
    addHandlers(handlerMap, pierService.handlers());
    addHandlers(handlerMap, settingsService.handlers());
    addHandlers(handlerMap, terminalService.handlers());

    ipcRenderer.on('set-socket', (event, { name }) => {
      console.log('received socket set', name)
      init(name, handlerMap)

      architectureSupportCheck();
    })

    pierService.setPierDirectory();

    console.log('initializing background process')
}

function addHandlers(handlerMap: HandlerMap<Handlers>, handlers: HandlerEntry<Handlers>[]): void {
    for (const entry of handlers) {
        handlerMap[entry.name] = entry.handler;

        console.log('adding handler:', entry.name);
    }
}

async function architectureSupportCheck() {
    const osPlatform = platform();
    const osArch = arch();
    
    try {
        console.log('architecture supported')
    } catch (err) {
        console.log('Unable to detect unsupported architecture');
        console.error(err);
    }
}