import React from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { send } from '../client/ipc'
import { RightArrow } from '../icons/RightArrow'
import { Layout } from '../shared/Layout'

export const Welcome = () => {
    const { data: piers } = useQuery('piers', async () => await send('get-piers'))

    return (
        <Layout title="Welcome" className="flex justify-center items-center min-content-area-height">
            <section className="max-w-xl">
                <div className="flex flex-col items-center">
                    <svg className="h-40 w-40" viewBox="0 0 216 216" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M108 195.75C59.537 195.75 20.25 156.463 20.25 108C20.25 59.537 59.537 20.25 108 20.25C156.463 20.25 195.75 59.537 195.75 108C195.75 156.463 156.463 195.75 108 195.75Z" stroke="white" strokeWidth="13.5"/>
                        <path d="M148.5 94.8294H132.507C131.302 101.909 128.207 106.189 122.704 106.189C112.729 106.189 107.054 94.5 91.5766 94.5C76.6145 94.5 68.7035 103.72 67.5 121.335H83.4935C84.6977 114.091 87.7932 109.811 93.4679 109.811C103.442 109.811 108.774 121.5 124.596 121.5C139.213 121.5 147.296 112.28 148.5 94.8294Z" fill="white"/>
                    </svg>
                    <h1 className="text-2xl mt-8 mb-20 text-center">Welcome to Urbit</h1>
                </div>
                <nav>
                    <ul className="grid gap-8 grid-cols-2">
                        <li>
                            <Link to="/boot/planet" className="block w-full p-4 border border-gray-700 hover:border-white focus:border-white transition-colors rounded">
                                <strong className="block font-semibold mb-2">Have an ID already?</strong>
                                <span className="text-gray-300">Boot your planet with the key or pier</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/boot/comet" className="block w-full p-4 border border-gray-700 hover:border-white focus:border-white transition-colors rounded">
                                <strong className="block font-semibold mb-2">Start without an ID</strong>
                                <span className="text-gray-300">Generate a disposable identity and boot as a comet</span>
                            </Link>
                        </li>
                    </ul>
                </nav>
                {piers &&
                    <nav className="max-w-md mx-auto mt-10">
                        <h2 className="font-semibold px-2">Ships</h2>
                        <ul>
                            {piers.sort((a,b) => b.lastUsed.localeCompare(a.lastUsed)).map(pier => (
                                <li key={pier.slug}>
                                    <Link className="group flex items-center px-2 py-1 border-b border-gray-700 hover:border-white focus:border-white focus:outline-none transition-colors no-underline" to={`/pier/launch/${pier.slug}`}>
                                        {pier.name}
                                        <RightArrow className="ml-auto w-7 h-7" secondary="fill-current text-gray-500 group-focus:text-white group-hover:text-white transition-colors" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                }
            </section>
        </Layout>
    )
}