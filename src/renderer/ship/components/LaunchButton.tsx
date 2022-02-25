import { getPlatform } from '../../../get-platform';
import React from 'react'
import { Link } from 'react-router-dom'
import { send } from '../../client/ipc'
import { Pier, ShipStatus } from '../../../background/services/pier-service'
import { RightArrow } from '../../icons/RightArrow'
import { useQuery } from 'react-query';
import { pierKey } from '../../query-keys';
import * as Tooltip from '@radix-ui/react-tooltip';

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
    const { data: ships } = useQuery(pierKey(), () => send('get-piers'));
    const buttonClass = `button min-w-22 py-1 pr-1 font-semibold text-sm ${className}`
    const path = ship.status === 'running' || ship.status === 'stopped' ? `/pier/${ship.slug}/launch` : `/boot/new/${ship.slug}`;
    const otherShipsRunning = ships.find(s => s.status === 'running' && s.type !== 'remote' && s.slug !== ship.slug);

    if (getPlatform() === 'win' && otherShipsRunning && ship.type !== 'remote') {
        return (
            <Tooltip.Root>
                <Tooltip.Trigger className="default-ring">
                    <button className={buttonClass} disabled>
                        { buttonLabels[ship.status] }
                        <RightArrow className="ml-auto w-5 h-5" primary="fill-current text-transparent" secondary="fill-current"/>
                    </button>
                </Tooltip.Trigger>
                <Tooltip.Content side="top" className="max-w-sm px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded">
                    Due to a bug in the urbit Windows runtime, only one local ship can be running at a time. Ships can be stopped using the <strong>Manage</strong> interface.
                    <Tooltip.Arrow className="fill-current text-gray-100 dark:text-gray-800"/>
                </Tooltip.Content>
            </Tooltip.Root>
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