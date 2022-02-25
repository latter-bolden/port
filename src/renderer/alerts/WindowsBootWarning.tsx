import React, { FunctionComponent, ReactElement } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip';

interface WindowsBootWarningProps {
    show?: boolean;
}

export const WindowsBootWarning: FunctionComponent<WindowsBootWarningProps> = ({ show = false, children }) => {
    if (!show) {
        return children as ReactElement;
    }

    return (
        <Tooltip.Root>
            <Tooltip.Trigger className="default-ring">
                {children}
            </Tooltip.Trigger>
            <Tooltip.Content side="top" className="max-w-sm px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded">
                Due to a bug in the urbit Windows runtime, only one local ship can be running at a time. Ships can be stopped using the <strong>Manage</strong> interface.
                <Tooltip.Arrow className="fill-current text-gray-100 dark:text-gray-800"/>
            </Tooltip.Content>
        </Tooltip.Root>
    );
}