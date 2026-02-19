import type { Metadata } from "next";

import { PageBody } from "@kit/ui/page";

import { HomeLayoutPageHeader } from "../_components/home-page-header";
import PresentationsList from "./_components/PresentationsList";
import { loadPresentations } from "./_lib/server/list-presentations.loader";

export const metadata: Metadata = {
	title: "AI Workflow",
};

export default async function AIPage() {
	const presentations = await loadPresentations();

	return (
		<>
			<HomeLayoutPageHeader
				title="AI Workflow"
				description="Browse, resume, and create AI presentation projects."
			/>

			<PageBody>
				<PresentationsList presentations={presentations} />
			</PageBody>
		</>
	);
}
