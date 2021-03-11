import { join as joinPath } from 'path';
import { spawn } from 'child_process';
import axios from 'axios'
import { DB } from '../db'
import { HandlerEntry } from '../server/ipc';
import { getPlatform, getPlatformPathSegments} from '../../get-platform';
import { rootPath as root } from 'electron-root-path';
import appRootDir from 'app-root-dir'
import find from 'find-process';
import fs from 'fs'

const IS_PROD = process.env.NODE_ENV === 'production';
const platform = getPlatform();

const binariesPath =
  IS_PROD // the path to a bundled electron app.
    ? joinPath(root, ...getPlatformPathSegments(platform), 'resources', platform)
    : joinPath(appRootDir.get(), 'resources', platform);

console.log({ root, IS_PROD, binariesPath })

export interface PierHandlers {
    'add-pier': PierService["addPier"]
    'get-pier': PierService["getPier"]
    'get-piers': PierService["getPiers"]
    'get-pier-auth': PierService["getPierAuth"]
    'boot-pier': PierService["bootPier"]
    'resume-pier': PierService["resumePier"]
    'check-pier': PierService["checkPier"]
    'stop-pier': PierService["stopPier"]
    'delete-pier': PierService["deletePier"]
}

export class PierService {
    private readonly db: DB;
    private readonly urbitPath: string;

    constructor(db: DB) {
        this.db = db;
        this.urbitPath = joinPath(binariesPath, 'urbit');
    }

    handlers(): HandlerEntry<PierHandlers>[] {
        return [
            { name: 'add-pier', handler: this.addPier.bind(this) },
            { name: 'get-pier', handler: this.getPier.bind(this) },
            { name: 'get-piers', handler: this.getPiers.bind(this) },
            { name: 'get-pier-auth', handler: this.getPierAuth.bind(this) },
            { name: 'boot-pier', handler: this.bootPier.bind(this) },
            { name: 'resume-pier', handler: this.resumePier.bind(this) },
            { name: 'check-pier', handler: this.checkPier.bind(this) },
            { name: 'stop-pier', handler: this.stopPier.bind(this) },
            { name: 'delete-pier', handler: this.deletePier.bind(this) }
        ]
    }

    async addPier(data: AddPier): Promise<Pier | null> {
        return await this.db.piers.asyncInsert({
            slug: pierSlugify(data.name),
            lastUsed: (new Date()).toISOString(),
            running: false,
            booted: false,
            ...data,
        })
    }

    async getPier(slug: string): Promise<Pier | null> {
        return await this.db.piers.asyncFindOne({ slug })
    }
    
    async getPiers(): Promise<Pier[] | null> {
        return await this.db.piers.asyncFind({})
    }

    async updatePier(newPier: Pier): Promise<Pier> {
        await this.db.piers.asyncUpdate({ slug: newPier.slug }, newPier)
        return newPier;
    }

    async getPierAuth(pier: Pier): Promise<PierAuth> {
        const loopback = `http://localhost:${pier.loopbackPort}`
        const username = await this.dojo(loopback, 'our');
        const code = await this.dojo(loopback, '+code');

        await this.db.piers.asyncUpdate({ slug: pier.slug }, {
            ...pier,
            shipName: username
        })

        return {
            username,
            code
        }
    }

    async dojo(url: string, command: string): Promise<string> {
        const res = await axios.post(url, {
            sink: {
                stdout: null
            },
            source: {
                dojo: command
            }
        })
    
        return await res.data
    }

    async checkPier(pier: Pier): Promise<Pier> {
        const loopback = `http://localhost:${pier.loopbackPort}`

        if (pier.type === 'remote')
            return pier

        try {
            const check = await this.dojo(loopback, 'our')
            if (check && pier.running && check === pier.shipName) {
                return pier
            }

            return await this.updatePier({ ...pier, running: false });
        } catch (err) {
            return await this.updatePier({ ...pier, running: false });
        }
    }

    async resumePier(pier: Pier): Promise<Pier | null> {
        const accuratePier = await this.checkPier(pier)
        if (accuratePier.running)
            return accuratePier;

        const ports = await this.spawnUrbit(accuratePier.slug, accuratePier.directory, false)
        const updatedPier = {
            ...accuratePier,
            webPort: ports.web,
            loopbackPort: ports.loopback,
            running: true
        }
        
        await this.db.piers.asyncUpdate({ slug: pier.slug }, updatedPier)

        return updatedPier;
    }

    async bootPier(slug: string): Promise<Pier | null> {
        const pier = await this.getPier(slug);

        if (!pier || pier.booted)
            return null;

        if (pier.type === 'comet') {
            const ports = await this.spawnUrbit(pier.slug, pier.directory, true)
            //make sure OTAs start
            //this.dojo(`http://localhost:${ports.loopback}`, '|ota (sein:title our now our) %kids')
            const shipName = await this.dojo(`http://localhost:${ports.loopback}`, 'our')
            const updatedPier = {
                ...pier,
                shipName,
                webPort: ports.web,
                loopbackPort: ports.loopback,
                running: true,
                booted: true
            }
            
            await this.db.piers.asyncUpdate({ slug: pier.slug }, updatedPier, {})

            return updatedPier;
        }

        return null
    }

    async stopPier(pier: Pier): Promise<Pier> {
        const updatedPier = await this.checkPier(pier);

        if (!updatedPier.running) {
            return updatedPier;
        }

        await this.stopUrbit(updatedPier.loopbackPort, updatedPier.shipName);

        return await this.updatePier({ ...updatedPier, running: false });
    }

    async deletePier(pier: Pier): Promise<void> {
        if (pier.type !== 'remote' && fs.existsSync(pier.directory)) {
            fs.rmdirSync(pier.directory, { recursive: true })
        }

        await this.db.piers.asyncRemove({ slug: pier.slug })  
    }

    private async stopUrbit(loopbackPort: number, shipName: string): Promise<void> {
        const processes = await find('port', loopbackPort)
        const check = await this.dojo(`http://localhost:${loopbackPort}`, 'our')

        processes.forEach(async proc => {
            if (check && check === shipName && proc.name.includes('urbit')) {
                process.kill(proc.pid)
            }
        })
    }

    private spawnUrbit(pierSlug: string, pierPath: string, isNew: boolean): Promise<{ loopback: number, web: number } | null> {
        const flags = `-t${isNew ? 'c' : ''}`
        const urbit = spawn(this.urbitPath, [flags, pierSlug], { cwd: pierPath });
        const webPattern = /http:\s+web interface live on http:\/\/localhost:(\d+)/
        const loopbackPattern = /http:\s+loopback live on http:\/\/localhost:(\d+)/
        let web, loopback;

        console.log('spawning', pierSlug, 'with flags', flags)

        return new Promise((resolve, reject) => {
            urbit.on('close', (code) => {
                if (code !== 0) {
                    console.error(`Exited with code ${code}`)
                    reject(code.toString())
                }
            })

            urbit.on('error', (err) => {
                console.error(err)
                reject(err)
            })

            urbit.stderr.on('data', (data) => console.error(data.toString()))

            urbit.stdout.on('data', (data) => {
                const line = data.toString() 
                console.log(line)

                const webMatch = line.match(webPattern)
                if (webMatch) {
                    web = webMatch[1]
                }

                const loopbackMatch = line.match(loopbackPattern)
                if (loopbackMatch) {
                    loopback = loopbackMatch[1]

                    resolve({
                        web,
                        loopback
                    })
                }
            })
        })
    }
}

type PierType = 'comet' | 'planet' |  'remote';

export interface Pier {
    name: string;
    slug: string;
    type: PierType;
    directory: string;
    lastUsed: string;
    booted: boolean;
    running: boolean;
    default: boolean;
    shipName?: string;
    webPort?: number;
    loopbackPort?: number;
}

export type AddPier = Pick<Pier, 'name' | 'type' | 'directory' | 'default'>

export interface PierAuth {
    username: string;
    code: string;
}

export function pierSlugify(name: string): string {
    return name.replace(/\s+/ig, '-').toLocaleLowerCase();
}