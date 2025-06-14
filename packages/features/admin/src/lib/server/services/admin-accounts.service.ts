import "server-only";

import type { Database } from "@kit/supabase/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export function createAdminAccountsService(client: SupabaseClient<Database>) {
	return new AdminAccountsService(client);
}

class AdminAccountsService {
	constructor(private adminClient: SupabaseClient<Database>) {}

	async deleteAccount(accountId: string) {
		const { error } = await this.adminClient
			.from("accounts")
			.delete()
			.eq("id", accountId);

		if (error) {
			throw error;
		}
	}
}
