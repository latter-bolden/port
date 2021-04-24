import React from 'react'
import { UseFormMethods, Validate } from 'react-hook-form/dist/types'
import { AddPier } from '../../../background/services/pier-service'

interface ShipNameFieldProps {
    form: UseFormMethods<AddPier>;
    placeholder?: string;
    validator?: Validate;
}

export const ShipNameField: React.FC<ShipNameFieldProps> = ({ form, validator, placeholder = '~sampel-palnet' }) => {
    const shipnamePattern = /^[a-z~-]*$/i;
    const shipnameContainsInvalidCharacters = form.errors.shipName?.type === 'pattern';

    return (
        <>
            <input 
                id="shipname" 
                name="shipName" 
                type="text"
                ref={form.register({ 
                    required: true,
                    pattern: shipnamePattern,
                    validate: validator
                })}
                className="flex w-full px-2 py-1 mt-2 bg-transparent border border-gray-700 focus:outline-none focus:border-gray-500 transition-colors rounded" 
                placeholder={placeholder}
                aria-invalid={!!form.errors.shipName}
            />
            <span className={`inline-block h-8.5 mt-2 text-xs text-red-600 ${form.errors.shipName ? 'visible' : 'invisible'}`} role="alert">
                { form.errors.shipName?.type === 'required' && 'Ship name is required'}
                { (!form.errors.shipName || shipnameContainsInvalidCharacters) && 'Ship name must only contain alphanumeric, dash, underscore, or tilde characters' }
            </span>
        </>
    )
}