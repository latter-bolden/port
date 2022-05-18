import React, { useEffect, useRef, useState } from 'react'
import { send } from '../../client/ipc'
import useResizeObserver from 'use-resize-observer'
import { Pier } from '../../../background/services/pier-service'
import { useHistory } from 'react-router-dom'
import { Spinner } from '../../shared/Spinner'
import { useQuery } from 'react-query'
import { useStore } from '../../App'

interface LandscapeWindowProps {
    pier: Pier;
    loading: boolean;
}

export const LandscapeWindow: React.FC<LandscapeWindowProps> = ({ pier, loading }) => {
    const history = useHistory();
    const protocolLink = useStore(s => s.protocolLink);
    const landscapeRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState('initial');
    const url = getUrl(pier);

    const { data } = useQuery(['auth', pier?.slug], 
    () => send('get-pier-auth', pier), {
        enabled: !!pier && pier.status === 'running' && pier.type !== 'remote'
    })

    useResizeObserver<HTMLDivElement>({ 
        ref: landscapeRef,
        onResize: ({ width, height }) => {
            if (landscapeRef.current && url) {
                requestAnimationFrame(() => {
                    send('update-view-bounds', {
                        url,
                        ship: pier.shipName,
                        code: data?.code,
                        bounds: getBounds(landscapeRef.current, width, height)
                    })
                })
            }
        }
    });

    useEffect(() => {
        if (pier?.status === 'errored') {
            history.push(`/pier/${pier.slug}/error`, { ship: pier });
        }
    }, [pier])

    useEffect(() => {
        async function createView() {
            try {
                await send('create-view', {
                    url,
                    ship: pier.shipName || pier.slug,
                    code: data?.code,
                    bounds: getBounds(landscapeRef.current),
                    openLink: protocolLink
                })
                setStatus('loaded')
                useStore.setState({ protocolLink: null });
                await send('refresh-settings');
            } catch (err) {
                setStatus('errored')
            }
        }

        if (landscapeRef.current && url && (data || pier.type === 'remote')) {
            setStatus('loading')
            createView();    
        }
    }, [landscapeRef.current, url, data, protocolLink])

    useEffect(() => {
        const unlisten = history.listen(() => {
            send('remove-view', url)
            console.log('removing', url)
        });

        return () => unlisten && unlisten();
    }, [url])

    return (
        <div ref={landscapeRef} id="landscape" className="grid h-full w-full justify-center items-center">
            { (loading || status === 'loading' || pier?.status === 'booting') &&
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