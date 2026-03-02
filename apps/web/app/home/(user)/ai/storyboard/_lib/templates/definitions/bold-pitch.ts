import type { TemplateConfig } from "../../types/template.types";

export const boldPitchTemplate: TemplateConfig = {
	id: "bold-pitch",
	name: "Bold Pitch",
	description:
		"High-contrast, high-energy visual system designed for persuasive startup and sales decks.",
	colors: {
		primary: "#FF4F00",
		secondary: "#1F2937",
		background: "#FFF7ED",
		text: "#1F2937",
		textMuted: "#64748B",
		accent: "#0EA5E9",
		chartPalette: ["#FF4F00", "#0EA5E9", "#FACC15", "#111827", "#14B8A6"],
	},
	typography: {
		headingFont: "'Avenir Next', 'Segoe UI', Arial, sans-serif",
		bodyFont: "'Avenir Next', 'Segoe UI', Arial, sans-serif",
		titleSize: 44,
		headingSize: 28,
		bodySize: 16,
		captionSize: 11,
	},
	density: "balanced",
	tags: ["pitch", "sales", "startup"],
};
