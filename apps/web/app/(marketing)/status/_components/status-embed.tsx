"use client";

import { Alert, AlertDescription, AlertTitle } from "@kit/ui/alert";
import { SitePageHeader } from "~/(marketing)/_components/site-page-header";

interface StatusPageProps {
	betterStackStatusUrl: string | undefined;
	title: string;
	subtitle: string;
	notConfiguredTitle: string;
	notConfiguredDescription: string;
}

export function StatusPage({
	betterStackStatusUrl,
	title,
	subtitle,
	notConfiguredTitle,
	notConfiguredDescription,
}: StatusPageProps) {
	return (
		<div className="flex flex-col space-y-4 xl:space-y-8">
			<SitePageHeader title={title} subtitle={subtitle} />

			<div className="container flex flex-col space-y-8 pb-16">
				{betterStackStatusUrl ? (
					<iframe
						src={betterStackStatusUrl}
						title="System Status"
						className="w-full min-h-[600px] rounded-lg border"
						loading="lazy"
					/>
				) : (
					<Alert variant="warning">
						<AlertTitle>{notConfiguredTitle}</AlertTitle>
						<AlertDescription>{notConfiguredDescription}</AlertDescription>
					</Alert>
				)}
			</div>
		</div>
	);
}
