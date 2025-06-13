import { createI18nServerInstance } from "~/lib/i18n/i18n.server";

import { ErrorBoundary } from "./_components/error-boundary";
import { StoryboardPage } from "./_components/storyboard-page";

interface StoryboardServerPageProps {
	searchParams?: {
		id?: string;
	};
}

export const generateMetadata = async () => {
	const i18n = await createI18nServerInstance();
	const title = i18n.t("common:routes.Storyboard");

	return {
		title,
	};
};

export default async function StoryboardServerPage(
	_props: StoryboardServerPageProps,
) {
	const i18n = await createI18nServerInstance();
	const title = i18n.t("common:routes.Storyboard");
	const description = i18n.t("common:storyboardTabDescription");

	return (
		<ErrorBoundary
			fallback={(error) => (
				<div className="flex h-full flex-col items-center justify-center p-4">
					<h2 className="text-2xl font-bold text-red-600">
						Something went wrong.
					</h2>
					<p className="mt-2 text-gray-700">
						We're sorry, but an unexpected error occurred while loading the
						storyboard.
					</p>
					{error && (
						<p className="mt-2 text-sm text-gray-500">Error: {error.message}</p>
					)}
					<p className="mt-4 text-gray-700">Please try refreshing the page.</p>
					<button
						type="button"
						className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
						onClick={() => window.location.reload()}
					>
						Retry
					</button>
				</div>
			)}
		>
			<StoryboardPage title={title} description={description} />
		</ErrorBoundary>
	);
}
