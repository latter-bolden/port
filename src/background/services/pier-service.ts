import { join as joinPath } from 'path';
import { spawn } from 'child_process';
import axios from 'axios'
import { DB } from '../db'
import { HandlerEntry } from '../server/ipc';
import getPlatform from './get-platform';
import { rootPath as root } from 'electron-root-path';
import appRootDir from 'app-root-dir'

const IS_PROD = process.env.NODE_ENV === 'production';

const binariesPath =
  IS_PROD // the path to a bundled electron app.
    ? joinPath(root, '../resources', getPlatform())
    : joinPath(appRootDir.get(), 'resources', getPlatform());

console.log({ root, IS_PROD, binariesPath })

export interface PierHandlers {
    'add-pier': PierService["addPier"]
    'get-pier': PierService["getPier"]
    'get-piers': PierService["getPiers"]
    'get-pier-auth': PierService["getPierAuth"]
    'boot-pier': PierService["bootPier"]
}

export class PierService {
    private readonly db: DB;

    constructor(db: DB) {
        this.db = db;
    }

    handlers(): HandlerEntry<PierHandlers>[] {
        return [
            { name: 'add-pier', handler: this.addPier.bind(this) },
            { name: 'get-pier', handler: this.getPier.bind(this) },
            { name: 'get-piers', handler: this.getPiers.bind(this) },
            { name: 'get-pier-auth', handler: this.getPierAuth.bind(this) },
            { name: 'boot-pier', handler: this.bootPier.bind(this) },
        ]
    }

    async addPier(data: AddPier): Promise<Pier | null> {
        return await this.db.piers.asyncInsert({
            ...data,
            slug: pierSlugify(data.name),
            lastUsed: (new Date()).toISOString(),
            running: false,
            booted: false
        })
    }

    async getPier(slug: string): Promise<Pier | null> {
        return await this.db.piers.asyncFindOne({ slug })
    }
    
    async getPiers(): Promise<Pier[] | null> {
        return await this.db.piers.asyncFind({})
    }

    async getPierAuth(pier: Pier): Promise<PierAuth> {
        const loopback = `http://localhost:${pier.loopbackPort}`
        const username = await this.dojo(loopback, 'our');
        const code = await this.dojo(loopback, '+code');

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

    async bootPier(slug: string): Promise<Pier | null> {
        const pier = await this.getPier(slug);

        if (!pier || pier.booted)
            return null;

        const urbitPath = this.getUrbitPath();
        if (pier.type === 'comet') {
            const ports = await this.spawnUrbit(urbitPath, pier.slug, pier.directory)
            //make sure OTAs start
            //this.dojo(`http://localhost:${ports.loopback}`, '|ota (sein:title our now our) %kids')
            const updatedPier = await this.db.piers.asyncUpdate({ slug: pier.slug }, {
                ...pier,
                webPort: ports.web,
                loopbackPort: ports.loopback,
                running: true,
                booted: true
            })

            return updatedPier as Pier;
        }

        return null
    }

    private spawnUrbit(urbitPath: string, pierSlug: string, pierPath: string): Promise<{ loopback: number, web: number } | null> {
        const urbit = spawn(urbitPath, ['-ct', pierSlug], { cwd: pierPath });
        const webPattern = /^http:\s+web interface live on http:\/\/localhost:(\d+)/
        const loopbackPattern = /^http:\s+loopback live on http:\/\/localhost:(\d+)/
        let web, loopback;

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

    private getUrbitPath(): string {
        return joinPath(binariesPath, 'urbit');
    }
}

type PierType = 'comet' | 'planet';

export interface Pier {
    name: string;
    slug: string;
    type: PierType;
    directory: string;
    lastUsed: string;
    booted: boolean;
    running: boolean;
    default: boolean;
    webPort?: number;
    loopbackPort?: number;
}

export type AddPier = Pick<Pier, 'name' | 'type' | 'directory' | 'default'>

export interface PierAuth {
    username: string;
    code: string;
}

export function pierSlugify(name: string): string {
    return name.replace(' ', '-').toLocaleLowerCase();
}