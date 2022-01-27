import React, { useEffect } from 'react'
import { send } from '../../client/ipc'
import { LeftArrow } from '../../icons/LeftArrow'
import { Layout } from '../../shared/Layout'
import { Link } from 'react-router-dom'


export const PlanetInviteDetails: React.FC = () => {
  useEffect(() => {
    send('set-title', 'Boot a Planet')
  }, []);

  useEffect(() => {
    const frame = document.getElementById('bridgeFrame');
    console.log(frame);
  }, []);

  return (
    <div className="absolute items-center w-full h-full pt-7">
      <div className="flex h-full w-full items-center justify-center p-12">
        <Link to="/boot/planet" className="group focus:outline-none no-underline mr-12">
            <LeftArrow className="w-7 h-7" primary="fill-current text-white dark:text-black" secondary="fill-current text-gray-200 dark:text-gray-700 group-hover:text-gray-300 dark:group-hover:text-gray-600 group-focus:text-gray-300 dark:group-focus:text-gray-600 transition-colors"/>
            <span className="sr-only">Back</span>
        </Link>
        <div className="w-full h-full bg-white" style={{ borderRadius: '1rem', overflow: 'hidden', maxWidth: '48rem' }}>
          <iframe id="bridgeFrame"
                  style={{ position: "relative", width: "100%", height:"100%" }}
                  sandbox="allow-scripts allow-downloads-without-user-activation allow-downloads"
                  src="https://bridge-staging.urbit.org" />
        </div>
        <Link to="/boot/planet" className="group focus:outline-none no-underline mr-12" style={{ opacity: '0' }}>
            <LeftArrow className="w-7 h-7" primary="fill-current text-white dark:text-black" secondary="fill-current text-gray-200 dark:text-gray-700 group-hover:text-gray-300 dark:group-hover:text-gray-600 group-focus:text-gray-300 dark:group-focus:text-gray-600 transition-colors"/>
            <span className="sr-only">Back</span>
        </Link>
      </div>
    </div>
  );
}
