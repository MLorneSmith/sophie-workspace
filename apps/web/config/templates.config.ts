import { z } from "zod";

/**
 * Template interface representing a curated presentation template.
 */
export interface Template {
	id: string;
	name: string;
	description: string;
	colors: string[];
	thumbnailUrl: string;
	previewUrl: string;
}

/**
 * Zod schema for runtime validation of Template objects.
 */
export const TemplateSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	description: z.string().min(1),
	colors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).min(1),
	thumbnailUrl: z.string().url(),
	previewUrl: z.string().url(),
});

/**
 * Curated templates for the Library page.
 * These are static configurations that can be used when creating presentations.
 */
export const CURATED_TEMPLATES: Template[] = [
	{
		id: "professional-blue",
		name: "Professional Blue",
		description:
			"A sleek, corporate template ideal for business presentations and executive pitches.",
		colors: ["#1E3A5F", "#2563EB", "#60A5FA", "#DBEAFE"],
		thumbnailUrl: "/images/templates/professional-blue-thumb.svg",
		previewUrl: "/images/templates/professional-blue-preview.svg",
	},
	{
		id: "warm-sunset",
		name: "Warm Sunset",
		description:
			"An inviting template with warm tones, perfect for creative proposals and emotional narratives.",
		colors: ["#7C2D12", "#F97316", "#FDBA74", "#FFEDD5"],
		thumbnailUrl: "/images/templates/warm-sunset-thumb.svg",
		previewUrl: "/images/templates/warm-sunset-preview.svg",
	},
	{
		id: "modern-minimal",
		name: "Modern Minimal",
		description:
			"Clean and contemporary with ample white space, ideal for tech startups and design-forward content.",
		colors: ["#18181B", "#52525B", "#E4E4E7", "#FAFAFA"],
		thumbnailUrl: "/images/templates/modern-minimal-thumb.svg",
		previewUrl: "/images/templates/modern-minimal-preview.svg",
	},
	{
		id: "bold-impact",
		name: "Bold Impact",
		description:
			"High-contrast design that commands attention, perfect for bold statements and key announcements.",
		colors: ["#7F1D1D", "#DC2626", "#FCA5A5", "#FEE2E2"],
		thumbnailUrl: "/images/templates/bold-impact-thumb.svg",
		previewUrl: "/images/templates/bold-impact-preview.svg",
	},
	{
		id: "nature-green",
		name: "Nature Green",
		description:
			"An earthy, refreshing template suited for sustainability topics and eco-friendly messaging.",
		colors: ["#14532D", "#16A34A", "#86EFAC", "#DCFCE7"],
		thumbnailUrl: "/images/templates/nature-green-thumb.svg",
		previewUrl: "/images/templates/nature-green-preview.svg",
	},
];

/**
 * Zod schema for validating an array of templates.
 */
export const TemplateArraySchema = z.array(TemplateSchema);
