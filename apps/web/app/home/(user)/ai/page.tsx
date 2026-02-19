import { PageBody } from "@kit/ui/page";

import { HomeLayoutPageHeader } from "../_components/home-page-header";
import PresentationsList from "./_components/PresentationsList";
import { loadPresentations } from "./_lib/server/list-presentations.loader";

export const metadata = {
	title: "Presentations",
};

export default async function AIPage() {
	const presentations = await loadPresentations();

	return (
		<>
			<HomeLayoutPageHeader
				title="Presentations"
				description="Browse, resume, and create AI presentation projects."
			/>

			<PageBody>
				<PresentationsList presentations={presentations} />
			</PageBody>
		</>
	);
}
