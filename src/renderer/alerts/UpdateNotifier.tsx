import React, { useEffect } from 'react'
import { useStore } from '../App';
import { send } from '../client/ipc';
import { Spinner } from '../shared/Spinner';
import * as Popover from '@radix-ui/react-popover';
import { Close } from '../icons/Close';
import { Button } from '../shared/Button';
import { ipcRenderer } from 'electron';
import { useHistory, useRouteMatch } from 'react-router';

const PopoverContent: any = Popover.Content;

export const UpdateNotifier = () => {
    const history = useHistory();
    const match = useRouteMatch('/pier/:slug/launch')
    const status = useStore(state => state.updateStatus);

    function install() {
        send('install-updates');
    }

    function onClick() {
        if (match) {
            history.push('/')
        }
    }

    useEffect(() => {
        const listenAvailable = () => {
            useStore.setState({ updateStatus: 'available' });

            //just in case downloaded event fails to trigger,
            //hide after two minutes
            setTimeout(() => {
                useStore.setState({ updateStatus: 'initial' });
            }, 2 * 60 * 1000)
            
            //trigger update alert after thirty minutes
            setTimeout(() => {
                useStore.setState({ updateStatus: 'downloaded' });
            }, 30 * 60 * 1000)
        };

        const listenDownloaded = () => {
            useStore.setState({ updateStatus: 'downloaded' });
        };

        ipcRenderer.on('update-available', listenAvailable);
        ipcRenderer.on('update-downloaded', listenDownloaded);

        return () => {
            ipcRenderer.removeListener('update-available', listenAvailable);
            ipcRenderer.removeListener('update-downloaded', listenDownloaded);
        }
    }, []);

    if (status === 'initial') {
        return null;
    }

    return (
        <span className="flex items-center ml-4 mr-2 text-xs leading-none text-gray-400 dark:text-gray-500">
            {status === 'available' && 
                <>
                    <Spinner className="w-4 h-4 mr-2" />
                    <span>Getting Updates</span>
                </>
            }
            {status === 'downloaded' &&
                <>
                    <Popover.Root defaultOpen={true}>
                        <Popover.Trigger className="hover:text-black dark:hover:text-white default-ring" onClick={onClick}>
                            Updates Ready
                        </Popover.Trigger>
                        <PopoverContent
                            align="end"
                            sideOffset={20}
                            trapFocus={false}
                            onOpenAutoFocus={event => event.preventDefault()}
                            className="relative -right-8 flex items-center p-2 text-sm text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-900 default-ring rounded"
                        >
                            <Popover.Close className="mr-2 text-gray-300 dark:text-gray-700 hover:text-gray-400 dark:hover:text-gray-500 focus:text-gray-400 dark:focus:text-gray-500 default-ring rounded">
                                <Close className="w-5 h-5" primary="fill-current" />
                            </Popover.Close>
                            <h2><strong>Update Available</strong></h2>
                            <Popover.Close as={Button} className="ml-6" onClick={install}>Quit and Install</Popover.Close>
                        </PopoverContent>
                    </Popover.Root>
                </>    
            }
        </span>
    );
}