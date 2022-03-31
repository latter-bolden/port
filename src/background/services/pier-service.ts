import { join as joinPath } from 'path';
import process from 'process';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { shell, ipcRenderer } from 'electron';
import axios from 'axios'
import { DB } from '../db'
import { HandlerEntry } from '../server/ipc'; 
import { getPlatform, getPlatformPathSegments} from '../../get-platform';
import { rootPath as root } from 'electron-root-path';
import appRootDir from 'app-root-dir'
import { unlink, mkdir, rmdir, access, readFile } from 'fs'
import { promisify } from 'util'
import ADMZip from 'adm-zip'
import mv from 'mv'
import { each } from 'async';
import find from 'find-process';


const isDev = ipcRenderer.sendSync('is-dev');
const IS_PROD = !isDev;
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

const userData = ipcRenderer.sendSync('user-data-path');

console.log({ root, IS_PROD, binariesPath })

export interface PierHandlers {
    'add-pier': PierService["addPier"]
    'get-pier': PierService["getPier"]
    'get-piers': PierService["getPiers"]
    'get-messages': PierService["getMessages"]
    'get-pier-auth': PierService["getPierAuth"]
    'update-pier': PierService["updatePier"]
    'collect-existing-pier': PierService["collectExistingPier"]
    'boot-pier': PierService["bootPier"]
    'resume-pier': PierService["resumePier"]
    'spawn-in-terminal': PierService["spawnInTerminal"]
    'check-pier': PierService["checkPier"]
    'check-boot': PierService["checkBoot"]
    'check-url': PierService["checkUrlAccessible"]
    'stop-pier': PierService["stopPier"]
    'delete-pier': PierService["deletePier"]
    'eject-pier': PierService["ejectPier"]
    'validate-key-file': PierService["validateKeyfile"]
}

export class PierService {
    private readonly db: DB;
    private readonly urbitPath: string;
    private readonly resumesInProgress: Map<string, Promise<Pier | null>>;
    private pierDirectory: string;

    constructor(db: DB) {
        this.db = db;
        this.urbitPath = joinPath(binariesPath, 'urbit');
        this.resumesInProgress = new Map();
        this.recoverBootingShips();
    }

    handlers(): HandlerEntry<PierHandlers>[] {
        return [
            { name: 'add-pier', handler: this.addPier.bind(this) },
            { name: 'get-pier', handler: this.getPier.bind(this) },
            { name: 'get-piers', handler: this.getPiers.bind(this) },
            { name: 'get-messages', handler: this.getMessages.bind(this) },
            { name: 'get-pier-auth', handler: this.getPierAuth.bind(this) },
            { name: 'update-pier', handler: this.updatePier.bind(this) },
            { name: 'collect-existing-pier', handler: this.collectExistingPier.bind(this) },
            { name: 'boot-pier', handler: this.bootPier.bind(this) },
            { name: 'resume-pier', handler: this.resumePier.bind(this) },
            { name: 'spawn-in-terminal', handler: this.spawnInTerminal.bind(this) },
            { name: 'check-pier', handler: this.checkPier.bind(this) },
            { name: 'check-url', handler: this.checkUrlAccessible.bind(this) },
            { name: 'check-boot', handler: this.checkBoot.bind(this) },
            { name: 'stop-pier', handler: this.stopPier.bind(this) },
            { name: 'delete-pier', handler: this.deletePier.bind(this) },
            { name: 'eject-pier', handler: this.ejectPier.bind(this) },
            { name: 'validate-key-file', handler: this.validateKeyfile.bind(this) }
        ]
    }
    
    async setPierDirectory(): Promise<void> {
        const pierDirectory = await this.db.settings.asyncFindOne({ name: 'pier-directory' })
        this.pierDirectory = pierDirectory?.value || this.getPierDirectory();

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
            this.pierDirectory = userData;
        }
    }

    async addPier(data: AddPier): Promise<Pier | null> {
        return await this.db.piers.asyncInsert({
            directory: this.pierDirectory,
            slug: pierSlugify(data.name),
            lastUsed: (new Date()).toISOString(),
            status: 'unbooted',
            directoryAsPierPath: false,
            ...data,
        })
    }

    async getPier(slug: string): Promise<Pier | null> {
        return await this.db.piers.asyncFindOne({ slug })
    }
    
    async getPiers(query?: Partial<Pier>): Promise<Pier[] | null> {
        return await this.db.piers.asyncFind(query || {})
    }

    async getMessages(query?: Partial<BootMessage>): Promise<BootMessage[] | null> {
        return await this.db.messageLog.asyncFind(query || {})
    }

    async updatePier(slug: string, newPier: Partial<Pier>): Promise<Pier> {
        const currentPier = await this.getPier(slug);
        const completePier = { ...currentPier, ...newPier };
        await this.db.piers.asyncUpdate({ slug }, completePier);
        return completePier;
    }

    async getPierAuth(pier: Pier): Promise<PierAuth> {
        if (pier.type === 'remote') {
            return null;
        }

        const loopback = `http://localhost:${pier.loopbackPort}`
        const username = await this.dojo(loopback, 'our');
        const code = await this.dojo(loopback, '+code');

        await this.updatePier(pier.slug, { shipName: username });

        return {
            username,
            code
        }
    }
    
    async validateKeyfile(path: string): Promise<boolean> {
        const keyFile = (await asyncRead(path)).toString()
        const keyPattern = /^\s*0w[1-9A-Za-z~-][\dA-Za-z~-]{0,4}(\.[\dA-Za-z~-]{5})*\s*$/m

        return keyPattern.test(keyFile);
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

        try {
            const res = await axios.post(url, req, {
                withCredentials: false
            });
            return await res.data
        } catch (err) {
            isDev && console.error(err);
            return null;
        }
    }

    async checkPier(pier: Pier): Promise<Pier> {
        const dontUpdate: ShipStatus[] = ['unbooted', 'booting', 'errored'];
        if (pier.type === 'remote' || dontUpdate.includes(pier.status))
            return pier

        const dojoCheck = await this.runningCheck(pier);
        return await this.updatePier(pier.slug, {
            webPort: dojoCheck?.web,
            loopbackPort: dojoCheck?.loopback,
            status: dojoCheck ? 'running' : 'stopped' 
        });
    }

    private async runningCheck(pier: Pier): Promise<PortSet | null> {
        const ports = await this.portRunningCheck(pier);
        if (!ports || !ports.web || !ports.loopback) {
            console.log(`${pier.name} is not running or can't be contacted.`)
            return null;
        }

        const loopback = `http://localhost:${ports.loopback}`
        const check = await this.dojo(loopback, 'our')
        const webLive = await this.checkUrlAccessible(`http://localhost:${ports.web}`);

        if (check && !pier.shipName) {
            await this.updatePier(pier.slug, { shipName: check });
        }

        if (check || webLive) {
            return ports
        }

        console.log(`${pier.name} is not running or can't be contacted at port ${ports.loopback}`)
        return null
    }

    private async portRunningCheck(pier: Pier): Promise<PortSet | null> {
        const portPath = joinPath(this.getPierPath(pier), '.http.ports');

        try {
            await asyncAccess(portPath)
        } catch {
            return null
        }

        const portFile = (await asyncRead(portPath)).toString()
        const loopback = portFile.match(/(\d+).*loopback/)
        const web = portFile.match(/(\d+).*public/)

        if (!loopback || !web || !loopback[1] || !web[1]) {
            console.error('Issue with reading .http.ports file')
            return null;
        }

        return {
            loopback: parseInt(loopback[1]),
            web: parseInt(web[1])
        }
    }

    async checkUrlAccessible(url: string): Promise<boolean> {
        try {
            const res = await axios.get(url);
            if (res.status >= 200 && res.status < 400) {
                return true;
            }
        } catch (err) {
            console.log(err);
        }
    
        return false;
    }

    async resumePier(pier: Pier): Promise<Pier | null> {
        let resuming = this.resumesInProgress.get(pier.slug);
        if (resuming) {
            return resuming;
        }

        resuming = this.internalResumePier(pier);
        this.resumesInProgress.set(pier.slug, resuming);
        return resuming;
    }

    private async internalResumePier(pier: Pier): Promise<Pier | null> {
        try {
            const accuratePier = await this.checkPier(pier)
            if (accuratePier.status === 'running') {
                this.resumesInProgress.delete(accuratePier.slug);
                return await this.updatePier(accuratePier.slug, { lastUsed: (new Date()).toISOString() });
            }

            const urbit = this.spawnUrbit(this.getSpawnArgs(accuratePier));
            const ports = await this.handleUrbitProcess(urbit, accuratePier);
            const updatedPier: Pier = await this.updatePier(pier.slug, {
                lastUsed: (new Date()).toISOString(),
                webPort: ports.web,
                loopbackPort: ports.loopback,
                status: 'running'
            });

            this.resumesInProgress.delete(updatedPier.slug);
            return updatedPier;
        } catch (err) {
            console.error(err);
            this.resumesInProgress.delete(pier.slug);
            return null;
        }
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

        return await this.updatePier(pier.slug, {
            status: 'stopped',
            directory: this.pierDirectory 
        });
    }

    async checkBoot(slug: string): Promise<Pier> {
        const pier = await this.getPier(slug);
        const ports = await this.runningCheck(pier);
        if (ports) {                
            return await this.handlePostBoot(pier, ports);
        }

        return pier;
    }

    async bootPier(pier: Pier): Promise<void> {
        if (pier.status !== 'unbooted') {
            return;
        }
        
        const args = this.getSpawnArgs(pier);
        const updatedPier = await this.updatePier(pier.slug, { status: 'booting' });
        this.boot(updatedPier, args);
    }

    private async boot(pier: Pier, args: string[]) {
        try {
            const urbit = this.spawnUrbit(args);
            const ports = await this.handleUrbitProcess(urbit, pier, true);
            const updatedPier = await this.handlePostBoot(pier, ports);
            await this.checkUrlAccessible(`http://localhost:${ports.web}`);
            return updatedPier;
        } catch (err) {
            return await this.updatePier(pier.slug, { status: 'errored' })
        }
    }

    private async handlePostBoot(pier: Pier, ports: PortSet): Promise<Pier> {
        const shipUpdates = {
            webPort: ports.web,
            loopbackPort: ports.loopback,
            status: 'running' as ShipStatus
        };

        if (pier.type === 'comet') {
            this.startOTA(ports);
            const shipName = await this.dojo(`http://localhost:${ports.loopback}`, 'our');
            return await this.updatePier(pier.slug, {
                ...shipUpdates,
                shipName
            });
        }
        
        if (pier.keyFile) {
            try {
                await asyncRm(pier.keyFile)
            } catch (err) {
                console.error(err);
                console.log('Deleting keyfile failed')
            }
        }

        return await this.updatePier(pier.slug, shipUpdates);
    }

    private startOTA(ports: PortSet) {
        setTimeout(() => {
            try {
                console.log('attempting ota');
                //make sure OTAs start |ota (sein:title our now our) %kids
                this.dojo(`http://localhost:${ports.loopback}`, {
                    sink: {
                        app: 'hood'
                    },
                    source: {
                        dojo: '+hood/ota (sein:title our now our)'//old '+hood/install (sein:title our now our) %kids, =local %base'
                    }
                })
            } catch (err) {
                console.error('attempted ota', err)
            }
        }, 5000)
    }

    async stopPier(pier: Pier): Promise<Pier> {
        const updatedPier = await this.checkPier(pier);

        if (updatedPier.status !== 'running' && updatedPier.status !== 'booting') {
            return updatedPier;
        }

        await this.stopUrbit(updatedPier);

        return await this.updatePier(updatedPier.slug, { status: 'stopped' });
    }

    async ejectPier(pier: Pier): Promise<void> {
        const pierPath = this.getPierPath(pier);
        const zip = new ADMZip()

        zip.addLocalFolder(pierPath, pier.slug)
        zip.writeZip(`${pierPath}.zip`)
        asyncRmdir(pierPath, { recursive: true })

        await this.db.piers.asyncRemove({ slug: pier.slug })

        shell.openPath(pier.directory)
    }

    async deletePier(pier: Pier, keepFolder = false): Promise<void> {
        const pierPath = this.getPierPath(pier);
        let pierExists = true;

        try {
            await asyncAccess(pierPath)
        } catch {
            pierExists = false
        }

        if (pier.type !== 'remote' && pierExists && !keepFolder) {
            asyncRmdir(pierPath, { recursive: true })
        }

        await this.db.piers.asyncRemove({ slug: pier.slug })  
    }

    private async stopUrbit(ship: Pier): Promise<void> {
        if (ship.status === 'booting' && typeof ship.bootProcessId !== 'undefined') {
            process.kill(ship.bootProcessId, 'SIGTSTP');
            return;
        }

        const url = `http://localhost:${ship.loopbackPort}`
        const check = await this.dojo(url, 'our')

        if (check !== ship.shipName) {
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

    async spawnInTerminal(pier: Pier): Promise<void> {
        if (pier.type === 'remote') {
            return;
        }
        
        const stringifiedArgs = this.getSpawnArgs(pier, true).map(arg => arg.replace(/ /g, '\\ ')).join(' ');
        const spawnCommand = `${this.urbitPath} ${stringifiedArgs}`;

        await this.stopPier(pier);

        ipcRenderer.send('terminal-create', {
            ship: pier.shipName,
            initialCommand: spawnCommand,
            exitCommand: '\x04'
        })

        return new Promise((resolve) => {
            setTimeout(async () => {
                await this.checkPier(pier);
                resolve();
            }, 1500);
        });
    }

    private getPierPath(pier: Pier) {
        if (pier.directoryAsPierPath) {
            return pier.directory;
        }

        return joinPath(pier.directory, pier.slug);
    }

    private getSpawnArgs(pier: Pier, interactive = false): string[] {
        let args = []
        const pierPath = this.getPierPath(pier);
        const unbooted = pier.status === 'unbooted';

        if (!interactive) {
            args.push('-t')
        }

        if (pier.amesPort) {
            args.push('-p')
            args.push(pier.amesPort)
        }

        if (pier.type === 'comet' && unbooted) {
            args.push('-c')
        } else if (['star', 'planet', 'moon'].includes(pier.type) && unbooted) {
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

    private spawnUrbit(args: string[], options?: any): ChildProcessWithoutNullStreams {
        const urbit = spawn(this.urbitPath, args, options);
        console.log('spawning urbit with ', ...args)
        
        return urbit;
    }

    private handleUrbitProcess(urbit: ChildProcessWithoutNullStreams, pier: Pier, persist = false): Promise<PortSet | null> {
        if (pier.status === 'booting') {
            this.updatePier(pier.slug, { bootProcessId: urbit.pid })
        }

        return new Promise((resolve, reject) => {
            const onClose = (code) => {
                if (typeof code === 'undefined') {
                    reject('bailing out')
                }

                if (typeof code === 'number' && code !== 0) {
                    console.error(`Exited with code ${code}`)
                    reject(code.toString())
                }

                reject();
            }

            const onErr = (err) => {
                console.error(err)
                reject(err)
            }

            const onStdErr = (data) => {
                console.error(data.toString())

                if (persist) {
                    this.db.messageLog.asyncInsert({
                        type: 'error',
                        slug: pier.slug,
                        text: data.toString(),
                        time: (new Date()).toISOString()
                    })
                }
            }

            const onStdOut = async (data) => {
                const line = data.toString() 
                console.log(line)
        
                if (persist) {
                    await this.db.messageLog.asyncInsert({
                        type: 'out',
                        slug: pier.slug,
                        text: line,
                        time: (new Date()).toISOString()
                    })
                }
        
                const ports = await this.runningCheck(pier);
                if (ports) {
                    urbit.off('close', onClose);
                    urbit.off('error', onErr);
                    urbit.stderr.pause();
                    urbit.stdout.pause();
                    urbit.stderr.off('data', onStdErr);
                    urbit.stdout.off('data', onStdOut);
                    
                    resolve(ports);
                }
            }

            urbit.on('close', onClose);
            urbit.on('error', onErr);
            urbit.stderr.on('data', onStdErr);
            urbit.stdout.on('data', onStdOut);
        })
    }

    private portParser(): (line: string) => PortSet | null {
        const webPattern = /http:\s+web interface live on http:\/\/localhost:(\d+)/
        const loopbackPattern = /http:\s+loopback live on http:\/\/localhost:(\d+)/
        let web, loopback;

        return line => {
            const webMatch = line.match(webPattern)
            if (webMatch) {
                web = webMatch[1]
            }
    
            const loopbackMatch = line.match(loopbackPattern)
            if (loopbackMatch) {
                loopback = loopbackMatch[1]
                console.log('matched', line, webMatch, web, loopbackMatch, loopback)
    
                return {
                    web,
                    loopback
                };
            }

            return null;
        }
    }

    private getPierDirectory() {
        if (process.platform === 'linux' && process.env.SNAP) {
            return joinPath(process.env.SNAP_USER_COMMON, '.config', ipcRenderer.sendSync('app-name'));
        }

        return joinPath(userData, 'piers')
    }

    private async recoverBootingShips() {
        const bootingShips = await this.db.piers.asyncFind({ 
            $and: [{ status: 'booting' }, { bootProcessId: { $exists: true }}] 
        });

        await each(bootingShips, async ship => {
            this.checkBoot(ship.slug)

            const processes = await find('pid', ship.bootProcessId);
            this.updatePier(ship.slug, {
                bootProcessDisconnected: !processes.map(proc => proc.ppid).includes(process.pid),
            });
        })

    }
}

type PierType = 'comet' | 'moon' | 'planet' | 'star' |  'remote';

export interface Pier {
    _id?: string;
    name: string;
    slug: string;
    type: PierType;
    directory: string;
    status: ShipStatus;
    lastUsed: string;
    shipName?: string;
    keyFile?: string;
    webPort?: number;
    loopbackPort?: number;
    amesPort?: number;
    directoryAsPierPath?: boolean;
    bootProcessId?: number;
    bootProcessDisconnected?: boolean;
}

export type AddPier = Pick<Pier, 'name' | 'type' | 'shipName' | 'amesPort' | 'keyFile'> & {
    status?: ShipStatus;
    directory?: string;
    directoryAsPierPath?: boolean;
}

export type UpdatePier = Pick<Pier, 'name' | 'type'> 

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

export type ShipStatus = 'unbooted' | 'booting' | 'booted' | 'stopped' | 'running' | 'errored';

export interface BootMessage {
    type: 'out' | 'error';
    slug: string;
    time: string;
    text: string;
}

interface PortSet {
    loopback: number; 
    web: number;
}

export function pierSlugify(name: string): string {
    return name.replace(/\s+/ig, '-').toLocaleLowerCase();
}