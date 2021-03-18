import React, { useEffect, useState } from 'react'
import { BootMessage } from '../../background/services/pier-service';
import { listen } from '../client/ipc';

export const MessageLogger = () => {
    const [messages, setMessages] = useState<BootMessage[]>([]);

    useEffect(() => {
        const unlisten = listen('boot-log', data => setMessages((data as BootMessage[]).reverse()))

        return () => unlisten()
    }, [])
    
    return (
        <div className="relative">
            <div className="absolute top-0 left-0 right-0 bottom-0 z-20 bg-gradient-to-b from-black to-transparent" />
            <pre className="flex flex-col-reverse h-56 space-y-0 pt-10 pl-10 font-mono text-xs text-gray-500 overflow-y-auto">
                {messages.map(msg => (
                    <div key={Date.now + msg.text}>{msg.text}</div>
                ))}
            </pre>
        </div>
    )
}