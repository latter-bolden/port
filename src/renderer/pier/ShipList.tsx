import React from 'react'
import { Link } from 'react-router-dom'
import { Pier } from '../../background/services/pier-service'
import { send } from '../client/ipc'
import { RightArrow } from '../icons/RightArrow'

export const ShipList = ({ piers }: { piers: Pier[]}) => {
    return (
        <ul className="space-y-4">
            {piers.sort((a,b) => b.lastUsed.localeCompare(a.lastUsed)).map(pier => (
                <li key={pier.slug} className="flex items-center px-2 py-1 bg-gray-900 rounded">
                    <div>
                        <div>{ pier.name }</div>
                        <div className="flex items-center mt-1 text-sm">
                            <span className={`inline-flex w-2 h-2 mr-1 rounded-full ${pier.running ? 'bg-green-400' : 'bg-gray-700'}`}></span>
                            <span className="text-gray-500">{pier.running ? 'Running' : 'Stopped'}</span>
                        </div>
                    </div>
                    <Link to={`/pier/${pier.slug}`} className="ml-auto font-semibold text-gray-500 hover:text-white transition-colors text-sm">
                        Manage
                    </Link>
                    <Link 
                        to={`/pier/${pier.slug}/launch`} 
                        className="button min-w-22 py-1 pr-1 ml-4 text-sm font-semibold"
                        onClick={async () => await send('clear-data')}
                    >
                        { pier.running ? 'Open' : 'Launch' } <RightArrow className="ml-auto w-5 h-5" primary="fill-current text-transparent" secondary="fill-current"/>
                    </Link>
                </li>
            ))}
        </ul>
    )
}