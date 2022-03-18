import React from 'react'
import * as Collapsible from '@radix-ui/react-collapsible'
import { UseFormMethods } from 'react-hook-form/dist/types'
import { AddPier } from '../../../background/services/pier-service'
import {ChevronDown} from '../../icons/ChevronDown'
import {PortField} from './PortField'

type AdvancedOptionsProps = {
  className?: string,
  form: UseFormMethods<AddPier>,
  children?: React.ReactNode
}

export const AdvancedOptions: React.FC<AdvancedOptionsProps> = ({ form }) => {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="relative">
      <Collapsible.Root open={open} onOpenChange={setOpen} className="absolute">
        <Collapsible.Trigger className="button border-none focus:outline-none cursor-pointer text-gray-400 dark:text-gray-500">
          Advanced Options <ChevronDown className="ml-1 w-5 h-5" primary="fill-current" />
        </Collapsible.Trigger>
        <Collapsible.Content className="pt-5">
          <label htmlFor="port">Ames Port</label>
          <PortField form={form} />
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  )
}