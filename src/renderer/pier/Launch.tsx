import React from 'react'
import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'
import { send } from '../client/ipc'
import { Layout } from '../shared/Layout'

export const Launch = () => {
    const { slug } = useParams<{ slug: string }>()
    const { data: pier, isSuccess } = useQuery(['pier', slug], 
        async () => await send('get-pier', slug), {
            refetchOnWindowFocus: false
        }
    )
    const { data, isSuccess: isPostSuccess } = useQuery(['auth', slug], 
        async () => await send('get-pier-auth', pier), {
            enabled: !!pier,
            refetchOnWindowFocus: false
        })

    return (
        <Layout 
            title={pier?.name || 'Landscape'} 
            className="content-area-height w-screen" 
            footer={isPostSuccess && <div className="px-2 text-gray-700 text-xs">{data.code}</div>}>
            { isSuccess &&
                <iframe
                    className="h-full w-full"
                    src={`http://localhost:${pier.webPort}`} 
                    allowFullScreen 
                />
            }
        </Layout>
    )
}