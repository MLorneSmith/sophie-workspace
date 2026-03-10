import { requireUser } from "@kit/supabase/require-user";
import { getSupabaseServerClient } from "@kit/supabase/server-client";

import type { Database } from "~/lib/database.types";
import { getProfileByPresentationId } from "../../_lib/server/audience-profiles.service";
import { getSavedProfiles } from "../../../library/_lib/server/saved-profiles.service";

import { ProfileStepForm } from "./_components/profile-step-form";

export default async function ProfileStepPage(props: {
	params: Promise<{ id: string }>;
}) {
	const params = await props.params;
	const client = getSupabaseServerClient<Database>();
	const auth = await requireUser(client);

	if (auth.error) {
		throw new Error("Unauthorized");
	}

	const profile = await getProfileByPresentationId(client, params.id);

	// Get presentation to get account_id
	const { data: presentation } = await client
		.from("presentations")
		.select("account_id")
		.eq("id", params.id)
		.single();

	// Get saved profiles for this account
	const savedProfiles = presentation?.account_id
		? await getSavedProfiles(client, auth.data.id, presentation.account_id)
		: [];

	return (
		<ProfileStepForm
			presentationId={params.id}
			initialProfile={profile}
			savedProfiles={savedProfiles}
			accountId={presentation?.account_id ?? auth.data.id}
		/>
	);
}
