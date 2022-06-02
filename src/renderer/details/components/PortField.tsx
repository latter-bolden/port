import React from 'react'
import { UseFormMethods, Validate } from 'react-hook-form/dist/types'
import { AddPier } from '../../../background/services/pier-service'

export type PortType = 'ames' | 'http' | 'https'

interface ShipNameFieldProps {
    type: PortType
    form: UseFormMethods<AddPier>;
    placeholder?: string;
    validator?: Validate;
}

export const PortField: React.FC<ShipNameFieldProps> = ({ type, form, validator, placeholder = 'default' }) => {
    const FIELD_ID = `${type}Port`

    return (
        <>
            <input 
                id={FIELD_ID}
                name={FIELD_ID}
                type="number"
                ref={form.register({ 
                    validate: validator,
                    min: 1024,
                    max: 65535
                })}
                className="input flex w-full"
                placeholder={placeholder}
                aria-invalid={!!form.errors[FIELD_ID]}
            />
            <span className={`inline-block h-8.5 mt-2 text-xs text-red-600 ${form.errors[FIELD_ID] ? 'visible' : 'invisible'}`} role="alert">
              Invalid port. Must be a number between 1024-65535
            </span>
        </>
    )
}