import { getSupabaseServerClient } from "@kit/supabase/server-client";
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
import { LibraryTemplates } from "./_components/library-templates";

export const generateMetadata = async () => {
	const i18n = await createI18nServerInstance();
	const title = i18n.t("common:routes.library");

	return {
		title,
	};
};

async function LibraryPage() {
	const client = getSupabaseServerClient<Database>();
	const {
		data: { user },
	} = await client.auth.getUser();

	// Fetch audience profiles for the current user
	const { data: profiles } = user?.id
		? await client
				.from("audience_profiles")
				.select("id, person_name, company, title, created_at")
				.eq("user_id", user.id)
				.order("created_at", { ascending: false })
		: { data: null };

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
						<TabsTrigger value="profiles">
							<Trans i18nKey={"common:library.profiles"} />
						</TabsTrigger>
						<TabsTrigger value="company-profiles">
							<Trans i18nKey={"common:library.companyProfiles"} />
						</TabsTrigger>
					</TabsList>

					<TabsContent value="templates">
						<LibraryTemplates templates={CURATED_TEMPLATES} />
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

					<TabsContent value="company-profiles">
						<Card className="p-8 text-center">
							<p className="text-muted-foreground">
								<Trans i18nKey={"common:library.emptyCompanyProfiles"} />
							</p>
						</Card>
					</TabsContent>
				</Tabs>
			</PageBody>
		</>
	);
}

export default withI18n(LibraryPage);
