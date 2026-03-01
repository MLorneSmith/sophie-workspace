/**
 * Default template configuration for PowerPoint generation
 *
 * This file extracts ALL hardcoded values from pptx-generator.ts
 * to allow for customization via TemplateConfig.
 *
 * Issue #2205: Refactor PPTX generator to accept TemplateConfig
 */

import type { TemplateConfig } from "../../../../_lib/schemas/template-config";

/**
 * Default template configuration with all values that were previously hardcoded
 * in pptx-generator.ts
 */
export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
	name: "default",
	colors: {
		primary: "1a1a2e",
		secondary: "333333",
		accent: "666666",
		bodyText: "333333",
		headingText: "1a1a2e",
		subheadingText: "1a1a2e",
		mutedText: "666666",
		error: "FF0000",
		bullet: "333333",
		footerText: "666666",
	},
	typography: {
		fontFamily: "Arial",
		titleFontSize: 40,
		sectionFontSize: 40,
		headlineFontSize: 24,
		subheadlineFontSize: 18,
		bodyFontSize: 16,
		bulletFontSize: 16,
		subbulletFontSize: 14,
		tableFontSize: 12,
		footerFontSize: 10,
		minFontSize: 12,
		maxFontSize: 40,
	},
	layout: {
		slideWidth: 10,
		slideHeight: 7.5,
		titleSlidePosition: { x: 0.5, y: 1.0, w: 9, h: 1.5 },
		sectionPosition: { x: 0.5, y: 2.5, w: 9, h: 1.5 },
		defaultContentPosition: { x: 0.5, y: 1.8, w: 9, h: 4 },
		titlePosition: { x: 0.5, y: 0.6, w: 9, h: 0.5 },
		subheadlinePosition: { x: 0.5, y: 1.2, w: 9, h: 0.4 },
		twoColumnLeft: { x: 0.5, y: 1.8, w: 4.25, h: 4 },
		twoColumnRight: { x: 5.25, y: 1.8, w: 4.25, h: 4 },
		imageTextImage: { x: 0.5, y: 1.8, w: 4.0, h: 4 },
		imageTextText: { x: 5.0, y: 1.8, w: 4.5, h: 4 },
		textImageText: { x: 0.5, y: 1.8, w: 4.5, h: 4 },
		textImageImage: { x: 5.5, y: 1.8, w: 4.0, h: 4 },
		comparisonLeft: { x: 0.5, y: 1.8, w: 4.25, h: 4 },
		comparisonRight: { x: 5.25, y: 1.8, w: 4.25, h: 4 },
		chartPosition: { x: 1.0, y: 1.8, w: 8, h: 4 },
		bulletListPosition: { x: 0.5, y: 1.8, w: 9, h: 4 },
		titleContentPosition: { x: 0.5, y: 4.5, w: 9, h: 1.5 },
		sectionContentPosition: { x: 0.5, y: 4.0, w: 9, h: 1.5 },
		twoColumnSubheadlineLeft: { x: 0.5, y: 1.2, w: 4.25, h: 0.4 },
		twoColumnSubheadlineRight: { x: 5.25, y: 1.2, w: 4.25, h: 0.4 },
		imageTextSubheadline: { x: 5.0, y: 1.2, w: 4.5, h: 0.4 },
		textImageSubheadline: { x: 0.5, y: 1.2, w: 4.5, h: 0.4 },
		titleSubheadlinePosition: { x: 0.5, y: 3.0, w: 9, h: 1.0 },
		footerPosition: { x: "90%", y: "94%", w: "8%", h: "4%" },
		showPageNumbers: true,
		footer: {
			enabled: false,
		},
	},
	charts: {
		colors: ["4472C4", "ED7D31", "FFC000", "5B9BD5", "70AD47"],
		showTitle: true,
		showLegend: true,
		legendPosition: "b",
		dataLabelPosition: "outEnd",
		showDataLabels: true,
		roundedCorners: false,
	},
};
