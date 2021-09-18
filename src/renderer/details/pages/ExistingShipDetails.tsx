import React from 'react'
import { Controller } from 'react-hook-form'
import { AddPier } from '../../../background/services/pier-service'
import { send } from '../../client/ipc'
import { DetailsContainer } from '../components/DetailsContainer'
import { NameField } from '../components/NameField'
import { useAddPier } from '../useAddPier'

export const ExistingShipDetails = () => {
    const {
        form,
        mutate
    } = useAddPier<AddPier & { shipStays?: boolean }>(data => {
        const toSend: AddPier = { ...data, status: 'booted' };
        return data.shipStays ? 
            send('add-pier', { ...toSend, directoryAsPierPath: true }) : 
            send('collect-existing-pier', toSend)
    }, false);
    const { isValid } = form.formState;

    async function setDirectory() {
        return await send('get-directory')
    }

    return (
        <DetailsContainer 
            title="Existing Ship Details" 
            buttonDisabled={!isValid} 
            onSubmit={form.handleSubmit(data => mutate(data))}
        >
            <h1 className="font-semibold text-base mb-6">Enter Ship Details</h1>
            <div>
                <label htmlFor="name">Name <span className="text-gray-300 dark:text-gray-700">(local only)</span></label>
                <NameField form={form} />
            </div>
            <div className="mb-8">
                <label htmlFor="type">Ship Type</label>
                <select name="type" ref={form.register({ required: true })} className="input ml-3 bg-white dark:bg-black">
                    <option value="planet">Planet</option>
                    <option value="star">Star</option>
                    <option value="moon">Moon</option>
                    <option value="comet">Comet</option>
                    <option value="devship">Development ship</option>
                </select>
            </div>
            <div className="mb-3">
                <label htmlFor="directory">Upload Pier</label>
                <div className="flex items-stretch mt-2">
                    <Controller
                        name="directory"
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
                                    className="input flex-1 border border-r-0 rounded-r-none" 
                                    placeholder="/Users/my-user/sampel-palnet"
                                    readOnly={true}
                                    onClick={async () => onChange(await setDirectory())} 
                                />
                                <button type="button" className="input flex-none flex justify-center items-center hover:border-black focus:border-black dark:hover:border-white dark:focus:border-white default-ring rounded-l-none" onClick={async () => onChange(await setDirectory())}>
                                    Choose Directory
                                </button>
                            </>
                        )}
                    />
                </div>
            </div>
            <div className="flex items-center text-gray-500 dark:text-gray-400">
                <input id="keep-in-place" type="checkbox" name="shipStays" ref={form.register} className="mr-2"/>
                <label htmlFor="keep-in-place">Keep pier in current directory</label>
            </div>
        </DetailsContainer>
    )
}