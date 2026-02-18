import { WorkflowShell } from "./_components/WorkflowShell";

export default async function PresentationWorkflowLayout(props: {
	children: React.ReactNode;
	params: Promise<{ id: string }>;
}) {
	const params = await props.params;

	return (
		<WorkflowShell presentationId={params.id}>{props.children}</WorkflowShell>
	);
}
