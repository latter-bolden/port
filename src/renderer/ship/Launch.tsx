import React, { useEffect, useState } from 'react'
import { ipcRenderer } from 'electron'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Link, useParams } from 'react-router-dom'
import { Pier } from '../../background/services/pier-service'
import { send } from '../client/ipc'
import { getCometShortName } from '../shared/urbit-utils'
import { useStore } from '../App';
import { LeftArrow } from '../icons/LeftArrow'
import { pierKey } from '../query-keys'
import { Button } from '../shared/Button'
import { Layout } from '../shared/Layout'
import { LandscapeWindow } from './components/LandscapeWindow'

const LaunchFooter: React.FC<{ pier: Pier }> = ({ pier }) => {
    const queryClient = useQueryClient();
    const [showCopied, setShowCopied] = useState(false);
    const { data, isSuccess: isPostSuccess } = useQuery(['auth', pier?.slug], 
    () => send('get-pier-auth', pier), {
        enabled: !!pier && pier.status === 'running' && pier.type !== 'remote'
    })

    useEffect(() => {
        if (!showCopied) {
            return
        }

        const timeout = setTimeout(() => {
            setShowCopied(false);
        }, 750);

        return () => window.clearTimeout(timeout)
    }, [showCopied])

    async function copyKey() {
        await navigator.clipboard.writeText(data.code);
        setShowCopied(true);
    }

    return (
        <>
            <Link to="/" className="inline-flex items-center ml-2 mr-8 text-xs text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white focus:text-black dark:focus:text-white transition-colors" onMouseOver={() => queryClient.prefetchQuery(pierKey())}>
                <LeftArrow className="w-5 h-5 mr-2" primary="fill-current text-transparent" secondary="fill-current" />
                Home
            </Link>
            {isPostSuccess && 
                <Button className="relative py-0 text-xs" onClick={copyKey}>
                    <span className={`transition-opacity ${!showCopied ? 'opacity-100' : 'opacity-0'}`}>Copy Access Key</span>
                    <span className={`absolute transition-opacity ${showCopied ? 'opacity-100' : 'opacity-0'}`}>Copied!</span>
                </Button>
            }
        </>
    )
}

export const Launch = () => {
    const { slug } = useParams<{ slug: string }>()
    const [pier, setPier] = useState<Pier>();
    const settings = useStore(s => s.settings);
    const { data: initialPier } = useQuery(pierKey(slug), () => send('get-pier', slug))
    const pierLoaded = initialPier?.slug;
    const { mutate, isIdle, isLoading } = useMutation(() => send('resume-pier', initialPier), 
        {
            onSuccess: (data: Pier) => {
                setPier(data)
            }
        }
    )

    useEffect(() => {
        if (pierLoaded) {
            mutate()
        }
    }, [pierLoaded])

    useEffect(() => {
        const handle =  () => {
            ipcRenderer.send('current-ship', {
                shouldDisplay: settings['ship-name-in-title'] === 'true',
                displayName: pier.shipName ? getCometShortName(pier.shipName).trim() : pier.name.trim(),
            })
        }

        ipcRenderer.on('current-ship', handle)

        return () => {
            ipcRenderer.removeListener('current-ship', handle)
        }
    }, [pier]);

    return (
        <Layout 
            title={pier?.name || 'Landscape'}
            center={false}
            footer={<LaunchFooter pier={pier} />}
        >
            <LandscapeWindow pier={pier} loading={isIdle || isLoading} />
        </Layout>
    )
}