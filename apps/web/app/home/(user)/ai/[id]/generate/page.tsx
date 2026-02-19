import { requireUser } from "@kit/supabase/require-user";
import { getSupabaseServerClient } from "@kit/supabase/server-client";

import type { StoryboardSlide } from "../_lib/types/storyboard.types";
import { GenerateStep } from "./_components/generate-step";

export default async function GenerateStepPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id: presentationId } = await params;
	const client = getSupabaseServerClient();
	const auth = await requireUser(client);

	if (auth.error) {
		throw new Error("Unauthorized");
	}

	const [presentationResult, storyboardResult] = await Promise.all([
		client
			.from("presentations")
			.select("id, title")
			.eq("id", presentationId)
			.eq("user_id", auth.data.id)
			.maybeSingle(),
		client
			.from("storyboard_contents")
			.select("slides")
			.eq("presentation_id", presentationId)
			.maybeSingle(),
	]);

	if (presentationResult.error) {
		throw presentationResult.error;
	}

	if (!presentationResult.data) {
		throw new Error("Presentation not found");
	}

	if (storyboardResult.error) {
		throw storyboardResult.error;
	}

	const slides = (storyboardResult.data?.slides ??
		[]) as unknown as StoryboardSlide[];

	return (
		<GenerateStep
			presentationId={presentationId}
			presentationTitle={
				presentationResult.data.title ?? "Untitled Presentation"
			}
			slideCount={slides.length}
		/>
	);
}
