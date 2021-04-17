import React from 'react'
import { send } from '../client/ipc'
import { DetailsContainer } from './DetailsContainer'
import { useAddPier } from './useAddPier'

export const CometDetails: React.FC = () => {
    const {
        form,
        mutate,
        invalidName,
        nameValidator
    } = useAddPier(data => send('add-pier', { ...data, type: 'comet' }));

    const { isValid } = form.formState;

    return (
        <DetailsContainer
            title="Comet Details"
            buttonDisabled={!isValid}
            onSubmit={form.handleSubmit(data => mutate(data))}
        >
            <h1 className="font-semibold text-base mb-2">Enter Comet Details</h1>
            <div>
                <label htmlFor="name">Name <span className="text-gray-700">(local only)</span></label>
                <input 
                    id="name" 
                    name="name" 
                    type="text"
                    ref={form.register({ 
                        required: true,
                        validate: nameValidator
                    })}
                    className="flex w-full px-2 py-1 mt-2 -mx-2 bg-transparent border border-gray-700 focus:outline-none focus:border-gray-500 transition-colors rounded" 
                    placeholder="My Comet"
                    aria-invalid={invalidName}
                />
                <span className={`inline-block mt-2 text-sm text-red-600 ${invalidName ? 'visible' : 'invisible'}`} role="alert">
                    Name must be unique
                </span>
            </div>
        </DetailsContainer>
    )
}