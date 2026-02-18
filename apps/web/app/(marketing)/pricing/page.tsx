import { SitePageHeader } from "~/(marketing)/_components/site-page-header";
import { createI18nServerInstance } from "~/lib/i18n/i18n.server";
import { withI18n } from "~/lib/i18n/with-i18n";

import { HomePricingSection } from "../_components/home-pricing-section";

export const generateMetadata = async () => {
	const { t } = await createI18nServerInstance();

	return {
		title: t("marketing:pricing"),
	};
};

async function PricingPage() {
	const { t } = await createI18nServerInstance();

	return (
		<div className={"flex flex-col space-y-12"}>
			<SitePageHeader
				title={t("marketing:pricing")}
				subtitle={t("marketing:pricingSubtitle")}
			/>

			<div className={"container mx-auto pb-8 xl:pb-16"}>
				<HomePricingSection />
			</div>
		</div>
	);
}

export default withI18n(PricingPage);
