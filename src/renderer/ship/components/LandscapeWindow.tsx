import React, { useEffect, useRef, useState } from 'react'
import { send } from '../../client/ipc'
import useResizeObserver from 'use-resize-observer'
import { Pier } from '../../../background/services/pier-service'
import { Link, useHistory } from 'react-router-dom'
import { Spinner } from '../../shared/Spinner'
import { LeftArrow } from '../../icons/LeftArrow'

interface LandscapeWindowProps {
    pier: Pier;
    loading: boolean;
}

export const LandscapeWindow: React.FC<LandscapeWindowProps> = ({ pier, loading }) => {
    const history = useHistory();
    const landscapeRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState('initial');
    const url = getUrl(pier);

    useResizeObserver<HTMLDivElement>({ 
        ref: landscapeRef,
        onResize: ({ width, height }) => {
            if (landscapeRef.current && url) {
                requestAnimationFrame(() => {
                    send('update-view-bounds', {
                        url,
                        bounds: getBounds(landscapeRef.current, width, height)
                    })
                })
            }
        }
    });

    useEffect(() => {
        async function createView() {
            try {
                await send('create-view', {
                    url,
                    bounds: getBounds(landscapeRef.current)
                })
                setStatus('loaded')
            } catch (err) {
                setStatus('errored')
            }
        }

        if (landscapeRef.current && url) {
            setStatus('loading')
            createView();    
        }
    }, [landscapeRef.current, url])

    useEffect(() => {
        const unlisten = history.listen(() => {
            send('remove-view', url)
            console.log('removing', url)
        });

        return () => unlisten && unlisten();
    }, [url])

    return (
        <div ref={landscapeRef} id="landscape" className="grid h-full w-full justify-center items-center">
            { (loading || status === 'loading' || pier?.status !== 'running') &&
                <Spinner className="h-24 w-24" />
            }
            { status === 'errored' &&
                <div className="mx-auto max-w-xs space-y-3">
                    <h1>
                        <span className="font-semibold text-red-500">Unable to connect to:</span>
                        <span className="text-base ml-2">{ pier.name }</span>
                    </h1>
                    <p>There may be something wrong with your remote ship, its URL, or your connection to it.</p>
                    <p>
                        <Link to="/" className="inline-flex items-center text-xs text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white focus:text-black dark:focus:text-white transition-colors">
                            <LeftArrow className="w-5 h-5 mr-2" primary="fill-current text-transparent" secondary="fill-current" />
                            Home
                        </Link>
                    </p>
                </div>
            }
        </div>
    )
}

function getBounds(element: HTMLDivElement, width?: number, height?: number) {
    if (!element) {
        return null
    }

    const rect = element.getBoundingClientRect()
    return {
        x: rect.left,
        y: rect.top,
        width: width || rect.width,
        height: height || rect.height
    }
}

function getUrl(pier: Pier) {
    if (!pier) {
        return null
    }

    return pier.type === 'remote' ? pier.directory : `http://localhost:${pier.webPort}`;
}