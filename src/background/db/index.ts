import { AsyncNedb } from 'nedb-async'
import { remote } from 'electron';
import { Pier } from '../services/pier-service';
const userData = remote.app.getPath('userData');

console.log('db location:', userData)

export interface SettingsDocument {
    name: string;
    value: string;
}

export interface DB {
    settings: AsyncNedb<SettingsDocument>;
    piers: AsyncNedb<Pier>;
}

const settings = new AsyncNedb<SettingsDocument>({ filename: userData + '/db/settings.db', autoload: true })
const piers = new AsyncNedb<Pier>({ filename: userData + '/db/piers.db', autoload: true })

export default {
    settings,
    piers
}