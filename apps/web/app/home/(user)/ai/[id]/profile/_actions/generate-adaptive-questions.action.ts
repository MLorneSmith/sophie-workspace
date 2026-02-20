"use server";

import {
	ConfigManager,
	type ChatCompletionOptions,
	type ChatMessage,
	createOpenAIOnlyConfig,
	getChatCompletion,
} from "@kit/ai-gateway";
import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const GenerateAdaptiveQuestionsSchema = z.object({
	briefStructured: z.record(z.string(), z.unknown()),
	companyBrief: z.record(z.string(), z.unknown()).nullable().optional(),
	personName: z.string().min(1),
	company: z.string().min(1),
});

export interface AdaptiveQuestion {
	id: string;
	question: string;
	why: string;
	quadrant: "communication" | "strategy" | "format" | "company";
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

function buildQuestionsPrompt(
	briefStructured: Record<string, unknown>,
	companyBrief: Record<string, unknown> | null | undefined,
	personName: string,
	company: string,
): ChatMessage[] {
	const systemPrompt = `You are a presentation coach. You've just generated an audience brief for a presenter. Now identify 2-4 follow-up questions that would significantly improve the brief's quality.

Focus on gaps — areas where the brief had to make assumptions due to missing data. Each question should target a specific quadrant:
- "communication": How this person prefers to receive information (decision style, attention span, trust signals)
- "strategy": What to lead with, how to frame the narrative, what to avoid
- "format": Presentation structure, data density, tone, length
- "company": Company-specific context that would sharpen the recommendations

Rules:
- Only ask questions where the answer would materially change the brief
- Be specific — not "tell me more about them" but "Does [person] prefer bottom-line-up-front or narrative builds?"
- If the brief is already strong in a quadrant, skip it
- Maximum 4 questions, minimum 2

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "The specific question to ask",
      "why": "Brief explanation of what gap this fills",
      "quadrant": "communication | strategy | format | company"
    }
  ]
}`;

	const userPrompt = `Generate follow-up questions for this audience brief:

**Person:** ${personName} at ${company}

**Brief:**
${JSON.stringify(briefStructured, null, 2)}

${companyBrief ? `**Company Brief:**\n${JSON.stringify(companyBrief, null, 2)}` : "**Company Brief:** Not available — consider asking about company context."}

Respond with ONLY the JSON object, no markdown fences.`;

	return [
		{ role: "system" as const, content: systemPrompt },
		{ role: "user" as const, content: userPrompt },
	];
}

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

export const generateAdaptiveQuestionsAction = enhanceAction(
	async (data, user) => {
		const logger = await getLogger();
		const ctx = { name: "generateAdaptiveQuestionsAction" };

		const messages = buildQuestionsPrompt(
			data.briefStructured,
			data.companyBrief,
			data.personName,
			data.company,
		);

		const config = createOpenAIOnlyConfig({
			userId: user.id,
			context: "adaptive-questions",
		});
		const normalizedConfig = ConfigManager.normalizeConfig(config);

		if (!normalizedConfig) {
			throw new Error("Failed to normalize AI config");
		}

		try {
			const response = await getChatCompletion(messages, {
				config: normalizedConfig,
				userId: user.id,
				feature: "workflow-adaptive-questions",
			} as ChatCompletionOptions);

			const jsonMatch = response.content.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error("No JSON found in AI response");
			}

			const parsed = JSON.parse(jsonMatch[0]) as {
				questions: AdaptiveQuestion[];
			};

			return {
				success: true as const,
				questions: parsed.questions ?? [],
			};
		} catch (err) {
			logger.error(ctx, "Failed to generate adaptive questions: %o", err);
			return {
				success: true as const,
				questions: [] as AdaptiveQuestion[],
			};
		}
	},
	{
		schema: GenerateAdaptiveQuestionsSchema,
		auth: true,
	},
);
