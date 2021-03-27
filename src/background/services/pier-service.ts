import { join as joinPath } from 'path';
import { spawn } from 'child_process';
import { shell, remote } from 'electron';
import axios from 'axios'
import { DB } from '../db'
import { HandlerEntry, send } from '../server/ipc'; 
import { getPlatform, getPlatformPathSegments} from '../../get-platform';
import { rootPath as root } from 'electron-root-path';
import appRootDir from 'app-root-dir'
import find from 'find-process';
import { unlink, rmdir, exists } from 'fs'
import { promisify } from 'util'
import ADMZip from 'adm-zip'
import mv from 'mv'
import { format } from 'date-fns';

const IS_PROD = process.env.NODE_ENV === 'production';
const platform = getPlatform();

const asyncRm = promisify(unlink);
const asyncRmdir = promisify(rmdir);
const asyncExists = promisify(exists);

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
    'collect-existing-pier': PierService["collectExistingPier"]
    'boot-pier': PierService["bootPier"]
    'resume-pier': PierService["resumePier"]
    'check-pier': PierService["checkPier"]
    'stop-pier': PierService["stopPier"]
    'delete-pier': PierService["deletePier"]
    'eject-pier': PierService["ejectPier"]
}

export class PierService {
    private readonly db: DB;
    private readonly urbitPath: string;
    private pierDirectory: string;

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
            { name: 'collect-existing-pier', handler: this.collectExistingPier.bind(this) },
            { name: 'boot-pier', handler: this.bootPier.bind(this) },
            { name: 'resume-pier', handler: this.resumePier.bind(this) },
            { name: 'check-pier', handler: this.checkPier.bind(this) },
            { name: 'stop-pier', handler: this.stopPier.bind(this) },
            { name: 'delete-pier', handler: this.deletePier.bind(this) },
            { name: 'eject-pier', handler: this.ejectPier.bind(this) }
        ]
    }
    
    async setPierDirectory(): Promise<void> {
        const pierDirectory = await this.db.settings.asyncFindOne({ name: 'pier-directory' })
        this.pierDirectory = pierDirectory?.value || joinPath(remote.app.getPath('userData'), 'piers')
    }

    async addPier(data: AddPier): Promise<Pier | null> {
        return await this.db.piers.asyncInsert({
            directory: this.pierDirectory,
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
            return accuratePier

        const ports = await this.spawnUrbit(this.getSpawnArgs(accuratePier))
        const updatedPier = {
            ...accuratePier,
            webPort: ports.web,
            loopbackPort: ports.loopback,
            running: true
        }
        
        await this.db.piers.asyncUpdate({ slug: pier.slug }, updatedPier)

        return updatedPier;
    }

    async collectExistingPier(data: AddPier): Promise<Pier> {
        const pier = await this.addPier(data);
        await new Promise((resolve, reject) => {
            mv(data.directory, joinPath(this.pierDirectory, pier.slug), { mkdirp: true }, (error) => {
                if (error) {
                    return reject(error)
                }

                return resolve(true)
            })
        })

        return await this.updatePier({ 
            ...pier, 
            booted: true,
            directory: this.pierDirectory 
        });
    }

    async bootPier(slug: string): Promise<Pier | null> {
        const pier = await this.getPier(slug);

        if (!pier || pier.booted)
            return null;

        const ports = await this.spawnUrbit(this.getSpawnArgs(pier))
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
        
        if (pier.keyFile) {
            await asyncRm(pier.keyFile)
        }
        
        return updatedPier;
    }

    async stopPier(pier: Pier): Promise<Pier> {
        const updatedPier = await this.checkPier(pier);

        if (!updatedPier.running) {
            return updatedPier;
        }

        await this.stopUrbit(updatedPier.loopbackPort, updatedPier.shipName);

        return await this.updatePier({ ...updatedPier, running: false });
    }

    async ejectPier(pier: Pier): Promise<void> {
        const pierPath = joinPath(pier.directory, pier.slug);
        const zip = new ADMZip()

        zip.addLocalFolder(pierPath, pier.slug)
        zip.writeZip(`${pierPath}.zip`)
        asyncRmdir(pierPath, { recursive: true })

        await this.db.piers.asyncRemove({ slug: pier.slug })

        shell.openPath(pier.directory)
    }

    async deletePier(pier: Pier): Promise<void> {
        const pierPath = joinPath(pier.directory, pier.slug);

        if (pier.type !== 'remote' && await asyncExists(pierPath)) {
            asyncRmdir(pierPath, { recursive: true })
        }

        await this.db.piers.asyncRemove({ slug: pier.slug })  
    }

    private async stopUrbit(loopbackPort: number, shipName: string): Promise<void> {
        const processes = await find('port', loopbackPort)
        const check = await this.dojo(`http://localhost:${loopbackPort}`, 'our')

        processes.forEach(async proc => {
            if (check && check === shipName && proc.name.includes('urbit')) {
                process.kill(proc.pid, 'SIGTSTP')
            }
        })
    }

    private getSpawnArgs(pier: Pier): string[] {
        let args = ['-t']
        const pierPath = joinPath(pier.directory, pier.slug);
        const unbooted = !pier.booted;

        if (pier.type === 'comet' && unbooted) {
            args.push('-c')
        } else if ((pier.type === 'moon' || pier.type === 'planet') && unbooted) {
            args = args.concat([
                '-w',
                pier.shipName,
                '-k',
                pier.keyFile,
                '-c'
            ])
        }

        args.push(pierPath)
        return args;
    }

    private spawnUrbit(args: string[]): Promise<{ loopback: number, web: number } | null> {
        const urbit = spawn(this.urbitPath, args);
        const webPattern = /http:\s+web interface live on http:\/\/localhost:(\d+)/
        const loopbackPattern = /http:\s+loopback live on http:\/\/localhost:(\d+)/
        const messages = [];
        let web, loopback;

        console.log('spawning urbit with ', ...args)

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

            urbit.stderr.on('data', (data) => {
                console.error(data.toString())
                messages.push({
                    type: 'error',
                    text: this.formatBootLog(data)
                })
                
                send('boot-log', messages)
            })

            urbit.stdout.on('data', (data) => {
                const line = data.toString() 
                console.log(line)

                messages.push({
                    type: 'out',
                    text: this.formatBootLog(data)
                })
                
                send('boot-log', messages)

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

    private formatBootLog(data: any) {
        return `${format(new Date(), 'HH:mm:ss')} ${data.toString()}`
    }
}

type PierType = 'comet' | 'moon' | 'planet' |  'remote';

export interface Pier {
    _id?: string;
    name: string;
    slug: string;
    type: PierType;
    directory: string;
    lastUsed: string;
    booted: boolean;
    running: boolean;
    default: boolean;
    shipName?: string;
    keyFile?: string;
    webPort?: number;
    loopbackPort?: number;
}

export type AddPier = Pick<Pier, 'name' | 'type' | 'default' | 'shipName' | 'keyFile'> & {
    directory?: string;
}

export interface PierAuth {
    username: string;
    code: string;
}

export interface BootMessage {
    type: 'out' | 'error';
    text: string;
}

export function pierSlugify(name: string): string {
    return name.replace(/\s+/ig, '-').toLocaleLowerCase();
}