import { StatusPage } from "./_components/status-embed";
import { createI18nServerInstance } from "~/lib/i18n/i18n.server";
import { withI18n } from "~/lib/i18n/with-i18n";

export const generateMetadata = async () => {
	const { t } = await createI18nServerInstance();

	return {
		title: t("marketing:status"),
	};
};

async function StatusPageRoute() {
	const { t } = await createI18nServerInstance();
	const betterStackStatusUrl = process.env.BETTERSTACK_STATUS_URL;

	return (
		<StatusPage
			betterStackStatusUrl={betterStackStatusUrl}
			title={t("marketing:status")}
			subtitle={t("marketing:statusSubtitle")}
			notConfiguredTitle={t("marketing:statusNotConfiguredTitle")}
			notConfiguredDescription={t("marketing:statusNotConfiguredDescription")}
		/>
	);
}

export default withI18n(StatusPageRoute);
