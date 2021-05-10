import { DB } from ".";
import { Pier } from "../services/pier-service";
import { each } from 'async'

type OldPier = {
    booted: boolean;
    running: boolean;
} & Omit<Pier, 'status'>

export async function migrate(db: DB): Promise<void> {
    const piers: (OldPier | Pier)[] = await db.piers.asyncFind({});
    const piersToMigrate = piers.filter(pier => {
        const keys = Object.keys(pier);
        return keys.includes('booted') || keys.includes('running');
    }) as OldPier[];

    if (piersToMigrate.length === 0) {
        console.log('Status migration unnecessary')
        return;
    }

    console.log('Running status migration on', piersToMigrate.length, 'ships.')

    return each(piersToMigrate, async pier => {
        let status = 'unbooted'
        if (pier.running) {
            status = 'running'
        } else if (pier.booted) {
            status = 'stopped'
        }

        const { booted, running, ...newPier } = pier;
        return await db.piers.asyncUpdate({ slug: pier.slug }, {
            ...newPier,
            status
        })
    });
}