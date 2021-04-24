import { useForm } from "react-hook-form";
import { useQueryClient, useMutation, useQuery, MutationFunction } from "react-query";
import { useHistory } from "react-router-dom";
import { send } from "../client/ipc";
import { AddPier, Pier } from "../../background/services/pier-service";
import { pierKey } from "../query-keys";

export function useAddPier<Action = AddPier>(mutator: MutationFunction<Pier, Action>, boot = true) {
    const history = useHistory();
    const queryClient = useQueryClient();
    const form = useForm<AddPier>({
        mode: 'onChange',
        reValidateMode: 'onChange'
    });
    const { mutate } = useMutation(mutator, {
        onSuccess: (pier: Pier) => {
            if (!pier)
                return;

            queryClient.setQueryData(pierKey(pier.slug), pier);
            history.push(boot ? `/boot/${pier.slug}` : `/pier/${pier.slug}/launch`)
        }
    })
    const { data: piers } = useQuery(pierKey(), () => send('get-piers'))
    
    function nameValidator(value: string) {
        return !piers.find(pier => pier.name.toLocaleLowerCase() === value.toLocaleLowerCase())
    }

    return {
        form,
        mutate,
        nameValidator,
        namePattern: /^[\w_ -]*$/i,
        shipnamePattern: /^[a-z~-]*$/i,
        nameNotUnique: form.errors.name?.type === 'validate',
        nameContainsInvalidCharacters: form.errors.name?.type === 'pattern',
        shipnameContainsInvalidCharacters: form.errors.shipName?.type === 'pattern',
    }
}