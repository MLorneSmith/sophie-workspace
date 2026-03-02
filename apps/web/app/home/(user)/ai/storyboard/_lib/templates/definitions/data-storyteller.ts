import type { TemplateConfig } from "../../types/template.types";

export const dataStorytellerTemplate: TemplateConfig = {
	id: "data-storyteller",
	name: "Data Storyteller",
	description:
		"A data-viz-first theme with crisp white space and mono-inspired typography for analytical narratives.",
	colors: {
		primary: "#111827",
		secondary: "#374151",
		background: "#FFFFFF",
		text: "#1F2937",
		textMuted: "#6B7280",
		accent: "#0891B2",
		chartPalette: ["#2563EB", "#059669", "#DC2626", "#D97706", "#7C3AED"],
	},
	typography: {
		headingFont: "'IBM Plex Mono', 'SFMono-Regular', Menlo, Monaco, monospace",
		bodyFont: "'IBM Plex Sans', 'Segoe UI', Arial, sans-serif",
		titleSize: 38,
		headingSize: 24,
		bodySize: 15,
		captionSize: 10,
	},
	density: "compact",
	tags: ["data", "analytics", "technical"],
};
