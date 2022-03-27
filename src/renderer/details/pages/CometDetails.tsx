import React from 'react'
import { send } from '../../client/ipc'
import { DetailsContainer } from '../components/DetailsContainer'
import { NameField } from '../components/NameField'
import { AdvancedOptions } from '../components/AdvancedOptions'
import { useAddPier } from '../useAddPier'

export const CometDetails: React.FC = () => {
    const {
        form,
        mutate
    } = useAddPier(data => send('add-pier', { ...data, type: 'comet' }));

    const { isValid } = form.formState;

    return (
        <DetailsContainer
            title="Comet Details"
            buttonDisabled={!isValid}
            onSubmit={form.handleSubmit(data => mutate(data))}
        >
            <h1 className="font-semibold text-base mb-4">Enter Comet Details</h1>
            <div>
                <label htmlFor="name">Name <span className="text-gray-300 dark:text-gray-700">(local only)</span></label>
                <NameField form={form} />
            </div>
            <AdvancedOptions form={form} />
        </DetailsContainer>
    )
}