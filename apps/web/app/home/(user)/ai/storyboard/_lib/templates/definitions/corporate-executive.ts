import type { TemplateConfig } from "../../types/template.types";

export const corporateExecutiveTemplate: TemplateConfig = {
	id: "corporate-executive",
	name: "Corporate Executive",
	description:
		"Polished executive tone with dark blue foundations and restrained green highlights.",
	colors: {
		primary: "#0F172A",
		secondary: "#1E293B",
		background: "#F8FAFC",
		text: "#111827",
		textMuted: "#64748B",
		accent: "#4D7C0F",
		chartPalette: ["#0F172A", "#1D4ED8", "#4D7C0F", "#0F766E", "#94A3B8"],
	},
	typography: {
		headingFont: "'Times New Roman', Georgia, serif",
		bodyFont: "Arial, Helvetica, sans-serif",
		titleSize: 40,
		headingSize: 25,
		bodySize: 15,
		captionSize: 11,
	},
	density: "balanced",
	tags: ["corporate", "executive", "formal"],
};
