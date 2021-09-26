import React from 'react'
import { UseFormMethods, Validate } from 'react-hook-form/dist/types'
import { AddPier } from '../../../background/services/pier-service'

interface ArgumentsFieldProps {
    form: UseFormMethods<AddPier>;
    placeholder?: string;
    validator?: Validate;
}

export const ArgumentsField: React.FC<ArgumentsFieldProps> = ({ form, validator, placeholder = '-v' }) => {
    const argsPattern = /^-.*$/i;
    //const argsContainsInvalidCharacters = form.errors.spawnArgs?.type === 'pattern';

    return (
        <>
            <input 
                id="spawnArgs" 
                name="spawnArgs" 
                type="text"
                ref={form.register({ 
                    required: false,
                    pattern: argsPattern,
                    validate: validator,
                })}
                className="input flex w-full mt-2" 
                placeholder={placeholder}
                //aria-invalid={!!form.errors.spawnArgs}
            />
        </>
    )
}