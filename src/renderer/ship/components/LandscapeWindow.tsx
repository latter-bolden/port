import React, { useEffect, useRef } from 'react'
import { send } from '../../client/ipc'
import useResizeObserver from 'use-resize-observer'
import { Pier } from '../../../background/services/pier-service'
import { useHistory } from 'react-router-dom'
import { Spinner } from '../../shared/Spinner'

interface LandscapeWindowProps {
    pier: Pier;
    loading: boolean;
}

export const LandscapeWindow: React.FC<LandscapeWindowProps> = ({ pier, loading }) => {
    const history = useHistory();
    const landscapeRef = useRef<HTMLDivElement>(null);
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
        if (landscapeRef.current && url) {
            send('create-view', {
                url,
                bounds: getBounds(landscapeRef.current)
            })
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
            { (loading || pier?.status !== 'running') &&
                <Spinner className="h-24 w-24" />
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