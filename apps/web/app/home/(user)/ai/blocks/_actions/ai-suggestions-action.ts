"use server";

import { z } from "zod";

import {
	type ChatCompletionOptions,
	type ChatMessage,
	getChatCompletion,
} from "@kit/ai-gateway";
import { ConfigManager } from "@kit/ai-gateway/src/configs/config-manager";
import { createBalancedOptimizedConfig } from "@kit/ai-gateway/src/configs/templates/balanced-optimized";
import { createAudienceSuggestionsConfig } from "@kit/ai-gateway/src/configs/use-cases/audience-suggestions/config";
import { createTitleSuggestionsConfig } from "@kit/ai-gateway/src/configs/use-cases/title-suggestions/config";
import { PromptManager } from "@kit/ai-gateway/src/prompts/prompt-manager";
import { enhanceAction } from "@kit/next/actions";

// Define Zod schema for request validation
const SuggestionsSchema = z
	.object({
		title: z.string().optional(),
		field: z.enum(
			["title", "audience", "situation", "complication", "answer"],
			{
				description:
					"Must be one of: title, audience, situation, complication, answer",
			},
		),
		presentationType: z.string().optional(),
	})
	.refine(
		(data) => {
			// Require title only for non-title fields
			if (data.field !== "title") {
				return data.title && data.title.length > 0;
			}
			// For title field, require presentationType instead
			return data.presentationType && data.presentationType.length > 0;
		},
		{
			message:
				"Title is required for non-title suggestions, presentationType is required for title suggestions",
		},
	);

// Helper function to generate prompts based on field type
function generateMessages(
	field: string,
	title: string | undefined,
	presentationType?: string,
): ChatMessage[] {
	// For title suggestions, we don't need the title parameter
	if (field === "title") {
		if (!presentationType)
			throw new Error("Presentation type required for title suggestions");

		const messages = PromptManager.loadTemplate("title-suggestions");
		return messages.map((message: ChatMessage) => ({
			...message,
			content: PromptManager.compile(message.content, {
				presentation_type: presentationType,
			}),
		}));
	}

	// For audience suggestions, use the template
	if (field === "audience") {
		if (!title) {
			throw new Error("Title is required for audience suggestions");
		}

		const messages = PromptManager.loadTemplate("audience-suggestions");
		return messages.map((message: ChatMessage) => ({
			...message,
			content: PromptManager.compile(message.content, {
				title,
			}),
		}));
	}

	// For all other fields, we need the title parameter
	if (!title) {
		throw new Error("Title is required for non-title suggestions");
	}

	// Now we know title is defined for non-title fields
	switch (field) {
		case "situation":
			return [
				{
					role: "system",
					content:
						"You are a professional presentation expert who provides concise, relevant suggestions.",
				},
				{
					role: "user",
					content: `Based on "${title}" provide 3 suggestions to improve the situation description. Format as a numbered list.`,
				},
			];

		case "complication":
			return [
				{
					role: "system",
					content:
						"You are a professional presentation expert who provides concise, relevant suggestions.",
				},
				{
					role: "user",
					content: `Based on "${title}" provide 3 suggestions to make the complication more compelling. Format as a numbered list.`,
				},
			];

		case "answer":
			return [
				{
					role: "system",
					content:
						"You are a professional presentation expert who provides concise, relevant suggestions.",
				},
				{
					role: "user",
					content: `Based on "${title}" provide 3 suggestions to make the answer more impactful. Format as a numbered list.`,
				},
			];

		default:
			throw new Error("Invalid field type");
	}
}

export const getSuggestions = enhanceAction(
	async (data: z.infer<typeof SuggestionsSchema>, user) => {
		try {
			// Start performance tracking
			const startTime = performance.now();

			// Debug log the request
			console.log("Suggestions Request:", {
				title: data.title,
				field: data.field,
				presentationType: data.presentationType,
				userId: user.id,
			});

			// Create and normalize config
			const config =
				data.field === "title"
					? createTitleSuggestionsConfig({
							userId: user.id,
							context: "title-suggestions",
						})
					: data.field === "audience"
						? createAudienceSuggestionsConfig({
								userId: user.id,
								context: "audience-suggestions",
							})
						: createBalancedOptimizedConfig({
								userId: user.id,
								context: `suggestions-${data.field}`,
							});
			const normalizedConfig = ConfigManager.normalizeConfig(config);

			if (!normalizedConfig) {
				throw new Error("Failed to normalize config");
			}

			// Generate messages based on field type
			const messages = generateMessages(
				data.field,
				data.title,
				data.presentationType,
			);

			// Get completion from AI Gateway
			const response = await getChatCompletion(messages, {
				config: normalizedConfig,
			} as ChatCompletionOptions);

			// Calculate duration for monitoring
			const duration = performance.now() - startTime;

			// Log metrics
			console.log("AI Request Metrics:", {
				field: data.field,
				duration,
				userId: user.id,
				status: "success",
			});

			// Parse numbered list response and remove quotes
			// Access the text content from the response before splitting
			const suggestions = (response.content as string) // Access text content
				.split("\n")
				.map(
					(
						line: string, // Explicitly type line
					) =>
						line
							.replace(/^\d+\.\s*/, "") // Remove numbered list format
							.replace(/^["']|["']$/g, "") // Remove leading/trailing quotes
							.trim(),
				)
				.filter(Boolean);

			// Debug log the suggestions
			console.log("Parsed Suggestions:", suggestions);

			return {
				success: true,
				data: suggestions,
			};
		} catch (error) {
			console.error("Error in suggestions action:", error);

			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	},
	{
		schema: SuggestionsSchema,
		auth: true,
	},
);
