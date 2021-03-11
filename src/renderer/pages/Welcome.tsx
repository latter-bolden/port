import React from 'react'
import { useQuery } from 'react-query'
import { send } from '../client/ipc'
import { Logo } from '../icons/Logo'
import { BootOptions } from '../pier/BootOptions'
import { ShipList } from '../pier/ShipList'
import { Layout } from '../shared/Layout'

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
    const { data: piers } = useQuery('piers', async () => await send('get-piers'))

    if (!piers || piers.length === 0) {
        return <CenteredLayout />
    }

    return (
        <Layout title="Welcome" className="flex justify-center items-center min-content-area-height">
            <div className="grid grid-cols-3 gap-x-12 gap-y-8 max-w-3xl">
                <header className="col-span-3 flex items-center">
                    <Logo className="h-14 w-14 mr-3" />
                    <h1 className="text-4xl font-normal text-center">urbit</h1> 
                </header>
                <aside className="col-span-1">
                    <nav>
                        <BootOptions className="grid gap-8 grid-cols-1" />
                    </nav>
                </aside>
                <section className="col-span-2">
                    <nav className="">
                        <h2 className="font-semibold px-2">Ships</h2>
                        <ShipList piers={piers} />
                    </nav>
                </section>
            </div>                               
        </Layout>
    )
}