import React, { FunctionComponent, useEffect, useState } from 'react'
import isDev from 'electron-is-dev'
import { useHistory } from 'react-router-dom'
import { send } from '../client/ipc';
import { Bug } from '../icons/Bug';

interface LayoutProps {
    title: string;
    className?: string;
    footer?: React.ReactElement
}

export const Layout: FunctionComponent<LayoutProps> = ({ children, title, className = '', footer }) => {
    const history = useHistory();
    const url = stringifyHistory();
    const [showDevTools, setShowDevTools] = useState(false);

    useEffect(() => {
        send('set-title', title)
    }, [])

    function stringifyHistory() {
        let url = history.location.pathname;

        if (history.location.hash) {
            url += '#' + history.location.hash
        }

        if (history.location.search) {
            url += '?' + history.location.search
        }

        return url;
    }

    async function toggleDevTools() {
        await send('toggle-dev-tools')
        setShowDevTools((old) => !old)
    }

    return (
        <>
            <header className="fixed window-drag top-0 left-0 w-full h-10 p-3">
                <h1 className="text-center text-sm leading-none font-medium tracking-tighter text-gray-700">{title}</h1>
            </header>
            <main className={`mt-10 ${className}`}>
                { children }
            </main>
            <footer className="flex items-center h-8 py-2">
                { footer }
                <div className="fixed right-2 bottom-2 flex justify-end items-center leading-none">
                    <input 
                        type="text" 
                        className={`min-w-64 text-white text-xs bg-transparent border border-gray-700 hover:border-white focus:border-white ${isDev || showDevTools ? '' : 'hidden'}`}
                        defaultValue={url}
                        onBlur={(event) => {
                            if (event.target.value !== url) {
                                history.push(event.target.value)
                            }
                        }}
                    />
                    <button className="ml-4 text-gray-300 hover:text-white focus:text-white focus:outline-none" onClick={toggleDevTools}>
                        <Bug className="h-4 w-4" primary="fill-current" secondary="fill-current opacity-40" />
                    </button>
                </div>
            </footer>
        </>
    )
}