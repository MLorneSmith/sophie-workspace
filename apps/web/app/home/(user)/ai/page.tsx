import { PageBody } from "@kit/ui/page";

import { HomeLayoutPageHeader } from "../_components/home-page-header";
import PresentationsList from "./_components/PresentationsList";

export const metadata = {
	title: "Presentations",
};

export default function AIPage() {
	return (
		<>
			<HomeLayoutPageHeader
				title="Presentations"
				description="Browse, resume, and create AI presentation projects."
			/>

			<PageBody>
				<PresentationsList />
			</PageBody>
		</>
	);
}
