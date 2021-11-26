import { format } from 'date-fns'
import React from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Link, useHistory, useParams } from 'react-router-dom'
import { send } from '../client/ipc'
import { LeftArrow } from '../icons/LeftArrow'
import { Upload } from '../icons/Upload'
import { Layout } from '../shared/Layout'
import { Spinner } from '../shared/Spinner'
import { getCometShortName } from '../shared/urbit-utils'
import { ShipStatus } from './components/ShipStatus'
import { LaunchButton } from './components/LaunchButton'
import { EditableShipName } from './components/EditableShipName'
import { pierKey } from '../query-keys'
import { Pier } from '../../background/services/pier-service'
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '../shared/Dialog'
import { Button } from '../shared/Button'


export const Ship: React.FC = () => {
    const history = useHistory()
    const { slug } = useParams<{ slug: string }>()
    const queryClient = useQueryClient();
    const { data: ship } = useQuery(pierKey(slug), async () => {
        const pier = await send('get-pier', slug)
        return send('check-pier', pier)
    })
    const { mutate: stopShip } = useMutation(() => send('stop-pier', ship), {
        onSuccess: (newShip: Pier) => {
            queryClient.invalidateQueries(pierKey(slug))
            queryClient.setQueryData(pierKey(slug), newShip)
        }
    })
    const { mutate: ejectShip, isLoading } = useMutation(async () => {
        const pier = await send('stop-pier', ship)

        //we wait here in case .vere.lock hasn't cleared yet (race condition)
        return new Promise<void>((resolve) => {
            setTimeout(async () => {
                await send('eject-pier', pier)
                resolve();
            }, 2000)
        })
    }, {
        onSuccess: () => {
            queryClient.prefetchQuery(pierKey())
            history.push('/')
        }
    })
    const { mutate: spawnTerminal } = useMutation(() => send('spawn-in-terminal', ship), {
        onSuccess: () => {
            queryClient.invalidateQueries(pierKey(ship.slug));
        }
    });
    
    function onHover(ship: Pier) {
        return () => queryClient.setQueryData(pierKey(ship.slug), ship);
    }

    if (!ship) {
        return <Layout title="Loading Ship...">
            <Spinner className="h-24 w-24" />
        </Layout>
    }

    const deleteShip = async () => {
        await send('delete-pier', ship);
        history.push('/')
    }

    const formattedDate = format(new Date(ship.lastUsed), 'MM-dd-yyyy HH:mm')

    return (
        <Layout 
            title={ship.name} 
            className="pt-8 text-gray-400 dark:text-gray-500 text-sm"
            footer={
                <Link to="/" className="inline-flex items-center ml-2 mr-8 text-xs text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white focus:text-black dark:focus:text-white transition-colors">
                    <LeftArrow className="w-5 h-5 mr-2" primary="fill-current text-transparent" secondary="fill-current" />
                    Home
                </Link>
            }
        >
            <section className="w-full max-w-md mr-6 space-y-8">
                <div className="px-4 py-5 bg-gray-100 dark:bg-gray-900 rounded">
                    <header className="flex items-center">
                        <div className="mr-6">
                            <h1 className="font-semibold mb-1">
                                <EditableShipName ship={ship} />
                                <div className="mb-4 mt-2 whitespace-nowrap">{ ship.type === 'comet' ? getCometShortName(ship.shipName || '') : ship.shipName }</div>
                            </h1>
                            <div className="flex items-center">
                                <ShipStatus ship={ship} />
                                {ship.status === 'running' && ship.type !== 'remote' && <button className="px-1 ml-3 font-semibold text-gray-300 dark:text-gray-700 hover:text-red-800 focus:text-red-800 hover:border-red-900 focus:border-red-900 rounded default-ring border border-gray-300 dark:border-gray-700 transition-colors" onClick={() => stopShip()}>Stop</button>}
                            </div>
                        </div>
                        <div className="ml-auto">
                            <LaunchButton ship={ship} loadData={onHover(ship)}/>
                        </div>
                    </header>
                    <hr className="my-3 border-gray-300 dark:border-gray-700"/>
                    <p className="mb-1">{ ship.directory }</p>
                    <p><span className="text-gray-700 dark:text-gray-300">Last Used: </span>{ formattedDate }</p>
                </div>
                {ship.type !== 'remote' && (
                    <div className="px-4 py-5 bg-gray-100 dark:bg-gray-900 rounded">               
                        <h2 className="text-base font-semibold text-black dark:text-white mb-4">Troubleshooting</h2>
                        <div className="flex items-center font-semibold">
                            <Button onClick={() => spawnTerminal()}>
                                Start in Terminal
                            </Button>
                        </div>
                    </div>
                )}
                <div className="px-4 py-5 bg-gray-100 dark:bg-gray-900 rounded">               
                    <h2 className="text-base font-semibold text-black dark:text-white mb-4">Ship Migration</h2>
                    <div className="flex items-center font-semibold">
                        { ship.type === 'remote' && 
                            <button className="button text-red-600 hover:text-red-600 focus:text-red-600 border border-red-900 hover:border-red-700 focus:border-red-700 focus:outline-none transition-colors default-ring" onClick={async () => await deleteShip()}>Remove</button>
                        }
                        { ship.type !== 'remote' &&
                            <>
                                <Dialog>
                                    <DialogTrigger className="mr-3 hover:text-red-800 focus:text-red-800 transition-colors default-ring">
                                        Delete Permanently
                                    </DialogTrigger>
                                    <DialogContent>
                                        <div className="my-6 pr-6">Are you sure you want to delete your ship's pier and data? This action is irreversible.</div>
                                        <div className="flex justify-end items-center">
                                            <DialogClose className="text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white focus:text-black dark:focus:text-white transition-colors mr-4 default-ring">Cancel</DialogClose>
                                            <DialogClose className="button text-red-600 hover:text-red-600 focus:text-red-600 border border-red-900 hover:border-red-700 focus:border-red-700 focus:outline-none transition-colors default-ring" onClick={async () => await deleteShip()}>Delete Permanently</DialogClose>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                <button className="button" onClick={async () => await ejectShip()}>
                                    {!isLoading && <>
                                        <Upload className="w-5 h-5 mr-2" primary="fill-current opacity-50" secondary="fill-current" /> Eject
                                    </>}
                                    {isLoading && <>
                                        <Spinner className="w-4 h-4 mr-2" /> Ejecting
                                    </>}
                                </button>
                            </>
                        }
                    </div>
                </div>
            </section>
        </Layout>
    )
}