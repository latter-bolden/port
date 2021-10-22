import React, { useEffect, useRef, useState } from 'react';
import { XTerm } from 'xterm-for-react';
import { FitAddon } from 'xterm-addon-fit';
import { listen, send, unlisten } from '../client/ipc';
import { ipcRenderer } from 'electron';

export const Terminal = () => {
  const [loaded, setLoaded] = useState(false);
  const [ship, setShip] = useState('');
  const xterm = useRef<XTerm>(null);
  const fit = useRef(new FitAddon());

  const write = (data) => {
    xterm.current.terminal.write(data);
  };

  const fitTerm = () => fit.current.fit();

  useEffect(() => {
    setLoaded(true);

    ipcRenderer.on('ship', (e, data) => {
      setShip(data);
    })
  }, []);

  useEffect(() => {
    if (!loaded || !ship) {
      return;
    }

    listen('terminal-incoming', write);
    window.addEventListener('resize', fitTerm)

    fit.current.fit()
    send('terminal-loaded', ship);

    return () => {
      unlisten('terminal-incoming');
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
        send('terminal-keystroke', { ship, data: e });
      }} 
    />
  )
}