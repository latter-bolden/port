import React from 'react'
import { UseFormMethods, Validate } from 'react-hook-form/dist/types'
import { AddPier } from '../../../background/services/pier-service'

interface ShipNameFieldProps {
    form: UseFormMethods<AddPier>;
    placeholder?: string;
    validator?: Validate;
}

export const PortField: React.FC<ShipNameFieldProps> = ({ form, validator, placeholder = 'default' }) => {
    return (
        <>
            <input 
                id="amesPort" 
                name="amesPort" 
                type="number"
                ref={form.register({ 
                    validate: validator,
                    min: 1024,
                    max: 65535
                })}
                className="input flex w-full mt-2" 
                placeholder={placeholder}
                aria-invalid={!!form.errors.shipName}
            />
            <span className={`inline-block h-8.5 mt-2 text-xs text-red-600 ${form.errors.amesPort ? 'visible' : 'invisible'}`} role="alert">
              Invalid port. Must be a number between 1024-65535
            </span>
        </>
    )
}