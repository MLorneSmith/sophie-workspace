import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { PageBody } from "@kit/ui/page";
import { Trans } from "@kit/ui/trans";

import type { Database } from "~/lib/database.types";
import { createI18nServerInstance } from "~/lib/i18n/i18n.server";
import { withI18n } from "~/lib/i18n/with-i18n";

// local imports
import { DashboardGrid } from "./_components/dashboard-grid";
import { GreetingBanner } from "./_components/greeting-banner";
import { HomeLayoutPageHeader } from "./_components/home-page-header";
import type { DashboardData } from "./_lib/dashboard/types";
import { loadDashboardPageData } from "./_lib/server/dashboard-page.loader";
import { loadUserWorkspace } from "./_lib/server/load-user-workspace";

export const generateMetadata = async () => {
	const i18n = await createI18nServerInstance();
	const title = i18n.t("common:routes.dashboard");

	return {
		title,
	};
};

function hasActivity(data: DashboardData) {
	return (
		data.courseProgress !== null ||
		data.skillsRadar !== null ||
		data.kanbanSummary !== null ||
		data.activities.length > 0 ||
		data.presentations.length > 0
	);
}

async function UserHomePage() {
	const client = getSupabaseServerClient<Database>();

	const [dashboardData, workspace, accountRow] = await Promise.all([
		loadDashboardPageData(),
		loadUserWorkspace(),
		client
			.from("accounts")
			.select("created_at")
			.eq("is_personal_account", true)
			.limit(1)
			.maybeSingle(),
	]);

	const firstName =
		(workspace.workspace.name ?? workspace.user.email ?? "").split(" ")[0] ??
		"";

	return (
		<>
			<HomeLayoutPageHeader
				title={<Trans i18nKey={"common:routes.dashboard"} />}
				description={<Trans i18nKey={"common:dashboardTabDescription"} />}
			/>

			<PageBody>
				<GreetingBanner
					firstName={firstName}
					accountCreatedAt={accountRow.data?.created_at ?? null}
					hasActivity={hasActivity(dashboardData)}
				/>

				<DashboardGrid data={dashboardData} />
			</PageBody>
		</>
	);
}

export default withI18n(UserHomePage);
