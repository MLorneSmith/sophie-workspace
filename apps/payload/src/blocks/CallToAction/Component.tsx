"use client";

import type React from "react";
import Image from "next/image";
import { Button } from "../../../../../packages/ui/src/shadcn/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../../../packages/ui/src/shadcn/card";
// Define the type for the component props
type CallToActionData = {
	headline?: string;
	subheadline?: string;
	leftButtonLabel?: string;
	leftButtonUrl?: string;
	rightButtonLabel?: string;
	rightButtonUrl?: string;
};

// Define our own component props type since BlockComponentProps is not exported
type ComponentProps = {
	data?: CallToActionData;
	[key: string]: unknown;
};

// The component receives props from Lexical
const Component: React.FC<ComponentProps> = (props) => {
	// Destructure the important properties from props
	const { data } = props;

	// Extract data with defaults if missing
	const {
		headline = "FREE Course Trial",
		subheadline = "Start improving your presentations skills immediately with our free trial of the Decks for Decision Makers course.",
		leftButtonLabel = "Individuals",
		leftButtonUrl = "/free-trial/individual",
		rightButtonLabel = "Teams",
		rightButtonUrl = "/free-trial/teams",
	} = data || {};

	// Render the component
	return (
		<Card className="my-6">
			<CardHeader>
				<CardTitle>{headline}</CardTitle>
				<CardDescription>{subheadline}</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col sm:flex-row justify-end gap-4">
				<div className="relative">
					<div className="absolute -left-10 top-1/2 -translate-y-1/2">
						<Image
							src="/images/doodle.png"
							alt="Doodle"
							width={32}
							height={32}
							className="w-8 h-auto transform -rotate-90"
						/>
					</div>
					<Button variant="default" asChild>
						<a href={leftButtonUrl}>{leftButtonLabel}</a>
					</Button>
				</div>
				<div className="relative">
					<Button variant="outline" asChild>
						<a href={rightButtonUrl}>{rightButtonLabel}</a>
					</Button>
					<div className="absolute -right-10 top-1/2 -translate-y-1/2">
						<Image
							src="/images/doodle.png"
							alt="Doodle"
							width={32}
							height={32}
							className="w-8 h-auto transform rotate-90"
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default Component;
