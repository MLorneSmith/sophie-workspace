"use client";

import { cn } from "@kit/ui/utils";
import Image from "next/image";

import { LAYOUT_POSITIONS } from "../_lib/services/powerpoint/pptx-generator";
import type { Slide, SlideContent } from "../_lib/types";

interface SlidePreviewProps {
	slide: Slide;
}

// Define a type for ContentArea based on its usage, including position and size
interface ContentArea {
	id: string;
	x: number;
	y: number;
	w: number;
	h: number;
}

export function SlidePreview({ slide }: SlidePreviewProps) {
	// Get layout positions based on the slide's layoutId
	const layoutPositions = LAYOUT_POSITIONS[slide.layoutId];

	// Extract content areas with their positions and dimensions
	const contentAreas: ContentArea[] = [];

	if (layoutPositions) {
		// Map layout positions to content areas
		if (layoutPositions.content1) {
			contentAreas.push({
				id: "content1", // Assuming 'content1' is the ID used in SlideContent
				x: layoutPositions.content1.x,
				y: layoutPositions.content1.y,
				w: layoutPositions.content1.w,
				h: layoutPositions.content1.h,
			});
		}
		if (layoutPositions.content2) {
			contentAreas.push({
				id: "content2", // Assuming 'content2' is the ID used in SlideContent
				x: layoutPositions.content2.x,
				y: layoutPositions.content2.y,
				w: layoutPositions.content2.w,
				h: layoutPositions.content2.h,
			});
		}
		// Add other content areas as defined in LAYOUT_POSITIONS if needed
		// Note: The current LAYOUT_POSITIONS only defines 'content1' and 'content2'
		// for content areas, plus 'title' and 'subheadline'.
		// The SlideContent type uses an 'area' property which needs to map to these.
		// Based on the PRD, the SlideContentItem has a 'columnIndex'.
		// Let's assume columnIndex 0 maps to content1, 1 to content2, etc.
		// We need to adjust this mapping based on the actual SlideContent structure.
		// For now, let's map columnIndex to content area IDs like 'content1', 'content2'.
		// We'll need to refine this if the 'area' property is used differently.
	}

	const renderContentItem = (item: SlideContent) => {
		// Basic rendering for different content types
		switch (item.type) {
			case "text":
				return (
					<div key={item.id} className="text-sm">
						{item.text}
					</div>
				);
			case "bullet":
				return (
					<div key={item.id} className="flex items-start text-sm">
						<span className="mr-2">•</span>
						{item.text}
					</div>
				);
			case "subbullet":
				return (
					<div key={item.id} className="flex items-start pl-4 text-sm">
						<span className="mr-2">-</span>
						{item.text}
					</div>
				);
			case "image":
				return (
					<div
						key={item.id}
						className="flex items-center justify-center overflow-hidden" // Added overflow-hidden
					>
						{item.imageUrl ? (
							// Render image if imageUrl is provided
							<Image
								src={item.imageUrl}
								alt="Slide content"
								fill
								className="object-contain" // Use object-contain to fit without stretching
							/>
						) : (
							// Show placeholder if no imageUrl
							<div className="bg-muted text-muted-foreground flex aspect-video items-center justify-center text-xs">
								Image Placeholder
							</div>
						)}
					</div>
				);
			case "chart":
				return (
					<div
						key={item.id}
						className="bg-muted text-muted-foreground flex aspect-video flex-col items-center justify-center p-2 text-xs" // Added flex-col and padding
					>
						<div>Chart ({item.chartType || "Unknown Type"})</div>
						{item.chartData && (
							<div className="mt-1 text-[10px] opacity-75">
								Data: {JSON.stringify(item.chartData).substring(0, 50)}...
							</div>
						)}
					</div>
				);
			case "table":
				return (
					<div
						key={item.id}
						className="bg-muted text-muted-foreground flex aspect-video flex-col items-center justify-center p-2 text-xs" // Added flex-col and padding
					>
						<div>Table</div>
						{item.tableData && (
							<div className="mt-1 text-[10px] opacity-75">
								Data: {JSON.stringify(item.tableData).substring(0, 50)}...
							</div>
						)}
					</div>
				);
			default:
				return null;
		}
	};

	// Calculate the scale factor for the preview
	// Assuming a standard slide size (e.g., 10 inches wide) and a preview container width
	// Let's assume the preview container is roughly 600px wide for now.
	// A standard PowerPoint slide is 10 inches wide. Let's assume 1 inch = 72 points (standard for print/PPT).
	// So, 10 inches = 720 points.
	// If our preview container is 600px, the scale factor is roughly 600 / 720 = 0.833
	// We need to convert PptxGenJS points (which seem to be based on inches * 72) to pixels for the preview.
	// Let's assume a conversion factor where 1 PptxGenJS unit (inch) = 100 pixels for a reasonable preview size.
	const scaleFactor = 100; // 1 PptxGenJS unit (inch) = 100 pixels

	return (
		<div
			className={cn(
				"slide-preview bg-background relative overflow-hidden rounded-md border",
				// Remove grid classes as we'll use absolute positioning
				// layoutGridClasses[slide.layoutId] || 'grid-cols-1 grid-rows-[auto_1fr]',
			)}
			style={{
				width: `${10 * scaleFactor}px`, // Assuming 10 inches wide slide
				height: `${5.625 * scaleFactor}px`, // Assuming 16:9 aspect ratio (10 * 9/16 = 5.625 inches)
			}}
		>
			{/* Render Title */}
			{layoutPositions?.title && (
				<div
					className="absolute flex items-center justify-center" // Center text in title area
					style={{
						left: `${layoutPositions.title.x * scaleFactor}px`,
						top: `${layoutPositions.title.y * scaleFactor}px`,
						width: `${layoutPositions.title.w * scaleFactor}px`,
						height: `${layoutPositions.title.h * scaleFactor}px`,
						fontSize: `${layoutPositions.title.fontSize}px`, // Use font size from layout
						fontWeight: "bold", // Titles are typically bold
						textAlign: layoutPositions.title
							.align as React.CSSProperties["textAlign"], // Use alignment from layout
					}}
				>
					{slide.title}
				</div>
			)}

			{/* Render Subheadlines */}
			{slide.subheadlines?.map((sub: string, index: number) => {
				// Define a union type for valid subheadline keys
				type SubheadlineKey = "subheadline1" | "subheadline2";
				const subheadlineKey = `subheadline${index + 1}` as SubheadlineKey;
				const subheadlinePosition = layoutPositions?.[subheadlineKey];

				if (!subheadlinePosition) {
					return null;
				}

				return (
					<div
						key={sub}
						className="text-muted-foreground absolute text-sm"
						style={{
							left: `${subheadlinePosition.x * scaleFactor}px`,
							top: `${subheadlinePosition.y * scaleFactor}px`,
							width: `${subheadlinePosition.w * scaleFactor}px`,
							height: `${subheadlinePosition.h * scaleFactor}px`,
							fontSize: "18px", // Subheadline font size from PptxGenerator
							textAlign: "left", // Default alignment for subheadlines
						}}
					>
						{sub}
					</div>
				);
			})}

			{/* Render Content Areas and their items */}
			{contentAreas.map((contentArea: ContentArea) => (
				<div
					key={contentArea.id}
					className="absolute overflow-hidden border border-dashed border-gray-400 p-2" // Add border for visualization
					style={{
						left: `${contentArea.x * scaleFactor}px`,
						top: `${contentArea.y * scaleFactor}px`,
						width: `${contentArea.w * scaleFactor}px`,
						height: `${contentArea.h * scaleFactor}px`,
					}}
				>
					{/* Render content items within this content area */}
					{/* Assuming item.columnIndex maps to contentArea.id like 'content1', 'content2' */}
					{slide.content
						.filter(
							(item) =>
								`content${item.columnIndex + 1}` === contentArea.id ||
								item.area === contentArea.id, // Also check item.area if used
						)
						.map(renderContentItem)}
				</div>
			))}
		</div>
	);
}
