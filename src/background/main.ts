import db from './db'
import { HandlerEntry, HandlerMap } from './server/ipc';
import { init } from './server'
import { OSHandlers, OSService } from './services/os-service';
import { PierHandlers, PierService } from './services/pier-service';

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

    // addHandlers(handlerMap, [
    //     { name: 'init', handler: async () => await projectService.init() }
    // ])
    init(handlerMap);

    console.log('initializing background process')
}

start();