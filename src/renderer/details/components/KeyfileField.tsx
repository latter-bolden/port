import React from 'react'
import { Controller } from 'react-hook-form'
import { UseFormMethods, Validate, ValidateResult } from 'react-hook-form/dist/types'
import { send } from '../../client/ipc'
import { AddPier } from '../../../background/services/pier-service'

interface KeyfileFieldProps {
    form: UseFormMethods<AddPier>
    validator?: Record<string, Validate>;
}

export const KeyfileField: React.FC<KeyfileFieldProps> = ({ form, validator, children }) => {

    async function setFile(onChange) {
        const file = await send('get-file')
        onChange(file);
    }

    async function validate(data: string): Promise<ValidateResult> {
        return send('validate-key-file', data);
    }
    
    return (
        <>
            <div className="flex items-stretch mt-2">
                <Controller
                    name="keyFile"
                    control={form.control}
                    defaultValue=""
                    rules={{ validate: {
                        ...validator,
                        keyFile: validate
                    }}}
                    render={({ value, onChange, name, ref }) => (
                        <>
                            <input 
                                id="directory" 
                                name={name} 
                                ref={ref}
                                type="text"
                                value={value}
                                className="flex-1 px-2 py-1 bg-transparent border border-r-0 border-gray-700 focus:outline-none focus:border-gray-500 transition-colors rounded rounded-r-none" 
                                placeholder="/Users/my-user/sampel-palnet.key"
                                readOnly={true}
                                onClick={async () => await setFile(onChange)}
                                aria-invalid={!!form.errors?.keyFile} 
                            />
                            <button type="button" className="flex-none flex justify-center items-center px-2 py-1 bg-transparent border border-gray-700 hover:border-white focus:outline-none focus:border-white focus:ring focus:ring-gray-600 focus:ring-opacity-50 transition-colors rounded rounded-l-none" onClick={async () => await setFile(onChange)}>
                                Choose Key File
                            </button>
                        </>
                    )}
                />
            </div>
            <span className={`inline-block h-8.5 mt-2 text-xs text-red-600 ${form.errors?.keyFile ? 'visible' : 'invisible'}`} role="alert">
                { form.errors.keyFile?.type === 'required' && 'Keyfile is required'}
                { (!form.errors.keyFile || form.errors.keyFile.type === 'keyFile') && 'Keyfile invalid' }
                { children }
            </span>
        </>
    )
}