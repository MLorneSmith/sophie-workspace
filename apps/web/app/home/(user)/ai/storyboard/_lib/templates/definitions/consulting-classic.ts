import type { TemplateConfig } from "../../types/template.types";

export const consultingClassicTemplate: TemplateConfig = {
	id: "consulting-classic",
	name: "Consulting Classic",
	description:
		"A boardroom-ready theme with navy authority, serif headings, and refined gold/teal accents.",
	colors: {
		primary: "#1B2A4A",
		secondary: "#334E68",
		background: "#F8F7F4",
		text: "#1F2937",
		textMuted: "#6B7280",
		accent: "#C8A44D",
		chartPalette: ["#1B2A4A", "#0F766E", "#C8A44D", "#7C8AA2", "#2E4057"],
	},
	typography: {
		headingFont: "Georgia, 'Times New Roman', serif",
		bodyFont: "Arial, Helvetica, sans-serif",
		titleSize: 42,
		headingSize: 26,
		bodySize: 16,
		captionSize: 11,
	},
	density: "compact",
	tags: ["consulting", "executive", "classic"],
};
