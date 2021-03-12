import React from 'react'
import { useQuery } from 'react-query'
import { Link, useParams } from 'react-router-dom'
import { send } from '../client/ipc'
import { LeftArrow } from '../icons/LeftArrow'
import { Layout } from '../shared/Layout'
import { Spinner } from '../shared/Spinner'

export const Launch = () => {
    const { slug } = useParams<{ slug: string }>()
    const { data: pier, isLoading } = useQuery(['pier', slug], 
        async () => {
            const pier = await send('get-pier', slug)
            return await send('resume-pier', pier)
        }, {
            refetchOnWindowFocus: false
        }
    )
    const { data, isSuccess: isPostSuccess } = useQuery(['auth', slug], 
        async () => await send('get-pier-auth', pier), {
            enabled: !!pier && pier.running && pier.type !== 'remote',
            refetchOnWindowFocus: false
        })

    const Footer = () => (
        <>
            <Link to="/" className="inline-flex items-center ml-2 mr-8 text-xs text-gray-500 hover:text-white focus:text-white transition-colors">
                <LeftArrow className="w-5 h-5 mr-2" secondary="fill-current" />
                Home
            </Link>
            {isPostSuccess && <span className="inline-flex px-2 text-white text-xs">{data.code}</span>}
        </>
    )

    if (!pier || isLoading) {
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

    return (
        <Layout 
            title={pier.name} 
            className="flex justify-center items-center content-area-height w-screen" 
            footer={<Footer />}
        >
            <iframe
                className="h-full w-full"
                src={url} 
                allowFullScreen 
            />
        </Layout>
    )
}