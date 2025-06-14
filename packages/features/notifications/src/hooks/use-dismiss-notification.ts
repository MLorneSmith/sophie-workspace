import { useSupabase } from "@kit/supabase/hooks/use-supabase";
import { useCallback } from "react";

export function useDismissNotification() {
	const client = useSupabase();

	return useCallback(
		async (notification: number) => {
			const { error } = await client
				.from("notifications")
				.update({ dismissed: true })
				.eq("id", notification);

			if (error) {
				throw error;
			}
		},
		[client],
	);
}
