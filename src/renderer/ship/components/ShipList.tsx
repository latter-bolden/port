import React from 'react'
import { Link } from 'react-router-dom'
import { Pier } from '../../../background/services/pier-service'
import { LaunchButton } from './LaunchButton'
import { ShipStatus } from './ShipStatus'

export const ShipList = ({ piers }: { piers: Pier[]}) => {
    return (
        <ul className="space-y-4">
            {piers.sort((a,b) => b.lastUsed.localeCompare(a.lastUsed)).map(pier => (
                <li key={pier.slug} className="flex items-center p-2 bg-gray-900 rounded">
                    <div>
                        <div className="leading-tight">{ pier.name }</div>
                        <div className="flex items-center mt-1 text-sm">
                            <ShipStatus ship={pier} />
                        </div>
                    </div>
                    <Link to={`/pier/${pier.slug}`} className="ml-auto font-semibold text-gray-500 hover:text-white transition-colors text-sm">
                        Manage
                    </Link>
                    <LaunchButton ship={pier} className="ml-4" />
                </li>
            ))}
        </ul>
    )
}