import { getPlatform } from '../../../get-platform';
import React from 'react'
import { Link } from 'react-router-dom'
import { send } from '../../client/ipc'
import { Pier, BootStatus } from '../../../background/services/pier-service'
import { RightArrow } from '../../icons/RightArrow'
import { useQuery } from 'react-query';
import { pierKey } from '../../query-keys';
import { WindowsBootWarning } from '../../alerts/WindowsBootWarning';

type LaunchButtonProps = {
    ship: Pier;
    loadData: () => void
    className?: string;
}

const buttonLabels: Record<BootStatus, string> = {
    running: 'Open',
    booting: 'Open',
    stopped: 'Boot',
    // booting: 'Check Progress',
    // unbooted: 'Boot',
    errored: 'Check Error'
}

export const LaunchButton: React.FC<LaunchButtonProps> = ({ ship, loadData, className = '' }) => {
    const { data: ships } = useQuery(pierKey(), () => send('get-piers'));
    const buttonClass = `button min-w-22 py-1 pr-1 font-semibold text-sm ${className}`
    const path = ship.startupPhase !== 'complete' ? `/boot/new/${ship.slug}` : `/pier/${ship.slug}/launch`;
    const otherShipsRunning = ships?.find(s => s.status === 'running' && s.type !== 'remote' && s.slug !== ship.slug);

    if (getPlatform() === 'win' && otherShipsRunning && ship.type !== 'remote') {
        return (
            <WindowsBootWarning show>
                <button className={buttonClass} disabled>
                    { buttonLabels[ship.status] }
                    <RightArrow className="ml-auto w-5 h-5" primary="fill-current text-transparent" secondary="fill-current"/>
                </button>
            </WindowsBootWarning>
        )
    }

    return (
        <Link 
            to={path} 
            className={buttonClass}
            onMouseEnter={loadData} 
            // onClick={async () => await send('clear-data')}
        >
            { buttonLabels[ship.status] }
            <RightArrow className="ml-auto w-5 h-5" primary="fill-current text-transparent" secondary="fill-current"/>
        </Link>
    )
}