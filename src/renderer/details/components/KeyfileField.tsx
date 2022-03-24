import React from 'react'
import { Controller } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { UseControllerOptions, UseFormMethods, Validate, ValidateResult } from 'react-hook-form/dist/types'
import { send } from '../../client/ipc'
import { AddPier } from '../../../background/services/pier-service'
import { Dialog, DialogContent } from '../../shared/Dialog'

interface KeyfileFieldProps {
    form: UseFormMethods<AddPier>
    //validator?: Record<string, Validate>;
    rules?: UseControllerOptions["rules"];
}

export const KeyfileField: React.FC<KeyfileFieldProps> = ({ form, rules, children }) => {
    const [warningOpen, setWarningOpen] = React.useState(false)

    async function bypassWarning(onChange) {
        setWarningOpen(false)
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
                                onClick={() => setWarningOpen(true)}
                                aria-invalid={!!form.errors?.keyFile} 
                            />
                            <button type="button" className="input flex-none flex justify-center items-center hover:border-black focus:border-black dark:hover:border-white dark:focus:border-white default-ring rounded-l-none" onClick={() => setWarningOpen(true)}>
                                Choose Key File
                            </button>
                            <Dialog open={warningOpen} onOpenChange={setWarningOpen}>
                                <DialogContent showCloseIcon onOpenAutoFocus={e => e.preventDefault()}>
                                    <h2 className="font-semibold">Key File Warning</h2>
                                    <p className="mt-4">
                                        Starting a ship with it's key file should only be done once. Doing so repeatedly will
                                        break your ship and require a factory reset.
                                    </p>
                                    <p className="mt-4">
                                        If your key file has already been used, export your pier folder and <Link to="/boot/existing">boot as an existing ship</Link> instead.
                                    </p>
                                    <div className="mt-8 flex justify-center">
                                        <button className="button text-black bg-yellow-300 hover:bg-yellow-400 dark:bg-transparent dark:border-yellow-200 dark:text-yellow-200 dark:hover:bg-transparent dark:hover:border-yellow-400 dark:hover:text-yellow-400" onClick={async () => bypassWarning(onChange)}>Continue, this key file has not been used</button>
                                    </div>
                                </DialogContent>
                            </Dialog>
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