import { requireUser } from "@kit/supabase/require-user";
import { getSupabaseServerClient } from "@kit/supabase/server-client";

import BlocksMultistepForm from "../../blocks/BlocksMultistepForm";

export default async function AssembleStepPage() {
	const client = getSupabaseServerClient();
	const auth = await requireUser(client);

	if (auth.error) {
		throw new Error("Unauthorized");
	}

	return <BlocksMultistepForm userId={auth.data.id} />;
}
