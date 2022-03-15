import React, { useEffect } from 'react'
import * as Popover from '@radix-ui/react-popover';
import { ipcRenderer } from 'electron';
import { useStore } from '../App';

const PopoverContent: any = Popover.Content;

export const AttemptedLink = () => {
    const protocolLink = useStore(s => s.protocolLink);

    useEffect(() => {
        const handle = (event, link) => {
          useStore.setState({ protocolLink: link });
        }

        ipcRenderer.on('protocol-link', handle);

        return () => {
            ipcRenderer.removeListener('protocol-link', handle);
        }
    }, []);

    if (!protocolLink) {
        return null;
    }

    return (
      <Popover.Root open={true}>
        <Popover.Trigger className="absolute bottom-4 right-4 hover:text-black dark:hover:text-white default-ring" />
        <PopoverContent
            align="end"
            sideOffset={20}
            trapFocus={false}
            onOpenAutoFocus={event => event.preventDefault()}
            className="flex items-center max-w-sm p-2 text-sm text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-900 default-ring rounded"
        >
          <h2>Trying to open the link <strong>{protocolLink}</strong>, choose a ship to open it.</h2>
        </PopoverContent>
      </Popover.Root>
    );
}