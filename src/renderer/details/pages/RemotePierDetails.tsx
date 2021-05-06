import React from 'react'
import { send } from '../../client/ipc'
import { DetailsContainer } from '../components/DetailsContainer'
import { NameField } from '../components/NameField'
import { useAddPier } from '../useAddPier'

export const RemotePierDetails = () => {
    const {
        mutate,
        form
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
            <h1 className="font-semibold text-base mb-6">Enter Ship Details</h1>
            <div>
                <label htmlFor="name">Name <span className="text-gray-300 dark:text-gray-700">(local only)</span></label>
                <NameField form={form} />
            </div>
            <div>
                <label htmlFor="directory">URL</label>
                <input 
                    id="directory" 
                    name="directory"
                    type="text"
                    ref={form.register({ 
                        required: true, 
                        pattern: /^(?:http(s)?:\/\/)[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/
                    })}
                    className="input flex w-full mt-2" 
                    placeholder="https://myurbit.com"
                />
                <span className={`inline-block h-8.5 mt-2 text-xs text-red-600 ${form.errors?.directory ? 'visible' : 'invisible'}`} role="alert">
                    { form.errors.directory?.type === 'required' && 'Url is required'}
                    { (!form.errors.directory || form.errors.directory.type === 'pattern') && 'Url must be valid and include protocol, e.g. https://myurbit.com' }
                </span>
            </div>
        </DetailsContainer>
    )
}