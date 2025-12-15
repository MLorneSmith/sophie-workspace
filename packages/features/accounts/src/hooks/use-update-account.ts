import type { Database } from "@kit/supabase/database";
import { useSupabase } from "@kit/supabase/hooks/use-supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type UpdateData = Database["public"]["Tables"]["accounts"]["Update"];

export function useUpdateAccountData(accountId: string) {
	const client = useSupabase();
	const queryClient = useQueryClient();

	const mutationKey = ["account:data", accountId];

	const mutationFn = async (data: UpdateData) => {
		const response = await client
			.from("accounts")
			.update(data)
			.match({
				id: accountId,
			})
			.select("id, name, picture_url, public_data")
			.single();

		if (response.error) {
			throw response.error;
		}

		return response.data;
	};

	return useMutation({
		mutationKey,
		mutationFn,
		onSuccess: (data) => {
			if (data) {
				// Directly update the cache with the new data
				queryClient.setQueryData(["account:data", accountId], data);
			}
		},
	});
}
