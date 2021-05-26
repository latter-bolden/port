import { app, remote } from "electron";
import path from "path";
import { Pier, PierService } from "../services/pier-service";
import fs from 'fs-extra';
import { each, whilst } from 'async';
import { send } from "../server/ipc";

const electronApp = app || remote.app;

function getMacPath(app: string) {
    const segments = electronApp.getPath('userData').split(path.sep);
    segments.pop();
    segments.push(app);

    return path.join(path.sep, ...segments);
}

async function getMigrationPath(suffix = '', old = true): Promise<string> {
    const app = old ? 'taisho' : electronApp.getName();
    let pierPath = getMacPath(app);

    if (suffix) {
        pierPath = path.join(pierPath, suffix)
    }

    return pierPath;
}

export async function portDBMigration(): Promise<void> {
    console.log('Attempting Port DB migration...')

    if (process.env.SNAP) {
        console.log('Snaps can\'t migrate the DB because of folder permissions')
        console.log('Manually migrate from ~/snap/taisho/current/.config/taisho/db')
        console.log('To ~/snap/port/current/.config/Port/db')
        return;
    }

    const oldDbPath = await getMigrationPath('db');
    const dbPath = await getMigrationPath('db', false)

    if (!(await fs.pathExists(oldDbPath))) {
        console.log('Taisho DB not found, migration unnecessary')
        return;
    }

    if (await fs.pathExists(dbPath)) {
        console.log('Port DB migration unnecessary')
        return;
    }
    
    console.log('Port DB not found, migrating')
    await fs.copy(oldDbPath, dbPath)
    console.log('Port DB migrated')
}

export async function portPierMigration(ps: PierService): Promise<void> {
    console.log('Attempting Port Pier migration...')

    if (process.env.SNAP) {
        send('piers-migrated');
        ps.migrationStatus = 'migrated';
        console.log('Snaps can\'t migrate piers because of folder permissions')
        console.log('Manually migrate from ~/snap/taisho/common/.config/taisho')
        console.log('To ~/snap/port/common/.config/Port')
        return;
    }

    const oldPierPath = await getMigrationPath('piers');
    const pierPath = await getMigrationPath('piers', false);
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
    
        await fs.copy(oldPierPath, pierPath)
    } catch (err) {
        console.error(err);
    }

    try {
        let count = piersToMigrate.length;
        await whilst(cb => cb(null, count > 0), async (iterate: any) => {
            await each(piersToMigrate, async pier => {
                if (await fs.pathExists(path.join(pierPath, pier.slug))) {
                    count--;
                    iterate(null, count);
                }
            })
        });
    } catch (err) {
        await new Promise((resolve) => {
            setTimeout(resolve, 60 * 1000);
        })
    }

    send('piers-migrated');
    ps.migrationStatus = 'migrated';
}