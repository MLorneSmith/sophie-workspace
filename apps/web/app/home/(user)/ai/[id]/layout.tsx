import { requireUser } from "@kit/supabase/require-user";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { redirect } from "next/navigation";

import type { Database } from "~/lib/database.types";

import { WorkflowShell } from "./_components/workflow-shell";

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
		.select("id, completed_steps")
		.eq("id", params.id)
		.eq("user_id", auth.data.id)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!presentation) {
		redirect("/home/ai");
	}

	const completedSteps = Array.isArray(presentation.completed_steps)
		? (presentation.completed_steps as string[])
		: [];

	return (
		<WorkflowShell presentationId={params.id} completedSteps={completedSteps}>
			{props.children}
		</WorkflowShell>
	);
}
