import React, { useEffect } from 'react'
import { send } from '../../client/ipc'
import { LeftArrow } from '../../icons/LeftArrow'
import { Layout } from '../../shared/Layout'
import { Link, useParams } from 'react-router-dom'


export const PlanetInviteDetails: React.FC = () => {
  let params = useParams();

  let url = "https://bridge-dev.urbit.org/#";
  if (params['ticket'] === ':ticket') {
    url = url + 'sampel-palnet-sampel-palnet';
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
        <div className="w-full h-full bg-white" style={{ borderRadius: '1rem', overflow: 'hidden', maxWidth: '48rem' }}>
          <iframe style={{ position: "relative", width: "100%", height:"100%" }}
                  src={url} />
        </div>
        <Link to="/boot/planet" className="group focus:outline-none no-underline mr-12" style={{ opacity: '0' }}>
            <LeftArrow className="w-7 h-7" primary="fill-current text-white dark:text-black" secondary="fill-current text-gray-200 dark:text-gray-700 group-hover:text-gray-300 dark:group-hover:text-gray-600 group-focus:text-gray-300 dark:group-focus:text-gray-600 transition-colors"/>
            <span className="sr-only">Back</span>
        </Link>
      </div>
    </div>
  );
}
