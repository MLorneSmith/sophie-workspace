"use client";

import { Label } from "@kit/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@kit/ui/select";
import { cn } from "@kit/ui/utils";

import { useStoryboard } from "../_lib/providers/storyboard-provider";
import type { Slide } from "../_lib/types";

interface ChartTypeSelectorProps {
	slide: Slide;
	contentAreaIndex: number;
}

// Define available chart types (placeholder)
const availableChartTypes = [
	{ id: "bar", name: "Bar Chart" },
	{ id: "line", name: "Line Chart" },
	{ id: "pie", name: "Pie Chart" },
];

export function ChartTypeSelector({
	slide,
	contentAreaIndex,
}: ChartTypeSelectorProps) {
	const { updateSlide } = useStoryboard();

	const handleChartTypeChange = (chartTypeId: string) => {
		// TODO: Implement logic to update the specific content area's chart type and data
		console.log(
			`Chart type changed for slide ${slide.id}, content area ${contentAreaIndex}: ${chartTypeId}`,
		);
		// This will require a more detailed structure for chart data within SlideContent
		// For now, just logging the change.
	};

	// TODO: Implement UI to select chart type and potentially input chart data

	return (
		<div className="space-y-2">
			<Label
				htmlFor={`chart-type-${slide.id}-${contentAreaIndex}`}
				className="text-sm font-medium"
			>
				Chart Type
			</Label>
			{/* Placeholder Select for chart types */}
			<Select onValueChange={handleChartTypeChange}>
				<SelectTrigger
					id={`chart-type-${slide.id}-${contentAreaIndex}`}
					className="w-full"
				>
					<SelectValue placeholder="Select chart type" />
				</SelectTrigger>
				<SelectContent>
					{availableChartTypes.map((type) => (
						<SelectItem key={type.id} value={type.id}>
							{type.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{/* TODO: Add input fields for chart data based on selected chart type */}
		</div>
	);
}
