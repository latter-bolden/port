import React from 'react'
import { Link } from 'react-router-dom'

export const BootOptions = ({ className = '' }: { className: string }) => {
    return (
        <ul className={className}>
            <li>
                <div className="block w-full p-4 text-gray-700 border border-gray-700 rounded">
                    <strong className="block font-semibold mb-2">Coming Soon™ {/*Have an ID already?*/}</strong>
                    <span>Boot your planet with the key or pier</span>
                </div>
            </li>
            <li>
                <Link to="/boot/comet" className="block w-full p-4 border border-gray-700 hover:border-white focus:border-white transition-colors rounded">
                    <strong className="block font-semibold mb-2">Start without an ID</strong>
                    <span className="text-gray-300">Generate a disposable identity and boot as a comet</span>
                </Link>
            </li>
            <li>
                <Link to="/boot/remote" className="block w-full p-4 border border-gray-700 hover:border-white focus:border-white transition-colors rounded">
                    <strong className="block font-semibold mb-2">Access Remote Ship</strong>
                    <span className="text-gray-300">Access your remote ship by URL</span>
                </Link>
            </li>
        </ul>
    )
}