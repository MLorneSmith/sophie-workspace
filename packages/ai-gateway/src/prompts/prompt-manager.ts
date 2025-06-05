import type { ChatMessage } from "../index";
// Import templates
import audienceSuggestionsTemplate from "./templates/audience-suggestions";
import testOutlineTemplate from "./templates/test-outline";
import titleSuggestionsTemplate from "./templates/title-suggestions";

// Template registry
const templateRegistry: Record<string, ChatMessage[]> = {
	"title-suggestions": titleSuggestionsTemplate,
	"audience-suggestions": audienceSuggestionsTemplate,
	"test-outline": testOutlineTemplate,
};

export class PromptManager {
	/**
	 * Compiles a template string by replacing variables with their values
	 * @param template The template string with variables in the format {{variable_name}}
	 * @param variables An object mapping variable names to their values
	 * @returns The compiled template with variables replaced
	 */
	static compile(template: string, variables: Record<string, string>): string {
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
	static loadTemplate(templateName: string): ChatMessage[] {
		const template = templateRegistry[templateName];
		if (!template) {
			throw new Error(`Template not found: ${templateName}`);
		}
		return [...template]; // Return a copy to prevent modification of the original
	}
}
