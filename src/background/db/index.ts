import path from 'path';
import { AsyncNedb } from 'nedb-async'
import { remote } from 'electron';
import { BootMessage, Pier } from '../services/pier-service';
const userData = remote.app.getPath('userData');

console.log('db location:', userData)

export type Settings =
    | 'seen-grid-update-modal';

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