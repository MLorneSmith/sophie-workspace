/**
 * Server wrapper for SiteHeader that fetches session data
 * Passes session to client components safely
 */
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { Header } from "@kit/ui/marketing";

import { AppLogo } from "~/components/app-logo";

import { SiteHeaderAccountSection } from "./site-header-account-section";
import { SiteNavigation } from "./site-navigation";

export async function SiteHeaderServer() {
	const supabase = getSupabaseServerClient();
	const { data: sessionData } = await supabase.auth.getSession();

	return (
		<Header
			logo={<AppLogo />}
			navigation={<SiteNavigation />}
			actions={<SiteHeaderAccountSection session={sessionData.session} />}
		/>
	);
}
