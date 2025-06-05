"use client";

import { createContext } from "react";

import type { User } from "@supabase/supabase-js";

import type { Database } from "@kit/supabase/database";

interface AccountWorkspace {
	accounts: Database["public"]["Views"]["user_accounts"]["Row"][];
	account: Database["public"]["Functions"]["team_account_workspace"]["Returns"][0];
	user: User;
}

export const TeamAccountWorkspaceContext = createContext<AccountWorkspace>(
	{} as AccountWorkspace,
);

export function TeamAccountWorkspaceContextProvider(
	props: React.PropsWithChildren<{ value: AccountWorkspace }>,
) {
	return (
		<TeamAccountWorkspaceContext.Provider value={props.value}>
			{props.children}
		</TeamAccountWorkspaceContext.Provider>
	);
}
