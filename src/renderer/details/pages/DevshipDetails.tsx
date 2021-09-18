import React from 'react'
import { send } from '../../client/ipc'
import { DetailsContainer } from '../components/DetailsContainer'
import { NameField } from '../components/NameField'
import { ShipNameField } from '../components/ShipNameField'
import { useAddPier } from '../useAddPier'

export const DevshipDetails: React.FC = () => {
    const {
        form,
        mutate
    } = useAddPier(data => send('add-pier', { ...data, type: 'devship' }));

    const { isValid } = form.formState;

    return (
        <DetailsContainer
            title="Development ship details"
            buttonDisabled={!isValid}
            onSubmit={form.handleSubmit(data => mutate(data))}
        >
            <h1 className="font-semibold text-base mb-4">Enter development ship details</h1>
            <div>
                <label htmlFor="name">Name <span className="text-gray-300 dark:text-gray-700">(local only)</span></label>
                <NameField form={form} />
            </div>
            <div>
                <label htmlFor="shipname">Shipname <span className="text-gray-300 dark:text-gray-700">(Urbit ID)</span></label>
                <ShipNameField form={form} />
            </div>
        </DetailsContainer>
    )
}
