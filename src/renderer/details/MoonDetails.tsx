import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Link, useHistory } from 'react-router-dom'
import { AddPier, isNewMoon, NewMoon, Pier } from '../../background/services/pier-service'
import { send } from '../client/ipc'
import { LeftArrow } from '../icons/LeftArrow'
import { RightArrow } from '../icons/RightArrow'
import { Layout } from '../shared/Layout'
import * as Tabs from '@radix-ui/react-tabs'
import * as Tooltip from '@radix-ui/react-tooltip'

export const MoonDetails: React.FC = () => {
    const history = useHistory();
    const queryClient = useQueryClient();
    const [tab, setTab] = useState('manual')
    const { data: planets } = useQuery('planets', () => send('get-piers', { type: 'planet' }), {
        refetchOnWindowFocus: false,
        onSuccess: (data) => {
            if (data?.length === 0 && tab !== 'manual') {
                setTab('manual')
            }
        }
    })
    const { 
        register, 
        handleSubmit, 
        control,
        formState: { 
            isValid 
        },
    } = useForm<AddPier | NewMoon>({
        mode: 'onChange'
    });
    const { mutate } = useMutation((data: AddPier | NewMoon) => {
        return isNewMoon(data) && data.planet && tab === 'from-planet'
            ? send('generate-moon', data)
            : send('add-pier', {...data, type: 'moon' })
    }, {
        onSuccess: (pier: Pier) => {
            if (!pier)
                return;

            queryClient.setQueryData(['pier', pier.slug], pier);
            history.push(`/boot/${pier.slug}`)
        }
    })
    
    const fromPlanetValidate = (value: any) => (!!value && tab === 'from-planet') || tab !== 'from-planet';
    const manualValidate = (value: any) => (!!value && tab === 'manual') || tab !== 'manual';

    async function setFile(onChange) {
        const file = await send('get-file')
        onChange(file);
    }

    function onSubmit(data: AddPier | NewMoon) {
        mutate(data)
    }

    return (
        <Layout title="Boot a Moon" className="relative flex justify-center items-center min-content-area-height">            
            <form className="flex items-center w-full max-w-xl" onSubmit={handleSubmit(onSubmit)}>
                <div className="mr-12">
                    <Link to="/" className="group focus:outline-none no-underline">
                        <LeftArrow className="w-7 h-7" secondary="fill-current text-gray-700 group-hover:text-gray-600 group-focus:text-gray-600 transition-colors"/>
                        <span className="sr-only">Back</span>
                    </Link>
                </div>
                <div className="w-full space-y-8 text-sm">
                    <h1 className="font-semibold text-base mb-2">Enter Moon Details</h1>                    
                    <div>
                        <label htmlFor="name">Name <span className="text-gray-700">(local only)</span></label>
                        <input 
                            id="name" 
                            name="name" 
                            type="text"
                            ref={register({ required: true })}
                            className="flex w-full px-2 py-1 mt-2 bg-transparent border border-gray-700 focus:outline-none focus:border-gray-500 transition-colors rounded" 
                            placeholder="My Ship" 
                        />
                    </div>
                    <Tabs.Root value={tab} onValueChange={setTab}>
                        <Tabs.List className="flex mb-4 border-b border-gray-700">
                            <Tooltip.Root>
                                <Tooltip.Trigger className="default-ring">
                                    <Tabs.Tab value="from-planet" className={`flex justify-center px-3 py-2 border-b-2 default-ring  transition-colors text-gray-700 ${tab === 'from-planet' ? 'border-white font-semibold' : 'border-transparent'}`} disabled={true}>From Planet</Tabs.Tab>
                                </Tooltip.Trigger>
                                <Tooltip.Content side="top" className="px-3 py-2 text-sm bg-gray-800 rounded">
                                    Currently waiting for changes to Urbit for this to be supported
                                    <Tooltip.Arrow className="fill-current text-gray-800"/>
                                </Tooltip.Content>
                            </Tooltip.Root>
                            <Tabs.Tab value="manual" className={`flex justify-center px-3 py-2 border-b-2 default-ring transition-colors ${tab === 'manual' ? 'border-white font-semibold' : 'border-transparent'}`}>Existing Key File</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panel value="from-planet" className="space-y-6 default-ring">
                            <div>
                                <label htmlFor="shipname">Shipname <span className="text-gray-700">(optional)</span></label>
                                {tab === 'from-planet' && <input 
                                    id="shipname" 
                                    name="shipName" 
                                    type="text"
                                    ref={register}
                                    className="flex w-full px-2 py-1 mt-2 bg-transparent border border-gray-700 focus:outline-none focus:border-gray-500 transition-colors rounded" 
                                    placeholder="~sampel-palnet-migtyl-wallys" 
                                />}
                            </div>
                            <div>
                                <label htmlFor="planet">Planet:</label>
                                <select name="planet" ref={register({ validate: fromPlanetValidate })} className="w-full px-2 py-1 mt-2 bg-transparent border border-gray-700 focus:outline-none focus:border-gray-500 transition-colors rounded">
                                    <option value="">Select a planet</option>
                                    { planets && planets.map(planet => (
                                        <option key={planet.slug} value={planet.slug}>
                                            { planet.name }: { planet.shipName }
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </Tabs.Panel>
                        <Tabs.Panel value="manual" className="space-y-6 default-ring">
                            <div>
                                <label htmlFor="shipname">Shipname</label>
                                <input 
                                    id="shipname" 
                                    name="shipName" 
                                    type="text"
                                    ref={register({ validate: manualValidate })}
                                    className="flex w-full px-2 py-1 mt-2 bg-transparent border border-gray-700 focus:outline-none focus:border-gray-500 transition-colors rounded" 
                                    placeholder="~sampel-palnet-migtyl-wallys" 
                                />
                            </div>                          
                            <div>
                                <label htmlFor="directory">Key File</label>
                                <div className="flex items-stretch mt-2">
                                    <Controller
                                        name="keyFile"
                                        control={control}
                                        defaultValue=""
                                        rules={{ validate: manualValidate }}
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
                                                />
                                                <button type="button" className="flex-none flex justify-center items-center px-2 py-1 bg-transparent border border-gray-700 hover:border-white focus:outline-none focus:border-white focus:ring focus:ring-gray-600 focus:ring-opacity-50 transition-colors rounded rounded-l-none" onClick={async () => await setFile(onChange)}>
                                                    Choose Key File
                                                </button>
                                            </>
                                        )}
                                    />
                                </div>
                            </div>
                        </Tabs.Panel>
                    </Tabs.Root>                    
                </div>
                <div className="ml-12">
                    <button type="submit" className="flex items-center text-gray-500 hover:text-white focus:text-white default-ring disabled:text-gray-700 transition-colors" disabled={!isValid || tab === 'from-planet'}>
                        Continue
                        <RightArrow className="ml-1 w-7 h-7" secondary="fill-current" />
                    </button>
                </div>
            </form>
        </Layout>
    )
}