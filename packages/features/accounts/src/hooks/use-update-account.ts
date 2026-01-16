import type { Database } from "@kit/supabase/database";
import { useSupabase } from "@kit/supabase/hooks/use-supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type UpdateData = Database["public"]["Tables"]["accounts"]["Update"];

export function useUpdateAccountData(accountId: string) {
	const client = useSupabase();
	const queryClient = useQueryClient();

	const mutationKey = ["account:data", accountId];

	const mutationFn = async (data: UpdateData) => {
		const response = await client.from("accounts").update(data).match({
			id: accountId,
		});

		if (response.error) {
			throw response.error;
		}

		return data;
	};

	return useMutation({
		mutationKey,
		mutationFn,
		onSuccess: async (data) => {
			// Optimistically update the cache with the new data
			// This ensures UI updates immediately without waiting for a refetch
			queryClient.setQueryData(
				["account:data", accountId],
				(oldData: unknown) => {
					if (!oldData || typeof oldData !== "object") {
						return data;
					}
					return { ...oldData, ...data };
				},
			);

			// Also invalidate to ensure consistency with server state
			await queryClient.invalidateQueries({
				queryKey: ["account:data", accountId],
				refetchType: "all",
			});
		},
	});
}
