import type { TemplateConfig } from "../../types/template.types";

export const modernMinimalTemplate: TemplateConfig = {
	id: "modern-minimal",
	name: "Modern Minimal",
	description:
		"Clean sans-serif styling with wide spacing and cool neutral surfaces for modern narratives.",
	colors: {
		primary: "#111827",
		secondary: "#4B5563",
		background: "#F5F5F5",
		text: "#1F2937",
		textMuted: "#6B7280",
		accent: "#4F46E5",
		chartPalette: ["#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"],
	},
	typography: {
		headingFont:
			"-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
		bodyFont:
			"-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
		titleSize: 40,
		headingSize: 24,
		bodySize: 16,
		captionSize: 11,
	},
	density: "airy",
	tags: ["modern", "minimal", "clean"],
};
