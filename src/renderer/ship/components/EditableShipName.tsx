import React from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient, useMutation } from 'react-query'
import { pierKey } from "../../query-keys";
import { Pencil } from '../../icons/Pencil'
import { Close } from '../../icons/Close'
import { Pier, UpdatePier } from "../../../background/services/pier-service"
import { send } from '../../client/ipc'
import { NameField } from '../../details/components/NameField'

export const EditableShipName = (props: { ship: Pier }) => {
  const [editMode, setEditMode] = React.useState(false)
  const queryClient = useQueryClient()

  const form = useForm<UpdatePier>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: props.ship.name
    }
  })
  const { mutate } = useMutation((data: UpdatePier) => send('update-pier', {...props.ship, ...data}), {
    onSuccess: (pier: Pier) => {
      queryClient.setQueryData(pierKey(pier.slug), pier)
      setEditMode(false)
    }
  })
  
  const { isValid } = form.formState

  const ShipNameDisplay = (
    <div className="w-2/3 flex flex-row items-baseline">
      <div className="mr-3 text-xl text-black dark:text-white whitespace-nowrap">{ props.ship.name }</div>
      <button className="button opacity-70" onClick={setEditMode.bind(this, true)}>
        <Pencil className="w-4 h-4 opacity-70" primary="gray"/>
      </button>
    </div>
  )

  const ShipNameEdit = (
    <form onSubmit={form.handleSubmit((data) => mutate(data))}>
      <div className="w-100 flex flex-row baseline">
        <div className="w-2/3 mr-2 text-black dark:text-white">
          <NameField form={form} />
        </div>
        <div className="relative">
          <button className="button absolute top-2 font-semibold text-gray-300 dark:text-gray-700" type="submit" disabled={!isValid}>
            Save
          </button>
          <button className="button absolute top-2 p-1.5 left-14" onClick={setEditMode.bind(this, false)}>
            <Close className="w-4 h-4" primary="fill-current opacity-40" />
          </button>
        </div>
      </div>
    </form>
  )

  return (
    <div className="w-100 flex flex-row items-baseline">
      {
        editMode
        ? ShipNameEdit
        : ShipNameDisplay
      }
    </div>
  )
}