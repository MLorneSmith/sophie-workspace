import { createI18nServerInstance } from "~/lib/i18n/i18n.server";

import { StoryboardPage } from "./_components/storyboard-page";

interface StoryboardServerPageProps {
	searchParams?: {
		id?: string;
	};
}

export const generateMetadata = async () => {
	const i18n = await createI18nServerInstance();
	const title = i18n.t("common:routes.Storyboard");

	return {
		title,
	};
};

export default async function StoryboardServerPage(
	_props: StoryboardServerPageProps,
) {
	const i18n = await createI18nServerInstance();
	const title = i18n.t("common:routes.Storyboard");
	const description = i18n.t("common:storyboardTabDescription");

	return <StoryboardPage title={title} description={description} />;
}
