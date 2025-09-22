export const runtime = "edge";

import {
	baseInstructions,
	type ChatCompletionOptions,
	type ChatMessage,
	ConfigManager,
	createOpenAIOnlyConfig,
	getChatCompletion,
	ideasCreatorSystem,
	improvementFormat,
	parseImprovements,
	presentationContext,
} from "@kit/ai-gateway";
import { enhanceRouteHandler } from "@kit/next/routes";
import { createServiceLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { NextResponse } from "next/server";
import { z } from "zod";

const { getLogger } = createServiceLogger("AI-GENERATE-IDEAS-EDGE");

// Define Zod schema for request validation
const IdeasSchema = z.object({
	content: z.string().min(1, "Content is required"),
	submissionId: z.string().min(1, "Submission ID is required"),
	type: z.enum(["situation", "complication", "answer", "outline"]),
	sessionId: z.string().optional(),
});

export const POST = enhanceRouteHandler(
	async ({ user, request }) => {
		try {
			// Start performance tracking
			const startTime = performance.now();

			// Parse and validate request body
			const body = await request.json();
			const data = IdeasSchema.parse(body);

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
				return NextResponse.json(
					{ success: false, error: "Failed to fetch submission data" },
					{ status: 400 },
				);
			}

			// If content is empty, use a placeholder
			const contentToUse =
				data.content.trim() ||
				"No content provided yet. Please suggest some initial ideas.";

			// Debug log the request
			const logger = await getLogger();
			logger.info("Ideas Request:", {
				operation: "generateIdeasActionEdge",
				contentLength: contentToUse.length,
				userId: user.id,
				submissionId: data.submissionId,
				type: data.type,
				runtime: "edge",
			});

			// Create and normalize config using OpenAI-only config to avoid authentication issues
			const config = createOpenAIOnlyConfig({
				userId: user.id,
				context: `${data.type}-ideas`,
			});
			const normalizedConfig = ConfigManager.normalizeConfig(config);

			if (!normalizedConfig) {
				return NextResponse.json(
					{ success: false, error: "Failed to normalize config" },
					{ status: 500 },
				);
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
				feature: `canvas-${data.type}-ideas-edge`,
				sessionId: data.sessionId, // Include session ID for cost tracking
			} as ChatCompletionOptions);

			// Calculate duration for monitoring
			const duration = performance.now() - startTime;

			// Log metrics
			logger.info("AI Request Metrics:", {
				operation: "generateIdeasActionEdge",
				duration,
				userId: user.id,
				status: "success",
				runtime: "edge",
			});

			// Parse the response using our utility - extract content from CompletionResult
			const improvements = parseImprovements(response.content, data.type);

			// Debug log the parsed improvements
			logger.info("Parsed Ideas:", {
				operation: "generateIdeasActionEdge",
				data: improvements,
				userId: user.id,
				runtime: "edge",
			});

			return NextResponse.json({
				success: true,
				data: { improvements },
				metadata: {
					cost: response.metadata.cost, // Include cost in response metadata
					duration,
					runtime: "edge",
				},
			});
		} catch (error) {
			const logger = await getLogger();
			logger.error("Error in ideas edge action:", {
				operation: "generateIdeasActionEdge",
				error,
				userId: user.id,
				runtime: "edge",
			});

			return NextResponse.json(
				{
					success: false,
					error: error instanceof Error ? error.message : "Unknown error",
				},
				{ status: 500 },
			);
		}
	},
	{
		auth: true,
	},
);
