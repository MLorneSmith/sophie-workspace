"use server";

import {
	type ChatCompletionOptions,
	type ChatMessage,
	ConfigManager,
	getChatCompletion,
} from "@kit/ai-gateway";
import { createBalancedOptimizedConfig } from "@kit/ai-gateway/src/configs/templates/balanced-optimized";
import { baseInstructions } from "@kit/ai-gateway/src/prompts/partials/base-instructions";
import { improvementFormat } from "@kit/ai-gateway/src/prompts/partials/improvement-format";
import { improvementProcess } from "@kit/ai-gateway/src/prompts/partials/improvement-process";
import { presentationContext } from "@kit/ai-gateway/src/prompts/partials/presentation-context";
import { sectionAnalysis } from "@kit/ai-gateway/src/prompts/partials/section-analysis";
import { parseImprovements } from "@kit/ai-gateway/src/utils/parse-improvements";
import { enhanceAction } from "@kit/next/actions";
import { createServiceLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";

const { getLogger } = createServiceLogger("AI-IMPROVEMENTS-GENERATOR");

// Define Zod schema for request validation
const ImprovementsSchema = z.object({
	content: z.string().min(1, "Content is required"),
	submissionId: z.string().min(1, "Submission ID is required"),
	type: z.enum(["situation", "complication", "answer", "outline"]),
});

export const generateImprovementsAction = enhanceAction(
	async (data: z.infer<typeof ImprovementsSchema>, user) => {
		try {
			// Start performance tracking
			const _startTime = performance.now();

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

			const logger = await getLogger();
			logger.info("Processing improvements request", {
				operation: "generate_improvements",
				contentLength: data.content.length,
				userId: user.id,
				submissionId: data.submissionId,
				type: data.type,
			});

			// Create and normalize config
			const config = createBalancedOptimizedConfig({
				userId: user.id,
				context: `${data.type}-improvements`,
			});
			const normalizedConfig = ConfigManager.normalizeConfig(config);

			if (!normalizedConfig) {
				throw new Error("Failed to normalize config");
			}

			// Start timing for performance monitoring
			const startTime = performance.now();

			// Generate messages using partials
			const messages: ChatMessage[] = [
				{
					role: "system",
					content: baseInstructions,
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
						.replace("{{content}}", data.content)
						.replace(/{{sectionType}}/g, data.type)}

${sectionAnalysis.replace(/{{sectionType}}/g, data.type)}

${improvementProcess}

${improvementFormat}`,
				},
			];

			// Get completion from AI Gateway
			const response = await getChatCompletion(messages, {
				config: normalizedConfig,
			} as ChatCompletionOptions);

			// Calculate duration for monitoring
			const _duration = performance.now() - startTime;

			// Parse the response using our utility
			const improvements = parseImprovements(response.content, data.type);

			logger.info("Improvements generated successfully", {
				operation: "generate_improvements",
				duration: _duration,
				userId: user.id,
				submissionId: data.submissionId,
				type: data.type,
				improvementsCount: improvements.length,
			});

			return {
				success: true,
				data: { improvements },
			};
		} catch (error) {
			const logger = await getLogger();
			logger.error("Error generating improvements", {
				operation: "generate_improvements",
				userId: user.id,
				submissionId: data.submissionId,
				type: data.type,
				error,
			});

			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	},
	{
		schema: ImprovementsSchema,
		auth: true,
	},
);
