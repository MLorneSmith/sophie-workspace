"use client";

import type React from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../../../packages/ui/src/shadcn/card";

// Define the type for the component props
type TestBlockData = {
	text?: string;
	// Remove any type usage
};

// Define our own component props type
type ComponentProps = {
	data?: TestBlockData;
	// Remove any type usage
};

// The component receives props from Lexical
const Component: React.FC<ComponentProps> = (props) => {
	// Destructure the important properties from props
	const { data } = props;

	// Extract data with defaults if missing
	const { text = "Test Block" } = data || {};

	// Render the component
	return (
		<Card className="my-6 bg-blue-100">
			<CardHeader>
				<div className="flex items-center">
					<img
						src="/images/doodle.png"
						alt="Doodle"
						className="w-8 h-auto transform -rotate-45 mr-4"
					/>
					<CardTitle className="mb-2">Test Block</CardTitle>
					<img
						src="/images/doodle.png"
						alt="Doodle"
						className="w-8 h-auto transform rotate-45 ml-4"
					/>
				</div>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground">{text}</p>
			</CardContent>
		</Card>
	);
};

export default Component;
