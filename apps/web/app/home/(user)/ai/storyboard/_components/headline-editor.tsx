"use client";

import { Input } from "@kit/ui/input";
import { Label } from "@kit/ui/label";
import { Textarea } from "@kit/ui/textarea";

import { useStoryboard } from "../_lib/providers/storyboard-provider";
import type { Slide } from "../_lib/types";

interface HeadlineEditorProps {
	slide: Slide;
}

export function HeadlineEditor({ slide }: HeadlineEditorProps) {
	const { updateSlide } = useStoryboard();

	const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		updateSlide({ ...slide, title: event.target.value });
	};

	const handleSubheadlineChange = (
		index: number,
		event: React.ChangeEvent<HTMLTextAreaElement>,
	) => {
		const newSubheadlines = [...(slide.subheadlines || [])];
		newSubheadlines[index] = event.target.value;
		updateSlide({ ...slide, subheadlines: newSubheadlines });
	};

	// Determine number of subheadline fields based on layout (basic placeholder logic)
	// Assuming 'title' layout has subheadlines based on availableLayouts in layout-selector.tsx
	const numSubheadlineFields = slide.layoutId === "title" ? 1 : 0;

	return (
		<div className="space-y-4">
			<div>
				<Label htmlFor={`title-${slide.id}`} className="text-sm font-medium">
					Title
				</Label>
				<Input
					id={`title-${slide.id}`}
					type="text"
					value={slide.title}
					onChange={handleTitleChange}
					placeholder="Enter slide title"
					maxLength={255} // Example validation
				/>
			</div>

			{Array.from({ length: numSubheadlineFields }).map((_, index) => (
				<div key={`subheadline-${slide.id}-${index}`}>
					<Label
						htmlFor={`subheadline-${slide.id}-${index}`}
						className="text-sm font-medium"
					>
						Subheadline {index + 1}
					</Label>
					<Textarea
						id={`subheadline-${slide.id}-${index}`}
						value={slide.subheadlines?.[index] || ""}
						onChange={(e) => handleSubheadlineChange(index, e)}
						placeholder={`Enter subheadline ${index + 1}`}
						maxLength={500} // Example validation
					/>
				</div>
			))}

			{/* TODO: Implement dynamic subheadline fields based on selected layout */}
		</div>
	);
}
