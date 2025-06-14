"use client";

import { useId } from "react";
import type React from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../../../packages/ui/src/shadcn/card";
import { Input } from "../../../../../packages/ui/src/shadcn/input";
import { Label } from "../../../../../packages/ui/src/shadcn/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../../../packages/ui/src/shadcn/select";
import { Switch } from "../../../../../packages/ui/src/shadcn/switch";

// Define the type for YouTube Video field data
type YouTubeVideoData = {
	videoId?: string;
	title?: string;
	aspectRatio?: string;
	showPreview?: boolean;
	previewUrl?: string;
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
const isYouTubeVideoData = (value: unknown): value is YouTubeVideoData => {
	return typeof value === "object" && value !== null;
};

// Helper function to safely get YouTubeVideoData from unknown value
const getYouTubeVideoData = (value: unknown): YouTubeVideoData => {
	if (isYouTubeVideoData(value)) {
		return value;
	}
	return {};
};

/**
 * This component is used for the input card in the Lexical editor
 */
const Field: React.FC<FieldProps> = (props) => {
	const { path: _path, value, onChange } = props;
	const showPreviewId = useId();

	// Get type-safe data from the unknown value
	const data = getYouTubeVideoData(value);

	// Handle field changes
	const handleChange = (fieldName: string, fieldValue: unknown) => {
		if (onChange) {
			onChange({
				...data,
				[fieldName]: fieldValue,
			});
		}
	};

	// Handle aspect ratio selection
	const handleAspectRatioChange = (newRatio: string) => {
		handleChange("aspectRatio", newRatio);
	};

	return (
		<Card className="mb-4 p-4">
			<CardHeader>
				<CardTitle>YouTube Video</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<TextField
					label="Video ID or URL"
					value={data.videoId || ""}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						handleChange("videoId", e.target.value)
					}
				/>
				<div className="mb-4 text-xs text-gray-500">
					<p>
						Enter a YouTube video ID (e.g., dQw4w9WgXcQ) or full URL (e.g.,
						https://www.youtube.com/watch?v=dQw4w9WgXcQ)
					</p>
				</div>

				<div className="mb-4 border-t pt-4">
					<p className="mb-2 text-sm font-medium">Preview Options</p>
					<TextField
						label="Custom Preview Image URL (optional)"
						value={data.previewUrl || ""}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							handleChange("previewUrl", e.target.value)
						}
					/>
					<div className="mt-4 flex items-center space-x-2">
						<Switch
							id={showPreviewId}
							checked={data.showPreview || false}
							onCheckedChange={(checked) =>
								handleChange("showPreview", checked)
							}
						/>
						<Label htmlFor={showPreviewId}>
							Show preview image before playing
						</Label>
					</div>
				</div>
				<TextField
					label="Title (optional)"
					value={data.title || "YouTube Video"}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						handleChange("title", e.target.value)
					}
				/>
				<div className="space-y-2">
					<Label>Aspect Ratio</Label>
					<Select
						value={data.aspectRatio || "16:9"}
						onValueChange={handleAspectRatioChange}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select aspect ratio" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
							<SelectItem value="4:3">4:3 (Standard)</SelectItem>
							<SelectItem value="1:1">1:1 (Square)</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</CardContent>
		</Card>
	);
};

export default Field;
