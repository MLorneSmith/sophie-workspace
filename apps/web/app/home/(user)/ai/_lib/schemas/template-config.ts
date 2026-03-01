import { z } from "zod";

/**
 * Template configuration schemas for PowerPoint generation
 * Issue #2205: Refactor PPTX generator to accept TemplateConfig
 */

// ============================================
// Colors Schema
// ============================================

/**
 * Color palette for a template
 * Colors should be provided without the '#' prefix (PptxGenJS format)
 */
export const TemplateColorsSchema = z.object({
	/** Primary brand color */
	primary: z.string().default("1a1a2e"),
	/** Secondary color */
	secondary: z.string().default("333333"),
	/** Accent color for highlights */
	accent: z.string().default("666666"),
	/** Text color for body content */
	bodyText: z.string().default("333333"),
	/** Text color for headings */
	headingText: z.string().default("1a1a2e"),
	/** Text color for subheadings */
	subheadingText: z.string().default("1a1a2e"),
	/** Muted/secondary text color */
	mutedText: z.string().default("666666"),
	/** Error color */
	error: z.string().default("FF0000"),
	/** Default bullet color */
	bullet: z.string().default("333333"),
	/** Footer text color */
	footerText: z.string().default("666666"),
});

export type TemplateColors = z.infer<typeof TemplateColorsSchema>;

// ============================================
// Typography Schema
// ============================================

/**
 * Typography settings for a template
 */
export const TemplateTypographySchema = z.object({
	/** Default font family */
	fontFamily: z.string().default("Arial"),
	/** Title slide font size */
	titleFontSize: z.number().default(40),
	/** Section header font size */
	sectionFontSize: z.number().default(40),
	/** Slide title (headline) font size */
	headlineFontSize: z.number().default(24),
	/** Subheadline font size */
	subheadlineFontSize: z.number().default(18),
	/** Body text font size */
	bodyFontSize: z.number().default(16),
	/** Bullet list font size */
	bulletFontSize: z.number().default(16),
	/** Sub-bullet font size */
	subbulletFontSize: z.number().default(14),
	/** Table text font size */
	tableFontSize: z.number().default(12),
	/** Footer text font size */
	footerFontSize: z.number().default(10),
	/** Minimum font size */
	minFontSize: z.number().default(12),
	/** Maximum font size */
	maxFontSize: z.number().default(40),
});

export type TemplateTypography = z.infer<typeof TemplateTypographySchema>;

// ============================================
// Layout Schema
// ============================================

/**
 * Layout configuration for slides
 */
export const TemplateLayoutSchema = z.object({
	/** Slide width in inches (standard is 10) */
	slideWidth: z.number().default(10),
	/** Slide height in inches (standard is 7.5) */
	slideHeight: z.number().default(7.5),
	/** Title slide title position */
	titlePosition: z
		.object({
			x: z.number(),
			y: z.number(),
			w: z.number(),
			h: z.number(),
		})
		.default({ x: 0.5, y: 1.0, w: 9, h: 1.5 }),
	/** Section slide title position */
	sectionPosition: z
		.object({
			x: z.number(),
			y: z.number(),
			w: z.number(),
			h: z.number(),
		})
		.default({ x: 0.5, y: 2.5, w: 9, h: 1.5 }),
	/** Default content position */
	defaultContentPosition: z
		.object({
			x: z.number(),
			y: z.number(),
			w: z.number(),
			h: z.number(),
		})
		.default({ x: 0.5, y: 1.8, w: 9, h: 4 }),
	/** Title position for content slides */
	titlePosition: z
		.object({
			x: z.number(),
			y: z.number(),
			w: z.number(),
			h: z.number(),
		})
		.default({ x: 0.5, y: 0.6, w: 9, h: 0.5 }),
	/** Subheadline position for content slides */
	subheadlinePosition: z
		.object({
			x: z.number(),
			y: z.number(),
			w: z.number(),
			h: z.number(),
		})
		.default({ x: 0.5, y: 1.2, w: 9, h: 0.4 }),
	/** Left column position for two-column layouts */
	twoColumnLeft: z
		.object({
			x: z.number(),
			y: z.number(),
			w: z.number(),
			h: z.number(),
		})
		.default({ x: 0.5, y: 1.8, w: 4.25, h: 4 }),
	/** Right column position for two-column layouts */
	twoColumnRight: z
		.object({
			x: z.number(),
			y: z.number(),
			w: z.number(),
			h: z.number(),
		})
		.default({ x: 5.25, y: 1.8, w: 4.25, h: 4 }),
	/** Image-text layout image position */
	imageTextImage: z
		.object({
			x: z.number(),
			y: z.number(),
			w: z.number(),
			h: z.number(),
		})
		.default({ x: 0.5, y: 1.8, w: 4.0, h: 4 }),
	/** Image-text layout text position */
	imageTextText: z
		.object({
			x: z.number(),
			y: z.number(),
			w: z.number(),
			h: z.number(),
		})
		.default({ x: 5.0, y: 1.8, w: 4.5, h: 4 }),
	/** Text-image layout text position */
	textImageText: z
		.object({
			x: z.number(),
			y: z.number(),
			w: z.number(),
			h: z.number(),
		})
		.default({ x: 0.5, y: 1.8, w: 4.5, h: 4 }),
	/** Text-image layout image position */
	textImageImage: z
		.object({
			x: z.number(),
			y: z.number(),
			w: z.number(),
			h: z.number(),
		})
		.default({ x: 5.5, y: 1.8, w: 4.0, h: 4 }),
	/** Comparison layout left position */
	comparisonLeft: z
		.object({
			x: z.number(),
			y: z.number(),
			w: z.number(),
			h: z.number(),
		})
		.default({ x: 0.5, y: 1.8, w: 4.25, h: 4 }),
	/** Comparison layout right position */
	comparisonRight: z
		.object({
			x: z.number(),
			y: z.number(),
			w: z.number(),
			h: z.number(),
		})
		.default({ x: 5.25, y: 1.8, w: 4.25, h: 4 }),
	/** Chart layout position */
	chartPosition: z
		.object({
			x: z.number(),
			y: z.number(),
			w: z.number(),
			h: z.number(),
		})
		.default({ x: 1.0, y: 1.8, w: 8, h: 4 }),
	/** Bullet list position */
	bulletListPosition: z
		.object({
			x: z.number(),
			y: z.number(),
			w: z.number(),
			h: z.number(),
		})
		.default({ x: 0.5, y: 1.8, w: 9, h: 4 }),
	/** Title slide content position */
	titleContentPosition: z
		.object({
			x: z.number(),
			y: z.number(),
			w: z.number(),
			h: z.number(),
		})
		.default({ x: 0.5, y: 4.5, w: 9, h: 1.5 }),
	/** Section slide content position */
	sectionContentPosition: z
		.object({
			x: z.number(),
			y: z.number(),
			w: z.number(),
			h: z.number(),
		})
		.default({ x: 0.5, y: 4.0, w: 9, h: 1.5 }),
	/** Subheadline position for two-column layouts - left */
	twoColumnSubheadlineLeft: z
		.object({
			x: z.number(),
			y: z.number(),
			w: z.number(),
			h: z.number(),
		})
		.default({ x: 0.5, y: 1.2, w: 4.25, h: 0.4 }),
	/** Subheadline position for two-column layouts - right */
	twoColumnSubheadlineRight: z
		.object({
			x: z.number(),
			y: z.number(),
			w: z.number(),
			h: z.number(),
		})
		.default({ x: 5.25, y: 1.2, w: 4.25, h: 0.4 }),
	/** Image-text subheadline position */
	imageTextSubheadline: z
		.object({
			x: z.number(),
			y: z.number(),
			w: z.number(),
			h: z.number(),
		})
		.default({ x: 5.0, y: 1.2, w: 4.5, h: 0.4 }),
	/** Text-image subheadline position */
	textImageSubheadline: z
		.object({
			x: z.number(),
			y: z.number(),
			w: z.number(),
			h: z.number(),
		})
		.default({ x: 0.5, y: 1.2, w: 4.5, h: 0.4 }),
	/** Subheadline position for title slide */
	titleSubheadlinePosition: z
		.object({
			x: z.number(),
			y: z.number(),
			w: z.number(),
			h: z.number(),
		})
		.default({ x: 0.5, y: 3.0, w: 9, h: 1.0 }),
	/** Footer position */
	footerPosition: z
		.object({
			x: z.number().or(z.string()),
			y: z.number().or(z.string()),
			w: z.number().or(z.string()),
			h: z.number().or(z.string()),
		})
		.default({ x: "90%", y: "94%", w: "8%", h: "4%" }),
	/** Show page numbers */
	showPageNumbers: z.boolean().default(true),
	/** Footer configuration - TODO: implement footer rendering */
	footer: z
		.object({
			enabled: z.boolean().default(false),
			text: z.string().optional(),
			position: z
				.object({
					x: z.number().or(z.string()),
					y: z.number().or(z.string()),
					w: z.number().or(z.string()),
					h: z.number().or(z.string()),
				})
				.optional(),
		})
		.default({ enabled: false }),
});

export type TemplateLayout = z.infer<typeof TemplateLayoutSchema>;

// ============================================
// Charts Schema
// ============================================

/**
 * Chart configuration for a template
 * Uses roundedCorners: boolean (NOT borderRadius: number)
 */
export const TemplateChartsSchema = z.object({
	/** Default chart color palette */
	colors: z
		.array(z.string())
		.default(["4472C4", "ED7D31", "FFC000", "5B9BD5", "70AD47"]),
	/** Show chart title by default */
	showTitle: z.boolean().default(true),
	/** Show legend by default */
	showLegend: z.boolean().default(true),
	/** Default legend position */
	legendPosition: z.enum(["l", "r", "t", "b", "tr"]).default("b"),
	/** Default data label position */
	dataLabelPosition: z
		.enum(["inEnd", "outEnd", "ctr", "l", "r", "t", "b"])
		.default("outEnd"),
	/** Show data labels by default */
	showDataLabels: z.boolean().default(true),
	/** Use rounded corners for chart elements */
	roundedCorners: z.boolean().default(false),
});

export type TemplateCharts = z.infer<typeof TemplateChartsSchema>;

// ============================================
// Complete Template Config
// ============================================

/**
 * Complete template configuration
 */
export const TemplateConfigSchema = z.object({
	/** Template name */
	name: z.string().default("default"),
	/** Color palette */
	colors: TemplateColorsSchema.default({}),
	/** Typography settings */
	typography: TemplateTypographySchema.default({}),
	/** Layout configuration */
	layout: TemplateLayoutSchema.default({}),
	/** Chart settings */
	charts: TemplateChartsSchema.default({}),
});

export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate a template configuration
 * Returns the validated config or throws an error
 */
export function validateTemplateConfig(config: unknown): TemplateConfig {
	return TemplateConfigSchema.parse(config);
}

/**
 * Validate a template configuration safely
 * Returns the validated config or the default config if validation fails
 */
export function safeValidateTemplateConfig(config: unknown): TemplateConfig {
	return TemplateConfigSchema.safeParse(config).success
		? (TemplateConfigSchema.parse(config) as TemplateConfig)
		: TemplateConfigSchema.parse({});
}
