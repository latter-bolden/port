import React from 'react'
import { Pier } from '../../../background/services/pier-service'

export const ShipStatus = ({ ship }: { ship: Pier }) => {
    let shipStatus = 'Unbooted';

    if (ship.booted && ship.running) {
        shipStatus = 'Running'
    }

    if (ship.booted && !ship.running) {
        shipStatus = 'Stopped'
    }

    return (
        <>
            <span className={`inline-flex w-2 h-2 mr-1 rounded-full ${ship.running ? 'bg-green-400' : 'bg-gray-700'}`}></span>
            <span className="text-gray-500">{shipStatus}</span>          
        </>
    )
}