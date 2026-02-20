import { requireUser } from "@kit/supabase/require-user";
import { getSupabaseServerClient } from "@kit/supabase/server-client";

import type { Database } from "~/lib/database.types";

import { getProfileByPresentationId } from "../../_lib/server/audience-profiles.service";
import { getAssembleOutput } from "../../_lib/server/assemble-outputs.service";
import type { FormData } from "../../blocks/_components/BlocksFormContext";
import BlocksMultistepForm from "../../blocks/BlocksMultistepForm";

export default async function AssembleStepPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id: presentationId } = await params;

	const client = getSupabaseServerClient<Database>();
	const auth = await requireUser(client);

	if (auth.error) {
		throw new Error("Unauthorized");
	}

	// Load existing Assemble data (if any) to prefill the multistep form.
	const [assembleOutput, audienceProfile, presentation] = await Promise.all([
		getAssembleOutput(client, presentationId),
		getProfileByPresentationId(client, presentationId),
		client
			.from("presentations")
			.select("id, title")
			.eq("id", presentationId)
			.eq("user_id", auth.data.id)
			.maybeSingle()
			.then(({ data, error }) => {
				if (error) throw error;
				return data;
			}),
	]);

	if (!presentation) {
		throw new Error("Presentation not found");
	}

	const initialFormData: Partial<FormData> = {
		title: presentation.title ?? "",
		audience: audienceProfile?.person_name ?? "",
		presentation_type: assembleOutput?.presentation_type ?? "",
		question_type: assembleOutput?.question_type ?? "",
		situation: assembleOutput?.situation ?? "",
		complication: assembleOutput?.complication ?? "",
		// NOTE: current form uses `answer` (legacy). We don't persist it anymore.
		answer: "",
		argument_map: assembleOutput?.argument_map ?? undefined,
	};

	return (
		<BlocksMultistepForm
			userId={auth.data.id}
			mode="assemble"
			presentationId={presentationId}
			initialFormData={initialFormData as FormData}
		/>
	);
}
