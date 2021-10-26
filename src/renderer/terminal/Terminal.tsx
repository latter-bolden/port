import React, { useEffect, useRef, useState } from 'react';
import { XTerm } from 'xterm-for-react';
import { FitAddon } from 'xterm-addon-fit';
import { ipcRenderer } from 'electron';
import { Payload } from '../../main/terminal-service';

const isDev = process.env.NODE_ENV === 'development';

export const Terminal = () => {
  const [loaded, setLoaded] = useState(false);
  const [ship, setShip] = useState('');
  const xterm = useRef<XTerm>(null);
  const fit = useRef(new FitAddon());

  const write = (event, { ship: incomingShip, data }: Payload) => {
    if (ship !== incomingShip) {
      return;
    }

    isDev && console.log('incoming write', data)
    xterm.current.terminal.write(data);
  };

  const fitTerm = () => fit.current.fit();

  useEffect(() => {
    setLoaded(true);

    ipcRenderer.on('ship', (e, data) => {
      isDev && console.log('receiving ship', data);
      setShip(data);
    })
  }, []);

  useEffect(() => {
    if (!loaded || !ship) {
      return;
    }

    isDev && console.log('listening for incoming terminal writes')
    ipcRenderer.on('terminal-incoming', write);
    window.addEventListener('resize', fitTerm)

    fit.current.fit()
    isDev && console.log('sending terminal loaded')
    ipcRenderer.send('terminal-loaded', ship);

    return () => {
      ipcRenderer.removeListener('terminal-incoming', write);
      window.removeEventListener('resize', fitTerm);
    }
  }, [loaded, ship])

  return (
    <XTerm 
      ref={xterm}
      className="h-full p-2 bg-black" 
      addons={[fit.current]}
      options={{
        cursorStyle: 'underline',
        cursorBlink: true,
        fontFamily: 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
        lineHeight: 1.2
      }}
      onData={e => {
        ipcRenderer.send('terminal-keystroke', { ship, data: e });
      }} 
    />
  )
}