"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@kit/ui/select";
import { useState } from "react";

import type { SlideContent } from "../_lib/types";

interface ContentTypeSelectorProps {
	contentItem: SlideContent;
	onUpdateContentItem: (updatedItem: SlideContent) => void;
}

const contentTypes = [
	{ value: "text", label: "Text" },
	{ value: "bullet", label: "Bullets" },
	{ value: "chart", label: "Chart" },
	{ value: "image", label: "Image" },
	{ value: "table", label: "Table" },
];

// Placeholder chart types - will be moved to a dedicated component later (Task 14)
const chartTypes = [
	{ value: "bar", label: "Bar Chart" },
	{ value: "line", label: "Line Chart" },
	{ value: "pie", label: "Pie Chart" },
];

export function ContentTypeSelector({
	contentItem,
	onUpdateContentItem,
}: ContentTypeSelectorProps) {
	const [selectedType, setSelectedType] = useState(contentItem.type);
	const [selectedChartType, setSelectedChartType] = useState(
		contentItem.chartType || "",
	);

	const handleTypeChange = (value: SlideContent["type"]) => {
		setSelectedType(value);
		const updatedItem = { ...contentItem, type: value };
		// Reset chartType if not a chart
		if (value !== "chart") {
			updatedItem.chartType = undefined;
			setSelectedChartType("");
		}
		onUpdateContentItem(updatedItem);
	};

	const handleChartTypeChange = (value: string) => {
		// Cast the string value to the expected type
		const chartTypeValue = value as SlideContent["chartType"];
		setSelectedChartType(chartTypeValue || ""); // Handle undefined case for state
		const updatedItem = { ...contentItem, chartType: chartTypeValue };
		onUpdateContentItem(updatedItem);
	};

	return (
		<div className="flex flex-col space-y-2">
			<Select value={selectedType} onValueChange={handleTypeChange}>
				<SelectTrigger className="w-[180px]">
					<SelectValue placeholder="Select content type" />
				</SelectTrigger>
				<SelectContent>
					{contentTypes.map((type) => (
						<SelectItem key={type.value} value={type.value}>
							{type.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{selectedType === "chart" && (
				<Select value={selectedChartType} onValueChange={handleChartTypeChange}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Select chart type" />
					</SelectTrigger>
					<SelectContent>
						{chartTypes.map((type) => (
							<SelectItem key={type.value} value={type.value}>
								{type.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
		</div>
	);
}
