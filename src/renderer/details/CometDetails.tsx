import React from 'react'
import { send } from '../client/ipc'
import { DetailsContainer } from './DetailsContainer'
import { useAddPier } from './useAddPier'

export const CometDetails: React.FC = () => {
    const {
        form,
        mutate,
        namePattern,
        nameValidator,
        nameNotUnique,
        nameContainsInvalidCharacters
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
                        pattern: namePattern,
                        validate: nameValidator
                    })}
                    className="flex w-full px-2 py-1 mt-2 -mx-2 bg-transparent border border-gray-700 focus:outline-none focus:border-gray-500 transition-colors rounded" 
                    placeholder="My Comet"
                    aria-invalid={!!form.errors.name}
                />
                <span className={`inline-block mt-2 text-sm text-red-600 ${form.errors.name ? 'visible' : 'invisible'}`} role="alert">
                    { form.errors.name.type === 'required' && 'Name is required'}
                    { nameNotUnique && 'Name must be unique' }
                    { nameContainsInvalidCharacters && 'Name must only contain alphanumeric, dash, underscore, or space characters' }
                </span>
            </div>
        </DetailsContainer>
    )
}