import React from 'react'
import { Link } from 'react-router-dom'
import { Pier } from '../../background/services/pier-service'
import { send } from '../client/ipc'
import { RightArrow } from '../icons/RightArrow'

export const ShipList = ({ piers }: { piers: Pier[]}) => {
    return (
        <ul>
            {piers.sort((a,b) => b.lastUsed.localeCompare(a.lastUsed)).map(pier => (
                <li key={pier.slug}>
                    <Link 
                        className="group flex items-center px-2 py-1 border-b border-gray-700 hover:border-white focus:border-white focus:outline-none transition-colors no-underline" to={`/pier/${pier.slug}`} 
                        onClick={async () => await send('clear-data')}
                    >
                        {pier.name}
                        <RightArrow className="ml-auto w-7 h-7" secondary="fill-current text-gray-500 group-focus:text-white group-hover:text-white transition-colors" />
                    </Link>
                </li>
            ))}
        </ul>
    )
}