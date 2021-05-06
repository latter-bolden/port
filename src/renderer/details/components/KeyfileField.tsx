import React from 'react'
import { Controller } from 'react-hook-form'
import { UseControllerOptions, UseFormMethods, Validate, ValidateResult } from 'react-hook-form/dist/types'
import { send } from '../../client/ipc'
import { AddPier } from '../../../background/services/pier-service'

interface KeyfileFieldProps {
    form: UseFormMethods<AddPier>
    //validator?: Record<string, Validate>;
    rules?: UseControllerOptions["rules"];
}

export const KeyfileField: React.FC<KeyfileFieldProps> = ({ form, rules, children }) => {

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
                    rules={{
                        ...rules, 
                        validate: {
                            ...rules.validate,
                            keyFile: validate
                        }
                    }}
                    render={({ value, onChange, name, ref }) => (
                        <>
                            <input 
                                id="directory" 
                                name={name} 
                                ref={ref}
                                type="text"
                                value={value}
                                className="input flex-1 border border-r-0 rounded-r-none" 
                                placeholder="/Users/my-user/sampel-palnet.key"
                                readOnly={true}
                                onClick={async () => await setFile(onChange)}
                                aria-invalid={!!form.errors?.keyFile} 
                            />
                            <button type="button" className="input flex-none flex justify-center items-center hover:border-black focus:border-black dark:hover:border-white dark:focus:border-white default-ring rounded-l-none" onClick={async () => await setFile(onChange)}>
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