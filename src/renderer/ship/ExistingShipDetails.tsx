import React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useQueryClient } from 'react-query'
import { Link, useHistory } from 'react-router-dom'
import { AddPier } from '../../background/services/pier-service'
import { send } from '../client/ipc'
import { LeftArrow } from '../icons/LeftArrow'
import { RightArrow } from '../icons/RightArrow'
import { Layout } from '../shared/Layout'

export const ExistingShipDetails = () => {
    const history = useHistory();
    const queryClient = useQueryClient();
    const { register, handleSubmit, control, formState: { isValid } } = useForm<AddPier>({
        mode: 'onChange'
    });

    async function setDirectory() {
        return await send('get-directory')
    }

    async function onSubmit(data) {
        const pier = await send('add-pier', { ...data, booted: true })

        if (!pier)
            return;

        queryClient.setQueryData(['pier', pier.slug], pier);
        history.push(`/pier/${pier.slug}/launch`)
    }

    return (
        <Layout title="Existing Ship Details" className="relative flex justify-center items-center min-content-area-height">            
            <form className="flex items-center w-full max-w-xl" onSubmit={handleSubmit(onSubmit)}>
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
                        <label htmlFor="type">Ship Type</label>
                        <select name="type" ref={register({ required: true })} className="px-2 py-1 ml-3 bg-transparent border border-gray-700 focus:outline-none focus:border-gray-500 transition-colors rounded">
                            <option value="planet">Planet</option>
                            <option value="moon">Moon</option>
                            <option value="comet">Comet</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="directory">Upload Pier</label>
                        <div className="flex items-stretch mt-2">
                            <Controller
                                name="directory"
                                control={control}
                                defaultValue=""
                                rules={{ required: true }}
                                render={({ value, onChange, name }) => (
                                    <>
                                        <input 
                                            id="directory" 
                                            name={name} 
                                            type="text"
                                            value={value}
                                            className="flex-1 px-2 py-1 bg-transparent border border-r-0 border-gray-700 focus:outline-none focus:border-gray-500 transition-colors rounded rounded-r-none" 
                                            placeholder="/Users/my-user/sampel-palnet"
                                            readOnly={true}
                                            onClick={async () => onChange(await setDirectory())} 
                                        />
                                        <button type="button" className="flex-none flex justify-center items-center px-2 py-1 bg-transparent border border-gray-700 hover:border-white focus:outline-none focus:border-white focus:ring focus:ring-gray-600 focus:ring-opacity-50 transition-colors rounded rounded-l-none" onClick={async () => onChange(await setDirectory())}>
                                            Choose Directory
                                        </button>
                                    </>
                                )}
                            />
                        </div>
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