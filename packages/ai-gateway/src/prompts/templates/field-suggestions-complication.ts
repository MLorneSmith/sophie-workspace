import type { ChatMessage } from "../../index";

/**
 * Template for field suggestions (Complication)
 */
const fieldSuggestionsComplicationTemplate: ChatMessage[] = [
	{
		role: "system",
		content:
			"You are an expert presentation strategist specializing in the SCQA framework (Situation, Complication, Question, Answer). Your task is to suggest improvements to the Complication section of a presentation.",
	},
	{
		role: "user",
		content: `Analyze and suggest improvements for the following Complication section:

Title: {{title}}
Current Complication: {{complication_content}}

Provide specific, actionable suggestions to strengthen this Complication section.`,
	},
];

export default fieldSuggestionsComplicationTemplate;
