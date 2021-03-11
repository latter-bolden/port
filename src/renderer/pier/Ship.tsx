import { format } from 'date-fns'
import React from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Link, useLocation, useParams } from 'react-router-dom'
import { send } from '../client/ipc'
import { LeftArrow } from '../icons/LeftArrow'
import { RightArrow } from '../icons/RightArrow'
import { Layout } from '../shared/Layout'
import { Spinner } from '../shared/Spinner'
import { getCometShortName } from '../shared/urbit-utils'


export const Ship = () => {
    const location = useLocation()
    const { slug } = useParams<{ slug: string }>()
    const queryClient = useQueryClient();
    const { data: ship } = useQuery(['pier', slug], async () => {
        const pier = await send('get-pier', slug)
        return send('check-pier', pier)
    }, {
        refetchOnWindowFocus: false
    })
    const { mutate: stopShip } = useMutation(async () => send('stop-pier', ship), {
        onSuccess: () => {
            queryClient.invalidateQueries(['pier', slug])
        }
    })

    if (!ship) {
        return <Layout title="Loading Ship..." className="flex justify-center items-center min-content-area-height">
            <Spinner className="h-24 w-24" />
        </Layout>
    }

    const formattedDate = format(new Date(ship.lastUsed), 'HH:mm MM-dd-yyyy')

    return (
        <Layout 
            title={ship.name} 
            className="flex justify-center items-center min-content-area-height pt-8 text-gray-500"
            footer={
                <Link to="/" className="inline-flex items-center ml-2 mr-8 text-xs text-gray-500 hover:text-white focus:text-white transition-colors">
                    <LeftArrow className="w-5 h-5 mr-2" secondary="fill-current" />
                    Home
                </Link>
            }
        >
            <section className="w-full max-w-md mr-6">
                <header className="flex items-center">
                    <div className="mr-6">
                        <h1 className="text-xl font-semibold text-white">{ ship.name }</h1>
                        { ship.booted && 
                            <div className="flex items-center text-sm">
                                <span className={`inline-flex w-2 h-2 mr-2 rounded-full ${ship.running ? 'bg-green-400' : 'bg-gray-700'}`}></span>
                                <span>{ship.running ? 'Running' : 'Stopped'}</span>
                                {ship.running && <button className="px-1 ml-3 font-semibold text-gray-700 hover:text-red-800 focus:text-red-800 hover:border-red-900 focus:border-red-900 rounded default-ring border border-gray-700 transition-colors" onClick={() => stopShip()}>Stop</button>}
                            </div>
                        }
                        { !ship.booted &&
                            <span className="text-sm">Unbooted</span>
                        }
                    </div>
                    <div className="ml-auto">
                        { ship.booted &&
                            <Link to={`${location.pathname}/launch`} className="button">
                                Launch <RightArrow className="ml-1 w-7 h-7" secondary="fill-current"/>
                            </Link>
                        }
                        { !ship.booted &&
                            <Link to={`/boot/comet/${ship.slug}`} className="button">
                                Boot <RightArrow className="ml-1 w-7 h-7" secondary="fill-current"/>
                            </Link>
                        }
                    </div>
                </header>
                <hr className="my-3 border-gray-700"/>
                <div className="space-y-4">
                    <p className="flex items-center">{ ship.shipName && getCometShortName(ship.shipName) } <span className="ml-auto">{ formattedDate }</span></p>
                    <p>{ ship.directory }</p>
                </div>                
            </section>
        </Layout>
    )
}