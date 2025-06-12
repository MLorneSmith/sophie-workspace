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

// Define the type for Call To Action field data
type CallToActionData = {
	headline?: string;
	subheadline?: string;
	leftButtonLabel?: string;
	leftButtonUrl?: string;
	rightButtonLabel?: string;
	rightButtonUrl?: string;
};

// Define the type for the field props
type FieldProps = {
	path: string;
	name: string;
	label?: string;
	value?: unknown;
	onChange?: (value: unknown) => void;
	[key: string]: unknown;
};

// Custom TextField component
type TextFieldProps = {
	label: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const TextField: React.FC<TextFieldProps> = ({ label, value, onChange }) => {
	return (
		<div className="space-y-2">
			<Label>{label}</Label>
			<Input value={value} onChange={onChange} />
		</div>
	);
};

// Type guard function to ensure value is a valid object
const isCallToActionData = (value: unknown): value is CallToActionData => {
	return typeof value === "object" && value !== null;
};

// Helper function to safely get CallToActionData from unknown value
const getCallToActionData = (value: unknown): CallToActionData => {
	if (isCallToActionData(value)) {
		return value;
	}
	return {};
};

/**
 * This component is used for the input card in the Lexical editor
 */
const Field: React.FC<FieldProps> = (props) => {
	const { path: _path, value, onChange } = props;

	// Get type-safe data from the unknown value
	const data = getCallToActionData(value);

	// Handle field changes
	const handleChange = (fieldName: string, fieldValue: unknown) => {
		if (onChange) {
			onChange({
				...data,
				[fieldName]: fieldValue,
			});
		}
	};

	return (
		<Card className="p-4 mb-4">
			<CardHeader>
				<CardTitle>Call To Action</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<TextField
					label="Headline"
					value={data.headline || "FREE Course Trial"}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						handleChange("headline", e.target.value)
					}
				/>
				<TextField
					label="Subheadline"
					value={
						data.subheadline ||
						"Start improving your presentations skills immediately with our free trial of the Decks for Decision Makers course."
					}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						handleChange("subheadline", e.target.value)
					}
				/>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<TextField
							label="Left Button Label"
							value={data.leftButtonLabel || "Individuals"}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								handleChange("leftButtonLabel", e.target.value)
							}
						/>
						<TextField
							label="Left Button URL"
							value={data.leftButtonUrl || "/free-trial/individual"}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								handleChange("leftButtonUrl", e.target.value)
							}
						/>
					</div>
					<div>
						<TextField
							label="Right Button Label"
							value={data.rightButtonLabel || "Teams"}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								handleChange("rightButtonLabel", e.target.value)
							}
						/>
						<TextField
							label="Right Button URL"
							value={data.rightButtonUrl || "/free-trial/teams"}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								handleChange("rightButtonUrl", e.target.value)
							}
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default Field;
