import { requireUser } from "@kit/supabase/require-user";
import { getSupabaseServerClient } from "@kit/supabase/server-client";

import type { Database } from "~/lib/database.types";
import { getAssembleOutput } from "../../_lib/server/assemble-outputs.service";
import { getProfileByPresentationId } from "../../_lib/server/audience-profiles.service";
import type { FormData } from "../../blocks/_components/BlocksFormContext";
import BlocksMultistepForm from "../../blocks/BlocksMultistepForm";

import { DeckUpload } from "./_components/deck-upload";

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

	// Build audience string from profile data
	const audienceLabel = [
		audienceProfile?.person_name,
		audienceProfile?.company ? `at ${audienceProfile.company}` : null,
	]
		.filter(Boolean)
		.join(" ");

	const initialFormData: Partial<FormData> = {
		title: presentation.title ?? "",
		audience: audienceLabel || "",
		presentation_type: assembleOutput?.presentation_type ?? "",
		question_type: assembleOutput?.question_type ?? "",
		situation: assembleOutput?.situation ?? "",
		complication: assembleOutput?.complication ?? "",
		// NOTE: current form uses `answer` (legacy). We don't persist it anymore.
		answer: "",
		argument_map: assembleOutput?.argument_map ?? undefined,
	};

	// Extract company brief from enrichment data for SCQA context hints
	const enrichment = audienceProfile?.enrichment_data as {
		companyBrief?: {
			currentSituation?: {
				summary?: string;
				archetype?: string;
				strategicFocus?: string;
				challenges?: string[];
			};
			presentationImplications?: { framingAdvice?: string };
		};
	} | null;
	const companyBrief = enrichment?.companyBrief ?? null;

	return (
		<div className="space-y-6">
			{companyBrief?.currentSituation?.summary ? (
				<div className="mx-auto max-w-3xl px-6 pt-4 sm:px-8">
					<div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
						<p className="text-app-xs font-medium text-blue-400">
							🏢 Company Context
							{companyBrief.currentSituation.archetype ? (
								<span className="ml-2 rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] capitalize">
									{companyBrief.currentSituation.archetype.replace(/-/g, " ")}
								</span>
							) : null}
						</p>
						<p className="mt-1 text-app-xs text-muted-foreground">
							{companyBrief.currentSituation.summary}
						</p>
						{companyBrief.presentationImplications?.framingAdvice ? (
							<p className="mt-1 text-app-xs text-muted-foreground">
								<span className="font-medium">Tip:</span>{" "}
								{companyBrief.presentationImplications.framingAdvice}
							</p>
						) : null}
					</div>
				</div>
			) : null}

			{/* Deck Upload Section */}
			<div className="mx-auto max-w-3xl px-6 sm:px-8">
				<DeckUpload presentationId={presentationId} />
			</div>

			<BlocksMultistepForm
				userId={auth.data.id}
				mode="assemble"
				presentationId={presentationId}
				initialFormData={initialFormData as FormData}
			/>
		</div>
	);
}
