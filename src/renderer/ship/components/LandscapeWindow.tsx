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
    useResizeObserver<HTMLDivElement>({ 
        ref: landscapeRef,
        onResize: ({ width, height }) => {
            if (landscapeRef.current) {
                requestAnimationFrame(() => {
                    send('update-view-bounds', {
                        url: getUrl(pier),
                        bounds: getBounds(landscapeRef.current, width, height)
                    })
                })
            }
        }
    });

    useEffect(() => {
        if (landscapeRef.current && pier) {
            send('create-view', {
                url: getUrl(pier),
                bounds: getBounds(landscapeRef.current)
            })
        }
    }, [landscapeRef.current, pier])

    useEffect(() => {
        const unlisten = history.listen(() => {
            const pierUrl = getUrl(pier);
            send('remove-view', pierUrl)
            console.log('removing', pierUrl)
        });

        return () => unlisten && unlisten();
    }, [pier])

    return (
        <div ref={landscapeRef} id="landscape" className="grid h-full w-full justify-center items-center">
            { (loading || !pier?.running) &&
                <Spinner className="h-24 w-24" />
            }
        </div>
    )
}

function getBounds(element: HTMLDivElement, width?: number, height?: number) {
    if (!element) {
        return null
    }

    return {
        x: element.offsetLeft,
        y: element.offsetTop,
        width: width || element.offsetWidth,
        height: height || element.offsetHeight
    }
}

function getUrl(pier: Pier) {
    if (!pier) {
        return null
    }

    return pier.type === 'remote' ? pier.directory : `http://localhost:${pier.webPort}`;
}