import { useForm } from "react-hook-form";
import { useQueryClient, useMutation, MutationFunction } from "react-query";
import { useHistory } from "react-router-dom";
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
            history.push(boot ? `/boot/new/${pier.slug}` : `/pier/${pier.slug}/launch`)
        }
    })

    return {
        form,
        mutate
    }
}