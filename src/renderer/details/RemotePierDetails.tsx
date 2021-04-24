import React from 'react'
import { send } from '../client/ipc'
import { DetailsContainer } from './DetailsContainer'
import { useAddPier } from './useAddPier'

export const RemotePierDetails = () => {
    const {
        mutate,
        form,
        nameNotUnique,
        nameValidator
    } = useAddPier((data) => {
        return send('add-pier', { 
            ...data,
            booted: true,
            running: true, 
            type: 'remote' 
        })
    }, false)

    const { isValid } = form.formState;

    return (
        <DetailsContainer
            title="Remote Ship Details"
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
                    aria-invalid={nameNotUnique}
                />
                <span className={`inline-block mt-2 text-sm text-red-600 ${nameNotUnique ? 'visible' : 'invisible'}`} role="alert">
                    Name must be unique
                </span>
            </div>
            <div>
                <label htmlFor="directory">URL</label>
                <input 
                    id="directory" 
                    name="directory"
                    type="text"
                    ref={form.register({ required: true })}
                    className="flex w-full px-2 py-1 mt-2 bg-transparent border border-gray-700 focus:outline-none focus:border-gray-500 transition-colors rounded" 
                    placeholder="https://myurbit.com"
                />
            </div>
        </DetailsContainer>
    )
}