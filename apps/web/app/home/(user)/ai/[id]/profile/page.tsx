import { requireUser } from "@kit/supabase/require-user";
import { getSupabaseServerClient } from "@kit/supabase/server-client";

import { getProfileByPresentationId } from "../../_lib/server/audience-profiles.service";

import { ProfileStepForm } from "./_components/profile-step-form";

export default async function ProfileStepPage(props: {
	params: Promise<{ id: string }>;
}) {
	const params = await props.params;
	const client = getSupabaseServerClient();
	const auth = await requireUser(client);

	if (auth.error) {
		throw new Error("Unauthorized");
	}

	const profile = await getProfileByPresentationId(client, params.id);

	return <ProfileStepForm presentationId={params.id} initialProfile={profile} />;
}
