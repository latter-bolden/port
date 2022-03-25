import React, { FC } from 'react'
import * as RadixDialog from '@radix-ui/react-dialog'
import { Close } from '../icons/Close'

export const Dialog: FC<RadixDialog.DialogOwnProps> = ({ children, ...props }) => (
    <RadixDialog.Root {...props}>
        <RadixDialog.Overlay className="fixed z-10 top-0 left-0 right-0 bottom-0 bg-white dark:bg-black opacity-70" />
        { children }
    </RadixDialog.Root>
)

type DialogContentProps = {
    showCloseIcon?: boolean;
    className?: string;
} & React.PropsWithChildren<RadixDialog.DialogContentOwnProps>;
export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(({ children, showCloseIcon = true, className = 'p-6', ...props }, ref) => (
    <RadixDialog.Content 
        className="fixed z-40 top-1/2 left-1/2 min-w-80 bg-gray-100 dark:bg-gray-900 rounded default-ring transform -translate-y-1/2 -translate-x-1/2"
        {...props}
        ref={ref}
    >
        <div className={`relative ${className}`}>
            {children}
            {showCloseIcon &&
                <RadixDialog.Close className="absolute top-2 right-2 text-gray-300 dark:text-gray-700 hover:text-gray-400 dark:hover:text-gray-500 focus:text-gray-400 dark:focus:text-gray-500 default-ring rounded">
                    <Close className="w-7 h-7" primary="fill-current" />
                </RadixDialog.Close>
            }
        </div>
    </RadixDialog.Content>
))


export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;