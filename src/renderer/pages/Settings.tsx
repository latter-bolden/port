import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { useStore } from '../App';
import { send } from '../client/ipc';
import { LeftArrow } from '../icons/LeftArrow';
import { Layout } from '../shared/Layout';
import { Toggle } from '../shared/Toggle';
import { Settings as SettingsType } from '../../background/db';

export const Settings = () => {
  const queryClient = useQueryClient();
  const settings = useStore(s => s.settings);
  const leapGlobally = settings['global-leap'] === 'true';
  const protocolHandling = settings['protocol-handling'] === 'true';
  const shipNameInTitle = settings['ship-name-in-title'] === 'true';
  const { mutate: setSetting } = useMutation(({ setting, on }: { setting: SettingsType, on: boolean }) => {
      return send('set-setting', setting, on.toString())
    }, {
    onSuccess: () => {
      queryClient.invalidateQueries('settings');
    }
  })

  return (
    <Layout 
      title="Settings" 
      className="pt-8 text-gray-600 dark:text-gray-400 text-sm"
      footer={
          <Link to="/" className="inline-flex items-center ml-2 mr-8 text-xs text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white focus:text-black dark:focus:text-white transition-colors">
              <LeftArrow className="w-5 h-5 mr-2" primary="fill-current text-transparent" secondary="fill-current" />
              Home
          </Link>
      }
    >
      <section className="w-full max-w-xl mr-6">
        <h1 className="mb-6 font-semibold text-lg text-black dark:text-white">Settings</h1>
        <h2 className="mb-3 text-black dark:text-white">Leap</h2>
        <div className="flex items-center mb-6 space-x-4">
          <Toggle 
            pressed={leapGlobally}
            onPressedChange={(on) => setSetting({ setting: 'global-leap', on })}
            className="text-blue-500" 
            toggleClass="w-9 h-6"
          />
          <div className="w-96">
            {leapGlobally && <p>Allow access to Leap globally on my computer</p>}
            {!leapGlobally && <p>Only allow Leap while Port is focused</p>}
          </div>
        </div>
        <h2 className="mb-3 text-black dark:text-white">Leap</h2>
        <div className="flex items-center mb-6 space-x-4">
          <Toggle 
            pressed={protocolHandling}
            onPressedChange={(on) => setSetting({ setting: 'protocol-handling', on })}
            className="text-blue-500" 
            toggleClass="w-9 h-6"
          />
          <div className="w-96">
            {protocolHandling && <p>Allow Port to handle any and all <strong className='font-mono'>web+urbitgraph</strong> links</p>}
            {!protocolHandling && <p><strong className='font-mono'>web+urbitgraph</strong> link handling disabled</p>}
          </div>
        </div>
        <h2 className="mb-3 text-black dark:text-white">Show Ship</h2>
        <div className="flex items-center space-x-4">
          <Toggle
            pressed={shipNameInTitle}
            onPressedChange={(on) => setSetting({ setting: 'ship-name-in-title', on })}
            className="text-blue-500"
            toggleClass="w-9 h-6"
          />
          <div className="w-96">
            {shipNameInTitle && <p>Ship name will be displayed in the title of app windows</p>}
            {!shipNameInTitle && <p>Ship name will not be displayed in the title of app windows</p>}
          </div>
        </div>
      </section>
    </Layout>
  )
}