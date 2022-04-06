import path from 'path';
import { AsyncNedb } from 'nedb-async'
import { BootMessage, Pier } from '../services/pier-service';
import { ipcRenderer } from 'electron';
const userData = ipcRenderer.sendSync('user-data-path');

console.log('db location:', userData)

export type Settings =
    | 'seen-grid-update-modal'
    | 'global-leap'
    | 'protocol-handling'
    | 'ship-name-in-title';

export interface SettingsDocument {
    name: Settings;
    value: string;
}

export interface DB {
    settings: AsyncNedb<SettingsDocument>;
    piers: AsyncNedb<Pier>;
    messageLog: AsyncNedb<BootMessage>;
}

export default {
    settings: new AsyncNedb<SettingsDocument>({ filename: path.join(userData, 'db', 'settings.db'), autoload: true }),
    piers: new AsyncNedb<Pier>({ filename: path.join(userData, 'db', 'piers.db'), autoload: true }),
    messageLog: new AsyncNedb<BootMessage>({ filename: path.join(userData, 'db', 'message-log.db'), autoload: true })
}