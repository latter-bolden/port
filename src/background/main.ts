import db from './db'
import { HandlerEntry, HandlerMap, init } from './server/ipc';
import { OSHandlers, OSService } from './services/os-service';
import { PierHandlers, PierService } from './services/pier-service';
import { ipcRenderer } from 'electron';
import { migrate } from './db/status-migration';

export type Handlers = OSHandlers & PierHandlers//& { init: () => Promise<PierData> };

function addHandlers(handlerMap: HandlerMap<Handlers>, handlers: HandlerEntry<Handlers>[]): void {
    for (const entry of handlers) {
        handlerMap[entry.name] = entry.handler;

        console.log('adding handler:', entry.name);
    }
}

async function start() {
    const handlerMap: HandlerMap<Handlers> = {} as HandlerMap<Handlers>;
    const osService = new OSService();
    const pierService = new PierService(db);

    addHandlers(handlerMap, osService.handlers());
    addHandlers(handlerMap, pierService.handlers());

    ipcRenderer.on('set-socket', (event, { name }) => {
      console.log('received socket set', name)
      init(name, handlerMap)
    })

    pierService.setPierDirectory();

    console.log('initializing background process')
    console.log('Attempting status migration...')
    await migrate(db)
}

start();