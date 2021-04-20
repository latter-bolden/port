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
import { unlink, mkdir, rmdir, access, readFile } from 'fs'
import { promisify } from 'util'
import ADMZip from 'adm-zip'
import mv from 'mv'
import { format } from 'date-fns';

const IS_PROD = process.env.NODE_ENV === 'production';
const platform = getPlatform();

const asyncRm = promisify(unlink);
const asyncRmdir = promisify(rmdir);
const asyncAccess = promisify(access);
const asyncRead = promisify(readFile);
const asyncMkdir = promisify(mkdir);

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
    'generate-moon': PierService["generateMoon"]
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
            { name: 'generate-moon', handler: this.generateMoon.bind(this) },
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

        try {
            await asyncAccess(this.pierDirectory)
            return;
        } catch {
            console.log('Pier directory missing, creating...')
        }

        try {
            await asyncMkdir(this.pierDirectory, { recursive: true })
        } catch (err) {
            console.log('Error creating piers directory:', err, 'Reverting to userData folder')
            this.pierDirectory = remote.app.getPath('userData')
        }
    }

    async addPier(data: AddPier): Promise<Pier | null> {
        return await this.db.piers.asyncInsert({
            directory: this.pierDirectory,
            slug: pierSlugify(data.name),
            lastUsed: (new Date()).toISOString(),
            running: false,
            booted: false,
            default: false,
            ...data,
        })
    }

    async getPier(slug: string): Promise<Pier | null> {
        return await this.db.piers.asyncFindOne({ slug })
    }
    
    async getPiers(query: Partial<Pier>): Promise<Pier[] | null> {
        return await this.db.piers.asyncFind(query || {})
    }

    async updatePier(newPier: Pier): Promise<Pier> {
        await this.db.piers.asyncUpdate({ slug: newPier.slug }, {
            lastUsed: (new Date()).toISOString(),
            ...newPier
        })
        return newPier;
    }

    async getPierAuth(pier: Pier): Promise<PierAuth> {
        const loopback = `http://localhost:${pier.loopbackPort}`
        const username = await this.dojo(loopback, 'our');
        const code = await this.dojo(loopback, '+code');

        await this.updatePier({
            ...pier,
            shipName: username
        })

        return {
            username,
            code
        }
    }

    async dojo(url: string, command: string | Record<string, unknown>): Promise<string> {
        const req = typeof command === 'object' ? command : {
            sink: {
                stdout: null
            },
            source: {
                dojo: command
            }
        };

        const res = await axios.post(url, req);
        return await res.data
    }

    async checkPier(pier: Pier): Promise<Pier> {
        if (pier.type === 'remote')
            return pier

        const update = (updates) => this.updatePier({ ...pier, ...updates });

        try {
            const dojoCheck = await this.runningCheck(pier);

            if (dojoCheck) {
                return await update({ ...dojoCheck, running: true });
            }

            return await update({ running: false });
        } catch (err) {
            return await update({ running: false });
        }
    }

    private async runningCheck(pier: Pier): Promise<{ loopbackPort: number, webPort: number } | null> {
        const ports = await this.portRunningCheck(pier);
        if (!ports || !ports.webPort || !ports.loopbackPort || !pier.shipName) {
            return null;
        }

        try {
            const loopback = `http://localhost:${ports.loopbackPort}`
            const check = await this.dojo(loopback, 'our')

            if (check && check === pier.shipName) {
                return ports
            }

            return null
        } catch (err) {
            console.error(err)
            return null;
        }
    }

    private async portRunningCheck(pier: Pier): Promise<{ loopbackPort: number, webPort: number } | null> {
        const portPath = joinPath(pier.directory, pier.slug, '.http.ports');

        try {
            await asyncAccess(portPath)
        } catch {
            return null
        }

        const portFile = (await asyncRead(portPath)).toString()
        const loopback = portFile.match(/(\d+).*loopback/)
        const web = portFile.match(/(\d+).*public/)

        if (!loopback || !web || !loopback[1] || !web[1]) {
            throw new Error('Issue with read .http.ports file')
        }

        return {
            loopbackPort: parseInt(loopback[1]),
            webPort: parseInt(web[1])
        }
    }

    async resumePier(pier: Pier): Promise<Pier | null> {
        const accuratePier = await this.checkPier(pier)
        if (accuratePier.running)
            return accuratePier

        const ports = await this.spawnUrbit(this.getSpawnArgs(accuratePier), accuratePier.slug)
        const updatedPier: Pier = {
            ...accuratePier,
            webPort: ports.web,
            loopbackPort: ports.loopback,
            running: true
        }

        return await this.updatePier(updatedPier);
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

    async generateMoon(data: NewMoon): Promise<Pier> {
        const pier = await this.getPier(data.planet)
        const planet = await this.stopPier(pier)
        const loopback = `http://localhost:${planet.loopbackPort}`

        const cmd = data.shipName ? `|moon ${data.shipName}` : '|moon'
        // const response = await this.dojo(loopback, cmd)
        const responses = await this.runDojo(this.getSpawnArgs(planet, true), cmd)
        await this.stopPier(planet)

        const lines = responses[responses.length-1].split(/\r?\n/)
        const shipMatch = lines[0]?.match(/moon:\s*([~\w-]+)/g)
        const shipName = shipMatch ? shipMatch[1] : undefined
        const keyfile = lines[1]

        if (!shipName || !keyfile) {
            throw new Error('Unable to generate moon')
        }

        return await this.addPier({
            name: data.name,
            type: 'moon',
            directory: this.pierDirectory,
            keyFile: keyfile,
            shipName
        })
    }

    async bootPier(slug: string): Promise<Pier | null> {
        const pier = await this.getPier(slug);

        if (!pier)
            return null;

        const ports = await this.spawnUrbit(this.getSpawnArgs(pier), pier.slug)
        //make sure OTAs start
        //this.dojo(`http://localhost:${ports.loopback}`, '|ota (sein:title our now our) %kids')
        const shipName = await this.dojo(`http://localhost:${ports.loopback}`, 'our')
        const updatedPier = await this.updatePier({
            ...pier,
            shipName,
            webPort: ports.web,
            loopbackPort: ports.loopback,
            running: true,
            booted: true
        })
        
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
        let pierExists = true;

        try {
            await asyncAccess(pierPath)
        } catch {
            pierExists = false
        }

        if (pier.type !== 'remote' && pierExists) {
            asyncRmdir(pierPath, { recursive: true })
        }

        await this.db.piers.asyncRemove({ slug: pier.slug })  
    }

    private async stopUrbit(loopbackPort: number, shipName: string): Promise<void> {
        const url = `http://localhost:${loopbackPort}`
        const check = await this.dojo(url, 'our')

        if (check !== shipName) {
            return;
        }

        await this.dojo(url, {
            sink: {
                app: 'hood'
            },
            source: {
                dojo: '+hood/exit'
            }
        })
    }

    private getSpawnArgs(pier: Pier, interactive = false): string[] {
        let args = []
        const pierPath = joinPath(pier.directory, pier.slug);
        const unbooted = !pier.booted;

        if (!interactive) {
            args.push('-t')
        }

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

    private spawnUrbit(args: string[], slug: string, options?: any): Promise<{ loopback: number, web: number } | null> {
        const urbit = spawn(this.urbitPath, args, options);
        const messages = [];
        let web, loopback;

        async function getPorts(data, resolve) {
            const webPattern = /http:\s+web interface live on http:\/\/localhost:(\d+)/
            const loopbackPattern = /http:\s+loopback live on http:\/\/localhost:(\d+)/
            const line = data.toString() 
            console.log(line)

            messages.push({
                type: 'out',
                text: this.formatBootLog(data)
            })
            
            await send('boot-log', { slug, messages })

            const webMatch = line.match(webPattern)
            if (webMatch) {
                web = webMatch[1]
            }

            const loopbackMatch = line.match(loopbackPattern)
            if (loopbackMatch) {
                loopback = loopbackMatch[1]
                console.log('matched', line, webMatch, web, loopbackMatch, loopback)

                resolve({
                    web,
                    loopback
                })
            }
        }

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
                
                send('boot-log', { slug, messages })
            })

            urbit.stdout.on('data', (data) => {
                (getPorts.bind(this))(data, resolve)
            })
        })
    }

    private runDojo(args: string[], cmd: string): Promise<string[]> {
        const urbit = spawn(this.urbitPath, args, { shell: true });
        const messages = [];
        let done = false;

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
            })

            urbit.stdout.on('data', (data) => {
                messages.push(data.toString())

                if (done) {
                    resolve(messages)
                }
            })

            urbit.stdin.write(`${cmd}\n`, (error) => {
                if (error) {
                    return reject(error)
                }

                done = true;
                urbit.stdin.end()
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

export type AddPier = Pick<Pier, 'name' | 'type' | 'shipName' | 'keyFile'> & {
    booted?: boolean;
    running?: boolean;
    directory?: string;
}

export interface NewMoon {
    name: string;
    planet: string;
    shipName?: string;
}

export function isNewMoon(data: any): data is NewMoon {
    return typeof data.name !== 'undefined' && typeof data.planet !== 'undefined'
}

export interface PierAuth {
    username: string;
    code: string;
}

export interface BootMessage {
    type: 'out' | 'error';
    text: string;
}

export interface BootMessageSet {
    slug: string;
    messages: BootMessage[];
}

export function pierSlugify(name: string): string {
    return name.replace(/\s+/ig, '-').toLocaleLowerCase();
}