import React from 'react'
import qs from 'query-string'
import { useQuery } from 'react-query'
import { Link, Redirect, useHistory } from 'react-router-dom'
import { send } from '../client/ipc'
import { LeftArrow } from '../icons/LeftArrow'
import { Layout } from '../shared/Layout'

export const CometDirectory = () => {
    const history = useHistory();

    async function setDirectory() {
        const directory = await send('get-directory')
        
        if (directory)
            history.push({
                pathname: '/boot/comet/details',
                search: qs.stringify({ directory })
            })
    }

    return (
        <Layout title="Choose Comet Directory" className="relative flex justify-center items-center min-content-area-height">            
            <section className="flex items-center max-w-xl">
                <div className="mr-12">
                    <Link to="/" className="group focus:outline-none no-underline">
                        <LeftArrow className="w-8 h-8" secondary="fill-current text-gray-700 group-hover:text-gray-600 group-focus:text-gray-600 transition-colors"/>
                        <span className="sr-only">Back</span>
                    </Link>
                </div>
                <div>
                    <label htmlFor="directory">Choose directory to save your comet</label>
                    <div className="flex items-stretch mt-2 text-sm">
                        <input 
                            id="directory" 
                            name="directory" 
                            type="text"
                            className="flex-1 px-2 py-1 bg-transparent border border-r-0 border-gray-700 focus:outline-none focus:border-gray-500 transition-colors rounded rounded-r-none" 
                            placeholder="/Users/my-user/comet" 
                        />
                        <button className="flex-auto flex justify-center items-center px-2 py-1 bg-transparent border border-gray-700 hover:border-white focus:outline-none focus:border-white focus:ring focus:ring-gray-600 focus:ring-opacity-50 transition-colors rounded rounded-l-none">
                            Choose Directory
                        </button>
                    </div>
                </div>
                <div className="ml-12 w-8" />
            </section>
        </Layout>
    )
}