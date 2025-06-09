"use client";

import type React from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../../../packages/ui/src/shadcn/card";
import { Input } from "../../../../../packages/ui/src/shadcn/input";
import { Label } from "../../../../../packages/ui/src/shadcn/label";

// Define the type for the field props
type FieldProps = {
	path: string;
	name: string;
	label?: string;
	value?: unknown;
	onChange?: (value: unknown) => void;
	[key: string]: unknown;
};

/**
 * This component is used for the input card in the Lexical editor
 */
const Field: React.FC<FieldProps> = (props) => {
	const { path, value, onChange } = props;

	// Convert unknown value to string safely
	const stringValue =
		typeof value === "string"
			? value
			: value
				? JSON.stringify(value)
				: "Debug information will appear here";

	// Handle field changes
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (onChange) {
			onChange(e.target.value);
		}
	};

	return (
		<Card className="p-4 mb-4 bg-red-50">
			<CardHeader>
				<CardTitle>Debug Block</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label>Debug Information</Label>
					<Input value={stringValue} onChange={handleChange} />
				</div>
				<div className="text-xs text-gray-500">
					<p>Path: {path}</p>
					<p>Current value: {JSON.stringify(value)}</p>
				</div>
			</CardContent>
		</Card>
	);
};

export default Field;
