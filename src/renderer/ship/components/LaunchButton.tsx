import React from 'react'
import { Link } from 'react-router-dom'
import { send } from '../../client/ipc'
import { Pier } from '../../../background/services/pier-service'
import { RightArrow } from '../../icons/RightArrow'

type LaunchButtonProps = {
    ship: Pier;
    className?: string;
    loadData?: () => void
}

export const LaunchButton: React.FC<LaunchButtonProps> = ({ ship, loadData, className = '' }) => {
    const buttonClass = `button min-w-22 py-1 pr-1 font-semibold text-sm ${className}`
    const path = ship.booted ? `/pier/${ship.slug}/launch` : `/boot/${ship.slug}`;
    let buttonText = 'Boot';

    if (ship.booted && ship.running) {
        buttonText = 'Open'
    }
    
    if (ship.booted && !ship.running) {
        buttonText = 'Launch'
    }

    return (
        <Link 
            to={path} 
            className={buttonClass}
            onMouseEnter={loadData} 
            onClick={async () => await send('clear-data')}
        >
            { buttonText }
            <RightArrow className="ml-auto w-5 h-5" primary="fill-current text-transparent" secondary="fill-current"/>
        </Link>
    )
}