// export const runtime = "edge";

import {
	type ChatCompletionOptions,
	type ChatMessage,
	createReasoningOptimizedConfig,
	getChatCompletion,
	PromptManager,
	textSimplificationTemplate,
} from "@kit/ai-gateway";
import { enhanceRouteHandler } from "@kit/next/routes";
import { createServiceLogger } from "@kit/shared/logger";
import { NextResponse } from "next/server";
import { z } from "zod";

const { getLogger } = createServiceLogger("AI-SIMPLIFY-TEXT-EDGE");

const SimplifyTextSchema = z.object({
	content: z.string(),
	userId: z.string(),
	canvasId: z.string(),
	sectionType: z.string(),
});

export const POST = enhanceRouteHandler(
	async ({ user, request }) => {
		try {
			// Start performance tracking
			const startTime = performance.now();

			// Parse and validate request body
			const body = await request.json();
			const data = SimplifyTextSchema.parse(body);

			const logger = await getLogger();
			logger.info("Simplify text request:", {
				operation: "simplifyTextActionEdge",
				userId: user.id,
				canvasId: data.canvasId,
				sectionType: data.sectionType,
				contentLength: data.content.length,
				runtime: "edge",
			});

			// Create config with cache namespacing
			const config = createReasoningOptimizedConfig({
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
				config,
				...options,
			});

			// Calculate duration for monitoring
			const duration = performance.now() - startTime;

			// Log metrics
			logger.info("AI Simplify Text Metrics:", {
				operation: "simplifyTextActionEdge",
				duration,
				userId: user.id,
				status: "success",
				runtime: "edge",
			});

			return NextResponse.json({
				success: true,
				response,
				metadata: {
					duration,
					runtime: "edge",
				},
			});
		} catch (error) {
			const logger = await getLogger();
			logger.error("Error in simplify text edge action:", {
				operation: "simplifyTextActionEdge",
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
