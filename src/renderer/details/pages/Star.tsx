import React from 'react'
import { send } from '../../client/ipc'
import { DetailsContainer } from '../components/DetailsContainer'
import { KeyfileField } from '../components/KeyfileField'
import { NameField } from '../components/NameField'
import { ShipNameField } from '../components/ShipNameField'
import { useAddPier } from '../useAddPier'

export const Star: React.FC = () => {
    const {
        form,
        mutate
    } = useAddPier(data => send('add-pier', { ...data, type: 'star' }));
    const { isValid } = form.formState;

    return (
        <DetailsContainer
            title="Boot a Star"
            buttonDisabled={!isValid}
            onSubmit={form.handleSubmit(data => mutate(data))}
        >
            <h1 className="font-semibold text-base mb-6">Enter Ship Details</h1>
            <div>
                <label htmlFor="name">Name <span className="text-gray-300 dark:text-gray-700">(local only)</span></label>
                <NameField form={form} />
            </div>
            <div>
                <label htmlFor="shipname">Shipname <span className="text-gray-300 dark:text-gray-700">(Urbit ID)</span></label>
                <ShipNameField form={form} />
            </div>
            <div>
                <label htmlFor="directory">Key File</label>
                <KeyfileField form={form} rules={{ required: true }} />
            </div>
        </DetailsContainer>
    )
}