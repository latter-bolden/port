import React from 'react'
import { Link } from 'react-router-dom'
import { LeftArrow } from '../icons/LeftArrow'
import { pierKey } from '../query-keys'

export const HomeFooter = ({ queryClient }) => (
    <Link to="/" className="inline-flex items-center ml-2 mr-8 text-xs text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white focus:text-black dark:focus:text-white transition-colors" onMouseOver={() => queryClient.prefetchQuery(pierKey())}>
        <LeftArrow className="w-5 h-5 mr-2" primary="fill-current text-transparent" secondary="fill-current" />
        Home
    </Link>
)