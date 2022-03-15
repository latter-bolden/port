import React, { useEffect } from 'react'
import { send } from '../../client/ipc'
import { LeftArrow } from '../../icons/LeftArrow'
import { RightArrow } from '../../icons/RightArrow'
import { Layout } from '../../shared/Layout'
import { Link, useParams } from 'react-router-dom'


export const PlanetInviteDetails: React.FC = () => {
  let params = useParams();

  let url = "https://bridge.urbit.org/#";
  if (params['ticket'] === ':ticket') {
    url = url + 'sampel-palnet-sampel-palnet-sampel-palnet';
  } else {
    url = url + params['ticket'];
  }

  useEffect(() => {
    send('set-title', 'Boot a Planet')
  }, []);

  return (
    <div className="absolute items-center w-full h-full pt-7">
      <div className="flex h-full w-full items-center justify-center p-12">
        <Link to="/boot/planet" className="group focus:outline-none no-underline mr-12">
            <LeftArrow className="w-7 h-7" primary="fill-current text-white dark:text-black" secondary="fill-current text-gray-200 dark:text-gray-700 group-hover:text-gray-300 dark:group-hover:text-gray-600 group-focus:text-gray-300 dark:group-focus:text-gray-600 transition-colors"/>
            <span className="sr-only">Back</span>
        </Link>
        <div className="w-full h-full flex items-center justify-center p-12" style={{ maxWidth: '48rem', textAlign: 'center', flexDirection: 'column' }}>
          <a target="_blank" href={url}>Claim your Planet in Bridge</a>
          <p>Once you have finished, click the arrow on the right.</p>
        </div>
        <Link to="/boot/planet/key" className="group focus:outline-none no-underline mr-12">
            <RightArrow className="w-7 h-7" primary="fill-current text-white dark:text-black" secondary="fill-current text-gray-200 dark:text-gray-700 group-hover:text-gray-300 dark:group-hover:text-gray-600 group-focus:text-gray-300 dark:group-focus:text-gray-600 transition-colors"/>
            <span className="sr-only">Back</span>
        </Link>
      </div>
    </div>
  );
}
