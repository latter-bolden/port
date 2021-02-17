import React, { FunctionComponent, useEffect } from 'react'
import isDev from 'electron-is-dev'
import { useHistory } from 'react-router-dom'
import { send } from '../client/ipc';

interface LayoutProps {
    title: string;
    className?: string;
    footer?: React.ReactElement
}

export const Layout: FunctionComponent<LayoutProps> = ({ children, title, className = '', footer }) => {
    const history = useHistory();
    const url = stringifyHistory();

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
                {isDev &&
                    <div className="fixed right-2 bottom-2 leading-none">
                        <input 
                            type="text" 
                            className="min-w-64 text-white text-xs bg-transparent border border-gray-700 hover:border-white focus:border-white"
                            defaultValue={url}
                            onBlur={(event) => {
                                if (event.target.value !== url) {
                                    history.push(event.target.value)
                                }
                            }}
                        />
                    </div>
                }
            </footer>
        </>
    )
}