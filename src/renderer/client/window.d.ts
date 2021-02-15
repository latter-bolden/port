import { Client } from 'node-ipc'

declare global {
    interface Window { 
        IS_DEV: boolean;
        getServerSocket: () => Promise<string>;
        ipcConnect: (id: string) => Promise<Client>;
    }
}