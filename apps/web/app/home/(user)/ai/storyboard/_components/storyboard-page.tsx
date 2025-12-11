"use client";

import { Alert, AlertDescription, AlertTitle } from "@kit/ui/alert";
import { PageBody } from "@kit/ui/page";
import { Toaster } from "@kit/ui/sonner";
import { AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { HomeLayoutPageHeader } from "../../../_components/home-page-header";
import { StoryboardProvider } from "../_lib/providers/storyboard-provider";
import { ErrorBoundary } from "./error-boundary";
import { PresentationSelector } from "./presentation-selector";
import { StoryboardPanel } from "./storyboard-panel";

interface StoryboardPageProps {
	title: string;
	description: string;
}

// Static error fallback element to display when an error occurs
const ErrorFallback = (
	<Alert variant="destructive">
		<AlertCircle className="h-4 w-4" />
		<AlertTitle>Error</AlertTitle>
		<AlertDescription>
			Something went wrong. Please try refreshing the page.
		</AlertDescription>
	</Alert>
);

export function StoryboardPage({ title, description }: StoryboardPageProps) {
	const searchParams = useSearchParams();
	const id = searchParams.get("id");
	const [selectedPresentationId, setSelectedPresentationId] = useState<
		string | null
	>(id);

	return (
		<ErrorBoundary fallback={ErrorFallback}>
			<StoryboardProvider>
				<Toaster />
				<HomeLayoutPageHeader title={title} description={description} />

				<PageBody>
					<div className="flex flex-col">
						{!selectedPresentationId ? (
							<PresentationSelector onSelect={setSelectedPresentationId} />
						) : (
							<StoryboardPanel
								presentationId={selectedPresentationId}
								onBack={() => setSelectedPresentationId(null)}
							/>
						)}
					</div>
				</PageBody>
			</StoryboardProvider>
		</ErrorBoundary>
	);
}
