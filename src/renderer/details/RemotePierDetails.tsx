import React from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient } from 'react-query'
import { Link, useHistory } from 'react-router-dom'
import { AddPier } from '../../background/services/pier-service'
import { send } from '../client/ipc'
import { LeftArrow } from '../icons/LeftArrow'
import { RightArrow } from '../icons/RightArrow'
import { Layout } from '../shared/Layout'

export const RemotePierDetails = () => {
    const history = useHistory();
    const queryClient = useQueryClient();
    const { register, handleSubmit, formState: { isValid } } = useForm<AddPier>({
        mode: 'onChange'
    });

    async function onSubmit(data) {
        const pier = await send('add-pier', { 
            ...data,
            booted: true,
            running: true, 
            type: 'remote' 
        })

        if (!pier)
            return;

        queryClient.setQueryData(['pier', pier.slug], pier);
        history.push(`/pier/${pier.slug}/launch`)
    }

    return (
        <Layout title="Remote Ship Details" className="relative flex justify-center items-center min-content-area-height">            
            <form className="flex items-center w-full max-w-lg" onSubmit={handleSubmit(onSubmit)}>
                <div className="mr-12">
                    <Link to="/" className="group focus:outline-none no-underline">
                        <LeftArrow className="w-7 h-7" secondary="fill-current text-gray-700 group-hover:text-gray-600 group-focus:text-gray-600 transition-colors"/>
                        <span className="sr-only">Back</span>
                    </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 w-full text-sm ">
                    <h1 className="font-semibold text-base mb-2">Enter Ship Details</h1>
                    <div>
                        <label htmlFor="name">Name <span className="text-gray-700">(local only)</span></label>
                        <input 
                            id="name" 
                            name="name" 
                            type="text"
                            ref={register({ required: true })}
                            className="flex w-full px-2 py-1 mt-2 bg-transparent border border-gray-700 focus:outline-none focus:border-gray-500 transition-colors rounded" 
                            placeholder="My Ship" 
                        />
                    </div>
                    <div>
                        <label htmlFor="directory">URL</label>
                        <input 
                            id="directory" 
                            name="directory"
                            type="text"
                            ref={register({ required: true })}
                            className="flex w-full px-2 py-1 mt-2 bg-transparent border border-gray-700 focus:outline-none focus:border-gray-500 transition-colors rounded" 
                            placeholder="https://myurbit.com"
                        />
                    </div>
                    <div>
                        <input 
                            id="defaultShip"
                            type="checkbox"
                            name="default"
                            ref={register}
                            defaultChecked={true}
                        />
                        <label htmlFor="defaultShip" className="ml-2">Use as default ship</label>
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