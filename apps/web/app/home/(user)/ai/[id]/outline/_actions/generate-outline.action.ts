"use server";

import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";

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

const GenerateOutlineSchema = z.object({
	presentationId: z.string().min(1),
	forceRegenerate: z.boolean().default(false),
});

export const generateOutlineAction = enhanceAction(
	async (data, _user) => {
		const logger = await getLogger();
		const client = getSupabaseServerClient();

		// Check if outline already exists and has content (unless force regenerating)
		if (!data.forceRegenerate) {
			const { data: existing } = await client
				.from("outline_contents")
				.select("id, sections")
				.eq("presentation_id", data.presentationId)
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

		// Parse situation, complication text into TipTap nodes
		const situationNodes = textToTiptapNodes(assembleOutput.situation || "");
		const complicationNodes = textToTiptapNodes(
			assembleOutput.complication || "",
		);

		// Parse argument_map to extract answer content
		let answerNodes: TiptapNode[] = [];
		if (assembleOutput.argument_map) {
			const argMap = assembleOutput.argument_map as Record<string, unknown>;
			if (typeof argMap === "object" && argMap !== null) {
				// Try to extract text from argument_map structure
				const mainArg = (argMap.main_argument || argMap.answer || "") as string;
				if (typeof mainArg === "string" && mainArg.trim()) {
					answerNodes = textToTiptapNodes(mainArg);
				}

				// Also include supporting points if available
				const supporting = argMap.supporting_points as string[] | undefined;
				if (Array.isArray(supporting) && supporting.length > 0) {
					answerNodes.push({
						type: "bulletList",
						content: supporting
							.filter(
								(p): p is string =>
									typeof p === "string" && p.trim().length > 0,
							)
							.map((point) => ({
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
