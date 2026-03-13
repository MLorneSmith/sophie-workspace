"use server";

import { type ChatMessage, getChatCompletion } from "@kit/ai-gateway";
import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "~/lib/database.types";
import {
	type ArgumentMapNode,
	ArgumentMapNodeSchema,
	GenerateOutlineSchema,
	LLMOutlineResponseSchema,
} from "~/home/(user)/ai/_lib/schemas/presentation-artifacts";

interface TiptapNode {
	type: string;
	content?: TiptapNode[];
	attrs?: Record<string, unknown>;
	marks?: { type: string }[];
	text?: string;
}

interface TiptapDocument {
	type: string;
	content: TiptapNode[];
	meta?: Record<string, unknown>;
}

const SPACER_PARAGRAPH: TiptapNode = {
	type: "paragraph",
	content: [{ type: "text", text: " " }],
};

function hasValidText(node: TiptapNode): boolean {
	if (
		(node.type === "paragraph" || node.type === "heading") &&
		node.content &&
		node.content.length > 0
	) {
		return node.content.some(
			(child) =>
				child.type === "text" &&
				typeof child.text === "string" &&
				child.text.trim().length > 0,
		);
	}

	if (
		node.type === "bulletList" ||
		node.type === "orderedList" ||
		node.type === "listItem" ||
		node.type === "blockquote" ||
		node.type === "codeBlock" ||
		node.type === "table"
	) {
		return true;
	}

	return false;
}

function normalizeNode(node: TiptapNode): TiptapNode {
	if (node.type === "text" && (!node.text || node.text === "")) {
		node.text = " ";
	}

	if (
		node.type === "paragraph" &&
		(!node.content || node.content.length === 0)
	) {
		node.content = [{ type: "text", text: " " }];
	}

	if (node.type === "bulletList" || node.type === "orderedList") {
		if (!node.content || node.content.length === 0) {
			node.content = [
				{
					type: "listItem",
					content: [
						{ type: "paragraph", content: [{ type: "text", text: " " }] },
					],
				},
			];
		} else {
			node.content = node.content.map((item) => {
				if (!item || item.type !== "listItem") {
					return {
						type: "listItem",
						content: [
							{ type: "paragraph", content: [{ type: "text", text: " " }] },
						],
					};
				}
				return normalizeNode(item);
			});
		}
	}

	if (node.type === "listItem") {
		if (!node.content || node.content.length === 0) {
			node.content = [
				{ type: "paragraph", content: [{ type: "text", text: " " }] },
			];
		} else if (node.content[0] && node.content[0].type !== "paragraph") {
			node.content = [
				{
					type: "paragraph",
					content: [node.content[0] || { type: "text", text: " " }],
				},
			];
		}
	}

	if (node.content && Array.isArray(node.content)) {
		node.content = node.content.map((childNode) =>
			childNode
				? normalizeNode(childNode)
				: { type: "paragraph", content: [{ type: "text", text: " " }] },
		);
	}

	return node;
}

function normalizeOutlineContent(content: TiptapDocument): TiptapDocument {
	const result: TiptapDocument = JSON.parse(JSON.stringify(content));

	if (result.content && Array.isArray(result.content)) {
		result.content = result.content.map((node: TiptapNode | undefined) =>
			node
				? normalizeNode(node)
				: { type: "paragraph", content: [{ type: "text", text: " " }] },
		);
	}

	return result;
}

function textToTiptapNodes(text: string): TiptapNode[] {
	if (!text || text.trim().length === 0) return [];

	return text.split("\n").map((line) => ({
		type: "paragraph",
		content: line.trim()
			? [{ type: "text", text: line }]
			: [{ type: "text", text: " " }],
	}));
}

export const generateOutlineAction = enhanceAction(
	async (data, _user) => {
		const logger = await getLogger();
		const client = getSupabaseServerClient<Database>();

		// Check if outline already exists and has content (unless force regenerating)
		if (!data.forceRegenerate) {
			const { data: existing } = await client
				.from("outline_contents")
				.select("id, sections")
				.eq("presentation_id", data.presentationId)
				.order("created_at", { ascending: false })
				.limit(1)
				.maybeSingle();

			if (existing?.sections) {
				const doc = existing.sections as unknown as TiptapDocument;
				if (
					doc.type === "doc" &&
					Array.isArray(doc.content) &&
					doc.content.length > 1
				) {
					return { success: true, data: doc };
				}
			}
		}

		// Fetch assemble_outputs for this presentation
		const { data: assembleOutput, error: assembleError } = await client
			.from("assemble_outputs")
			.select(
				"situation, complication, presentation_type, question_type, argument_map",
			)
			.eq("presentation_id", data.presentationId)
			.order("created_at", { ascending: false })
			.limit(1)
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

		// Check for uploaded deck materials (RAG context)
		const { data: materials } = await client
			.from("materials")
			.select("id, name, file_url, mime_type, content")
			.eq("presentation_id", data.presentationId)
			.eq("type", "upload")
			.maybeSingle();

		// If there's a deck upload, use LLM-powered generation with RAG context
		if (materials?.file_url) {
			logger.info("Using LLM-powered outline generation with deck context", {
				presentationId: data.presentationId,
				materialId: materials.id,
				fileName: materials.name,
			});

			return await generateOutlineWithRAG(
				logger,
				client,
				data.presentationId,
				assembleOutput,
				materials,
				_user,
			);
		}

		// Parse situation, complication text into TipTap nodes
		const situationNodes = textToTiptapNodes(assembleOutput.situation || "");
		const complicationNodes = textToTiptapNodes(
			assembleOutput.complication || "",
		);

		// Parse argument_map to extract answer content using ArgumentMapNodeSchema
		let answerNodes: TiptapNode[] = [];
		if (assembleOutput.argument_map) {
			const parseResult = ArgumentMapNodeSchema.safeParse(
				assembleOutput.argument_map,
			);

			if (parseResult.success) {
				const root = parseResult.data;
				// Main argument comes from root.text (the top-level claim)
				if (root.text?.trim()) {
					answerNodes = textToTiptapNodes(root.text);
				}

				// Supporting points come from root.children
				if (root.children && root.children.length > 0) {
					const supportingPoints = root.children
						.map((child: ArgumentMapNode) => child.text)
						.filter(
							(text: string | undefined): text is string =>
								typeof text === "string" && text.trim().length > 0,
						);

					if (supportingPoints.length > 0) {
						answerNodes.push({
							type: "bulletList",
							content: supportingPoints.map((point: string) => ({
								type: "listItem",
								content: [
									{
										type: "paragraph",
										content: [{ type: "text", text: point }],
									},
								],
							})),
						});
					}
				}
			} else {
				logger.warn("Failed to parse argument_map with ArgumentMapNodeSchema", {
					presentationId: data.presentationId,
					errors: parseResult.error.issues,
				});
			}
		}

		// Build combined TipTap document (same structure as old canvas outline)
		const outlineContent: TiptapDocument = {
			type: "doc",
			content: [
				// H1: Presentation Outline
				{
					type: "heading",
					attrs: { level: 1 },
					content: [{ type: "text", text: "Presentation Outline" }],
				},
				SPACER_PARAGRAPH,

				// Situation section
				...(situationNodes.some(hasValidText)
					? [
							{
								type: "heading" as const,
								attrs: { level: 2 },
								content: [{ type: "text" as const, text: "Situation" }],
							},
							SPACER_PARAGRAPH,
							...situationNodes,
							SPACER_PARAGRAPH,
						]
					: []),

				// Complication section
				...(complicationNodes.some(hasValidText)
					? [
							{
								type: "heading" as const,
								attrs: { level: 2 },
								content: [{ type: "text" as const, text: "Complication" }],
							},
							SPACER_PARAGRAPH,
							...complicationNodes,
							SPACER_PARAGRAPH,
						]
					: []),

				// Answer section
				...(answerNodes.some(hasValidText)
					? [
							{
								type: "heading" as const,
								attrs: { level: 2 },
								content: [{ type: "text" as const, text: "Answer" }],
							},
							SPACER_PARAGRAPH,
							...answerNodes,
						]
					: []),
			],
		};

		// Normalize the content
		const normalizedContent = normalizeOutlineContent(outlineContent);

		// Add metadata
		const finalContent: TiptapDocument = {
			...normalizedContent,
			meta: {
				sectionType: "outline",
				timestamp: new Date().toISOString(),
				version: "1.0",
			},
		};

		// Fetch presentation for user/account context
		const { data: presentation } = await client
			.from("presentations")
			.select("user_id, account_id")
			.eq("id", data.presentationId)
			.single();

		if (!presentation) {
			throw new Error("Presentation not found");
		}

		// Upsert outline_contents (store full TipTap document in sections JSONB)
		const { error: upsertError } = await client.from("outline_contents").upsert(
			{
				presentation_id: data.presentationId,
				user_id: presentation.user_id,
				account_id: presentation.account_id,
				sections: JSON.parse(JSON.stringify(finalContent)),
			},
			{ onConflict: "presentation_id" },
		);

		if (upsertError) throw upsertError;

		logger.info("Outline assembled successfully", {
			presentationId: data.presentationId,
			nodeCount: finalContent.content.length,
		});

		return {
			success: true,
			data: finalContent,
		};
	},
	{
		schema: GenerateOutlineSchema,
		auth: true,
	},
);

/**
 * Generate outline using LLM with deck content as RAG context.
 * This is used when the user has uploaded a deck file.
 */
async function generateOutlineWithRAG(
	logger: Awaited<ReturnType<typeof getLogger>>,
	client: SupabaseClient<Database>,
	presentationId: string,
	assembleOutput: {
		situation: string | null;
		complication: string | null;
		presentation_type: string | null;
		question_type: string | null;
		argument_map: Json | null;
	},
	materials: {
		id: string;
		name: string;
		file_url: string | null;
		mime_type: string | null;
		content: string | null;
	},
	_user: { id: string },
) {
	// Build context from assemble outputs
	const scqaContext = [
		assembleOutput.situation
			? `Situation: ${assembleOutput.situation}`
			: "Situation: Not provided",
		assembleOutput.complication
			? `Complication: ${assembleOutput.complication}`
			: "Complication: Not provided",
		assembleOutput.question_type
			? `Question type: ${assembleOutput.question_type}`
			: "Question type: Not provided",
		assembleOutput.presentation_type
			? `Presentation type: ${assembleOutput.presentation_type}`
			: "Presentation type: Not provided",
	].join("\n");

	// Build argument map context
	const argumentMapText = assembleOutput.argument_map
		? JSON.stringify(assembleOutput.argument_map, null, 2)
		: "No argument map provided";

	// Build system prompt with RAG context
	const systemPrompt = `You are a presentation outline generator. Given SCQA context, argument map, and an optional uploaded deck reference, generate a structured presentation outline.

The uploaded deck (${materials.name}) provides additional context. Reference its structure and content when creating the outline.

Do not wrap in markdown code fences. Return ONLY valid JSON in this exact format:
{
  "sections": [
    {
      "title": "Section Title",
      "content": "Section content description"
    }
  ]
}

Guidelines:
- Use SCQA (Situation, Complication, Question, Answer) structure
- Reference the uploaded deck's structure when relevant
- Create 3-5 main sections that flow logically
- Include situation and complication as foundational sections
- End with actionable answer sections`;

	const userPrompt = `SCQA Context:
${scqaContext}

Argument Map:
${argumentMapText}

Uploaded Deck: ${materials.name}
Deck URL: ${materials.file_url ?? "N/A"}
${materials.content ? `Extracted Content:\n${materials.content}` : "Note: Full deck content extraction pending - use deck structure as reference"}

Generate a presentation outline.`;

	const messages: ChatMessage[] = [
		{ role: "system", content: systemPrompt },
		{ role: "user", content: userPrompt },
	];

	const response = await getChatCompletion(messages, {
		model:
			process.env.BIFROST_MODEL_WORKFLOW_OUTLINE ?? "claude-sonnet-4-20250514",
		virtualKey: process.env.BIFROST_VK_WORKFLOW_OUTLINE,
	});

	const content = response.content;
	if (!content) {
		throw new Error("Failed to generate outline with LLM");
	}

	// Strip markdown code fences if present
	const strippedContent = content
		.replace(/^```(?:json)?\n?/, "")
		.replace(/```$/, "")
		.trim();

	// Parse and validate the JSON response
	let parsed: unknown;
	try {
		parsed = JSON.parse(strippedContent);
	} catch {
		logger.error("Failed to parse LLM response as JSON", {
			presentationId,
			response: strippedContent,
		});
		throw new Error("Invalid response from AI");
	}

	// Validate response structure with Zod
	const validationResult = LLMOutlineResponseSchema.safeParse(parsed);
	if (!validationResult.success) {
		logger.error("LLM response validation failed", {
			presentationId,
			errors: validationResult.error.issues,
			response: strippedContent,
		});
		throw new Error("Invalid outline structure from AI");
	}

	const sections = validationResult.data.sections;

	// Convert sections to TipTap document format
	const outlineContent: TiptapDocument = {
		type: "doc",
		content: [
			{
				type: "heading",
				attrs: { level: 1 },
				content: [{ type: "text", text: "Presentation Outline" }],
			},
			SPACER_PARAGRAPH,
			...sections.flatMap((section: { title: string; content: string }) => [
				{
					type: "heading" as const,
					attrs: { level: 2 },
					content: [{ type: "text" as const, text: section.title }],
				},
				SPACER_PARAGRAPH,
				...textToTiptapNodes(section.content),
				SPACER_PARAGRAPH,
			]),
		],
	};

	const normalizedContent = normalizeOutlineContent(outlineContent);

	const finalContent: TiptapDocument = {
		...normalizedContent,
		meta: {
			sectionType: "outline",
			timestamp: new Date().toISOString(),
			version: "1.0",
			ragEnabled: true,
			materialId: materials.id,
		},
	};

	// Fetch presentation for user/account context
	const { data: presentation } = await client
		.from("presentations")
		.select("user_id, account_id")
		.eq("id", presentationId)
		.single();

	if (!presentation) {
		throw new Error("Presentation not found");
	}

	// Upsert outline_contents
	const { error: upsertError } = await client.from("outline_contents").upsert(
		{
			presentation_id: presentationId,
			user_id: presentation.user_id,
			account_id: presentation.account_id,
			sections: JSON.parse(JSON.stringify(finalContent)),
		},
		{ onConflict: "presentation_id" },
	);

	if (upsertError) throw upsertError;

	logger.info("Outline generated with RAG context", {
		presentationId,
		materialId: materials.id,
		sectionCount: sections.length,
	});

	return {
		success: true,
		data: finalContent,
	};
}
