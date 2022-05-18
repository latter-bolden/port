import React from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Caution } from '../icons/Caution'
import { Warning } from '../icons/Warning'

interface TooltipInterface {
    className: string
}

export const FirstBootTooltip: React.FC<TooltipInterface> = ({ className }) => (
    <div className={className}>
        <Tooltip.Root>
            <Tooltip.Trigger className="default-ring cursor-default">
                <Warning className="text-gray-400 dark:text-gray-500 h-5 w-5"></Warning>
            </Tooltip.Trigger>
            <Tooltip.Content side="top" className="max-w-md px-3 py-2 text-sm bg-gray-200 dark:bg-gray-800 rounded">
                Please do not close the app while booting for the first time. If interrupted,
                your ship may require a factory reset.
            </Tooltip.Content>
        </Tooltip.Root>
    </div>
)

export const RecoveryTooltip: React.FC<TooltipInterface> = ({ className }) => (
    <div className={className}>
        <Tooltip.Root>
            <Tooltip.Trigger className="default-ring cursor-default">
                <Caution className="text-yellow-500 dark:text-yellow-700 h-5 w-5"></Caution>
            </Tooltip.Trigger>
            <Tooltip.Content side="top" className="max-w-md px-3 py-2 text-sm bg-gray-200 dark:bg-gray-800 rounded">
                This ship was interrupted while booting for the first time. You can try starting it,
                but if that doesn't work, you may require a factory reset.
            </Tooltip.Content>
        </Tooltip.Root>
    </div>
)