"use server";

import {
	EditorReviewSchema,
	PartnerReviewSchema,
	ValidatorReviewSchema,
	WhispererReviewSchema,
	type LaunchAgentId,
} from "@kit/mastra";
import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";

import type { StoryboardSlide } from "../../_lib/types/storyboard.types";
import { getAgent as getMastraAgent } from "../../../_lib/server/mastra";

const LaunchAgentIdSchema = z.enum([
	"partner",
	"validator",
	"whisperer",
	"editor",
]);

const RunAgentSchema = z.object({
	presentationId: z.string().min(1),
	agentId: LaunchAgentIdSchema,
});

const RunAgentResultSchema = z.discriminatedUnion("agentId", [
	z.object({
		agentId: z.literal("partner"),
		result: PartnerReviewSchema,
		durationMs: z.number().int().nonnegative(),
	}),
	z.object({
		agentId: z.literal("validator"),
		result: ValidatorReviewSchema,
		durationMs: z.number().int().nonnegative(),
	}),
	z.object({
		agentId: z.literal("whisperer"),
		result: WhispererReviewSchema,
		durationMs: z.number().int().nonnegative(),
	}),
	z.object({
		agentId: z.literal("editor"),
		result: EditorReviewSchema,
		durationMs: z.number().int().nonnegative(),
	}),
]);

export type RunAgentResult = z.infer<typeof RunAgentResultSchema>;

type AudienceBriefContext = {
	briefStructured: Record<string, unknown> | null;
	briefText: string | null;
};

type AgentOutputById = {
	partner: z.infer<typeof PartnerReviewSchema>;
	validator: z.infer<typeof ValidatorReviewSchema>;
	whisperer: z.infer<typeof WhispererReviewSchema>;
	editor: z.infer<typeof EditorReviewSchema>;
};

const AgentOutputSchemas: {
	[K in LaunchAgentId]: z.ZodType<AgentOutputById[K]>;
} = {
	partner: PartnerReviewSchema,
	validator: ValidatorReviewSchema,
	whisperer: WhispererReviewSchema,
	editor: EditorReviewSchema,
};

function requiresAudienceBrief(agentId: LaunchAgentId): boolean {
	return agentId === "partner" || agentId === "whisperer";
}

function formatSlidesForAgent(slides: StoryboardSlide[]) {
	return [...slides]
		.sort((a, b) => a.order - b.order)
		.map((slide, index) => ({
			slideId: slide.id,
			slideNumber: index + 1,
			title: slide.title,
			layout: slide.layout,
			purpose: slide.purpose,
			takeawayHeadline: slide.takeaway_headline,
			content: slide.content,
			contentLeft: slide.content_left ?? "",
			contentRight: slide.content_right ?? "",
			evidenceNeeded: slide.evidence_needed,
			visualNotes: slide.visual_notes,
		}));
}

function buildAgentPrompt(input: {
	presentationId: string;
	agentId: LaunchAgentId;
	slides: StoryboardSlide[];
	audienceBrief: AudienceBriefContext;
}) {
	const payload = {
		presentationId: input.presentationId,
		agentId: input.agentId,
		slideCount: input.slides.length,
		storyboard: formatSlidesForAgent(input.slides),
		audienceBrief: input.audienceBrief.briefStructured,
		audienceBriefText: input.audienceBrief.briefText,
	};

	return [
		`Run The ${input.agentId[0]?.toUpperCase()}${input.agentId.slice(1)} agent on this storyboard context.`,
		"Use the optional audience brief when it is provided.",
		"Return only JSON that matches the required structured schema.",
		JSON.stringify(payload, null, 2),
	].join("\n\n");
}

function createRunAgentResult(
	agentId: LaunchAgentId,
	result: AgentOutputById[LaunchAgentId],
	durationMs: number,
): RunAgentResult {
	switch (agentId) {
		case "partner":
			return {
				agentId,
				result: PartnerReviewSchema.parse(result),
				durationMs,
			};
		case "validator":
			return {
				agentId,
				result: ValidatorReviewSchema.parse(result),
				durationMs,
			};
		case "whisperer":
			return {
				agentId,
				result: WhispererReviewSchema.parse(result),
				durationMs,
			};
		case "editor":
			return {
				agentId,
				result: EditorReviewSchema.parse(result),
				durationMs,
			};
		default:
			throw new Error(`Unsupported agent: ${agentId}`);
	}
}

export const runAgentAction = enhanceAction(
	async (data, user) => {
		const logger = await getLogger();
		const client = getSupabaseServerClient();
		const startTime = Date.now();
		const ctx = {
			name: "runAgentAction",
			presentationId: data.presentationId,
			agentId: data.agentId,
			userId: user.id,
		};

		const { data: presentation, error: presentationError } = await client
			.from("presentations")
			.select("id")
			.eq("id", data.presentationId)
			.eq("user_id", user.id)
			.maybeSingle();

		if (presentationError) {
			logger.error(
				ctx,
				"Failed to verify presentation access: %o",
				presentationError,
			);
			throw new Error("Failed to verify presentation access");
		}

		if (!presentation) {
			throw new Error("Presentation not found");
		}

		const { data: storyboard, error: storyboardError } = await client
			.from("storyboard_contents")
			.select("slides")
			.eq("presentation_id", data.presentationId)
			.maybeSingle();

		if (storyboardError) {
			logger.error(
				ctx,
				"Failed to load storyboard contents: %o",
				storyboardError,
			);
			throw new Error("Failed to load storyboard");
		}

		const rawSlides = storyboard?.slides;
		const slides = Array.isArray(rawSlides)
			? (rawSlides as unknown as StoryboardSlide[])
			: [];

		if (slides.length === 0) {
			throw new Error("Storyboard has no slides to analyze");
		}

		let audienceBrief: AudienceBriefContext = {
			briefStructured: null,
			briefText: null,
		};

		if (requiresAudienceBrief(data.agentId)) {
			const { data: audienceProfile, error: audienceError } = await client
				.from("audience_profiles")
				.select("brief_structured, brief_text")
				.eq("presentation_id", data.presentationId)
				.maybeSingle();

			if (audienceError) {
				logger.warn(
					ctx,
					"Failed to load audience profile context: %o",
					audienceError,
				);
			} else {
				audienceBrief = {
					briefStructured:
						audienceProfile?.brief_structured &&
						typeof audienceProfile.brief_structured === "object" &&
						!Array.isArray(audienceProfile.brief_structured)
							? (audienceProfile.brief_structured as Record<string, unknown>)
							: null,
					briefText:
						typeof audienceProfile?.brief_text === "string"
							? audienceProfile.brief_text
							: null,
				};
			}
		}

		const agent = getMastraAgent(data.agentId);
		const outputSchema = AgentOutputSchemas[data.agentId];
		const prompt = buildAgentPrompt({
			presentationId: data.presentationId,
			agentId: data.agentId,
			slides,
			audienceBrief,
		});

		let result: ReturnType<typeof createRunAgentResult>;
		try {
			const runResult = await agent.generate(
				[{ role: "user", content: prompt }],
				{ structuredOutput: { schema: outputSchema } },
			);

			const parsed = outputSchema.safeParse(runResult.object);
			if (!parsed.success) {
				logger.error(ctx, "Agent output validation failed", {
					agentId: data.agentId,
					zodErrors: parsed.error.flatten(),
				});
				throw new Error(`Agent "${data.agentId}" output validation failed`);
			}

			result = createRunAgentResult(
				data.agentId,
				parsed.data,
				Date.now() - startTime,
			);
		} catch (error) {
			logger.error(ctx, "Agent run failed", {
				agentId: data.agentId,
				slideCount: slides.length,
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}

		logger.info(ctx, "Agent run completed", {
			durationMs: result.durationMs,
			slideCount: slides.length,
		});

		return {
			success: true,
			data: RunAgentResultSchema.parse(result),
		};
	},
	{
		schema: RunAgentSchema,
		auth: true,
	},
);
