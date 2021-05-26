import { app, remote } from "electron";
import path from "path";
import { Pier, PierService } from "../services/pier-service";
import { access, copy } from 'fs-extra';
import { promisify } from 'util'
import { each, whilst } from 'async';
import { send } from "../server/ipc";

const electronApp = app || remote.app;

const asyncAccess = promisify(access);

function getLinuxPath(app: string) {
    const segments = process.env.SNAP_USER_COMMON.split(path.sep);
    const common = segments.pop();
    segments.pop();

    return path.join(path.sep, ...segments, app, common, '.config', electronApp.getName());
}

function getMacPath(app: string) {
    const segments = electronApp.getPath('userData').split(path.sep);
    segments.pop();
    segments.push(app);

    return path.join(path.sep, ...segments);
}

function getMigrationPath(suffix = '', old = true, common = false): string {
    const app = old ? 'taisho' : electronApp.getName();
    let pierPath = getMacPath(app);
    
    if (common && process.platform === 'linux' && process.env.SNAP) {
        return getLinuxPath(app);
    }

    if (old && process.platform === 'linux' && process.env.SNAP) {
        pierPath = path.join('~', 'snap', 'current', 'taisho', '.config', 'taisho');
    }

    if (suffix) {
        pierPath = path.join(pierPath, suffix)
    }

    return pierPath;
}

export async function portDBMigration(): Promise<void> {
    console.log('Attempting Port DB migration...')

    const oldDbPath = getMigrationPath('db');
    const dbPath = getMigrationPath('db', false)
    
    try {
        await asyncAccess(oldDbPath);
    } catch (err) {
        console.log('Taisho DB not found, migration unnecessary')
        return;
    }

    try {
        await asyncAccess(dbPath)
        console.log('Port DB migration unnecessary')
        return;
    } catch (err) {
        console.log('Port DB not found, migrating')
    }

    await copy(oldDbPath, dbPath)
    console.log('Port DB migrated')
}

export async function portPierMigration(ps: PierService): Promise<void> {
    console.log('Attempting Port Pier migration...')

    const oldPierPath = getMigrationPath('piers', true, true);
    const pierPath = getMigrationPath('piers', false, true);
    const piers: Pier[] = await ps.getPiers()
    const piersToMigrate = piers.filter(pier => pier.directory.startsWith(oldPierPath));

    if (piersToMigrate.length === 0 || process.platform === 'linux' && process.env.SNAP) {
        console.log('Port pier migration unnecessary')
        send('piers-migrated');
        ps.migrationStatus = 'migrated';
        return;
    }

    try {
        await each(piersToMigrate, async pier => {
            await ps.stopPier(pier)
            await ps.updatePier({ ...pier, directory: pierPath })
        });
    
        await copy(oldPierPath, pierPath)
    } catch (err) {
        console.error(err);
    }

    let count = piersToMigrate.length;
    await whilst(cb => cb(null, count > 0), async (iterate: any) => {
        await each(piersToMigrate, async pier => {
            try {
                await asyncAccess(path.join(pierPath, pier.slug))
                count--;
                iterate(null, count);
            } catch (err) {
                //dont care about error
            }
        })
    });

    send('piers-migrated');
    ps.migrationStatus = 'migrated';
}