import React from 'react'
import { Controller } from 'react-hook-form'
import { send } from '../client/ipc'
import { DetailsContainer } from './DetailsContainer'
import { useAddPier } from './useAddPier'

export const PlanetDetails: React.FC = () => {
    const {
        form,
        mutate,
        invalidName,
        nameValidator
    } = useAddPier(data => send('add-pier', { ...data, type: 'planet' }));
    const { isValid } = form.formState;

    async function setFile() {
        return await send('get-file')
    }

    return (
        <DetailsContainer
            title="Boot a Planet"
            buttonDisabled={!isValid}
            onSubmit={form.handleSubmit(data => mutate(data))}
        >
            <h1 className="font-semibold text-base mb-2">Enter Ship Details</h1>
            <div>
                <label htmlFor="name">Name <span className="text-gray-700">(local only)</span></label>
                <input 
                    id="name" 
                    name="name" 
                    type="text"
                    ref={form.register({ required: true, validate: nameValidator })}
                    className="flex w-full px-2 py-1 mt-2 bg-transparent border border-gray-700 focus:outline-none focus:border-gray-500 transition-colors rounded" 
                    placeholder="My Ship" 
                    aria-invalid={invalidName}
                />
                <span className={`inline-block mt-2 text-sm text-red-600 ${invalidName ? 'visible' : 'invisible'}`} role="alert">
                    Name must be unique
                </span>
            </div>
            <div>
                <label htmlFor="shipname">Shipname <span className="text-gray-700">(Urbit ID)</span></label>
                <input 
                    id="shipname" 
                    name="shipName" 
                    type="text"
                    ref={form.register({ required: true })}
                    className="flex w-full px-2 py-1 mt-2 bg-transparent border border-gray-700 focus:outline-none focus:border-gray-500 transition-colors rounded" 
                    placeholder="~sampel-palnet"
                />
            </div>
            <div>
                <label htmlFor="directory">Key File</label>
                <div className="flex items-stretch mt-2">
                    <Controller
                        name="keyFile"
                        control={form.control}
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
        </DetailsContainer>
    )
}