import React, { FunctionComponent, useEffect, useState } from 'react'
import isDev from 'electron-is-dev'
import { useHistory } from 'react-router-dom'
import { send } from '../client/ipc';
import { Bug } from '../icons/Bug';
import { isOSX } from '../../main/helpers';
import { UpdateNotifier } from './UpdateNotifier';

interface LayoutProps {
    title: string;
    center?: boolean;
    className?: string;
    footer?: React.ReactElement
}

export const Layout: FunctionComponent<LayoutProps> = ({ children, title, center = true, className = '', footer }) => {
    const history = useHistory();
    const url = stringifyHistory();
    const [showDevTools, setShowDevTools] = useState(false);

    useEffect(() => {
        send('set-title', title)
    }, [title])

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
        <div className="grid grid-cols-1 body-rows min-h-screen">
            { isOSX() &&
                <header className="fixed window-drag top-0 left-0 w-full h-7 p-2">
                    <h1 className="text-center text-sm leading-none font-medium tracking-tighter text-gray-300 dark:text-gray-700">{title}</h1>
                </header>
            }
            <main className={`grid ${center ? 'justify-center content-center' : ''} ${isOSX() ? 'mt-7' : ''} ${className}`}>
                { children }
            </main>
            <footer className="flex items-center h-8 py-2 z-20">
                { footer }
                <div className="flex justify-end items-center ml-auto leading-none">
                    <input 
                        type="text" 
                        className={`min-w-64 text-black dark:text-white text-xs bg-transparent border border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white ${isDev || showDevTools ? '' : 'hidden'}`}
                        defaultValue={url}
                        onBlur={(event) => {
                            if (event.target.value !== url) {
                                history.push(event.target.value)
                            }
                        }}
                    />
                    <UpdateNotifier />
                    <button className="p-2 ml-2 text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white focus:text-black dark:focus:text-white focus:outline-none" onClick={toggleDevTools}>
                        <Bug className="h-4 w-4" primary="fill-current" secondary="fill-current opacity-40" />
                    </button>
                </div>
            </footer>
        </div>
    )
}