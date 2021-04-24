import React from 'react'
import { useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import { pierKey } from '../../query-keys'
import { Pier } from '../../../background/services/pier-service'
import { LaunchButton } from './LaunchButton'
import { ShipStatus } from './ShipStatus'

export const ShipList = ({ piers }: { piers: Pier[]}) => {
    const queryClient = useQueryClient();
    
    function onHover(ship: Pier) {
        return () => queryClient.setQueryData(pierKey(ship.slug), ship);
    }

    return (
        <ul className="space-y-4">
            {piers.sort((a,b) => b.lastUsed.localeCompare(a.lastUsed)).map(pier => (
                <li key={pier.slug} className="flex items-center p-2 bg-gray-900 rounded">
                    <div>
                        <div className="leading-tight">{ pier.name }</div>
                        <div className="mt-1 text-sm">
                            <ShipStatus ship={pier} />
                        </div>
                    </div>
                    <Link to={`/pier/${pier.slug}`} className="ml-auto font-semibold text-gray-500 hover:text-white transition-colors text-sm" onMouseEnter={onHover(pier)} onFocus={onHover(pier)}>
                        Manage
                    </Link>
                    <LaunchButton ship={pier} loadData={onHover(pier)} className="ml-4" />
                </li>
            ))}
        </ul>
    )
}