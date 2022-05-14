import React from 'react'
import { Link, useHistory, useParams } from 'react-router-dom'
import { useQueryClient, useQuery, useMutation } from 'react-query'

import { send } from '../client/ipc'
import { pierKey } from '../query-keys'
import { Pier } from 'src/background/services/pier-service'
import { LeftArrow } from '../icons/LeftArrow'
import { MessageLogger } from '../shared/MessageLogger'
import { Button } from '../shared/Button'
import { Archive } from '../icons/Archive'
import { Spinner } from '../shared/Spinner'
import { Refresh } from '../icons/Refresh'
import { Layout } from '../shared/Layout'
import { HomeFooter } from '../shared/HomeFooter'

export const ShipError: React.FC = () => {
    const history = useHistory()
    const { slug } = useParams<{ slug: string }>();
    const queryClient = useQueryClient()
    const { data: ship } = useQuery(pierKey(slug), () => send('get-pier', slug));
    const pierLoaded = ship?.slug;


    const { mutate: deleteShip, isLoading: isDeleting } = useMutation(() => send('delete-pier', ship, ship.directoryAsPierPath), {
        onSuccess: () => {
            queryClient.invalidateQueries(pierKey())
            history.push('/')
        }
    })

    interface ErrorInterface { ship: Pier }
    const Error: React.FC<ErrorInterface> = ({ ship }) => {

        if (ship.type === 'remote')
            return (
                <div className="mx-auto max-w-xs space-y-3">
                    <h1>
                        <span className="font-semibold text-red-500">Unable to connect to:</span>
                        <span className="text-base ml-2">{ ship.name }</span>
                    </h1>
                    <p>There may be something wrong with your remote ship, its URL, or your connection to it.</p>
                    <p>
                        <Link to="/" className="inline-flex items-center text-xs text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white focus:text-black dark:focus:text-white transition-colors">
                            <LeftArrow className="w-5 h-5 mr-2" primary="fill-current text-transparent" secondary="fill-current" />
                            Home
                        </Link>
                    </p>
                </div>
            )

        return (
            <div>
            <h1 className="font-semibold mb-2">Booting {ship.name} Failed</h1>
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
                <Button onClick={() => history.push(`/pier/${ship.slug}/launch`)}>
                    <Refresh className="w-5 h-5 mr-1" primary="fill-current opacity-50" secondary="fill-current opacity-25" /> Retry
                </Button>
            </div>
        </div>
        )
    }

    return (
        <Layout title="Boot Error" footer={<HomeFooter queryClient={queryClient}/>}>
                
            { !pierLoaded && <Spinner className="h-24 w-24" />}
            { pierLoaded && <Error ship={ship} />}
        </Layout>
    )
}