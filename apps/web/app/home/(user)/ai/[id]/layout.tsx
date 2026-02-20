import { redirect } from "next/navigation";

import { requireUser } from "@kit/supabase/require-user";
import { getSupabaseServerClient } from "@kit/supabase/server-client";

import type { Database } from "~/lib/database.types";

import { WorkflowShell } from "./_components/WorkflowShell";

export default async function PresentationWorkflowLayout(props: {
	children: React.ReactNode;
	params: Promise<{ id: string }>;
}) {
	const params = await props.params;
	const client = getSupabaseServerClient<Database>();
	const auth = await requireUser(client);

	if (auth.error) {
		throw new Error("Unauthorized");
	}

	const { data: presentation, error } = await client
		.from("presentations")
		.select("id")
		.eq("id", params.id)
		.eq("user_id", auth.data.id)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!presentation) {
		redirect("/home/ai");
	}

	return (
		<WorkflowShell presentationId={params.id}>{props.children}</WorkflowShell>
	);
}
