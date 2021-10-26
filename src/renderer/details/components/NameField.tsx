import React from 'react'
import { UseFormMethods } from 'react-hook-form/dist/types';
import { useQuery } from 'react-query';
import { AddPier, UpdatePier} from '../../../background/services/pier-service';
import { send } from '../../client/ipc';
import { pierKey } from '../../query-keys';

interface NameFieldProps {
    form: UseFormMethods<AddPier | UpdatePier>
}

export const NameField: React.FC<NameFieldProps> = ({ form }) => {
    const { data: piers } = useQuery(pierKey(), () => send('get-piers'))
    
    function nameValidator(value: string) {
        return !piers.find(pier => pier.name.toLocaleLowerCase() === value.toLocaleLowerCase())
    }
    
    const namePattern = /^[\w_ -]*$/i;
    const nameNotUnique = form.errors.name?.type === 'validate';
    const nameContainsInvalidCharacters = form.errors.name?.type === 'pattern';

    return (
        <>
            <input 
                id="name" 
                name="name" 
                type="text"
                ref={form.register({ 
                    required: true,
                    pattern: namePattern,
                    validate: nameValidator,
                    maxLength: 64 
                })}
                className="input flex w-full mt-2"
                placeholder="My Ship"
                aria-invalid={!!form.errors.name}
            />
            <span className={`inline-block h-8.5 w-52 mt-2 text-xs text-red-600`} role="alert">
                { form.errors.name?.type === 'required' && 'Name is required'}
                { form.errors.name?.type === 'maxLength' && 'Name must be 64 characters or less'}
                { nameNotUnique && 'Name must be unique' }
                { nameContainsInvalidCharacters && 'Name must only contain alphanumeric, dash, underscore, or space characters' }
            </span>
        </>
    )
}