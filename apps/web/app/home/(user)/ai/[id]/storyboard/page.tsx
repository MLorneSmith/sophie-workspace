import { redirect } from "next/navigation";

import { createI18nServerInstance } from "~/lib/i18n/i18n.server";

import { StoryboardPage } from "../../storyboard/_components/storyboard-page";

export default async function StoryboardStepPage(props: {
	params: Promise<{ id: string }>;
	searchParams?: { id?: string };
}) {
	const params = await props.params;

	// The existing Storyboard implementation uses ?id=<submissionId>.
	// Bridge the new route param into the expected query param.
	if (props.searchParams?.id !== params.id) {
		redirect(`/home/ai/${params.id}/storyboard?id=${params.id}`);
	}

	const i18n = await createI18nServerInstance();
	const title = i18n.t("common:routes.Storyboard");
	const description = i18n.t("common:storyboardTabDescription");

	return <StoryboardPage title={title} description={description} />;
}
