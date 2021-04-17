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
import { routes } from '../routes'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown } from '../icons/ChevronDown'
import { pierKey } from '../query-keys'

const CenteredLayout = () => (
    <Layout title="Welcome" className="px-8">
        <section className="max-w-4xl">
            <div className="flex flex-col items-center">
                <Logo className="h-40 w-40 text-white" />
                <h1 className="text-2xl mt-8 mb-20 text-center">Welcome to Urbit</h1>
            </div>
            <nav>
                <BootOptions className="grid gap-8 grid-cols-1 sm:grid-cols-3" />
            </nav>
        </section>
    </Layout>
)

export const Welcome = () => {
    const { data: piers, isIdle, isLoading } = useQuery(pierKey(), async () => await send('get-piers'))

    if (isIdle || isLoading) {
        return <Layout title="Welcome">
            <Spinner className="h-24 w-24" />
        </Layout>
    }

    if (!piers || piers.length === 0) {
        return <CenteredLayout />
    }

    return (
        <Layout title="Welcome">
            <div className="grid grid-cols-3 gap-x-12 gap-y-8 max-w-3xl">
                <aside className="col-span-1">
                    <header className="col-span-3 flex items-center justify-end mb-4">
                        <Logo className="h-14 w-14 mr-3" />
                        <h1 className="text-4xl font-normal text-center">urbit</h1> 
                    </header>
                    <nav className="flex justify-end min-w-48 pl-16">
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger className="button text-sm">
                                Boot Menu
                                <ChevronDown className="ml-3 w-5 h-5" primary="fill-current" />
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content as="ul" align="end" sideOffset={-30} className="min-w-52 text-sm text-gray-400 bg-gray-900 rounded shadow-lg">
                                { routes.map(route => (
                                    <li className="border-gray-700">
                                        <Link to={route.path} className="group flex items-center px-5 py-2 hover:text-white focus:text-white focus:outline-none focus:ring-0 transition-colors no-underline">
                                            { route.title }
                                            <RightArrow className="ml-auto w-5 h-5" secondary="fill-current text-gray-500 group-focus:text-white group-hover:text-white transition-colors" primary="fill-current text-transparent" />
                                        </Link>
                                    </li>
                                ))}
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>
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