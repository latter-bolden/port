import React, { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Link, useParams } from 'react-router-dom'
import { send } from '../client/ipc'
import { LeftArrow } from '../icons/LeftArrow'
import { RightArrow } from '../icons/RightArrow'
import { pierKey } from '../query-keys'
import { Layout } from '../shared/Layout'
import { MessageLogger } from '../shared/MessageLogger'
import { Spinner } from '../shared/Spinner'

const BootFooter = ({ queryClient }) => (
    <Link to="/" className="inline-flex items-center ml-2 mr-8 text-xs text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white focus:text-black dark:focus:text-white transition-colors" onMouseOver={() => queryClient.prefetchQuery(pierKey())}>
        <LeftArrow className="w-5 h-5 mr-2" primary="fill-current text-transparent" secondary="fill-current" />
        Home
    </Link>
)

export const Boot: React.FC = () => {
    const shipSettled = useRef(false);
    const queryClient = useQueryClient()
    const { slug } = useParams<{ slug: string }>();
    const { data: ship } = useQuery(pierKey(slug), async () => {
        const pier = await send('get-pier', slug);

        if (pier.bootProcessDisconnected) {
            return await send('check-boot', pier)
        }

        return pier;
    }, {
        refetchInterval: !shipSettled.current ? 1000 : undefined
    })
    const { mutate } = useMutation(() => send('boot-pier', ship), {
        onSuccess: () => {
            queryClient.invalidateQueries(pierKey())
        }
    })
    shipSettled.current = ship && (ship.status === 'running' || ship.status === 'errored');

    useEffect(() => {
        if (!slug)
            return;

        mutate();
    }, [slug])

    const shipType = ship?.type ? ship.type[0].toLocaleUpperCase() + ship.type.substring(1) : ''
    const title = `Booting ${shipType}`

    return (
        <Layout 
            title={title}
            footer={<BootFooter queryClient={queryClient} />}
            className="relative flex justify-center items-center min-content-area-height"
        >            
            <section className="max-w-xl">                   
                {!shipSettled.current &&
                    <>
                        <div className="flex items-center mb-12">
                            <Spinner className="h-24 w-24 mr-6" />
                            <div className="flex-1">
                                <h1 className="font-semibold">{title}...</h1>
                                {ship?.type === 'comet' && <div className="text-gray-300 dark:text-gray-600">This could take an hour, but more likely 5-10 minutes.</div>}
                                {ship?.type !== 'comet' && <div className="text-gray-300 dark:text-gray-600">This could take up to a few minutes.</div>}
                            </div>
                        </div>
                        <MessageLogger ship={ship} />
                    </>
                }
                {shipSettled.current && ship.status === 'running' &&
                    <div className="flex flex-col justify-center items-center space-y-6">
                        <div>
                            <h1 className="font-semibold">Your Ship is Ready</h1>
                            <div className="text-gray-300 dark:text-gray-600">Enjoy the Landscape</div>
                        </div>
                        <Link to={`/pier/${slug}/launch`} className="button">
                            Launch Ship into Urbit
                            <RightArrow className="ml-1 w-7 h-7" primary="fill-current text-transparent" secondary="fill-current" />
                        </Link>                            
                    </div>
                }
            </section>
        </Layout>
    )
}