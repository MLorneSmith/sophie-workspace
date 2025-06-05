import { requireUser } from "@kit/supabase/require-user";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { PageBody } from "@kit/ui/page";
import { Trans } from "@kit/ui/trans";

import { createI18nServerInstance } from "~/lib/i18n/i18n.server";
import { withI18n } from "~/lib/i18n/with-i18n";

import { HomeLayoutPageHeader } from "../../_components/home-page-header";
import SetupMultistepForm from "./BlocksMultistepForm";

export const generateMetadata = async () => {
	const i18n = await createI18nServerInstance();
	const title = i18n.t("common:routes.blocks");

	return {
		title,
	};
};

async function BlocksPage() {
	const client = getSupabaseServerClient();
	const auth = await requireUser(client);

	if (auth.error) {
		throw new Error("Unauthorized");
	}

	return (
		<>
			<HomeLayoutPageHeader
				title={<Trans i18nKey={"common:routes.blocks"} />}
				description={<Trans i18nKey={"common:blocksTabDescription"} />}
			/>

			<PageBody>
				<SetupMultistepForm userId={auth.data.id} />
			</PageBody>
		</>
	);
}

export default withI18n(BlocksPage);
