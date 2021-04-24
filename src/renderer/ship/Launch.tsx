import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Link, useParams } from 'react-router-dom'
import { Pier } from '../../background/services/pier-service'
import { send } from '../client/ipc'
import { LeftArrow } from '../icons/LeftArrow'
import { pierKey } from '../query-keys'
import { Button } from '../shared/Button'
import { Layout } from '../shared/Layout'
import { LandscapeWindow } from './components/LandscapeWindow'

export const Launch = () => {
    const queryClient = useQueryClient();
    const { slug } = useParams<{ slug: string }>()
    const [pier, setPier] = useState<Pier>();
    const [showCopied, setShowCopied] = useState(false);
    const { data: initialPier } = useQuery(pierKey(slug), () => send('get-pier', slug))
    const { mutate, isIdle, isLoading } = useMutation(() => send('resume-pier', initialPier), 
        {
            onSuccess: (data: Pier) => {
                setPier(data)
            }
        }
    )
    const { data, isSuccess: isPostSuccess } = useQuery(['auth', slug], 
        () => send('get-pier-auth', pier), {
            enabled: !!pier && pier.running && pier.type !== 'remote',
            refetchOnWindowFocus: false
        })

    useEffect(() => {
        mutate()
    }, [initialPier])

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

    const Footer = () => (
        <>
            <Link to="/" className="inline-flex items-center mr-8 text-xs text-gray-500 hover:text-white focus:text-white transition-colors" onMouseOver={() => queryClient.prefetchQuery(pierKey())}>
                <LeftArrow className="w-5 h-5 mr-2" secondary="fill-current" />
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

    return (
        <Layout 
            title={pier?.name || 'Landscape'}
            center={false}
            footer={<Footer />}
        >
            <LandscapeWindow pier={pier} loading={isIdle || isLoading} />
        </Layout>
    )
}