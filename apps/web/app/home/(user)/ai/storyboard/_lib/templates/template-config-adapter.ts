import type {
	TemplateConfig as GeneratorTemplateConfig,
	TemplateLayout,
} from "../schemas/template-config";
import type {
	TemplateConfig as CuratedTemplateConfig,
	TemplateDensity,
} from "../types/template.types";

function normalizeColor(color: string): string {
	return color.replace(/^#/, "").toUpperCase();
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function addToPosition(
	pos: {
		x: number | string;
		y: number | string;
		w: number | string;
		h: number | string;
	},
	dx: number,
	dy: number,
	dw: number,
	dh: number,
): {
	x: number | string;
	y: number | string;
	w: number | string;
	h: number | string;
} {
	return {
		x: typeof pos.x === "number" ? pos.x + dx : pos.x,
		y: typeof pos.y === "number" ? pos.y + dy : pos.y,
		w: typeof pos.w === "number" ? pos.w + dw : pos.w,
		h: typeof pos.h === "number" ? pos.h + dh : pos.h,
	};
}

function withDensity(
	layout: TemplateLayout,
	density: TemplateDensity,
): TemplateLayout {
	if (density === "balanced") {
		return { ...layout };
	}

	const yShift = density === "compact" ? -0.2 : 0.2;
	const heightShift = density === "compact" ? 0.4 : -0.4;

	return {
		...layout,
		defaultContentPosition: addToPosition(
			layout.defaultContentPosition,
			0,
			yShift,
			0,
			heightShift,
		),
		twoColumnLeft: addToPosition(
			layout.twoColumnLeft,
			0,
			yShift,
			0,
			heightShift,
		),
		twoColumnRight: addToPosition(
			layout.twoColumnRight,
			0,
			yShift,
			0,
			heightShift,
		),
		imageTextImage: addToPosition(
			layout.imageTextImage,
			0,
			yShift,
			0,
			heightShift,
		),
		imageTextText: addToPosition(
			layout.imageTextText,
			0,
			yShift,
			0,
			heightShift,
		),
		textImageText: addToPosition(
			layout.textImageText,
			0,
			yShift,
			0,
			heightShift,
		),
		textImageImage: addToPosition(
			layout.textImageImage,
			0,
			yShift,
			0,
			heightShift,
		),
		comparisonLeft: addToPosition(
			layout.comparisonLeft,
			0,
			yShift,
			0,
			heightShift,
		),
		comparisonRight: addToPosition(
			layout.comparisonRight,
			0,
			yShift,
			0,
			heightShift,
		),
		chartPosition: addToPosition(
			layout.chartPosition,
			0,
			yShift,
			0,
			heightShift,
		),
		bulletListPosition: addToPosition(
			layout.bulletListPosition,
			0,
			yShift,
			0,
			heightShift,
		),
	};
}

export function toGeneratorTemplateConfig(
	template: CuratedTemplateConfig,
	baseConfig: GeneratorTemplateConfig,
): GeneratorTemplateConfig {
	const isCompact = template.density === "compact";
	const isAiry = template.density === "airy";

	const bodySize = clamp(
		template.typography.bodySize + (isCompact ? -1 : isAiry ? 1 : 0),
		10,
		48,
	);
	const captionSize = clamp(
		template.typography.captionSize + (isCompact ? -1 : isAiry ? 1 : 0),
		9,
		24,
	);

	return {
		...baseConfig,
		name: template.name,
		colors: {
			...baseConfig.colors,
			primary: normalizeColor(template.colors.primary),
			secondary: normalizeColor(template.colors.secondary),
			accent: normalizeColor(template.colors.accent),
			bodyText: normalizeColor(template.colors.text),
			headingText: normalizeColor(template.colors.primary),
			subheadingText: normalizeColor(template.colors.secondary),
			mutedText: normalizeColor(template.colors.textMuted),
			bullet: normalizeColor(template.colors.text),
			footerText: normalizeColor(template.colors.textMuted),
		},
		typography: {
			...baseConfig.typography,
			fontFamily: template.typography.bodyFont,
			titleFontSize: template.typography.titleSize,
			sectionFontSize: template.typography.titleSize,
			headlineFontSize: template.typography.headingSize,
			subheadlineFontSize: template.typography.bodySize,
			bodyFontSize: bodySize,
			bulletFontSize: bodySize,
			subbulletFontSize: clamp(bodySize - 2, 10, 36),
			tableFontSize: clamp(captionSize + 1, 10, 24),
			footerFontSize: captionSize,
			minFontSize: clamp(Math.min(captionSize, bodySize), 9, 24),
			maxFontSize: clamp(template.typography.titleSize + 4, 16, 72),
		},
		layout: withDensity(baseConfig.layout, template.density),
		charts: {
			...baseConfig.charts,
			colors: template.colors.chartPalette.map(normalizeColor),
		},
	};
}
