"use server";

import {
	type ChatCompletionOptions,
	type ChatMessage,
	getChatCompletion,
} from "@kit/ai-gateway";
import { createReasoningOptimizedConfig } from "@kit/ai-gateway/src/configs/templates";
import { PromptManager } from "@kit/ai-gateway/src/prompts/prompt-manager";
import { textSimplificationTemplate } from "@kit/ai-gateway/src/prompts/templates/text-simplification";
import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { z } from "zod";

const SimplifyTextSchema = z.object({
	content: z.string(),
	userId: z.string(),
	canvasId: z.string(),
	sectionType: z.string(),
});

export const simplifyTextAction = enhanceAction(
	async (data, _user) => {
		try {
			// Create config with cache namespacing
			const _config = createReasoningOptimizedConfig({
				userId: data.userId,
				presentationId: data.canvasId,
				context: `simplify-${data.sectionType}`,
			});

			// Compile the template with variables
			const compiledMessages = textSimplificationTemplate.map(
				(message: ChatMessage) => ({
					...message,
					content: PromptManager.compileTemplate(message.content, {
						content: data.content,
					}),
				}),
			);

			// Get completion
			const options: ChatCompletionOptions = {
				model: "gpt-4",
				temperature: 0.7,
			};

			const response = await getChatCompletion(compiledMessages, {
				...options,
			});

			return {
				success: true,
				response,
			};
		} catch (error) {
			const logger = await getLogger();
			logger.error("Error in simplifyTextAction:", {
				operation: "simplifyTextAction",
				error,
				userId: data.userId,
				canvasId: data.canvasId,
				sectionType: data.sectionType,
			});
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "An unknown error occurred",
			};
		}
	},
	{
		auth: true,
		schema: SimplifyTextSchema,
	},
);
