import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Link, useParams } from 'react-router-dom'
import { Pier } from '../../background/services/pier-service'
import { send } from '../client/ipc'
import { LeftArrow } from '../icons/LeftArrow'
import { Button } from '../shared/Button'
import { Layout } from '../shared/Layout'
import { Spinner } from '../shared/Spinner'

export const Launch = () => {
    const queryClient = useQueryClient();
    const { slug } = useParams<{ slug: string }>()
    const [pier, setPier] = useState<Pier>();
    const [showCopied, setShowCopied] = useState(false);
    const { mutate, isIdle, isLoading } = useMutation(async (slug: string) => {
            const pier = await send('get-pier', slug)
            return send('resume-pier', pier)
        }, {
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
        mutate(slug)
    }, [slug])

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
            <Link to="/" className="inline-flex items-center ml-2 mr-8 text-xs text-gray-500 hover:text-white focus:text-white transition-colors" onMouseOver={() => queryClient.prefetchQuery('piers')}>
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

    if (!pier || isIdle || isLoading) {
        return (
            <Layout 
                title="Landscape" 
                className="flex justify-center items-center content-area-height w-screen" 
                footer={<Footer />}
            >
                { (isLoading || !pier?.running) &&
                    <Spinner className="h-24 w-24" />
                }
            </Layout>
        )
    }

    const url = pier.type === 'remote' ? pier.directory : `http://localhost:${pier.webPort}`
    const key = pier.lastUsed + url

    return (
        <Layout 
            title={pier.name} 
            className="flex justify-center items-center content-area-height w-screen" 
            footer={<Footer />}
        >
            <iframe
                key={key}
                className="h-full w-full"
                src={url} 
                allowFullScreen 
            />
        </Layout>
    )
}