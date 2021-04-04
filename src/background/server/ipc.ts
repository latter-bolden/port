import { Socket } from "net"
import ipc from 'node-ipc'

const isDev = process.env.NODE_ENV === 'development'

export interface ServerMessage<T extends HandlerMap<T>> {
    id: string;
    name: keyof T;
    args: Parameters<T[keyof T]>;
}

export type ClientMessageTypes = 'reply' | 'error' | 'push';

export interface Reply {
    type: 'reply';
    id: string;
    result: unknown | null;

}
export interface Error {
    type: 'error';
    id: string;
}

export interface Push {
    type: 'push';
    name: string;
    args: unknown[];
}

export type ClientMessage = Reply | Error | Push;

export type Handler<Result = unknown> = (...args: unknown[]) => Promise<Result>

export type HandlerEntry<HandlerSet> = { 
    name: keyof HandlerSet, 
    handler: Handler
}

export type HandlerMap<T> = {
    [key in keyof T]: Handler;
}

async function handle<T extends HandlerMap<T>>({ id, args }: ServerMessage<T>, handler: HandlerMap<T>[keyof T], socket: Socket): Promise<void> {
    try {
        const result = args.length > 0 ? await handler(...args) : await handler()
        const reply: Reply = { type: 'reply', id, result }

        ipc.server.emit(socket, 'message', JSON.stringify(reply))
    } catch (err: unknown) {
        const error: Error = { type: 'error', id };
        ipc.server.emit(socket, 'message', JSON.stringify(error))

        throw err
    }
}

function noHandle<T extends HandlerMap<T>>({ id, name }: ServerMessage<T>, socket: Socket) {
    const reply: Reply = { type: 'reply', id, result: null };

    ipc.server.emit(socket, 'message', JSON.stringify(reply))
    console.warn('Unknown method: ' + name)
}

function serve<T extends HandlerMap<T>>(handlers: HandlerMap<T>) {
    ipc.server.on('message', (data: Stringified<ServerMessage<T>>, socket: Socket) => {
        const msg = JSON.parse(data)
        const handler = handlers[msg.name];

        console.log(Date.now(), 'server received:', msg);

        if (!handler)
            return noHandle(msg, socket);

        handle(msg, handler, socket);
    })
}

export function send(name: string, ...args: unknown[]): void {
    const msg: Push = { type: 'push', name, args };
    ipc.server.broadcast('message', JSON.stringify(msg))
    isDev && console.log(Date.now(), 'server sending:', msg);
}

export function init<T>(socketName: string, handlers: HandlerMap<T>): void {
    ipc.config.id = socketName
    ipc.config.silent = true

    ipc.serve(() => serve(handlers))
    ipc.server.start()

    isDev && console.log(Date.now(), 'server starting', 'socket:', socketName)
}