/**
 * Server wrapper for SiteHeader that fetches session data
 * Passes session to client components safely
 */
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { Header } from "@kit/ui/marketing";

import { AppLogo } from "~/components/app-logo";

import { SiteHeaderAccountSection } from "./site-header-account-section";
import { SiteNavigation } from "./site-navigation";

interface ExtendedUser {
	id: string;
	email?: string;
	phone?: string;
	is_anonymous?: boolean;
	aal?: "aal1" | "aal2";
	app_metadata?: Record<string, unknown>;
	user_metadata?: Record<string, unknown>;
}

export async function SiteHeaderServer() {
	const supabase = getSupabaseServerClient();
	const { data: sessionData } = await supabase.auth.getSession();

	// Convert session to user data for client component
	const user = sessionData.session?.user
		? {
				id: sessionData.session.user.id,
				email: sessionData.session.user.email ?? "",
				phone: sessionData.session.user.phone ?? "",
				is_anonymous: sessionData.session.user.is_anonymous ?? false,
				aal:
					((sessionData.session.user as ExtendedUser).aal as "aal1" | "aal2") ??
					"aal1",
				app_metadata: sessionData.session.user.app_metadata ?? {},
				user_metadata: sessionData.session.user.user_metadata ?? {},
			}
		: null;

	return (
		<Header
			logo={<AppLogo />}
			navigation={<SiteNavigation />}
			actions={<SiteHeaderAccountSection user={user} />}
		/>
	);
}
