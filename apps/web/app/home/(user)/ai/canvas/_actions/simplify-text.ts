"use server";

import {
	type ChatMessage,
	getChatCompletion,
	PromptManager,
	textSimplificationTemplate,
} from "@kit/ai-gateway";
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
			const response = await getChatCompletion(compiledMessages, {
				model: process.env.BIFROST_MODEL_CANVAS_QUALITY,
				temperature: 0.4,
				virtualKey: process.env.BIFROST_VK_CANVAS_QUALITY,
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
