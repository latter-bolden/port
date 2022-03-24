import React from 'react'
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom'
import { UseFormMethods, Validate } from 'react-hook-form/dist/types'
import { Pier, AddPier } from '../../../background/services/pier-service'
import { send } from '../../client/ipc';
import { pierKey } from '../../query-keys';

interface ShipNameFieldProps {
    form: UseFormMethods<AddPier>;
    placeholder?: string;
    validator?: Validate;
}

export const ShipNameField: React.FC<ShipNameFieldProps> = ({ form, validator, placeholder = '~sampel-palnet' }) => {
    const { data: piers } = useQuery(pierKey(), () => send('get-piers'))
    const shipnamePattern = /^[a-z~-]*$/i;
    const shipnameContainsInvalidCharacters = form.errors.shipName?.type === 'pattern';

    function getMatchingPier(shipName: string): Pier | undefined {
        return piers.find(pier => pier.shipName.trim().toLowerCase() === shipName.toLowerCase())
    }
    const shipNameValidator = (value: string) => !getMatchingPier(value)

    return (
        <>
            <input 
                id="shipname" 
                name="shipName" 
                type="text"
                ref={form.register({ 
                    required: true,
                    pattern: shipnamePattern,
                    validate: validator ? validator : shipNameValidator,
                    maxLength: 28
                })}
                className="input flex w-full mt-2" 
                placeholder={placeholder}
                aria-invalid={!!form.errors.shipName}
            />
            <span className={`inline-block h-8.5 mt-2 text-xs text-red-600 ${form.errors.shipName ? 'visible' : 'invisible'}`} role="alert">
                { form.errors.shipName?.type === 'required' && 'Ship name is required'}
                { form.errors.shipName?.type === 'maxLength' && 'Ship name must be 28 characters or less'}
                { (!form.errors.shipName || shipnameContainsInvalidCharacters) && 'Ship name must only contain alphanumeric, dash, underscore, or tilde characters' }
                { form.errors.shipName?.type === 'validate' && 
                    <span>
                        A ship with this name <Link to={`/pier/${getMatchingPier(form.getValues().shipName).slug}`}>is already docked</Link> in Port.
                    </span>
                }
            </span>
        </>
    )
}