import { PageBody } from "@kit/ui/page";
import { Trans } from "@kit/ui/trans";

import { createI18nServerInstance } from "~/lib/i18n/i18n.server";
import { withI18n } from "~/lib/i18n/with-i18n";

// local imports
import { DashboardGrid } from "./_components/dashboard-grid";
import { HomeLayoutPageHeader } from "./_components/home-page-header";
import { loadDashboardPageData } from "./_lib/server/dashboard-page.loader";

export const generateMetadata = async () => {
	const i18n = await createI18nServerInstance();
	const title = i18n.t("common:routes.dashboard");

	return {
		title,
	};
};

async function UserHomePage() {
	const dashboardData = await loadDashboardPageData();

	return (
		<>
			<HomeLayoutPageHeader
				title={<Trans i18nKey={"common:routes.dashboard"} />}
				description={<Trans i18nKey={"common:dashboardTabDescription"} />}
			/>

			<PageBody>
				<DashboardGrid data={dashboardData} />
			</PageBody>
		</>
	);
}

export default withI18n(UserHomePage);
