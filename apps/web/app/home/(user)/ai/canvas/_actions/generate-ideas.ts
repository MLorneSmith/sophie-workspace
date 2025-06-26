"use server";

import {
	type ChatCompletionOptions,
	type ChatMessage,
	ConfigManager,
	getChatCompletion,
} from "@kit/ai-gateway";
import { createOpenAIOnlyConfig } from "@kit/ai-gateway/src/configs/templates/openai-only";
import { ideasCreatorSystem } from "@kit/ai-gateway/src/prompts/messages/system/ideas-creator";
import { baseInstructions } from "@kit/ai-gateway/src/prompts/partials/base-instructions";
import { improvementFormat } from "@kit/ai-gateway/src/prompts/partials/improvement-format";
import { presentationContext } from "@kit/ai-gateway/src/prompts/partials/presentation-context";
import { parseImprovements } from "@kit/ai-gateway/src/utils/parse-improvements";
import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";

// Define Zod schema for request validation
const IdeasSchema = z.object({
	content: z.string().min(1, "Content is required"),
	submissionId: z.string().min(1, "Submission ID is required"),
	type: z.enum(["situation", "complication", "answer", "outline"]),
	sessionId: z.string().optional(),
});

// Create a wrapper function that handles empty content
export const generateIdeasAction = enhanceAction(
	async (data: z.infer<typeof IdeasSchema>, user) => {
		try {
			// Start performance tracking
			const startTime = performance.now();

			// Get the submission data from the database
			const supabase = getSupabaseServerClient();
			const { data: submission, error } = await supabase
				.from("building_blocks_submissions")
				.select(
					"title, audience, situation, complication, question_type, answer",
				)
				.eq("id", data.submissionId)
				.single();

			if (error || !submission) {
				throw new Error("Failed to fetch submission data");
			}

			// If content is empty, use a placeholder
			const contentToUse =
				data.content.trim() ||
				"No content provided yet. Please suggest some initial ideas.";

			// Debug log the request
			const logger = await getLogger();
			logger.info("Ideas Request:", {
				operation: "generateIdeasAction",
				contentLength: contentToUse.length,
				userId: user.id,
				submissionId: data.submissionId,
				type: data.type,
			});

			// Create and normalize config using OpenAI-only config to avoid authentication issues
			const config = createOpenAIOnlyConfig({
				userId: user.id,
				context: `${data.type}-ideas`,
			});
			const normalizedConfig = ConfigManager.normalizeConfig(config);

			if (!normalizedConfig) {
				throw new Error("Failed to normalize config");
			}

			// Generate messages using partials
			const messages: ChatMessage[] = [
				{
					role: "system",
					content: `${baseInstructions}\n\n${ideasCreatorSystem}`,
				},
				{
					role: "user",
					content: `${presentationContext
						.replace("{{title}}", submission.title)
						.replace("{{audience}}", submission.audience || "General audience")
						.replace("{{situation}}", submission.situation || "")
						.replace("{{complication}}", submission.complication || "")
						.replace("{{questionType}}", submission.question_type || "")
						.replace("{{answer}}", submission.answer || "")
						.replace("{{content}}", contentToUse)
						.replace(/{{sectionType}}/g, data.type)}

Current content to enhance with new ideas:
${contentToUse}

${improvementFormat}`,
				},
			];

			// Get completion from AI Gateway
			const response = await getChatCompletion(messages, {
				config: normalizedConfig,
				userId: user.id,
				feature: `canvas-${data.type}-ideas`,
				sessionId: data.sessionId, // Include session ID for cost tracking
			} as ChatCompletionOptions);

			// Calculate duration for monitoring
			const _duration = performance.now() - startTime;

			// Log metrics
			logger.info("AI Request Metrics:", {
				operation: "generateIdeasAction",
				duration: _duration,
				userId: user.id,
				status: "success",
			});

			// Parse the response using our utility - extract content from CompletionResult
			const improvements = parseImprovements(response.content, data.type);

			// Debug log the parsed improvements
			logger.info("Parsed Ideas:", {
				operation: "generateIdeasAction",
				data: improvements,
				userId: user.id,
			});

			return {
				success: true,
				data: { improvements },
				metadata: {
					cost: response.metadata.cost, // Include cost in response metadata
				},
			};
		} catch (error) {
			const logger = await getLogger();
			logger.error("Error in ideas action:", {
				operation: "generateIdeasAction",
				error,
				userId: user.id,
				submissionId: data.submissionId,
			});

			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	},
	{
		schema: IdeasSchema,
		auth: true,
	},
);
