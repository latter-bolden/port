import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { AddPier, isNewMoon, NewMoon } from '../../../background/services/pier-service'
import { send } from '../../client/ipc'
import * as Tabs from '@radix-ui/react-tabs'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useAddPier } from '../useAddPier'
import { DetailsContainer } from '../components/DetailsContainer'
import { NameField } from '../components/NameField'
import { ShipNameField } from '../components/ShipNameField'
import { KeyfileField } from '../components/KeyfileField'

export const MoonDetails: React.FC = () => {
    const [tab, setTab] = useState('manual')
    const {
        form,
        mutate
    } = useAddPier((data: AddPier | NewMoon) => {
        return isNewMoon(data) && data.planet && tab === 'from-planet'
            ? send('generate-moon', data)
            : send('add-pier', {...data, type: 'moon' })
    });
    const { isValid } = form.formState;

    const { data: planets } = useQuery('planets', () => send('get-piers', { type: 'planet' }), {
        onSuccess: (data) => {
            if (data?.length === 0 && tab !== 'manual') {
                setTab('manual')
            }
        }
    })
    
    const fromPlanetValidate = (value: any) => (!!value && tab === 'from-planet') || tab !== 'from-planet';
    const manualValidate = (value: any) => (!!value && tab === 'manual') || tab !== 'manual';

    return (
        <DetailsContainer
            title="Boot a Moon"
            buttonDisabled={!isValid || tab === 'from-planet'}
            onSubmit={form.handleSubmit(data => mutate(data))}
        >
            <h1 className="font-semibold text-base mb-6">Enter Moon Details</h1>                    
            <div>
                <label htmlFor="name">Name <span className="text-gray-700">(local only)</span></label>
                <NameField form={form} />
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
                <Tabs.Panel value="from-planet" className="default-ring">
                    <div>
                        <label htmlFor="shipname">Shipname <span className="text-gray-700">(optional)</span></label>
                        {tab === 'from-planet' && <ShipNameField form={form} placeholder="~sampel-palnet-migtyl-wallys" />}
                    </div>
                    <div>
                        <label htmlFor="planet">Planet:</label>
                        <select name="planet" ref={form.register({ validate: fromPlanetValidate })} className="w-full px-2 py-1 mt-2 bg-transparent border border-gray-700 focus:outline-none focus:border-gray-500 transition-colors rounded">
                            <option value="">Select a planet</option>
                            { planets && planets.map(planet => (
                                <option key={planet.slug} value={planet.slug}>
                                    { planet.name }: { planet.shipName }
                                </option>
                            ))}
                        </select>
                    </div>
                </Tabs.Panel>
                <Tabs.Panel value="manual" className="default-ring">
                    <div>
                        <label htmlFor="shipname">Shipname</label>
                        <ShipNameField form={form} validator={manualValidate} placeholder="~sampel-palnet-migtyl-wallys" />
                    </div>                          
                    <div>
                        <label htmlFor="directory">Key File</label>
                        <KeyfileField form={form} validator={{ tabOff: manualValidate }} />
                    </div>
                </Tabs.Panel>
            </Tabs.Root>
        </DetailsContainer>
    )
}