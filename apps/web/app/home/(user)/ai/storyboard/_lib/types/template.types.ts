import { z } from "zod";

const HexColorSchema = z
	.string()
	.regex(/^#[0-9a-fA-F]{6}$/, "Expected a 6-digit hex color (e.g. #1B2A4A)");

const ChartPaletteSchema = z.tuple([
	HexColorSchema,
	HexColorSchema,
	HexColorSchema,
	HexColorSchema,
	HexColorSchema,
]);

export interface TemplateColors {
	primary: string;
	secondary: string;
	background: string;
	text: string;
	textMuted: string;
	accent: string;
	chartPalette: [string, string, string, string, string];
}

export const TemplateColorsSchema: z.ZodType<TemplateColors> = z.object({
	primary: HexColorSchema,
	secondary: HexColorSchema,
	background: HexColorSchema,
	text: HexColorSchema,
	textMuted: HexColorSchema,
	accent: HexColorSchema,
	chartPalette: ChartPaletteSchema,
});

export interface TemplateTypography {
	headingFont: string;
	bodyFont: string;
	titleSize: number;
	headingSize: number;
	bodySize: number;
	captionSize: number;
}

export const TemplateTypographySchema: z.ZodType<TemplateTypography> = z.object(
	{
		headingFont: z.string().min(1),
		bodyFont: z.string().min(1),
		titleSize: z.number().int().positive(),
		headingSize: z.number().int().positive(),
		bodySize: z.number().int().positive(),
		captionSize: z.number().int().positive(),
	},
);

export type TemplateDensity = "compact" | "balanced" | "airy";

export const TemplateDensitySchema = z.enum(["compact", "balanced", "airy"]);

export interface TemplateConfig {
	id: string;
	name: string;
	description: string;
	colors: TemplateColors;
	typography: TemplateTypography;
	density: TemplateDensity;
	previewUrl?: string;
	tags?: string[];
}

export const TemplateConfigSchema: z.ZodType<TemplateConfig> = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	description: z.string().min(1),
	colors: TemplateColorsSchema,
	typography: TemplateTypographySchema,
	density: TemplateDensitySchema,
	previewUrl: z.string().url().optional(),
	tags: z.array(z.string().min(1)).optional(),
});
