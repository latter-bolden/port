import { format } from 'date-fns';
import React from 'react'
import { useQuery } from 'react-query';
import { send } from '../client/ipc';
import { BootMessage, Pier } from '../../background/services/pier-service';

function formatMsg(msg: BootMessage) {
    return `${format(new Date(msg.time), 'HH:mm:ss')} ${msg.text}`
}

export const MessageLogger: React.FC<{ ship: Pier }> = ({ ship }) => {
    const slug = ship?.slug;
    const { data } = useQuery(['messages', slug], () => send('get-messages', { slug }), {
        refetchInterval: 500
    })
    const disconnected = !!ship?.bootProcessDisconnected;
    const messages = (data || []).sort((a, b) => b.time.localeCompare(a.time));
    
    return (
        <div className="relative min-w-xl pl-10 font-mono text-xs text-gray-400 dark:text-gray-500">
            <div className="absolute top-0 left-0 right-0 bottom-0 z-20 bg-gradient-to-b from-white dark:from-black to-transparent pointer-events-none" />
            <pre className="flex flex-col-reverse h-56 space-y-0 pt-10 overflow-y-auto overflow-x-hidden">
                {messages.map((msg, index) => (
                    <div key={index + msg.text}>{formatMsg(msg)}</div>
                ))}
            </pre>
            {disconnected && 
                <div className="flex items-center mt-2 -ml-3 text-gray-300">
                    <span className="inline-flex w-2 h-2 mr-1 rounded-full bg-red-800"></span>
                    <span>disconnected from boot logs</span>
                </div>
            }
        </div>
    )
}