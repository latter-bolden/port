import * as Tooltip from '@radix-ui/react-tooltip';
import React from 'react'
import Case from 'case';
import { Pier } from '../../../background/services/pier-service'

const statusColors: Record<'running' | 'booting' | 'default', string> = {
    running: 'bg-green-400',
    booting: 'bg-yellow-500',
    default: 'bg-gray-300 dark:bg-gray-700'
}

export const ShipStatus = ({ ship }: { ship: Pier }) => {
    const isRemote = ship.type === 'remote';
    let shipStatus = Case.capital(ship.status);

    if (isRemote) {
        shipStatus = 'Connected'
    }

    return (
        <Tooltip.Root>
            <Tooltip.Trigger className="default-ring cursor-default" disabled={isRemote}>
                <span className="inline-flex items-center">
                    <span className={`inline-flex w-2 h-2 mr-1 rounded-full ${statusColors[ship.status] || statusColors.default}`}></span>
                    <span className="text-gray-400 dark:text-gray-500">{shipStatus}</span>          
                </span>
            </Tooltip.Trigger>
            <Tooltip.Content side="top" className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded">
                <strong className="inline-block mb-1 font-bold">Ports</strong>
                <div className="flex">
                    <span className="mr-3">Interface:</span> 
                    <span className="font-mono ml-auto">{ ship.webPort }</span>
                </div>
                <div className="flex">
                    <span className="mr-3">Loopback:</span>
                    <span className="font-mono ml-auto">{ ship.loopbackPort }</span>
                </div>
                <Tooltip.Arrow className="fill-current text-gray-100 dark:text-gray-800"/>
            </Tooltip.Content>
        </Tooltip.Root>
    )
}