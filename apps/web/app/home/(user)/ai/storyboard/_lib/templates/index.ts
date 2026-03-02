import type { TemplateConfig } from "../types/template.types";
import { CURATED_TEMPLATES } from "./definitions";

const DEFAULT_TEMPLATE_ID = "consulting-classic";

export const TEMPLATES: ReadonlyMap<string, TemplateConfig> = new Map(
	CURATED_TEMPLATES.map((template) => [template.id, template]),
);

export function getTemplate(id: string): TemplateConfig | undefined {
	return TEMPLATES.get(id);
}

export function getDefaultTemplate(): TemplateConfig {
	const defaultTemplate = TEMPLATES.get(DEFAULT_TEMPLATE_ID);
	if (defaultTemplate) {
		return defaultTemplate;
	}
	return CURATED_TEMPLATES[0];
}

export function getAllTemplates(): TemplateConfig[] {
	return [...TEMPLATES.values()];
}
