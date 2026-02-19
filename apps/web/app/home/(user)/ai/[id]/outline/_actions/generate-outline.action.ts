"use server";

import {
	ConfigManager,
	type ChatMessage,
	type ChatCompletionOptions,
	createOpenAIOnlyConfig,
	getChatCompletion,
} from "@kit/ai-gateway";
import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";

import type { OutlineSection } from "../../_lib/types/outline.types";

const GenerateOutlineSchema = z.object({
	presentationId: z.string().min(1),
	forceRegenerate: z.boolean().default(false),
});

export const generateOutlineAction = enhanceAction(
	async (data, user) => {
		const logger = await getLogger();
		const client = getSupabaseServerClient();

		// Fetch assemble_outputs for this presentation
		const { data: assembleOutput, error: assembleError } = await client
			.from("assemble_outputs")
			.select(
				"situation, complication, question_type, presentation_type, argument_map",
			)
			.eq("presentation_id", data.presentationId)
			.maybeSingle();

		if (assembleError) {
			logger.error("Failed to fetch assemble outputs", {
				presentationId: data.presentationId,
				error: assembleError,
			});
			throw new Error("Failed to fetch assemble outputs");
		}

		if (!assembleOutput) {
			throw new Error(
				"No assemble output found. Complete the assemble step first.",
			);
		}

		// Check if outline already exists (unless force regenerating)
		if (!data.forceRegenerate) {
			const { data: existing } = await client
				.from("outline_contents")
				.select("id, sections")
				.eq("presentation_id", data.presentationId)
				.maybeSingle();

			if (existing) {
				const sections = (existing.sections ??
					[]) as unknown as OutlineSection[];
				if (sections.length > 0) {
					return { success: true, data: { sections } };
				}
			}
		}

		// Build AI prompt
		const systemPrompt = `You are a presentation outline architect. Given a presentation's situation, complication, and answer (SCA framework), generate a structured outline with clear sections.

Each section should have a title and a body with key talking points as bullet points.

Return ONLY valid JSON in this exact format:
{
  "sections": [
    {
      "id": "section-1",
      "title": "Section Title",
      "body": { "type": "doc", "content": [{ "type": "bulletList", "content": [{ "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Key point here" }] }] }] }] },
      "order": 0
    }
  ]
}

Guidelines:
- Generate 4-7 sections for a typical presentation
- First section should be an introduction/hook
- Middle sections cover the situation, complication, and answer
- Last section should be a conclusion/call-to-action
- Each section body should have 2-4 bullet points as TipTap JSON
- Keep titles concise and descriptive`;

		const userPrompt = `Create a presentation outline from this SCA framework:

**Presentation Type:** ${assembleOutput.presentation_type}
**Question Type:** ${assembleOutput.question_type}

**Situation:** ${assembleOutput.situation || "Not provided"}

**Complication:** ${assembleOutput.complication || "Not provided"}

**Argument Map:** ${assembleOutput.argument_map ? JSON.stringify(assembleOutput.argument_map) : "Not provided"}

Generate a structured outline with sections that flow logically from the situation through complications to the answer/recommendation.`;

		const messages: ChatMessage[] = [
			{ role: "system", content: systemPrompt },
			{ role: "user", content: userPrompt },
		];

		const config = createOpenAIOnlyConfig({
			userId: user.id,
			context: "outline-generation",
		});
		const normalizedConfig = ConfigManager.normalizeConfig(config);

		if (!normalizedConfig) {
			throw new Error("Failed to normalize AI config");
		}

		const response = await getChatCompletion(messages, {
			config: normalizedConfig,
			userId: user.id,
			feature: "workflow-outline-generation",
		} as ChatCompletionOptions);

		// Parse AI response
		let sections: OutlineSection[];
		try {
			const jsonMatch = response.content.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error("No JSON found in AI response");
			}
			const parsed = JSON.parse(jsonMatch[0]);
			sections = parsed.sections;
		} catch (parseError) {
			logger.error("Failed to parse AI outline response", {
				presentationId: data.presentationId,
				responseContent: response.content.substring(0, 500),
				error: parseError,
			});
			// Fallback: create a basic outline
			sections = [
				{
					id: "section-1",
					title: "Introduction",
					body: {
						type: "doc",
						content: [
							{
								type: "paragraph",
								content: [
									{
										type: "text",
										text:
											assembleOutput.situation ||
											"Set the context for your audience",
									},
								],
							},
						],
					},
					order: 0,
				},
				{
					id: "section-2",
					title: "The Challenge",
					body: {
						type: "doc",
						content: [
							{
								type: "paragraph",
								content: [
									{
										type: "text",
										text:
											assembleOutput.complication ||
											"Describe the key challenge",
									},
								],
							},
						],
					},
					order: 1,
				},
				{
					id: "section-3",
					title: "Recommendation",
					body: {
						type: "doc",
						content: [
							{
								type: "paragraph",
								content: [
									{ type: "text", text: "Present your recommended approach" },
								],
							},
						],
					},
					order: 2,
				},
			];
		}

		// Fetch presentation for user/account context
		const { data: presentation } = await client
			.from("presentations")
			.select("user_id, account_id")
			.eq("id", data.presentationId)
			.single();

		if (!presentation) {
			throw new Error("Presentation not found");
		}

		// Upsert outline_contents
		if (data.forceRegenerate) {
			const { error: updateError } = await client
				.from("outline_contents")
				.update({
					sections: JSON.parse(JSON.stringify(sections)),
					updated_at: new Date().toISOString(),
				})
				.eq("presentation_id", data.presentationId);

			if (updateError) {
				// If no row exists yet, insert instead
				const { error: insertError } = await client
					.from("outline_contents")
					.insert({
						presentation_id: data.presentationId,
						user_id: presentation.user_id,
						account_id: presentation.account_id,
						sections: JSON.parse(JSON.stringify(sections)),
					});

				if (insertError) throw insertError;
			}
		} else {
			// Insert new record
			const { error: insertError } = await client
				.from("outline_contents")
				.upsert(
					{
						presentation_id: data.presentationId,
						user_id: presentation.user_id,
						account_id: presentation.account_id,
						sections: JSON.parse(JSON.stringify(sections)),
					},
					{ onConflict: "presentation_id" },
				);

			if (insertError) throw insertError;
		}

		logger.info("Outline generated successfully", {
			presentationId: data.presentationId,
			sectionCount: sections.length,
			cost: response.metadata.cost,
		});

		return {
			success: true,
			data: { sections },
		};
	},
	{
		schema: GenerateOutlineSchema,
		auth: true,
	},
);
