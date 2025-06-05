"use client";

import { createContext } from "react";

import type { User } from "@supabase/supabase-js";

import type { Tables } from "@kit/supabase/database";

interface UserWorkspace {
	accounts: Array<{
		label: string | null;
		value: string | null;
		image: string | null;
	}>;

	workspace: {
		id: string | null;
		name: string | null;
		picture_url: string | null;
		subscription_status: Tables<"subscriptions">["status"] | null;
	};

	user: User;
}

export const UserWorkspaceContext = createContext<UserWorkspace>(
	{} as UserWorkspace,
);

export function UserWorkspaceContextProvider(
	props: React.PropsWithChildren<{
		value: UserWorkspace;
	}>,
) {
	return (
		<UserWorkspaceContext.Provider value={props.value}>
			{props.children}
		</UserWorkspaceContext.Provider>
	);
}
