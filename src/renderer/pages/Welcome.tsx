import React from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { send } from '../client/ipc'
import { Logo } from '../icons/Logo'
import { RightArrow } from '../icons/RightArrow'
import { BootOptions } from '../ship/components/BootOptions'
import { ShipList } from '../ship/components/ShipList'
import { Layout } from '../shared/Layout'
import { Spinner } from '../shared/Spinner'

const CenteredLayout = () => (
    <Layout title="Welcome" className="flex justify-center items-center min-content-area-height">
        <section className="max-w-xl">
            <div className="flex flex-col items-center">
                <Logo className="h-40 w-40 text-white" />
                <h1 className="text-2xl mt-8 mb-20 text-center">Welcome to Urbit</h1>
            </div>
            <nav>
                <BootOptions className="grid gap-8 grid-cols-2" />
            </nav>
        </section>
    </Layout>
)

export const Welcome = () => {
    const { data: piers, isIdle, isLoading } = useQuery('piers', async () => await send('get-piers'))

    if (isIdle || isLoading) {
        return <Layout title="Welcome" className="flex justify-center items-center min-content-area-height">
            <Spinner className="h-24 w-24" />
        </Layout>
    }

    if (!piers || piers.length === 0) {
        return <CenteredLayout />
    }

    return (
        <Layout title="Welcome" className="flex justify-center items-center min-content-area-height">
            <div className="grid grid-cols-3 gap-x-12 gap-y-8 max-w-3xl mt-20">
                <aside className="col-span-1">
                    <header className="col-span-3 flex items-center mb-8">
                        <Logo className="h-14 w-14 mr-3" />
                        <h1 className="text-4xl font-normal text-center">urbit</h1> 
                    </header>
                    <nav>
                        <h2 className="font-semibold px-2 mb-1">Boot Menu</h2>
                        <ul className="min-w-52 divide-y text-gray-400">
                            <li className="border-gray-700">
                                <Link to="/boot/comet" className="group flex items-center px-2 py-1 hover:text-white focus:text-white default-ring transition-colors no-underline">
                                    Comet
                                    <RightArrow className="ml-auto w-7 h-7" secondary="fill-current text-gray-500 group-focus:text-white group-hover:text-white transition-colors" />
                                </Link>
                            </li>
                            <li className="border-gray-700">
                                <Link to="/boot/existing" className="group flex items-center px-2 py-1 hover:text-white focus:text-white default-ring transition-colors no-underline">
                                    Existing Ship
                                    <RightArrow className="ml-auto w-7 h-7" secondary="fill-current text-gray-500 group-focus:text-white group-hover:text-white transition-colors" />
                                </Link>
                            </li>
                            <li className="border-gray-700">
                                <Link to="/boot/remote" className="group flex items-center px-2 py-1 hover:text-white focus:text-white default-ring transition-colors no-underline">
                                    Remote Ship
                                    <RightArrow className="ml-auto w-7 h-7" secondary="fill-current text-gray-500 group-focus:text-white group-hover:text-white transition-colors" />
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </aside>
                <section className="col-span-2">
                    <nav className="mt-6">
                        <h2 className="font-semibold px-2 mb-2">Ships</h2>
                        <ShipList piers={piers} />
                    </nav>
                </section>
            </div>                               
        </Layout>
    )
}