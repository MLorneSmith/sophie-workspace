import { useSupabase } from "@kit/supabase/hooks/use-supabase";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

type Notification = {
	id: number;
	body: string;
	dismissed: boolean;
	type: "info" | "warning" | "error";
	created_at: string;
	link: string | null;
};

export function useNotificationsStream(params: {
	onNotifications: (notifications: Notification[]) => void;
	accountIds: string[];
	enabled: boolean;
}) {
	const client = useSupabase();

	const { data: subscription } = useQuery({
		enabled: params.enabled,
		queryKey: ["realtime-notifications", ...params.accountIds],
		queryFn: () => {
			const channel = client.channel("notifications-channel");

			return channel
				.on(
					"postgres_changes",
					{
						event: "INSERT",
						schema: "public",
						filter: `account_id=in.(${params.accountIds.join(", ")})`,
						table: "notifications",
					},
					(payload) => {
						params.onNotifications([payload.new as Notification]);
					},
				)
				.subscribe();
		},
	});

	useEffect(() => {
		return () => {
			void subscription?.unsubscribe();
		};
	}, [subscription]);
}
