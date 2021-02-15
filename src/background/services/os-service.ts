import { HandlerEntry } from '../server/ipc';
import { ipcRenderer as ipc} from 'electron'

export interface OSHandlers {
    'get-directory': OSService['getDirectory'];
    'set-title': OSService['setTitle'];
}

export class OSService {
    handlers(): HandlerEntry<OSHandlers>[] {
        return [
            { name: 'get-directory', handler: this.getDirectory.bind(this) },
            { name: 'set-title', handler: this.setTitle.bind(this) }
        ]
    }

    async getDirectory(options: Electron.OpenDialogOptions): Promise<string | undefined> {
        const result = await ipc.sendSync('open-dialog', options)

        if (result.canceled)
            return undefined;

        const directory = result.filePaths[0];
        console.log(`opening directory ${directory}`)
        return directory;
    }

    async setTitle(title: string): Promise<string> {
        await ipc.sendSync('set-title', title)

        return title;
    }
}

