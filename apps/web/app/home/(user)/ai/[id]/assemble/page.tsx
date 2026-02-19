import { requireUser } from "@kit/supabase/require-user";
import { getSupabaseServerClient } from "@kit/supabase/server-client";

import BlocksMultistepForm from "../../blocks/BlocksMultistepForm";
import { ArgumentMapSection } from "./_components/argument-map-section";

export default async function AssembleStepPage() {
	const client = getSupabaseServerClient();
	const auth = await requireUser(client);

	if (auth.error) {
		throw new Error("Unauthorized");
	}

	return (
		<>
			<BlocksMultistepForm userId={auth.data.id} />

			{/*
				New (local-only) Pyramid Principle argument map editor.
				
				Note: persistence and wiring into AssembleOutput will come in a follow-up PR.
			*/}
			<div className="container mx-auto max-w-4xl p-4 pt-0">
				<ArgumentMapSection />
			</div>
		</>
	);
}
