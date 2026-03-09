import type { ChatMessage } from "../../index";

/**
 * Template for field suggestions (Situation)
 */
const fieldSuggestionsSituationTemplate: ChatMessage[] = [
	{
		role: "system",
		content:
			"You are an expert presentation strategist specializing in the SCQA framework (Situation, Complication, Question, Answer). Your task is to suggest improvements to the Situation section of a presentation.",
	},
	{
		role: "user",
		content: `Analyze and suggest improvements for the following Situation section:

Title: {{title}}
Current Situation: {{situation_content}}

Provide specific, actionable suggestions to strengthen this Situation section.`,
	},
];

export default fieldSuggestionsSituationTemplate;
