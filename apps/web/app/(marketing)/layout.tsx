import type { JWTUserData } from "@kit/supabase/types";

import { MotionProvider } from "~/(marketing)/_components/motion-provider";
import { SiteFooter } from "~/(marketing)/_components/site-footer";
import { SiteHeader } from "~/(marketing)/_components/site-header";
import { withI18n } from "~/lib/i18n/with-i18n";

function SiteLayout(props: React.PropsWithChildren) {
	// User data not fetched here to avoid race condition with middleware's token refresh.
	// See GitHub #827 for details. Marketing pages work without user context.
	const user: JWTUserData | null = null;

	return (
		<div data-marketing className={"flex min-h-[100vh] flex-col"}>
			<SiteHeader user={user} />

			<MotionProvider>{props.children}</MotionProvider>

			<SiteFooter />
		</div>
	);
}

export default withI18n(SiteLayout);
