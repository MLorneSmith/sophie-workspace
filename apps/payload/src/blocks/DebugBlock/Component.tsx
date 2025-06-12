"use client";

import type React from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../../../packages/ui/src/shadcn/card";

// Define our own component props type
type ComponentProps = {
	data?: unknown;
	blockType?: string;
	schemaPath?: string;
	field?: {
		name?: string;
	};
	[key: string]: unknown;
};

// The component receives props from Lexical
const Component: React.FC<ComponentProps> = (props) => {
	// Extract useful debug information
	const { data: _data, field, schemaPath, blockType } = props;
	const fieldName = field?.name;

	// Render debug information
	return (
		<Card className="my-6 bg-red-100">
			<CardHeader>
				<CardTitle>Debug Block</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					<p>
						<strong>Field Name:</strong> {fieldName}
					</p>
					<p>
						<strong>Schema Path:</strong> {schemaPath}
					</p>
					<p>
						<strong>Block Type:</strong> {blockType}
					</p>
					<pre className="text-xs bg-gray-100 p-2 rounded">
						{JSON.stringify(props, null, 2)}
					</pre>
				</div>
			</CardContent>
		</Card>
	);
};

export default Component;
