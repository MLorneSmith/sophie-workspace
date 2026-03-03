/**
 * Presentation Template Registry
 * Issue #2199: Template selection UI for Generate step
 *
 * Contains the 5 curated templates for user selection.
 */

import type {
	PresentationTemplate,
	TemplateId,
} from "../schemas/presentation-template.schema";

/**
 * The 5 curated presentation templates
 */
export const PRESENTATION_TEMPLATES: PresentationTemplate[] = [
	{
		id: "consulting-classic",
		name: "Consulting Classic",
		description: "Professional and authoritative for business presentations",
		colors: ["1a1a2e", "2d3748", "4a5568", "718096", "a0aec0", "e2e8f0"],
		thumbnailUrl: "/images/templates/consulting-classic.svg",
		fonts: {
			headingFont: "Georgia",
			bodyFont: "Arial",
		},
	},
	{
		id: "modern-minimal",
		name: "Modern Minimal",
		description: "Clean and contemporary with ample white space",
		colors: ["0f172a", "1e293b", "334155", "475569", "64748b", "94a3b8"],
		thumbnailUrl: "/images/templates/modern-minimal.svg",
		fonts: {
			headingFont: "Inter",
			bodyFont: "Inter",
		},
	},
	{
		id: "creative-bold",
		name: "Creative Bold",
		description: "Vibrant and expressive for creative industries",
		colors: ["7c3aed", "a78bfa", "c4b5fd", "ddd6fe", "ede9fe", "f5f3ff"],
		thumbnailUrl: "/images/templates/creative-bold.svg",
		fonts: {
			headingFont: "Poppins",
			bodyFont: "Open Sans",
		},
	},
	{
		id: "corporate-professional",
		name: "Corporate Professional",
		description: "Trustworthy and polished for enterprise settings",
		colors: ["1e40af", "1d4ed8", "2563eb", "3b82f6", "60a5fa", "dbeafe"],
		thumbnailUrl: "/images/templates/corporate-professional.svg",
		fonts: {
			headingFont: "Helvetica",
			bodyFont: "Arial",
		},
	},
	{
		id: "tech-forward",
		name: "Tech Forward",
		description: "Modern tech aesthetic with dynamic energy",
		colors: ["059669", "10b981", "34d399", "6ee7b7", "a7f3d0", "d1fae5"],
		thumbnailUrl: "/images/templates/tech-forward.svg",
		fonts: {
			headingFont: "Roboto",
			bodyFont: "Roboto",
		},
	},
];

/**
 * Default template ID used when no template is selected
 */
export const DEFAULT_TEMPLATE_ID: TemplateId = "consulting-classic";

/**
 * Get a template by its ID
 * @param templateId - The template ID to look up
 * @returns The template object or undefined if not found
 */
export function getTemplateById(
	templateId: string,
): PresentationTemplate | undefined {
	return PRESENTATION_TEMPLATES.find((t) => t.id === templateId);
}

/**
 * Get the default template
 * @returns The default template object
 */
export function getDefaultTemplate(): PresentationTemplate {
	const found = PRESENTATION_TEMPLATES.find(
		(t) => t.id === DEFAULT_TEMPLATE_ID,
	);
	if (found) return found;
	const fallback = PRESENTATION_TEMPLATES[0];
	if (!fallback) {
		throw new Error("No templates defined");
	}
	return fallback;
}
