import { AGENT_CATALOG } from "@kit/mastra";

import { StoryboardEditor } from "./_components/storyboard-editor";

export default async function StoryboardStepPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id: presentationId } = await params;

	return (
		<StoryboardEditor
			presentationId={presentationId}
			agentCatalog={AGENT_CATALOG}
		/>
	);
}
