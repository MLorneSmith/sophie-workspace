import { createI18nServerInstance } from "~/lib/i18n/i18n.server";

export const generateMetadata = async () => {
	const i18n = await createI18nServerInstance();
	const title = i18n.t("common:routes.aiCanvas");

	return {
		title,
	};
};

export default function CanvasLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
