import React from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useQueryClient } from 'react-query'
import { Link, useHistory } from 'react-router-dom'
import { AddPier } from '../../background/services/pier-service'
import { send } from '../client/ipc'
import { LeftArrow } from '../icons/LeftArrow'
import { RightArrow } from '../icons/RightArrow'
import { pierKey } from '../query-keys'
import { Layout } from '../shared/Layout'

export const CometDetails: React.FC = () => {
    const history = useHistory();
    const queryClient = useQueryClient();
    const { register, handleSubmit, formState: { isValid } } = useForm<AddPier>({
        mode: 'onChange'
    });
    const { data: comet } = useQuery(pierKey())

    async function onSubmit(data) {
        const pier = await send('add-pier', { ...data, type: 'comet' })

        if (!pier)
            return;

        queryClient.setQueryData(pierKey(pier.slug), pier);
        history.push(`/boot/${pier.slug}`)
    }

    return (
        <Layout title="Comet Details" className="relative flex justify-center items-center min-content-area-height">            
            <form className="flex items-center max-w-xl" onSubmit={handleSubmit(onSubmit)}>
                <div className="mr-12">
                    <Link to="/" className="group focus:outline-none no-underline">
                        <LeftArrow className="w-7 h-7" secondary="fill-current text-gray-700 group-hover:text-gray-600 group-focus:text-gray-600 transition-colors"/>
                        <span className="sr-only">Back</span>
                    </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 text-sm">
                    <h1 className="font-semibold text-base mb-2">Enter Comet Details</h1>
                    <div>
                        <label htmlFor="name">Name <span className="text-gray-700">(local only)</span></label>
                        <input 
                            id="name" 
                            name="name" 
                            type="text"
                            ref={register({ required: true })}
                            className="flex w-full px-2 py-1 mt-2 bg-transparent border border-gray-700 focus:outline-none focus:border-gray-500 transition-colors rounded" 
                            placeholder="My Comet" 
                        />
                    </div>
                </div>
                <div className="ml-12">
                    <button type="submit" className="flex items-center text-gray-500 hover:text-white focus:text-white disabled:text-gray-700 transition-colors" disabled={!isValid}>
                        Continue
                        <RightArrow className="ml-1 w-7 h-7" secondary="fill-current" />
                    </button>
                </div>
            </form>
        </Layout>
    )
}