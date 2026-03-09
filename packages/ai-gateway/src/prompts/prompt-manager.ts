import type { ChatMessage } from "../index";
// Import templates
import audienceBriefGenerationTemplate from "./templates/audience-brief-generation";
import audienceSuggestionsTemplate from "./templates/audience-suggestions";
import agentEditorTemplate from "./templates/agent-editor";
import agentPartnerTemplate from "./templates/agent-partner";
import agentResearchTemplate from "./templates/agent-research";
import agentValidatorTemplate from "./templates/agent-validator";
import agentWhispererTemplate from "./templates/agent-whisperer";
import companyBriefSynthesisTemplate from "./templates/company-brief-synthesis";
import fieldSuggestionsComplicationTemplate from "./templates/field-suggestions-complication";
import fieldSuggestionsSituationTemplate from "./templates/field-suggestions-situation";
import storyboardGenerationTemplate from "./templates/storyboard-generation";
import testOutlineTemplate from "./templates/test-outline";
import titleSuggestionsTemplate from "./templates/title-suggestions";

// Template registry
const templateRegistry: Record<string, ChatMessage[]> = {
	// Existing templates
	"title-suggestions": titleSuggestionsTemplate,
	"audience-suggestions": audienceSuggestionsTemplate,
	"test-outline": testOutlineTemplate,
	// New templates
	"audience-brief-generation": audienceBriefGenerationTemplate,
	"company-brief-synthesis": companyBriefSynthesisTemplate,
	"storyboard-generation": storyboardGenerationTemplate,
	"field-suggestions-situation": fieldSuggestionsSituationTemplate,
	"field-suggestions-complication": fieldSuggestionsComplicationTemplate,
	"agent-editor": agentEditorTemplate,
	"agent-partner": agentPartnerTemplate,
	"agent-validator": agentValidatorTemplate,
	"agent-whisperer": agentWhispererTemplate,
	"agent-research": agentResearchTemplate,
};

/**
 * Compiles a template string by replacing variables with their values
 * @param template The template string with variables in the format {{variable_name}}
 * @param variables An object mapping variable names to their values
 * @returns The compiled template with variables replaced
 */
export function compileTemplate(
	template: string,
	variables: Record<string, string>,
): string {
	return Object.entries(variables).reduce((result, [key, value]) => {
		const pattern = new RegExp(`{{${key}}}`, "g");
		return result.replace(pattern, value);
	}, template);
}

/**
 * Loads a template by name
 * @param templateName The name of the template to load
 * @returns An array of chat messages for the template
 * @throws Error if the template is not found
 */
export function loadTemplate(templateName: string): ChatMessage[] {
	const template = templateRegistry[templateName];
	if (!template) {
		throw new Error(`Template not found: ${templateName}`);
	}
	return [...template]; // Return a copy to prevent modification of the original
}

/**
 * Gets the list of available template names
 * @returns Array of available template names
 */
export function getAvailableTemplates(): string[] {
	return Object.keys(templateRegistry);
}

/**
 * @deprecated Use the standalone functions instead of PromptManager
 * Backward compatibility export for PromptManager
 */
export const PromptManager = {
	/**
	 * @deprecated Use compileTemplate function directly
	 */
	compileTemplate,
	/**
	 * @deprecated Use loadTemplate function directly
	 */
	loadTemplate,
	/**
	 * @deprecated Use getAvailableTemplates function directly
	 */
	getAvailableTemplates,
};
