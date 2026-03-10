import { requireUser } from "@kit/supabase/require-user";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { createAccountsApi } from "@kit/accounts/api";
import { Card } from "@kit/ui/card";
import { PageBody } from "@kit/ui/page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kit/ui/tabs";
import { Trans } from "@kit/ui/trans";

import type { Database } from "~/lib/database.types";
import { createI18nServerInstance } from "~/lib/i18n/i18n.server";
import { withI18n } from "~/lib/i18n/with-i18n";

import { CURATED_TEMPLATES } from "~/config/templates.config";
import { HomeLayoutPageHeader } from "../_components/home-page-header";
import { LibraryProfiles } from "./_components/library-profiles";
import { LibrarySavedProfiles } from "./_components/library-saved-profiles";
import { LibraryTemplates } from "./_components/library-templates";
import { getSavedProfiles } from "./_lib/server/saved-profiles.service";

export const generateMetadata = async () => {
	const i18n = await createI18nServerInstance();
	const title = i18n.t("common:routes.library");

	return {
		title,
	};
};

async function LibraryPage() {
	const client = getSupabaseServerClient<Database>();
	const auth = await requireUser(client);

	if (auth.error) {
		throw new Error("Unauthorized");
	}

	const user = auth.data;

	// Get the personal account's actual ID using the accounts API
	const accountsApi = createAccountsApi(client);
	const workspace = await accountsApi.getAccountWorkspace();
	const personalAccountId = workspace?.id;

	// Fetch audience profiles for the current user
	const { data: profiles } = user?.id
		? await client
				.from("audience_profiles")
				.select("id, person_name, company, title, created_at")
				.eq("user_id", user.id)
				.order("created_at", { ascending: false })
		: { data: null };

	// Fetch saved profiles for the current user using the service
	const savedProfiles =
		user?.id && personalAccountId
			? await getSavedProfiles(client, user.id, personalAccountId)
			: [];

	return (
		<>
			<HomeLayoutPageHeader
				title={<Trans i18nKey={"common:routes.library"} />}
				description={<Trans i18nKey={"common:library.templatesDescription"} />}
			/>

			<PageBody>
				<Tabs defaultValue="templates" className="w-full">
					<TabsList>
						<TabsTrigger value="templates">
							<Trans i18nKey={"common:library.templates"} />
						</TabsTrigger>
						<TabsTrigger value="saved-profiles">
							<Trans i18nKey={"common:library.savedProfiles"} />
						</TabsTrigger>
						<TabsTrigger value="profiles">
							<Trans i18nKey={"common:library.profiles"} />
						</TabsTrigger>
					</TabsList>

					<TabsContent value="templates">
						<LibraryTemplates templates={CURATED_TEMPLATES} />
					</TabsContent>

					<TabsContent value="saved-profiles">
						{savedProfiles && savedProfiles.length > 0 ? (
							<LibrarySavedProfiles profiles={savedProfiles} />
						) : (
							<Card className="p-8 text-center">
								<p className="text-muted-foreground">
									<Trans i18nKey={"common:library.emptySavedProfiles"} />
								</p>
							</Card>
						)}
					</TabsContent>

					<TabsContent value="profiles">
						{profiles && profiles.length > 0 ? (
							<LibraryProfiles profiles={profiles} />
						) : (
							<Card className="p-8 text-center">
								<p className="text-muted-foreground">
									<Trans i18nKey={"common:library.emptyProfiles"} />
								</p>
							</Card>
						)}
					</TabsContent>
				</Tabs>
			</PageBody>
		</>
	);
}

export default withI18n(LibraryPage);
