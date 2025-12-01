import type { JWTUserData } from "@kit/supabase/types";
import { getSupabaseServerClient } from "@kit/supabase/server-client";

import { SiteFooter } from "~/(marketing)/_components/site-footer";
import { SiteHeader } from "~/(marketing)/_components/site-header";
import { withI18n } from "~/lib/i18n/with-i18n";

async function SiteLayout(props: React.PropsWithChildren) {
	const client = getSupabaseServerClient();
	const { data } = await client.auth.getUser();

	// Map Supabase User to JWTUserData format if authenticated
	const user: JWTUserData | null = data.user
		? {
				id: data.user.id,
				email: data.user.email ?? "",
				phone: data.user.phone ?? "",
				app_metadata: data.user.app_metadata,
				user_metadata: data.user.user_metadata,
				aal: "aal1" as const, // Marketing pages don't need MFA check
				is_anonymous: data.user.is_anonymous ?? false,
			}
		: null;

	return (
		<div className={"flex min-h-[100vh] flex-col"}>
			<SiteHeader user={user} />

			{props.children}

			<SiteFooter />
		</div>
	);
}

export default withI18n(SiteLayout);
