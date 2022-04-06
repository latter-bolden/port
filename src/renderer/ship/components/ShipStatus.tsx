import * as Tooltip from '@radix-ui/react-tooltip';
import React from 'react'
import { Pier } from '../../../background/services/pier-service'

const statusColors: Record<'running' | 'booting' | 'errored' | 'default', string> = {
    running: 'bg-green-400',
    booting: 'bg-yellow-500',
    errored: 'bg-red-600',
    default: 'bg-gray-300 dark:bg-gray-700'
}

const PortDisplay = ({ ship }: { ship: Pier }) => (
    <>
        <p className="mt-2 font-medium text-gray-600 dark:text-gray-400">Ports</p>
        <div className="flex">
            <span className="mr-3">Interface:</span>
            <span className="font-mono ml-auto">{ ship.webPort }</span>
        </div>
        <div className="flex">
            <span className="mr-3">Loopback:</span>
            <span className="font-mono ml-auto">{ ship.loopbackPort }</span>
        </div>
    </>
)

export const ShipStatus = ({ ship }: { ship: Pier }) => {
    const isRemote = ship.type === 'remote';
    const isRunning = ship.status === 'running'
    return (
        <Tooltip.Root>
            <Tooltip.Trigger className="default-ring cursor-default">
                <span className="inline-flex items-center">
                    <span className={`inline-flex w-2 h-2 mr-1 rounded-full ${statusColors[ship.status] || statusColors.default}`}></span>
                    <span className="capitalize text-gray-400 dark:text-gray-500">{ isRemote ? 'Connected' : ship.status }</span>
                </span>
            </Tooltip.Trigger>
            <Tooltip.Content side="top" className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-800 rounded">
                <strong> { isRemote
                    ? <span className="font-normal"> Remote ship </span>
                    : <span className={isRunning ? 'capitalize font-semibold' : 'capitalize font-normal'}>{ship.type}</span>}
                </strong>
                { !isRemote && isRunning && <PortDisplay ship={ship} /> }
                <Tooltip.Arrow className="fill-current text-gray-200 dark:text-gray-800"/>
            </Tooltip.Content>
        </Tooltip.Root>
    )
}