import { exec } from 'child_process';
import db from './db';
import { platform, arch } from 'os';
import { Handler, HandlerEntry, HandlerMap, init, send } from './server/ipc';
import { OSHandlers, OSService } from './services/os-service';
import { PierHandlers, PierService } from './services/pier-service';
import { ipcRenderer } from 'electron';
import { migrate as statusMigration } from './migrations/status-migration';
import { portPierMigration } from './migrations/port-migration';

start();

export type Handlers = OSHandlers & PierHandlers & { connected: Handler }//& { init: () => Promise<PierData> };

async function start() {
    const handlerMap: HandlerMap<Handlers> = {} as HandlerMap<Handlers>;
    const osService = new OSService();
    const pierService = new PierService(db);

    addHandlers(handlerMap, osService.handlers());
    addHandlers(handlerMap, pierService.handlers());

    ipcRenderer.on('set-socket', (event, { name }) => {
      console.log('received socket set', name)
      init(name, handlerMap)

      statusMigration(db)
      portPierMigration(pierService);
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
        if (osPlatform === 'darwin') {
            const sysctlCheck = await new Promise((resolve) => {
                exec('sysctl sysctl.proc_translated', (error, stdout, stderr) => {
                    if (error || stderr) {
                        resolve(false);
                    }

                    resolve(!stdout.includes('unknown'));
                })
            });

            const archCheck = await new Promise((resolve) => {
                exec('arch', (error, stdout, stderr) => {
                    resolve(stdout.includes('arm64'))
                })
            })

            if (osArch === 'arm64' || archCheck || sysctlCheck) {
                await send('arch-unsupported', osPlatform + '-' + osArch);
            }
        }
    } catch (err) {
        console.log('Unable to detect unsupported architecture');
        console.error(err);
    }
}