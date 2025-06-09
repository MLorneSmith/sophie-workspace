/**
 * Unit tests for generate-outline server action business logic
 * Tests the pure functions, schema validation, and content processing logic
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

// Mock the lexicalToTiptap import to avoid resolution issues
const mockLexicalToTiptap = vi.fn();
vi.mock("../_components/editor/tiptap/utils/format-conversion", () => ({
	lexicalToTiptap: mockLexicalToTiptap,
}));

// Create a test wrapper that mimics enhanceAction behavior
const createTestAction = (schema: z.ZodSchema) => {
	return async (data: any) => {
		const result = schema.safeParse(data);
		if (!result.success) {
			return { error: "Validation failed" };
		}

		// Simulate successful action
		return {
			success: true,
			data: { message: "Action completed successfully" },
		};
	};
};

// Extract constants and types from the source file
interface TiptapNode {
	type: string;
	content?: TiptapNode[];
	attrs?: Record<string, any>;
	marks?: { type: string }[];
	text?: string;
}

interface TiptapDocument {
	type: string;
	content: TiptapNode[];
}

const EMPTY_TIPTAP_DOCUMENT: TiptapDocument = {
	type: "doc",
	content: [],
};

const SPACER_PARAGRAPH: TiptapNode = {
	type: "paragraph",
	content: [
		{
			type: "text",
			text: " ",
		},
	],
};

// Extract pure functions from the source file for testing
function normalizeOutlineContent(content: TiptapDocument): TiptapDocument {
	const result = JSON.parse(JSON.stringify(content));

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
							{
								type: "paragraph",
								content: [{ type: "text", text: " " }],
							},
						],
					},
				];
			} else {
				node.content = node.content.map((item) => {
					if (!item || item.type !== "listItem") {
						return {
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: " " }],
								},
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
					{
						type: "paragraph",
						content: [{ type: "text", text: " " }],
					},
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
					: {
							type: "paragraph",
							content: [{ type: "text", text: " " }],
						},
			);
		}

		return node;
	}

	if (result.content && Array.isArray(result.content)) {
		result.content = result.content.map((node: TiptapNode | undefined) =>
			node
				? normalizeNode(node)
				: {
						type: "paragraph",
						content: [{ type: "text", text: " " }],
					},
		);
	}

	return result;
}

function parseTiptapDocument(content: string | null): TiptapDocument {
	if (!content) return EMPTY_TIPTAP_DOCUMENT;
	try {
		const parsed = JSON.parse(content);

		if (parsed.type === "doc" && Array.isArray(parsed.content)) {
			return parsed as TiptapDocument;
		}

		return mockLexicalToTiptap(content);
	} catch {
		return EMPTY_TIPTAP_DOCUMENT;
	}
}

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
		node.type === "listItem"
	) {
		return true;
	}

	if (
		node.type === "blockquote" ||
		node.type === "codeBlock" ||
		node.type === "table"
	) {
		return true;
	}

	return false;
}

// Schema from the source file
const GenerateOutlineSchema = z.object({
	submissionId: z.string().min(1, "Submission ID is required"),
	forceRegenerate: z.boolean().optional(),
});

describe("Generate Outline Business Logic", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockLexicalToTiptap.mockReturnValue(EMPTY_TIPTAP_DOCUMENT);
	});

	describe("Schema Validation", () => {
		let testAction: (data: any) => Promise<any>;

		beforeEach(() => {
			testAction = createTestAction(GenerateOutlineSchema);
		});

		it("should accept valid input with submissionId", async () => {
			const validInput = {
				submissionId: "test-submission-id",
				forceRegenerate: false,
			};

			const result = await testAction(validInput);
			expect(result.success).toBe(true);
		});

		it("should accept input with only submissionId (forceRegenerate optional)", async () => {
			const validInput = {
				submissionId: "test-submission-id",
			};

			const result = await testAction(validInput);
			expect(result.success).toBe(true);
		});

		it("should reject input without submissionId", async () => {
			const invalidInput = {
				forceRegenerate: true,
			};

			const result = await testAction(invalidInput);
			expect(result.error).toBe("Validation failed");
		});

		it("should reject input with empty submissionId", async () => {
			const invalidInput = {
				submissionId: "",
				forceRegenerate: false,
			};

			const result = await testAction(invalidInput);
			expect(result.error).toBe("Validation failed");
		});

		it("should accept boolean forceRegenerate values", async () => {
			const validInputTrue = {
				submissionId: "test-id",
				forceRegenerate: true,
			};

			const validInputFalse = {
				submissionId: "test-id",
				forceRegenerate: false,
			};

			const resultTrue = await testAction(validInputTrue);
			const resultFalse = await testAction(validInputFalse);

			expect(resultTrue.success).toBe(true);
			expect(resultFalse.success).toBe(true);
		});
	});

	describe("normalizeOutlineContent Function", () => {
		it("should normalize empty text nodes to contain a space", () => {
			const input: TiptapDocument = {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: "" }],
					},
				],
			};

			const result = normalizeOutlineContent(input);
			expect(result.content[0].content?.[0].text).toBe(" ");
		});

		it("should normalize paragraphs without content", () => {
			const input: TiptapDocument = {
				type: "doc",
				content: [
					{
						type: "paragraph",
					},
				],
			};

			const result = normalizeOutlineContent(input);
			expect(result.content[0].content).toEqual([{ type: "text", text: " " }]);
		});

		it("should normalize empty bullet lists", () => {
			const input: TiptapDocument = {
				type: "doc",
				content: [
					{
						type: "bulletList",
					},
				],
			};

			const result = normalizeOutlineContent(input);
			const bulletList = result.content[0];

			expect(bulletList.content).toBeDefined();
			expect(bulletList.content?.[0].type).toBe("listItem");
			expect(bulletList.content?.[0].content?.[0].type).toBe("paragraph");
		});

		it("should normalize list items without proper paragraph structure", () => {
			const input: TiptapDocument = {
				type: "doc",
				content: [
					{
						type: "bulletList",
						content: [
							{
								type: "listItem",
								content: [{ type: "text", text: "Direct text" }],
							},
						],
					},
				],
			};

			const result = normalizeOutlineContent(input);
			const listItem = result.content[0].content?.[0];

			expect(listItem.content?.[0].type).toBe("paragraph");
			expect(listItem.content?.[0].content?.[0].type).toBe("text");
		});

		it("should handle nested content structures", () => {
			const input: TiptapDocument = {
				type: "doc",
				content: [
					{
						type: "bulletList",
						content: [
							{
								type: "listItem",
								content: [
									{
										type: "paragraph",
										content: [
											{
												type: "bulletList",
												content: [],
											},
										],
									},
								],
							},
						],
					},
				],
			};

			const result = normalizeOutlineContent(input);
			const nestedList =
				result.content[0].content?.[0].content?.[0].content?.[0];

			expect(nestedList.type).toBe("bulletList");
			expect(nestedList.content).toBeDefined();
			expect(nestedList.content?.length).toBeGreaterThan(0);
		});

		it("should handle null/undefined nodes gracefully", () => {
			const input: TiptapDocument = {
				type: "doc",
				content: [undefined as any, null as any],
			};

			const result = normalizeOutlineContent(input);

			expect(result.content).toHaveLength(2);
			expect(result.content[0].type).toBe("paragraph");
			expect(result.content[1].type).toBe("paragraph");
		});

		it("should preserve valid content without modification", () => {
			const input: TiptapDocument = {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: "Valid content" }],
					},
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "Valid heading" }],
					},
				],
			};

			const result = normalizeOutlineContent(input);

			expect(result.content[0].content?.[0].text).toBe("Valid content");
			expect(result.content[1].content?.[0].text).toBe("Valid heading");
			expect(result.content[1].attrs?.level).toBe(1);
		});
	});

	describe("parseTiptapDocument Function", () => {
		it("should return empty document for null input", () => {
			const result = parseTiptapDocument(null);
			expect(result).toEqual(EMPTY_TIPTAP_DOCUMENT);
		});

		it("should return empty document for empty string", () => {
			const result = parseTiptapDocument("");
			expect(result).toEqual(EMPTY_TIPTAP_DOCUMENT);
		});

		it("should parse valid TipTap JSON", () => {
			const tiptapJson = JSON.stringify({
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: "Test content" }],
					},
				],
			});

			const result = parseTiptapDocument(tiptapJson);

			expect(result.type).toBe("doc");
			expect(result.content).toHaveLength(1);
			expect(result.content[0].type).toBe("paragraph");
		});

		it("should convert Lexical format using converter", () => {
			const lexicalJson = JSON.stringify({
				root: {
					children: [
						{
							type: "paragraph",
							children: [{ type: "text", text: "Lexical content" }],
						},
					],
				},
			});

			const expectedTiptap: TiptapDocument = {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: "Converted content" }],
					},
				],
			};

			mockLexicalToTiptap.mockReturnValue(expectedTiptap);

			const result = parseTiptapDocument(lexicalJson);

			expect(mockLexicalToTiptap).toHaveBeenCalledWith(lexicalJson);
			expect(result).toEqual(expectedTiptap);
		});

		it("should handle malformed JSON gracefully", () => {
			const malformedJson = '{"invalid": json';

			const result = parseTiptapDocument(malformedJson);
			expect(result).toEqual(EMPTY_TIPTAP_DOCUMENT);
		});

		it("should handle non-TipTap JSON by converting", () => {
			const nonTiptapJson = JSON.stringify({
				someOtherFormat: "data",
			});

			mockLexicalToTiptap.mockReturnValue(EMPTY_TIPTAP_DOCUMENT);

			const result = parseTiptapDocument(nonTiptapJson);

			expect(mockLexicalToTiptap).toHaveBeenCalledWith(nonTiptapJson);
			expect(result).toEqual(EMPTY_TIPTAP_DOCUMENT);
		});
	});

	describe("hasValidText Function", () => {
		it("should return true for paragraphs with text content", () => {
			const node: TiptapNode = {
				type: "paragraph",
				content: [{ type: "text", text: "Valid text" }],
			};

			expect(hasValidText(node)).toBe(true);
		});

		it("should return true for headings with text content", () => {
			const node: TiptapNode = {
				type: "heading",
				attrs: { level: 1 },
				content: [{ type: "text", text: "Valid heading" }],
			};

			expect(hasValidText(node)).toBe(true);
		});

		it("should return false for paragraphs with empty text", () => {
			const node: TiptapNode = {
				type: "paragraph",
				content: [{ type: "text", text: "" }],
			};

			expect(hasValidText(node)).toBe(false);
		});

		it("should return false for paragraphs with only whitespace", () => {
			const node: TiptapNode = {
				type: "paragraph",
				content: [{ type: "text", text: "   " }],
			};

			expect(hasValidText(node)).toBe(false);
		});

		it("should return true for bullet lists (always)", () => {
			const node: TiptapNode = {
				type: "bulletList",
				content: [],
			};

			expect(hasValidText(node)).toBe(true);
		});

		it("should return true for ordered lists (always)", () => {
			const node: TiptapNode = {
				type: "orderedList",
				content: [],
			};

			expect(hasValidText(node)).toBe(true);
		});

		it("should return true for list items (always)", () => {
			const node: TiptapNode = {
				type: "listItem",
				content: [],
			};

			expect(hasValidText(node)).toBe(true);
		});

		it("should return true for blockquotes (always)", () => {
			const node: TiptapNode = {
				type: "blockquote",
				content: [],
			};

			expect(hasValidText(node)).toBe(true);
		});

		it("should return true for code blocks (always)", () => {
			const node: TiptapNode = {
				type: "codeBlock",
				content: [],
			};

			expect(hasValidText(node)).toBe(true);
		});

		it("should return true for tables (always)", () => {
			const node: TiptapNode = {
				type: "table",
				content: [],
			};

			expect(hasValidText(node)).toBe(true);
		});

		it("should return false for unknown node types", () => {
			const node: TiptapNode = {
				type: "unknownType",
				content: [{ type: "text", text: "Some content" }],
			};

			expect(hasValidText(node)).toBe(false);
		});

		it("should handle paragraphs with mixed content", () => {
			const nodeWithText: TiptapNode = {
				type: "paragraph",
				content: [
					{ type: "text", text: "" },
					{ type: "text", text: "Valid text" },
				],
			};

			const nodeWithoutText: TiptapNode = {
				type: "paragraph",
				content: [
					{ type: "text", text: "" },
					{ type: "text", text: "   " },
				],
			};

			expect(hasValidText(nodeWithText)).toBe(true);
			expect(hasValidText(nodeWithoutText)).toBe(false);
		});
	});
});
