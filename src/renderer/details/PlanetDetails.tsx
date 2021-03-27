import React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from 'react-query'
import { Link, useHistory } from 'react-router-dom'
import { AddPier, Pier } from '../../background/services/pier-service'
import { send } from '../client/ipc'
import { LeftArrow } from '../icons/LeftArrow'
import { RightArrow } from '../icons/RightArrow'
import { Layout } from '../shared/Layout'

export const PlanetDetails: React.FC = () => {
    const history = useHistory();
    const queryClient = useQueryClient();
    const { register, handleSubmit, control, formState: { isValid } } = useForm<AddPier>({
        mode: 'onChange'
    });
    const { mutate } = useMutation((data: AddPier) => send('add-pier', {...data, type: 'planet' }), {
        onSuccess: (pier: Pier) => {
            if (!pier)
                return;

            queryClient.setQueryData(['pier', pier.slug], pier);
            history.push(`/boot/${pier.slug}`)
        }
    })

    async function setFile() {
        return await send('get-file')
    }

    function onSubmit(data: AddPier) {
        mutate(data)
    }

    return (
        <Layout title="Boot a Planet" className="relative flex justify-center items-center min-content-area-height">            
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
                        <label htmlFor="shipname">Shipname <span className="text-gray-700">(Urbit ID)</span></label>
                        <input 
                            id="shipname" 
                            name="shipName" 
                            type="text"
                            ref={register({ required: true })}
                            className="flex w-full px-2 py-1 mt-2 bg-transparent border border-gray-700 focus:outline-none focus:border-gray-500 transition-colors rounded" 
                            placeholder="~sampel-palnet" 
                        />
                    </div>
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
                        <label htmlFor="directory">Key File</label>
                        <div className="flex items-stretch mt-2">
                            <Controller
                                name="keyFile"
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
                                            placeholder="/Users/my-user/sampel-palnet.key"
                                            readOnly={true}
                                            onClick={async () => onChange(await setFile())} 
                                        />
                                        <button type="button" className="flex-none flex justify-center items-center px-2 py-1 bg-transparent border border-gray-700 hover:border-white focus:outline-none focus:border-white focus:ring focus:ring-gray-600 focus:ring-opacity-50 transition-colors rounded rounded-l-none" onClick={async () => onChange(await setFile())}>
                                            Choose Key File
                                        </button>
                                    </>
                                )}
                            />
                        </div>
                    </div>
                </div>
                <div className="ml-12">
                    <button type="submit" className="flex items-center text-gray-500 hover:text-white focus:text-white default-ring disabled:text-gray-700 transition-colors" disabled={!isValid}>
                        Continue
                        <RightArrow className="ml-1 w-7 h-7" secondary="fill-current" />
                    </button>
                </div>
            </form>
        </Layout>
    )
}