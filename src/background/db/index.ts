import path from 'path';
import { AsyncNedb } from 'nedb-async'
import { remote } from 'electron';
import { BootMessage, LandscapeSession, Pier } from '../services/pier-service';
const userData = remote.app.getPath('userData');

console.log('db location:', userData)

export interface SettingsDocument {
    name: string;
    value: string;
}

export interface DB {
    settings: AsyncNedb<SettingsDocument>;
    piers: AsyncNedb<Pier>;
    messageLog: AsyncNedb<BootMessage>;
    sessions: AsyncNedb<LandscapeSession>;
}

export default {
    settings: new AsyncNedb<SettingsDocument>({ filename: path.join(userData, 'db', 'settings.db'), autoload: true }),
    piers: new AsyncNedb<Pier>({ filename: path.join(userData, 'db', 'piers.db'), autoload: true }),
    messageLog: new AsyncNedb<BootMessage>({ filename: path.join(userData, 'db', 'message-log.db'), autoload: true }),
    sessions: new AsyncNedb<BootMessage>({ filename: path.join(userData, 'db', 'sessions.db'), autoload: true })
}