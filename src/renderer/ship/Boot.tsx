import React, { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Link, useHistory, useParams } from 'react-router-dom'
import { send } from '../client/ipc'
import { Archive } from '../icons/Archive'
import { LeftArrow } from '../icons/LeftArrow'
import { Refresh } from '../icons/Refresh'
import { RightArrow } from '../icons/RightArrow'
import { pierKey } from '../query-keys'
import { Button } from '../shared/Button'
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
    const history = useHistory();
    const queryClient = useQueryClient();
    const shipSettled = useRef(false);
    const bootFailedTimer = useRef(null);
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
    const { mutate: retry, isLoading: isRetrying } = useMutation(async () => {
        await send('delete-pier', ship, ship.directoryAsPierPath);
        const  { status, ...addPier } = ship;
        const newPier = await send('add-pier', addPier);

        return send('boot-pier', newPier);
    }, {
        onSuccess: () => {
            queryClient.setQueryData(pierKey(slug), {
                ...ship,
                status: 'booting'
            })
            queryClient.invalidateQueries(pierKey(slug))
        }
    })
    const { mutate: deleteShip, isLoading: isDeleting } = useMutation(() => send('delete-pier', ship, ship.directoryAsPierPath), {
        onSuccess: () => {
            queryClient.invalidateQueries(pierKey())
            history.push('/')
        }
    })
    shipSettled.current = ship && (ship.status === 'running' || ship.status === 'errored');

    useEffect(() => {
        if (!slug)
            return;

        mutate();
    }, [slug])

    useEffect(() => {
        if (!ship) {
            return;
        }

        const maxBootDuration = ship.type === 'comet' ? 60 : 20; // in minutes
        bootFailedTimer.current = setTimeout(() => {
            send('stop-pier', ship);
        }, maxBootDuration * 60 * 1000);

        return () => {
            window.clearTimeout(bootFailedTimer.current);
        }
    }, [ship])

    useEffect(() => {
        if (ship.status === 'running') {
            window.clearTimeout(bootFailedTimer.current);
        }
    }, [ship.status]);

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
                {shipSettled.current && ship.status === 'errored' &&
                    <div>
                        <h1 className="font-semibold mb-2">{title} Failed</h1>
                        <p className="mb-6 text-gray-300 dark:text-gray-600">Last seen messages:</p>                            
                        <MessageLogger ship={ship} showErrors />
                        <div className="flex items-center justify-end mt-6 text-sm space-x-4">
                            <Button className="hover:text-red-600 focus:text-red-600 hover:border-red-700 focus:border-red-700" onClick={() => deleteShip()}>
                                {!isDeleting && <>
                                    <Archive className="w-5 h-5 mr-1" primary="fill-current opacity-50" secondary="fill-current opacity-25" /> Delete
                                </>}
                                {isDeleting && <>
                                    <Spinner className="w-4 h-4 mr-2" /> Deleting
                                </>}
                            </Button>
                            <Button onClick={() => retry()}>
                                {!isRetrying && <>
                                    <Refresh className="w-5 h-5 mr-1" primary="fill-current opacity-50" secondary="fill-current opacity-25" /> Retry
                                </>}
                                {isRetrying && <>
                                    <Spinner className="w-4 h-4 mr-2" /> Retrying
                                </>}
                            </Button>
                        </div>
                    </div>
                }
            </section>
        </Layout>
    )
}