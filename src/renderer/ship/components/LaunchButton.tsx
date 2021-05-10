import React from 'react'
import { Link } from 'react-router-dom'
import { send } from '../../client/ipc'
import { Pier, ShipStatus } from '../../../background/services/pier-service'
import { RightArrow } from '../../icons/RightArrow'

type LaunchButtonProps = {
    ship: Pier;
    loadData: () => void
    className?: string;
}

const buttonLabels: Record<ShipStatus, string> = {
    running: 'Open',
    stopped: 'Launch',
    booted: 'Launch',
    booting: 'Check Progress',
    unbooted: 'Boot',
    errored: 'Check Error'
}

export const LaunchButton: React.FC<LaunchButtonProps> = ({ ship, loadData, className = '' }) => {
    const buttonClass = `button min-w-22 py-1 pr-1 font-semibold text-sm ${className}`
    const path = ship.status === 'running' || ship.status === 'stopped' ? `/pier/${ship.slug}/launch` : `/boot/new/${ship.slug}`;

    return (
        <Link 
            to={path} 
            className={buttonClass}
            onMouseEnter={loadData} 
            onClick={async () => await send('clear-data')}
        >
            { buttonLabels[ship.status] }
            <RightArrow className="ml-auto w-5 h-5" primary="fill-current text-transparent" secondary="fill-current"/>
        </Link>
    )
}