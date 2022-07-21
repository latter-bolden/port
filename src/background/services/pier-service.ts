import { join as joinPath } from 'path';
import process from 'process';
import { exec, spawn, ChildProcessWithoutNullStreams } from 'child_process';
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


const isDev = ipcRenderer.sendSync('is-dev');
const IS_PROD = !isDev;
const platform = getPlatform();

const asyncRm = promisify(unlink);
const asyncRmdir = promisify(rmdir);
const asyncAccess = promisify(access);
const asyncRead = promisify(readFile);
const asyncMkdir = promisify(mkdir);
const asyncExec = promisify(exec);

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
    'spawn-in-terminal': PierService["spawnInTerminal"]
    'check-pier': PierService["checkPier"]
    'check-boot': PierService["checkBoot"]
    'check-url': PierService["checkUrlAccessible"]
    'stop-pier': PierService["stopPier"]
    'delete-pier': PierService["deletePier"]
    'eject-pier': PierService["ejectPier"]
    'validate-key-file': PierService["validateKeyfile"]
}

type BootingPier = Promise<Pier | null> & { recoveryAttempted?: boolean }

export class PierService {
    private readonly db: DB;
    private readonly urbitPath: string;
    private readonly bootingPiers: Map<string, BootingPier>;
    private pierDirectory: string;

    constructor(db: DB) {
        this.db = db;
        this.urbitPath = joinPath(binariesPath, 'urbit');
        this.bootingPiers = new Map();

        ipcRenderer.on('cleanup', async () => {
            console.log('cleaning up pier-service');
            try {
                await this.cleanup();
            } catch (e) {
                console.error('failed to clean up pier-service')
            }
            ipcRenderer.send('cleanup-done');
        });
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

    async start(): Promise<void> {
        this.pruneOldLogs();

        await this.setPierDirectory();
        await this.migrate();
        await this.checkRunningShips();
        await this.recoverShips();
        await this.getPiers().then(piers => {
            ipcRenderer.invoke('piers', piers);
        });
    }

    async migrate(): Promise<void> {
        let piers = await this.getPiers();
        let migrationNeeded = piers.some(pier => {
            const hasInvalidStatus = !['stopped', 'booting', 'running', 'errored'].includes(pier.status);
            const missingStartupPhase = typeof pier.startupPhase === 'undefined';
            return hasInvalidStatus || missingStartupPhase;
        });

        if (migrationNeeded) {
            console.log('pier service attempting migration')
            await each(piers, async (pier) => {
                if (pier.type === 'remote' || ['booted', 'stopped'].includes(pier.status))
                    return await this.updatePier(pier.slug, { startupPhase: 'complete' });

                if (pier.status as any === 'unbooted')
                    return await this.updatePier(pier.slug, { status: 'stopped', startupPhase: 'never-booted' });

                if (['booting', 'errored'].includes(pier.status))
                    return await this.updatePier(pier.slug, { startupPhase: 'initialized' });

                if (pier.status === 'running') {
                    await this.stopPier(pier);
                    return await this.updatePier(pier.slug, { startupPhase: 'complete' });
                }
            });

            console.log('pier service migrated successfully');
        }
    }

    async pruneOldLogs(): Promise<void> {
        const THIRTY_DAYS_AGO = Date.now() - (1000 * 60 * 60 * 24 * 30);

        let query = {
            $where: function () {
                // current log is passed via "this"
                let stamp = (new Date(this.time)).getTime();
                return THIRTY_DAYS_AGO > stamp;
            }
        };

        try {
            let numRemoved = await this.db.messageLog.asyncRemove(query, { multi: true });

            Number(numRemoved) > 0
                ? console.log(`Pruned ${numRemoved} old logs.`)
                : console.log(`No old logs to prune.`);
        } catch (err) {
            console.error('Failed to prune old logs: ', err);
        }
    }

    async checkRunningShips(): Promise<void> {
        let piers = await this.getPiers();
        let runningPiers = piers.filter(pier => pier.status === 'running');
        await each(runningPiers, async (pier) => {
            await this.checkPier(pier);
        });
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

    async cleanup(): Promise<void> {
        const keepShipsRunning = await this.db.settings.asyncFindOne({ name: 'keep-ships-running' })
        if (keepShipsRunning?.value === 'true') {
            return;
        }

        const runningShips = await this.db.piers.asyncFind({ status: 'running' })

        const killWithSignal = true;
        const stops = []
        for (let ship of runningShips) {
            if (ship.type !== 'remote')
                stops.push(this.stopPier(ship, killWithSignal))
        }

        await Promise.all(stops)
    }

    async addPier(pierData: AddPier): Promise<Pier | null> {
        const pier = await this.db.piers.asyncInsert({
            directory: this.pierDirectory,
            slug: pierSlugify(pierData.name),
            lastUsed: (new Date()).toISOString(),
            status: 'stopped',
            startupPhase: typeof pierData.startupPhase !== 'undefined' 
                ? pierData.startupPhase
                : 'never-booted',
            directoryAsPierPath: false,
            ...pierData,
        })
        
        ipcRenderer.invoke('piers', await this.getPiers());
        return pier;
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
        ipcRenderer.invoke('piers', await this.getPiers());
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
        if (pier.type === 'remote' || pier.startupPhase !== 'complete')
            return pier

        const ports = await this.runningCheck(pier);

        return await this.updatePier(pier.slug, {
            webPort: ports?.web,
            loopbackPort: ports?.loopback,
            status: ports ? 'running' : 'stopped'
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

        if (check && pier.shipName && check.trim() !== pier.shipName.trim()) {
            // a different ship is running on this port
            return null;
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

    async collectExistingPier(data: AddPier): Promise<Pier> {
        const pier = await this.addPier({ ...data, startupPhase: 'initialized' });
        await new Promise((resolve, reject) => {
            mv(data.directory, joinPath(this.pierDirectory, pier.slug), { mkdirp: true }, (error) => {
                if (error) {
                    return reject(error)
                }

                return resolve(true)
            })
        })

        return await this.updatePier(pier.slug, { directory: this.pierDirectory });
    }

    async bootPier(pier: Pier): Promise<Pier | null> {
        let booting = this.bootingPiers.get(pier.slug);
        if (booting) {
            return booting;
        }

        let checkedPier = await this.checkPier(pier);
        if (checkedPier.status === 'running') {
            return await this.updatePier(checkedPier.slug, { lastUsed: (new Date()).toISOString() });
        }

        booting = this.internalBootPier(pier);
        booting.recoveryAttempted = false;
        this.bootingPiers.set(pier.slug, booting);
        return booting;
    }

    private async internalBootPier(pier: Pier): Promise<Pier | null> {
        try {
            const updates: Partial<Pier> = {
                status: 'booting',
                bootProcessDisconnected: false,
                lastUsed: (new Date()).toISOString()
            }
            pier.startupPhase !== 'complete'
                ? await this.updatePier(pier.slug, { ...updates, startupPhase: 'initialized' })
                : await this.updatePier(pier.slug, updates)

            const urbit = await this.spawnUrbit(pier);
            const ports = await this.handleUrbitProcess(urbit, pier, true)
            const updatedPier: Pier = pier.startupPhase !== 'complete'
                ? await this.handlePostInitialBoot(pier, ports)
                : await this.handlePostBoot(pier, ports)

            this.bootingPiers.delete(updatedPier.slug);
            return updatedPier;
            
        } catch (err) {
            console.error(err);

            if (!this.bootingPiers.get(pier.slug).recoveryAttempted)
                return this.tryAutomatedErrorRecovery(pier);

            this.bootingPiers.delete(pier.slug);
            return await this.updatePier(pier.slug, { status: 'errored', lastUsed: (new Date()).toISOString() });
        }
    }

    private async tryAutomatedErrorRecovery(pier: Pier): Promise<Pier | null> {
        this.bootingPiers.get(pier.slug).recoveryAttempted = true;

        this.db.messageLog.asyncInsert({
            type: 'out',
            slug: pier.slug,
            text: 'Port: attempting automated error recovery.',
            time: (new Date()).toISOString()
        });

        let pierPath = this.getSafePath(pier);

        try {
            let meldResult = await asyncExec(`${this.urbitPath} meld ${pierPath}`);
            console.log('auto error recovery — meld success');
            this.db.messageLog.asyncInsert({
                type: 'out',
                slug: pier.slug,
                text: meldResult.stdout,
                time: (new Date()).toISOString()
            });
        } catch(err) {
            console.error('auto error recovery — meld fail:', err);
        }

        return this.internalBootPier(pier);
    }

    private async handlePostBoot(pier: Pier, ports: PortSet) {
        const pierUpdates = {
            lastUsed: (new Date()).toISOString(),
            webPort: ports.web,
            loopbackPort: ports.loopback,
            status: 'running' as BootStatus,
        } as Partial<Pier>

        return await this.updatePier(pier.slug, pierUpdates);
    }

    async checkBoot(slug: string): Promise<Pier> {
        const pier = await this.getPier(slug);
        const ports = await this.runningCheck(pier);
        if (ports) {    
            return pier.startupPhase !== 'complete'            
                ? await this.handlePostInitialBoot(pier, ports)
                : await this.handlePostBoot(pier, ports);
        }

        return pier;
    }

    private async handlePostInitialBoot(pier: Pier, ports: PortSet): Promise<Pier> {
        const pierUpdates = {
            webPort: ports.web,
            loopbackPort: ports.loopback,
            status: 'running' as BootStatus,
            startupPhase: 'complete',
        } as Partial<Pier>;

        if (pier.type === 'comet') {
            this.startOTA(ports);
        }

        if (!pier.shipName) {
            pierUpdates.shipName = await this.dojo(`http://localhost:${ports.loopback}`, 'our');
        }
        
        if (pier.keyFile) {
            try {
                await asyncRm(pier.keyFile);
                pierUpdates.keyFile = null;
            } catch (err) {
                console.error(err);
                console.log('Deleting keyfile failed');
            }
        }

        return await this.updatePier(pier.slug, pierUpdates);
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

    async stopPier(pier: Pier, stopWithSignal = false): Promise<Pier> {
        let updatedPier;
        if (stopWithSignal && pier.status === 'running' && pier.pid && await this.processExists(pier.pid)) {
            // if we're only stopping via signal, we can speed up by using a heuristic instead of full check
            updatedPier = pier;
        } else {
            updatedPier = await this.checkPier(pier);
        }

        if (updatedPier.status !== 'running' && updatedPier.status !== 'booting') {
            return updatedPier;
        }

        await this.stopUrbit(updatedPier, stopWithSignal);

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

    private async stopUrbit(ship: Pier, stopWithSignal = false): Promise<void> {
        if (stopWithSignal || (ship.status === 'booting' && typeof ship.pid !== 'undefined')) {
            try {
                process.kill(ship.pid, platform === 'win' ? 'SIGINT' : 'SIGTERM');
            } catch (err) {
                // if process somehow doesn't exist (ESRCH), don't throw
                if (!err.message.toUpperCase().includes('ESRCH')) {
                    throw err;
                }
            }
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

    private getSafePath(pier: Pier) {
        // urbit binary can't handle paths with spaces so we escape them
        let pierPath = pier.directoryAsPierPath
            ? pier.directory
            : joinPath(pier.directory, pier.slug);

        if (['linux', 'mac'].includes(platform))
            return pierPath.split(' ').join('\\ ');

        return pierPath;
     }

    private getPierPath(pier: Pier) {
        if (pier.directoryAsPierPath) {
            return pier.directory;
        }

        return joinPath(pier.directory, pier.slug);
    }

    private async spawnUrbit(pier: Pier): Promise<ChildProcessWithoutNullStreams> {
        const args = this.getSpawnArgs(pier);
        const runDetached = await this.db.settings.asyncFindOne({ name: 'keep-ships-running' });

        console.log('spawning urbit with ', ...args)
        let urbit: ChildProcessWithoutNullStreams;
        if (runDetached) {
            urbit = spawn(this.urbitPath, args, { detached: true});
            urbit.unref()
        } else {
            urbit = spawn(this.urbitPath, args);
        }
        
        return urbit;
    }

    private getSpawnArgs(pier: Pier, interactive = false): string[] {
        let args = []
        const pierPath = this.getPierPath(pier);
        const neverBooted = pier.startupPhase === 'never-booted';

        if (!interactive) {
            args.push('-t')
        }

        if (pier.amesPort) {
            args.push('-p')
            args.push(pier.amesPort)
        }

        if (pier.httpPort) {
            args.push('--http-port')
            args.push(pier.httpPort)
        }

        if (pier.httpsPort) {
            args.push('--https-port')
            args.push(pier.httpsPort)
        }

        if (pier.type === 'comet' && neverBooted) {
            args.push('-c')
        } else if (['star', 'planet', 'moon'].includes(pier.type) && neverBooted) {
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

    private async handleUrbitProcess(urbit: ChildProcessWithoutNullStreams, pier: Pier, persist = false): Promise<PortSet | null> {
        await this.updatePier(pier.slug, { pid: urbit.pid })

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
                console.log(`<${pier.name}> failed to start.`)
                console.error(err)
                reject(err)
            }

            const onStdErr = (data) => {
                console.error(`<${pier.name}> ${data.toString()}`)

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
                const line = data.toString();
                console.log(`<${pier.name}> ${line}`);
        
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

    private processExists (pid:number) {
        try {
            process.kill(pid, 0)
            return true
        } catch (_) {
            return false
        }
    }

    private getPierDirectory() {
        if (process.platform === 'linux' && process.env.SNAP) {
            return joinPath(process.env.SNAP_USER_COMMON, '.config', ipcRenderer.sendSync('app-name'));
        }

        return joinPath(userData, 'piers')
    }

    private async recoverShips() {
        const bootingShips = await this.db.piers.asyncFind({ 
            $and: [ { status: 'booting' }, { pid: { $exists: true }}]
        });

        await each(bootingShips, async ship => {
            console.log(`trying to recover: ${ship.name}...`)

            const pier = await this.checkBoot(ship.slug);
            if (pier.status === 'running')
                return;

            if (pier.pid && await this.processExists(pier.pid)) {
                return this.updatePier(ship.slug, { bootProcessDisconnected: true })
            } else {
                return pier.startupPhase !== 'complete'
                    ? await this.updatePier(ship.slug, { status: 'stopped', startupPhase: 'recovery'})
                    : await this.updatePier(ship.slug, { status: 'stopped'})
            }
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
    status: BootStatus;
    startupPhase: StartupPhase;
    lastUsed: string;
    shipName?: string;
    keyFile?: string;
    webPort?: number;
    loopbackPort?: number;
    amesPort?: number;
    httpPort?: number;
    httpsPort?: number;
    directoryAsPierPath?: boolean;
    pid?: number;
    bootProcessDisconnected?: boolean;
}

export type AddPier = Pick<Pier, 'name' | 'type' | 'shipName' | 'amesPort' | 'httpPort' | 'httpsPort' | 'keyFile'> & {
    status?: BootStatus;
    startupPhase?: StartupPhase;
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

export type BootStatus = 'stopped' | 'booting' | 'running' | 'errored'
export type StartupPhase = 'never-booted' | 'initialized' | 'recovery' | 'complete'

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