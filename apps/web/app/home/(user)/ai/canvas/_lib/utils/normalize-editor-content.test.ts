/**
 * Unit tests for normalize-editor-content.ts
 * Tests content normalization, parsing, and validation for editor content
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
	EditorContentTypes,
	TiptapDocument,
} from "../../_types/editor-types";
import { normalizeEditorContent } from "./normalize-editor-content";

describe("normalizeEditorContent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Mock Date.now for consistent timestamps in tests
		vi.spyOn(Date.prototype, "toISOString").mockReturnValue(
			"2024-01-01T00:00:00.000Z",
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Core Functionality - Main Function", () => {
		it("should normalize valid TiptapDocument and add metadata", () => {
			// Arrange
			const input: TiptapDocument = {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: "Hello World" }],
					},
				],
			};
			const sectionType: EditorContentTypes = "situation";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			expect(result.type).toBe("doc");
			expect(result.content).toHaveLength(1);
			expect(result.content?.[0]?.type).toBe("paragraph");
			expect(result.meta).toEqual({
				sectionType: "situation",
				timestamp: "2024-01-01T00:00:00.000Z",
				version: "1.0",
			});
		});

		it("should normalize JSON string content", () => {
			// Arrange
			const input = JSON.stringify({
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: "Test content" }],
					},
				],
			});
			const sectionType: EditorContentTypes = "complication";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			expect(result.type).toBe("doc");
			expect(result.content).toHaveLength(1);
			expect(result.meta?.sectionType).toBe("complication");
		});

		it("should apply outline-specific transformations when sectionType is outline", () => {
			// Arrange
			const input: TiptapDocument = {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: "Some content" }],
					},
				],
			};
			const sectionType: EditorContentTypes = "outline";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			expect(result.content?.[0]?.type).toBe("heading");
			expect(result.content?.[0]?.attrs?.level).toBe(1);
			expect(result.content?.[0]?.content?.[0]).toEqual({
				type: "text",
				text: "Presentation Outline",
			});
			expect(result.content).toHaveLength(3); // heading + spacer paragraph + original content
		});

		it("should not add outline heading if one already exists", () => {
			// Arrange
			const input: TiptapDocument = {
				type: "doc",
				content: [
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "My Outline" }],
					},
					{
						type: "paragraph",
						content: [{ type: "text", text: "Content" }],
					},
				],
			};
			const sectionType: EditorContentTypes = "outline";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			expect(result.content).toHaveLength(2); // Should not add another heading
			expect(result.content?.[0]?.type).toBe("heading");
			expect(result.content?.[0]?.content?.[0]).toEqual({
				type: "text",
				text: "My Outline",
			});
		});
	});

	describe("Content Parsing Tests", () => {
		it("should handle null input gracefully", () => {
			// Arrange
			const input = null;
			const sectionType: EditorContentTypes = "situation";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			expect(result.type).toBe("doc");
			expect(result.content).toHaveLength(1);
			expect(result.content?.[0]?.type).toBe("paragraph");
			expect(result.content?.[0]?.content?.[0]).toEqual({
				type: "text",
				text: " ",
			});
		});

		it("should handle undefined input gracefully", () => {
			// Arrange
			const input = undefined;
			const sectionType: EditorContentTypes = "answer";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			expect(result.type).toBe("doc");
			expect(result.content).toHaveLength(1);
			expect(result.content?.[0]?.type).toBe("paragraph");
			expect(result.content?.[0]?.content?.[0]).toEqual({
				type: "text",
				text: " ",
			});
		});

		it("should handle invalid JSON string", () => {
			// Arrange
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			const input = "{ invalid json }";
			const sectionType: EditorContentTypes = "situation";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			expect(result.type).toBe("doc");
			expect(result.content).toHaveLength(1);
			expect(result.content?.[0]?.type).toBe("paragraph");
			expect(result.content?.[0]?.content?.[0]).toEqual({
				type: "text",
				text: " ",
			});
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Failed to parse content JSON:",
				expect.any(SyntaxError),
			);
		});

		it("should handle empty string", () => {
			// Arrange
			const input = "";
			const sectionType: EditorContentTypes = "complication";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			expect(result.type).toBe("doc");
			expect(result.content).toHaveLength(1);
			expect(result.content?.[0]?.type).toBe("paragraph");
			expect(result.content?.[0]?.content?.[0]).toEqual({
				type: "text",
				text: " ",
			});
		});

		it("should handle non-object, non-string input", () => {
			// Arrange
			const input = 123;
			const sectionType: EditorContentTypes = "situation";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			expect(result.type).toBe("doc");
			expect(result.content).toHaveLength(1);
			expect(result.content?.[0]?.type).toBe("paragraph");
			expect(result.content?.[0]?.content?.[0]).toEqual({
				type: "text",
				text: " ",
			});
		});
	});

	describe("Node Structure Normalization Tests", () => {
		it("should fix empty text nodes", () => {
			// Arrange
			const input: TiptapDocument = {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: "" }],
					},
				],
			};
			const sectionType: EditorContentTypes = "situation";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			expect(result.content?.[0]?.content?.[0]).toEqual({
				type: "text",
				text: " ",
			});
		});

		it("should fix text nodes missing text property", () => {
			// Arrange
			const input: TiptapDocument = {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [{ type: "text" }], // Missing text property
					},
				],
			};
			const sectionType: EditorContentTypes = "situation";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			expect(result.content?.[0]?.content?.[0]).toEqual({
				type: "text",
				text: " ",
			});
		});

		it("should fix paragraphs without content", () => {
			// Arrange
			const input: TiptapDocument = {
				type: "doc",
				content: [
					{ type: "paragraph" }, // Missing content array
				],
			};
			const sectionType: EditorContentTypes = "situation";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			expect(result.content?.[0]?.content).toEqual([
				{ type: "text", text: " " },
			]);
		});

		it("should fix paragraphs with empty content array", () => {
			// Arrange
			const input: TiptapDocument = {
				type: "doc",
				content: [{ type: "paragraph", content: [] }],
			};
			const sectionType: EditorContentTypes = "situation";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			expect(result.content?.[0]?.content).toEqual([
				{ type: "text", text: " " },
			]);
		});

		it("should fix empty bullet lists", () => {
			// Arrange
			const input: TiptapDocument = {
				type: "doc",
				content: [
					{ type: "bulletList" }, // Missing content
				],
			};
			const sectionType: EditorContentTypes = "situation";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			expect(result.content?.[0]?.content).toHaveLength(1);
			expect(result.content?.[0]?.content?.[0]?.type).toBe("listItem");
			expect(result.content?.[0]?.content?.[0]?.content?.[0]?.type).toBe(
				"paragraph",
			);
		});

		it("should fix empty ordered lists", () => {
			// Arrange
			const input: TiptapDocument = {
				type: "doc",
				content: [{ type: "orderedList", content: [] }],
			};
			const sectionType: EditorContentTypes = "situation";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			expect(result.content?.[0]?.content).toHaveLength(1);
			expect(result.content?.[0]?.content?.[0]?.type).toBe("listItem");
			expect(result.content?.[0]?.content?.[0]?.content?.[0]?.type).toBe(
				"paragraph",
			);
		});

		it("should fix list items without paragraph content", () => {
			// Arrange
			const input: TiptapDocument = {
				type: "doc",
				content: [
					{
						type: "bulletList",
						content: [
							{
								type: "listItem",
								content: [{ type: "text", text: "Direct text" }], // Should be wrapped in paragraph
							},
						],
					},
				],
			};
			const sectionType: EditorContentTypes = "situation";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			const listItem = result.content?.[0]?.content?.[0];
			expect(listItem?.content?.[0]?.type).toBe("paragraph");
			expect(listItem?.content?.[0]?.content?.[0]).toEqual({
				type: "text",
				text: "Direct text",
			});
		});

		it("should fix malformed list items in lists", () => {
			// Arrange
			const input: TiptapDocument = {
				type: "doc",
				content: [
					{
						type: "bulletList",
						content: [
							{ type: "text", text: "Invalid item" }, // Should be listItem
							null as unknown, // Null item
						],
					},
				],
			};
			const sectionType: EditorContentTypes = "situation";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			expect(result.content?.[0]?.content).toHaveLength(2);
			if (result.content?.[0]?.content) {
				for (const item of result.content[0].content) {
					expect(item.type).toBe("listItem");
					expect(item.content?.[0]?.type).toBe("paragraph");
				}
			}
		});
	});

	describe("Nested Structure Tests", () => {
		it("should recursively normalize nested content", () => {
			// Arrange
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
										content: [{ type: "text", text: "" }], // Empty text that should be normalized
									},
								],
							},
						],
					},
				],
			};
			const sectionType: EditorContentTypes = "situation";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			const nestedText =
				result.content?.[0]?.content?.[0]?.content?.[0]?.content?.[0];
			expect(nestedText).toEqual({ type: "text", text: " " });
		});

		it("should handle malformed nested arrays with null elements", () => {
			// Arrange
			const input: TiptapDocument = {
				type: "doc",
				content: [
					{
						type: "bulletList",
						content: [
							{
								type: "listItem",
								content: [
									null as unknown, // Null element
									{ type: "text", text: "Valid text" },
								],
							},
						],
					},
				],
			};
			const sectionType: EditorContentTypes = "situation";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			const listItemContent = result.content?.[0]?.content?.[0]?.content;
			expect(listItemContent).toHaveLength(2);
			expect(listItemContent?.[0]?.type).toBe("paragraph");
			expect(listItemContent?.[1]).toEqual({
				type: "text",
				text: "Valid text",
			});
		});

		it("should handle deeply nested structures", () => {
			// Arrange
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
										type: "bulletList",
										content: [
											{
												type: "listItem",
												content: [{ type: "text", text: "" }], // Should be wrapped and normalized
											},
										],
									},
								],
							},
						],
					},
				],
			};
			const sectionType: EditorContentTypes = "situation";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			// Looking at the source code, when a listItem has non-paragraph content,
			// it wraps it in a paragraph. So the bulletList gets wrapped.
			const outerList = result.content?.[0]; // Outer bullet list
			expect(outerList?.type).toBe("bulletList");

			const outerListItem = outerList?.content?.[0]; // First list item
			expect(outerListItem?.type).toBe("listItem");

			// The listItem normalization logic wraps the inner bulletList in a paragraph
			// because line 149-156 in the source: if content[0] is not a paragraph, wrap it
			const wrappingParagraph = outerListItem?.content?.[0];
			expect(wrappingParagraph?.type).toBe("paragraph");

			// The original bulletList becomes content of the wrapping paragraph
			const innerList = wrappingParagraph?.content?.[0];
			expect(innerList?.type).toBe("bulletList");

			// And the nested structure continues to be normalized recursively
			const innerListItem = innerList?.content?.[0];
			expect(innerListItem?.type).toBe("listItem");

			// The deepest text gets properly wrapped in a paragraph
			const deepParagraph = innerListItem?.content?.[0];
			expect(deepParagraph?.type).toBe("paragraph");
			expect(deepParagraph?.content?.[0]).toEqual({ type: "text", text: " " });
		});
	});

	describe("Schema Validation Tests", () => {
		it('should validate document type is "doc"', () => {
			// Arrange
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			const input = {
				type: "paragraph", // Wrong root type
				content: [{ type: "text", text: "Test" }],
			};
			const sectionType: EditorContentTypes = "situation";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Schema validation failed:",
				expect.any(Error),
			);
			expect(result.type).toBe("doc"); // Should fallback to safe content
			expect(result.content).toHaveLength(1);
			expect(result.content?.[0]?.type).toBe("paragraph");
		});

		it("should validate root content array exists", () => {
			// Arrange
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			const input = {
				type: "doc",
				// Missing content property
			};
			const sectionType: EditorContentTypes = "situation";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Schema validation failed:",
				expect.any(Error),
			);
			expect(result.type).toBe("doc"); // Should fallback to safe content
			expect(result.content).toEqual([
				{
					type: "paragraph",
					content: [{ type: "text", text: " " }],
				},
			]);
		});

		it("should validate nodes have required type property", () => {
			// Arrange
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			const input: TiptapDocument = {
				type: "doc",
				content: [
					{ type: "text", text: "Valid text" },
					{} as unknown, // Missing type property
				],
			};
			const sectionType: EditorContentTypes = "situation";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Schema validation failed:",
				expect.any(Error),
			);
			expect(result.type).toBe("doc"); // Should fallback to safe content
		});

		it("should validate and normalize text nodes missing text property", () => {
			// Arrange
			const input: TiptapDocument = {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [
							{ type: "text" } as unknown, // Missing text property - gets normalized before validation
						],
					},
				],
			};
			const sectionType: EditorContentTypes = "situation";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			// The function normalizes before validating, so this should succeed
			expect(result.type).toBe("doc");
			expect(result.content?.[0]?.content?.[0]).toEqual({
				type: "text",
				text: " ",
			});
			expect(result.meta?.sectionType).toBe("situation");
		});
	});

	describe("Input Immutability Tests", () => {
		it("should not mutate the original input object", () => {
			// Arrange
			const input: TiptapDocument = {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: "Original text" }],
					},
				],
			};
			const originalInput = JSON.parse(JSON.stringify(input)); // Deep copy for comparison
			const sectionType: EditorContentTypes = "situation";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			expect(input).toEqual(originalInput); // Input should remain unchanged
			expect(result).not.toBe(input); // Result should be a different object
			expect(result.meta).toBeDefined(); // Result should have additional metadata
			expect(input.meta).toBeUndefined(); // Original should not have metadata
		});

		it("should deep clone nested structures without mutation", () => {
			// Arrange
			const sharedTextNode = { type: "text", text: "Shared" };
			const input: TiptapDocument = {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [sharedTextNode],
					},
				],
			};
			const sectionType: EditorContentTypes = "situation";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			expect(result.content?.[0]?.content?.[0]).not.toBe(sharedTextNode); // Should be a different object
			expect(sharedTextNode.text).toBe("Shared"); // Original should remain unchanged
		});
	});

	describe("Metadata Addition Tests", () => {
		it("should add correct metadata for all section types", () => {
			const testCases: EditorContentTypes[] = [
				"situation",
				"complication",
				"answer",
				"outline",
			];

			for (const sectionType of testCases) {
				// Arrange
				const input: TiptapDocument = {
					type: "doc",
					content: [
						{
							type: "paragraph",
							content: [{ type: "text", text: "Test" }],
						},
					],
				};

				// Act
				const result = normalizeEditorContent(input, sectionType);

				// Assert
				expect(result.meta).toEqual({
					sectionType,
					timestamp: "2024-01-01T00:00:00.000Z",
					version: "1.0",
				});
			}
		});

		it("should override existing metadata with new metadata structure", () => {
			// Arrange
			const input: TiptapDocument = {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: "Test" }],
					},
				],
				meta: {
					existingProperty: "value",
					anotherProperty: 123,
				},
			};
			const sectionType: EditorContentTypes = "situation";

			// Act
			const result = normalizeEditorContent(input, sectionType);

			// Assert
			// The function replaces metadata entirely, doesn't preserve existing
			expect(result.meta).toEqual({
				sectionType: "situation",
				timestamp: "2024-01-01T00:00:00.000Z",
				version: "1.0",
			});
		});
	});
});
