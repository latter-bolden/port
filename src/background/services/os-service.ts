import { HandlerEntry } from '../server/ipc';
import { ipcRenderer as ipc} from 'electron'

export interface OSHandlers {
    'get-directory': OSService['getDirectory'];
    'get-file': OSService['getFile'];
    'set-title': OSService['setTitle'];
    'clear-data': OSService['clearData'];
    'toggle-dev-tools': OSService['toggleDevTools'];
}

export class OSService {
    handlers(): HandlerEntry<OSHandlers>[] {
        return [
            { name: 'get-directory', handler: this.getDirectory.bind(this) },
            { name: 'get-file', handler: this.getFile.bind(this) },
            { name: 'set-title', handler: this.setTitle.bind(this) },
            { name: 'clear-data', handler: this.clearData.bind(this) },
            { name: 'toggle-dev-tools', handler: this.toggleDevTools.bind(this) }
        ]
    }

    async getDirectory(options: Electron.OpenDialogOptions): Promise<string | undefined> {
        const result = await ipc.invoke('open-dialog', {
            ...options,
            title: 'Select a Directory',
            properties: ['openDirectory', 'createDirectory']
        });

        if (result.canceled)
            return undefined;

        const directory = result.filePaths[0];
        console.log(`opening directory ${directory}`)
        return directory;
    }

    async getFile(options: Electron.OpenDialogOptions): Promise<string | undefined> {
        const result = await ipc.invoke('open-dialog', {
            ...options,
            title: 'Select a File',
            properties: ['openFile']
        });

        if (result.canceled)
            return undefined;

        const file = result.filePaths[0];
        console.log(`opening file ${file}`)
        return file;
    }

    async setTitle(title: string): Promise<string> {
        await ipc.invoke('set-title', title)

        return title;
    }

    async clearData(): Promise<void> {
        await ipc.invoke('clear-data')
    }

    async toggleDevTools(): Promise<void> {
        await ipc.invoke('toggle-dev-tools')
    }
}

