"use server";

import { type ChatMessage, getChatCompletion } from "@kit/ai-gateway";
import { createQualityOptimizedConfig } from "@kit/ai-gateway/src/configs/templates";
import { baseInstructions } from "@kit/ai-gateway/src/prompts/partials/base-instructions";
import { improvementFormat } from "@kit/ai-gateway/src/prompts/partials/improvement-format";
import { outlineRewriteInstructions } from "@kit/ai-gateway/src/prompts/partials/outline-rewrite";
import { enhanceAction } from "@kit/next/actions";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";

import { lexicalToTiptap } from "../_components/editor/tiptap/utils/format-conversion";

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
}

function parseTiptapDocument(content: string | null): TiptapDocument {
	if (!content) {
		return {
			type: "doc",
			content: [],
		};
	}

	try {
		// Try to parse as Tiptap first
		const parsed = JSON.parse(content);

		// Check if it's already in Tiptap format
		if (parsed.type === "doc" && Array.isArray(parsed.content)) {
			return parsed as TiptapDocument;
		}

		// If not, try to convert from Lexical format
		return lexicalToTiptap(content);
	} catch {
		return {
			type: "doc",
			content: [],
		};
	}
}

function getTextContent(doc: TiptapDocument): string {
	const extractText = (node: TiptapNode): string => {
		if (node.type === "text" && node.text) {
			return node.text;
		}

		if (node.content && node.content.length > 0) {
			return node.content.map(extractText).join("");
		}

		return "";
	};

	return doc.content
		.map(extractText)
		.filter((text) => text.trim().length > 0)
		.join("\n");
}

const OutlineSuggestionsSchema = z.object({
	submissionId: z.string().min(1, "Submission ID is required"),
});

export const getOutlineSuggestionsAction = enhanceAction(
	async (data, user) => {
		try {
			const supabase = getSupabaseServerClient();

			// Use existing query to get all content
			const { data: submission, error } = await supabase
				.from("building_blocks_submissions")
				.select("situation, complication, answer")
				.eq("id", data.submissionId)
				.single();

			if (error || !submission) {
				throw new Error("Failed to fetch submission data");
			}

			// Create a quality-optimized config for structured output
			const config = createQualityOptimizedConfig({
				userId: user.id,
				context: "outline-suggestions",
			});

			// Parse Tiptap documents and extract text content
			const situationContent = getTextContent(
				parseTiptapDocument(submission.situation),
			);
			const complicationContent = getTextContent(
				parseTiptapDocument(submission.complication),
			);
			const answerContent = getTextContent(
				parseTiptapDocument(submission.answer),
			);

			// Combine all SCQA content for context
			const messages: ChatMessage[] = [
				{
					role: "system",
					content: `${baseInstructions}\n\n${outlineRewriteInstructions}`,
				},
				{
					role: "user",
					content: `Current Content:
Situation:
${situationContent}

Complication:
${complicationContent}

Answer:
${answerContent}

${improvementFormat}`,
				},
			];

			const result = await getChatCompletion(messages, {
				config,
				userId: user.id,
				feature: "outline-suggestions",
				sessionId: data.submissionId,
			});

			// Parse the JSON response
			const suggestions = JSON.parse(result.content);

			return {
				success: true,
				data: suggestions,
			};
		} catch (error) {
			// TODO: Async logger needed
			// TODO: Async logger needed
			// (await getLogger()).error(
			// 	"Error in outline suggestions action:",
			// 	{ data: error }
			);

			return {
				success: false,
				error: error instanceof Error ? error.message : "An error occurred",
			};
		}
	},
	{
		auth: true,
		schema: OutlineSuggestionsSchema,
	},
);
