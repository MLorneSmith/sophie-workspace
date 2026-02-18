import { redirect } from "next/navigation";

import { createI18nServerInstance } from "~/lib/i18n/i18n.server";

import { CanvasPage } from "../../canvas/_components/canvas-page";

export default async function OutlineStepPage(props: {
	params: Promise<{ id: string }>;
	searchParams?: { id?: string };
}) {
	const params = await props.params;

	// The existing Canvas implementation uses ?id=<submissionId>.
	// Bridge the new route param into the expected query param.
	if (props.searchParams?.id !== params.id) {
		redirect(`/home/ai/${params.id}/outline?id=${params.id}`);
	}

	const i18n = await createI18nServerInstance();
	const title = i18n.t("common:routes.aiCanvas");
	const description = i18n.t("common:aiCanvasTabDescription");

	return <CanvasPage title={title} description={description} />;
}
