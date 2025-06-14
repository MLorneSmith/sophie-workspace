"use client";

import {
	closestCenter,
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@kit/ui/button";
import { Card, CardContent } from "@kit/ui/card";
import { cn } from "@kit/ui/utils";
import { GripVertical } from "lucide-react";
import { useState } from "react";

import type { Slide } from "../_lib/types";
// Corrected import path and type name
import { HeadlineEditor } from "./headline-editor";
import { LayoutSelector } from "./layout-selector";
import { SlidePreview } from "./slide-preview";

interface SortableSlideListProps {
	slides: Slide[]; // Use Slide
	onSlidesChange: (slides: Slide[]) => void; // Use Slide
}

export function SortableSlideList({
	slides,
	onSlidesChange,
}: SortableSlideListProps) {
	const [activeId, setActiveId] = useState<string | null>(null);
	const [expandedSlideId, setExpandedSlideId] = useState<string | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragStart = (event: { active: { id: unknown } }) => {
		setActiveId(event.active.id as string);
	};

	const handleDragEnd = (event: {
		active: { id: unknown };
		over: { id: unknown } | null;
	}) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = slides.findIndex((slide) => slide.id === active.id);
			const newIndex = slides.findIndex((slide) => slide.id === over.id);

			const newSlides = arrayMove(slides, oldIndex, newIndex).map(
				(slide, index) => ({
					...slide,
					order: index,
				}),
			);

			onSlidesChange(newSlides);
		}

		setActiveId(null);
	};

	const toggleExpandSlide = (id: string) => {
		setExpandedSlideId(expandedSlideId === id ? null : id);
	};

	const activeSlide = slides.find((slide) => slide.id === activeId);

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
			<div className="space-y-4">
				<SortableContext
					items={slides.map((slide) => slide.id)}
					strategy={verticalListSortingStrategy}
				>
					{slides.map((slide) => (
						<SortableSlideItem
							key={slide.id}
							slide={slide}
							isExpanded={expandedSlideId === slide.id}
							onToggleExpand={() => toggleExpandSlide(slide.id)}
							onSlidesChange={onSlidesChange} // Pass onSlidesChange prop
							slides={slides} // Pass slides prop
						/>
					))}
				</SortableContext>

				<Button
					onClick={() => {
						const newSlide: Slide = {
							// Use Slide
							id: `slide-${Date.now()}`,
							title: "New Slide",
							headline: "",
							subheadlines: [],
							layoutId: "one-column",
							content: [], // Use content instead of contentAreas
							order: slides.length,
						};
						onSlidesChange([...slides, newSlide]);
						setExpandedSlideId(newSlide.id);
					}}
					className="w-full"
					variant="outline"
				>
					Add New Slide
				</Button>
			</div>

			<DragOverlay>
				{activeId && activeSlide ? (
					<div className="border-border bg-card w-full rounded-lg border p-4 opacity-80 shadow-md">
						<div className="text-lg font-medium">{activeSlide.title}</div>
						<div className="text-muted-foreground text-sm">
							Layout: {formatLayoutName(activeSlide.layoutId)}
						</div>
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	);
}

interface SortableSlideItemProps {
	slide: Slide; // Use Slide
	isExpanded: boolean;
	onToggleExpand: () => void;
	onSlidesChange: (slides: Slide[]) => void; // Add onSlidesChange prop
	slides: Slide[]; // Add slides prop
}

function SortableSlideItem({
	slide,
	isExpanded,
	onToggleExpand,
	onSlidesChange, // Destructure onSlidesChange
	slides, // Destructure slides prop
}: SortableSlideItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: slide.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"rounded-lg",
				isDragging ? "z-10 opacity-50" : "opacity-100",
			)}
		>
			<Card>
				<div className="flex items-center gap-2 p-3">
					<div
						{...attributes}
						{...listeners}
						className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex cursor-grab items-center rounded p-1 active:cursor-grabbing"
					>
						<GripVertical className="h-5 w-5" />
					</div>
					<button
						type="button"
						className="flex flex-1 cursor-pointer items-center justify-between text-left"
						onClick={onToggleExpand}
						aria-label={`Toggle slide ${slide.order + 1} details`}
					>
						<div>
							<div className="font-medium">{slide.title}</div>
							<div className="text-muted-foreground text-sm">
								Layout: {formatLayoutName(slide.layoutId)}
							</div>
						</div>
						<div>
							<span className="bg-primary/10 text-primary-foreground mr-2 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium">
								Slide {slide.order + 1}
							</span>
						</div>
					</button>
				</div>

				{isExpanded && (
					<CardContent className="pb-4">
						<div className="border-border space-y-4 rounded-md border p-4">
							{/* Render the SlidePreview component */}
							<SlidePreview slide={slide} />

							<HeadlineEditor slide={slide} />
							<LayoutSelector
								slide={slide}
								onLayoutChange={(layoutId) => {
									// Find the index of the current slide
									const slideIndex = slides.findIndex((s) => s.id === slide.id);
									if (slideIndex === -1) return;

									// Create a new slides array with the updated slide
									const newSlides = [...slides];
									newSlides[slideIndex] = { ...slide, layoutId };

									// Call the onSlidesChange prop to update the state in the parent
									onSlidesChange(newSlides);
								}}
								onContentChange={(content) => {
									// Find the index of the current slide
									const slideIndex = slides.findIndex((s) => s.id === slide.id);
									if (slideIndex === -1) return;

									// Create a new slides array with the updated slide
									const newSlides = [...slides];
									newSlides[slideIndex] = { ...slide, content };

									// Call the onSlidesChange prop to update the state in the parent
									onSlidesChange(newSlides);
								}}
							/>
							{/* TODO: Add ContentTypeSelector and other content editing components */}
							<div className="mt-4 flex justify-end">
								<Button size="sm" onClick={onToggleExpand}>
									Close
								</Button>
							</div>
						</div>
					</CardContent>
				)}
			</Card>
		</div>
	);
}

function formatLayoutName(layoutId: string): string {
	return layoutId
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}
