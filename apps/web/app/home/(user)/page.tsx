import { PageBody } from "@kit/ui/page";
import { Trans } from "@kit/ui/trans";

import { createI18nServerInstance } from "~/lib/i18n/i18n.server";
import { withI18n } from "~/lib/i18n/with-i18n";

// local imports
import { HomeLayoutPageHeader } from "./_components/home-page-header";

export const generateMetadata = async () => {
	const i18n = await createI18nServerInstance();
	const title = i18n.t("common:routes.dashboard");

	return {
		title,
	};
};

function UserHomePage() {
	return (
		<>
			<HomeLayoutPageHeader
				title={<Trans i18nKey={"common:routes.dashboard"} />}
				description={<Trans i18nKey={"common:dashboardTabDescription"} />}
			/>

			<PageBody>
				<div className="container mx-auto px-4 py-8">
					<p className="text-muted-foreground">
						Dashboard content will appear here
					</p>
				</div>
			</PageBody>
		</>
	);
}

export default withI18n(UserHomePage);
