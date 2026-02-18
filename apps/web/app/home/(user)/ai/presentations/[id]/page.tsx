import { redirect } from "next/navigation";

export default async function PresentationWorkflowIndex(props: {
	params: Promise<{ id: string }>;
}) {
	const params = await props.params;
	redirect(`/home/ai/presentations/${params.id}/profile`);
}
