import React, { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { Link, useParams } from 'react-router-dom'
import { BootMessage } from '../../background/services/pier-service'
import { send, listen } from '../client/ipc'
import { RightArrow } from '../icons/RightArrow'
import { Layout } from '../shared/Layout'
import { MessageLogger } from '../shared/MessageLogger'
import { Spinner } from '../shared/Spinner'

export const CometBoot = () => {
    const queryClient = useQueryClient()
    const { slug } = useParams<{ slug: string }>();
    const { mutate, isIdle, isLoading, isSuccess } = useMutation(async (slug: string) => await send('boot-pier', slug), {
        onSuccess: () => {
            queryClient.invalidateQueries(['pier', slug])
        }
    })

    useEffect(() => {
        if (!slug)
            return;

        async function boot() {
            await mutate(slug)
        }

        boot();
    }, [slug])

    return (
        <Layout title="Booting Comet" className="relative flex justify-center items-center min-content-area-height">            
            <section className="max-w-xl">                   
                {(isIdle || isLoading) &&
                    <>
                        <div className="flex items-center mb-12">
                            <Spinner className="h-24 w-24 mr-6" />
                            <div className="flex-1">
                                <h1 className="font-semibold">Booting Comet...</h1>
                                <div className="text-gray-600">This could take an hour, but more likely 5-10 minutes.</div>
                            </div>
                        </div>
                        <MessageLogger />
                    </>
                }
                {isSuccess &&
                    <div className="flex flex-col justify-center items-center space-y-6">
                        <div>
                            <h1 className="font-semibold">Your Ship is Ready</h1>
                            <div className="text-gray-600">Enjoy the Landscape</div>
                        </div>
                        <Link to={`/pier/${slug}/launch`} className="inline-flex justify-center items-center px-2 py-1 bg-transparent border border-gray-700 hover:border-white focus:outline-none focus:border-white focus:ring focus:ring-gray-600 focus:ring-opacity-50 transition-colors rounded no-underline">
                            Launch Ship into Urbit
                            <RightArrow className="ml-1 w-7 h-7" secondary="fill-current" />
                        </Link>                            
                    </div>
                }
            </section>
        </Layout>
    )
}