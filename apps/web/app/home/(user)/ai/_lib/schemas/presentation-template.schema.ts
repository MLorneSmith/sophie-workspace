import { z } from "zod";

/**
 * Presentation Template Type Definitions
 * Issue #2199: Template selection UI for Generate step
 */

// ============================================
// Template ID Type
// ============================================

export const TEMPLATE_IDS = [
	"consulting-classic",
	"modern-minimal",
	"creative-bold",
	"corporate-professional",
	"tech-forward",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

// ============================================
// Typography Configuration
// ============================================

const TemplateTypographyConfigSchema = z.object({
	headingFont: z.string().optional(),
	bodyFont: z.string().optional(),
});

export type TemplateTypographyConfig = z.infer<
	typeof TemplateTypographyConfigSchema
>;

// ============================================
// Presentation Template Schema
// ============================================

/**
 * Presentation template for UI display and export configuration
 */
export const PresentationTemplateSchema = z.object({
	/** Unique template identifier */
	id: z.enum(TEMPLATE_IDS),
	/** Display name for the template */
	name: z.string(),
	/** Brief description for UI display */
	description: z.string(),
	/** Color palette preview (5-6 hex color codes) */
	colors: z.array(z.string()).min(5).max(6),
	/** Path to template thumbnail preview image */
	thumbnailUrl: z.string(),
	/** Optional typography configuration */
	fonts: TemplateTypographyConfigSchema.optional(),
});

export type PresentationTemplate = z.infer<typeof PresentationTemplateSchema>;

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate a template ID
 */
export function isValidTemplateId(id: string): id is TemplateId {
	return TEMPLATE_IDS.includes(id as TemplateId);
}

/**
 * Validate a template ID safely
 */
export function safeGetTemplateId(id: string): TemplateId | null {
	return isValidTemplateId(id) ? id : null;
}
