import React, { useEffect, useState } from 'react'
import { BootMessage, BootMessageSet } from '../../background/services/pier-service';
import { listen } from '../client/ipc';

export const MessageLogger: React.FC<{ slug: string }> = ({ slug }) => {
    const [messages, setMessages] = useState<BootMessage[]>([]);

    useEffect(() => {
        const unlisten = listen('boot-log', (data: BootMessageSet) => {
            if (slug === data.slug) {
                setMessages((data.messages).reverse())
            }
        })

        return () => unlisten()
    }, [])
    
    return (
        <div className="relative min-w-xl">
            <div className="absolute top-0 left-0 right-0 bottom-0 z-20 bg-gradient-to-b from-black to-transparent pointer-events-none" />
            <pre className="flex flex-col-reverse h-56 space-y-0 pt-10 pl-10 font-mono text-xs text-gray-500 overflow-auto">
                {messages.map((msg, index) => (
                    <div key={index + msg.text}>{msg.text}</div>
                ))}
            </pre>
        </div>
    )
}