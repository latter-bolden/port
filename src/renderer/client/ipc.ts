import { Client } from 'node-ipc'
import { ClientMessage, Reply, Error, ServerMessage } from '../../background/server/ipc'
import { v4 } from 'uuid'
import { Handlers } from '../../background/main';

export type Listener<Result = unknown> = (...args: unknown[]) => Result

interface ReplyHandler {
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}

// Init
export async function init(): Promise<void> {
    const socketName = await window.getServerSocket()
    await connectSocket(socketName)
    console.log(Date.now(), 'client connected', 'socket:', socketName)

    window.onbeforeunload = () => {
        send('disconnected')
    }
}

// State
const replyHandlers = new Map<string, ReplyHandler>()
const listeners = new Map<string, Listener[]>()
let serverConnected = false;
let messageQueue: Stringified<ServerMessage<Handlers>>[] = []
let socketClient: Client = null

// Functions
export async function connectSocket(name: string): Promise<void> {
    const client = await window.ipcConnect(name);

    return new Promise(resolve => {
        client.on('message', onMessage)

        client.on('connect', () => onConnect(client, resolve))

        client.on('disconnect', () => {
            socketClient = null
        })
    })
}

function onMessage(data: string): void {
    const msg: ClientMessage = JSON.parse(data)
    //console.log(Date.now(), 'client received:', msg);

    if (msg.type === 'error' || msg.type === 'reply') {
        handleResponse(msg);
    } else if (msg.type === 'push') {
        const listens = listeners.get(msg.name)
        if (listens) {
            listens.forEach(listener => listener(...msg.args))
        }
    } else {
        throw new Error('Unknown message type: ' + JSON.stringify(msg))
    }
}

function handleResponse(msg: Reply | Error): void {
    const handler = replyHandlers.get(msg.id)
    if (!handler)
        return;

    if (msg.type === 'reply') {
        handler.resolve(msg.result)
    } else {
        handler.reject()
    }
    
    replyHandlers.delete(msg.id)
}

function onConnect(client: Client, onOpen: () => void): void {
    socketClient = client
    socketClient.emit('message', JSON.stringify({
        id: v4(),
        name: 'connected',
        args: []
    }));

    listen('connected', () => {
        if (serverConnected) {
            return;
        }
        
        serverConnected = true;
        send('connected');
        // Send any messages that were queued while closed
        if (messageQueue.length > 0) {
            messageQueue.forEach(msg => client.emit('message', msg))
            messageQueue = []
        }
    })

    onOpen();
}

export function send<T extends keyof Handlers>(name: T): ReturnType<Handlers[T]>;
export function send<T extends keyof Handlers>(name: T, ...args: Parameters<Handlers[T]>): ReturnType<Handlers[T]>;

export function send<T extends keyof Handlers>(name: T, ...args: Parameters<Handlers[T]>): ReturnType<Handlers[T]> {
    return new Promise((resolve, reject) => {
        const id = v4()
        const msg: ServerMessage<Handlers> = { id, name, args };
        const stringMsg = JSON.stringify(msg);

        
        replyHandlers.set(id, { resolve, reject })
        
        if (socketClient && serverConnected) {
            socketClient.emit('message', stringMsg)
            //console.log(Date.now(), 'client sending:', msg);
        } else {
            messageQueue.push(stringMsg)
        }
    }) as ReturnType<Handlers[T]>;
}

export function listen(name: string, listener: Listener): () => void {
    if (!listeners.get(name)) {
        listeners.set(name, [])
    }
    listeners.get(name).push(listener)

    return () => {
        const arr = listeners.get(name)
        listeners.set(name, arr.filter(func => func !== listener))
    }
}

export function unlisten(name: string): void {
    listeners.set(name, [])
}
