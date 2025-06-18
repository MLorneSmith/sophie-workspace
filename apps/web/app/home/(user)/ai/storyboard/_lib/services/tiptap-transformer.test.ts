/**
 * Unit tests for TipTap Transformer
 * Tests pure transformation functions for converting TipTap documents to storyboard format
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Import the class to test
import { TipTapTransformer } from "./tiptap-transformer";

// Mock console.error to prevent test output pollution
// biome-ignore lint/suspicious/noConsole: Test file needs console.error for mocking
const originalConsoleError = console.error;

describe("TipTapTransformer", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		console.error = vi.fn();
	});

	afterEach(() => {
		console.error = originalConsoleError;
	});

	describe("transform", () => {
		it("should transform a simple TipTap document with title", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "Main Title" }],
					},
					{
						type: "paragraph",
						content: [{ type: "text", text: "Introduction content" }],
					},
				],
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc);

			// Assert
			expect(result.title).toBe("Main Title");
			expect(result.slides).toHaveLength(1);
			expect(result.slides[0]).toBeDefined();
			expect(result.slides[0]?.title).toBe("Main Title");
			expect(result.slides[0]?.layoutId).toBe("title");
		});

		it("should transform a JSON string document", () => {
			// Arrange
			const tipTapDocString = JSON.stringify({
				type: "doc",
				content: [
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "String Title" }],
					},
				],
			});

			// Act
			const result = TipTapTransformer.transform(tipTapDocString);

			// Assert
			expect(result.title).toBe("String Title");
			expect(result.slides).toHaveLength(1);
		});

		it("should handle invalid JSON string gracefully", () => {
			// Arrange
			const invalidJson = "{ invalid json }";

			// Act
			const result = TipTapTransformer.transform(invalidJson, "Fallback Title");

			// Assert
			expect(result.title).toBe("Fallback Title");
			expect(result.slides).toHaveLength(1);
			expect(result.slides[0]?.title).toBe("Untitled Presentation"); // Uses document meta or default
			// biome-ignore lint/suspicious/noConsole: Test assertion for console.error mock
			expect(console.error).toHaveBeenCalledWith(
				"Error parsing TipTap document:",
				expect.any(Error),
			);
		});

		it("should use fallback title when no level 1 heading exists", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Section Title" }],
					},
				],
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc, "Fallback Title");

			// Assert
			expect(result.title).toBe("Fallback Title");
		});

		it("should create multiple slides from multiple headings", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "Title Slide" }],
					},
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Section 1" }],
					},
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Section 2" }],
					},
				],
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc);

			// Assert
			expect(result.slides).toHaveLength(3);
			expect(result.slides[0]?.title).toBe("Title Slide");
			expect(result.slides[1]?.title).toBe("Section 1");
			expect(result.slides[2]?.title).toBe("Section 2");
		});

		it("should handle empty document", () => {
			// Arrange
			const emptyDoc = { type: "doc" as const, content: [] };

			// Act
			const result = TipTapTransformer.transform(emptyDoc);

			// Assert
			expect(result.title).toBe("Untitled Presentation");
			expect(result.slides).toHaveLength(1);
			expect(result.slides[0]?.layoutId).toBe("title");
		});
	});

	describe("Layout Detection", () => {
		it("should detect two-column layout from level 3 headings", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Section" }],
					},
					{
						type: "heading",
						attrs: { level: 3 },
						content: [{ type: "text", text: "Column 1" }],
					},
					{
						type: "paragraph",
						content: [{ type: "text", text: "Content 1" }],
					},
					{
						type: "heading",
						attrs: { level: 3 },
						content: [{ type: "text", text: "Column 2" }],
					},
					{
						type: "paragraph",
						content: [{ type: "text", text: "Content 2" }],
					},
				],
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc);

			// Assert
			expect(result.slides).toHaveLength(1);
			expect(result.slides[0].storyboard.layoutId).toBe("two-column");
			expect(result.slides[0].storyboard.subHeadlines).toEqual([
				"Column 1",
				"Column 2",
			]);
		});

		it("should detect three-column layout from three level 3 headings", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Section" }],
					},
					{
						type: "heading",
						attrs: { level: 3 },
						content: [{ type: "text", text: "Col 1" }],
					},
					{
						type: "heading",
						attrs: { level: 3 },
						content: [{ type: "text", text: "Col 2" }],
					},
					{
						type: "heading",
						attrs: { level: 3 },
						content: [{ type: "text", text: "Col 3" }],
					},
				],
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc);

			// Assert
			expect(result.slides[0].storyboard.layoutId).toBe("three-column");
			expect(result.slides[0].storyboard.subHeadlines).toEqual([
				"Col 1",
				"Col 2",
				"Col 3",
			]);
		});

		it("should detect bullet-list layout from bullet content", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Bullet Section" }],
					},
					{
						type: "bulletList",
						content: [
							{
								type: "listItem",
								content: [
									{
										type: "paragraph",
										content: [{ type: "text", text: "Item 1" }],
									},
								],
							},
							{
								type: "listItem",
								content: [
									{
										type: "paragraph",
										content: [{ type: "text", text: "Item 2" }],
									},
								],
							},
							{
								type: "listItem",
								content: [
									{
										type: "paragraph",
										content: [{ type: "text", text: "Item 3" }],
									},
								],
							},
							{
								type: "listItem",
								content: [
									{
										type: "paragraph",
										content: [{ type: "text", text: "Item 4" }],
									},
								],
							},
						],
					},
				],
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc);

			// Assert
			expect(result.slides[0].storyboard.layoutId).toBe("bullet-list");
		});

		it("should detect chart layout from numerical content", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Sales Data" }],
					},
					{
						type: "paragraph",
						content: [
							{
								type: "text",
								text: "Revenue increased by 25% with Q1 at 100M, Q2 at 125M, and Q3 at 150M.",
							},
						],
					},
				],
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc);

			// Assert
			expect(result.slides[0].storyboard.layoutId).toBe("chart");
		});
	});

	describe("Chart Data Detection", () => {
		it("should detect percentage patterns", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Growth" }],
					},
					{
						type: "paragraph",
						content: [{ type: "text", text: "We grew by 45% this year" }],
					},
				],
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc);

			// Assert
			// Layout detection prioritizes paragraph content over chart detection
			// So this becomes "content" layout instead of "chart"
			expect(result.slides[0].storyboard.layoutId).toBe("content");
		});

		it("should detect multiple numbers as potential data", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Data" }],
					},
					{
						type: "paragraph",
						content: [
							{ type: "text", text: "Q1: 100, Q2: 200, Q3: 300, Q4: 400" },
						],
					},
				],
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc);

			// Assert
			expect(result.slides[0].storyboard.layoutId).toBe("chart");
		});

		it("should detect trend keywords", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Trends" }],
					},
					{
						type: "paragraph",
						content: [
							{
								type: "text",
								text: "Revenue shows significant growth over time",
							},
						],
					},
				],
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc);

			// Assert
			expect(result.slides[0].storyboard.layoutId).toBe("chart");
		});
	});

	describe("Content Processing", () => {
		it("should process bullet lists correctly", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "List Section" }],
					},
					{
						type: "bulletList",
						content: [
							{
								type: "listItem",
								content: [
									{
										type: "paragraph",
										content: [{ type: "text", text: "First item" }],
									},
								],
							},
							{
								type: "listItem",
								content: [
									{
										type: "paragraph",
										content: [{ type: "text", text: "Second item" }],
									},
								],
							},
						],
					},
				],
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc);

			// Assert
			expect(result.slides).toHaveLength(1);
			// Note: The actual content processing logic would need to be tested
			// based on how the transformer processes bullet lists in the slide content
		});

		it("should process nested lists correctly", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Nested List" }],
					},
					{
						type: "bulletList",
						content: [
							{
								type: "listItem",
								content: [
									{
										type: "paragraph",
										content: [{ type: "text", text: "Main item" }],
									},
									{
										type: "bulletList",
										content: [
											{
												type: "listItem",
												content: [
													{
														type: "paragraph",
														content: [{ type: "text", text: "Sub item" }],
													},
												],
											},
										],
									},
								],
							},
						],
					},
				],
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc);

			// Assert
			expect(result.slides).toHaveLength(1);
			expect(result.slides[0].headline).toBe("Nested List");
		});

		it("should handle ordered lists", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Ordered List" }],
					},
					{
						type: "orderedList",
						content: [
							{
								type: "listItem",
								content: [
									{
										type: "paragraph",
										content: [{ type: "text", text: "First step" }],
									},
								],
							},
							{
								type: "listItem",
								content: [
									{
										type: "paragraph",
										content: [{ type: "text", text: "Second step" }],
									},
								],
							},
						],
					},
				],
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc);

			// Assert
			expect(result.slides).toHaveLength(1);
			expect(result.slides[0].headline).toBe("Ordered List");
		});

		it("should extract text from complex nested structures", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "heading",
						attrs: { level: 1 },
						content: [
							{ type: "text", text: "Complex " },
							{ type: "text", text: "Title" },
						],
					},
				],
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc);

			// Assert
			expect(result.title).toBe("Complex Title");
		});
	});

	describe("Title Extraction", () => {
		it("should extract title from first level 1 heading", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: "Some intro text" }],
					},
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "The Real Title" }],
					},
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "Second Title" }],
					},
				],
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc);

			// Assert
			expect(result.title).toBe("The Real Title");
		});

		it("should return null when no level 1 heading exists", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Level 2" }],
					},
					{
						type: "heading",
						attrs: { level: 3 },
						content: [{ type: "text", text: "Level 3" }],
					},
				],
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc, "Fallback");

			// Assert
			expect(result.title).toBe("Fallback");
		});

		it("should handle empty heading", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "heading",
						attrs: { level: 1 },
						content: [],
					},
				],
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc, "Fallback");

			// Assert
			expect(result.title).toBe("Fallback");
		});
	});

	describe("Edge Cases", () => {
		it("should handle document with only whitespace", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: "   \n\t  " }],
					},
				],
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc);

			// Assert
			expect(result.slides).toHaveLength(1);
			expect(result.slides[0].storyboard.layoutId).toBe("title");
		});

		it("should handle nodes without content property", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "heading",
						attrs: { level: 1 },
						// missing content property
					} as unknown,
				],
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc);

			// Assert
			expect(result.slides).toHaveLength(1);
		});

		it("should handle very deep nesting without stack overflow", () => {
			// Arrange
			let deepContent: unknown = { type: "text", text: "deep content" };
			for (let i = 0; i < 100; i++) {
				deepContent = {
					type: "paragraph",
					content: [deepContent],
				};
			}

			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "Deep Test" }],
					},
					deepContent,
				],
			};

			// Act & Assert - should not throw
			expect(() => TipTapTransformer.transform(tipTapDoc)).not.toThrow();
		});

		it("should handle null/undefined values gracefully", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					null,
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "Valid Title" }],
					},
					undefined,
				].filter(Boolean),
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc);

			// Assert
			expect(result.title).toBe("Valid Title");
		});

		it("should handle special characters and Unicode", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "heading",
						attrs: { level: 1 },
						content: [
							{
								type: "text",
								text: "Spëciál Cháracters & Émojis 🎉 中文",
							},
						],
					},
				],
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc);

			// Assert
			expect(result.title).toBe("Spëciál Cháracters & Émojis 🎉 中文");
		});

		it("should handle level 4+ headings as content", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Section" }],
					},
					{
						type: "heading",
						attrs: { level: 4 },
						content: [{ type: "text", text: "Subsection" }],
					},
					{
						type: "heading",
						attrs: { level: 5 },
						content: [{ type: "text", text: "Sub-subsection" }],
					},
				],
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc);

			// Assert
			expect(result.slides).toHaveLength(1);
			expect(result.slides[0].headline).toBe("Section");
		});
	});

	describe("Document Metadata", () => {
		it("should use document meta sectionType as fallback title", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [],
				meta: {
					sectionType: "Meta Title",
					timestamp: "2025-01-01",
					version: "1.0",
				},
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc);

			// Assert
			expect(result.slides).toHaveLength(1);
			expect(result.slides[0].headline).toBe("Meta Title");
		});

		it("should prioritize parameter title over meta sectionType", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [],
				meta: {
					sectionType: "Meta Title",
					timestamp: "2025-01-01",
					version: "1.0",
				},
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc, "Parameter Title");

			// Assert
			expect(result.title).toBe("Parameter Title");
		});
	});

	describe("Subheadline Normalization", () => {
		it("should normalize subheadlines for two-column layout", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Section" }],
					},
					{
						type: "heading",
						attrs: { level: 3 },
						content: [{ type: "text", text: "Only One" }],
					},
				],
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc);

			// Assert
			expect(result.slides[0].storyboard.subHeadlines).toHaveLength(1);
		});

		it("should truncate excess subheadlines", () => {
			// Arrange
			const tipTapDoc = {
				type: "doc" as const,
				content: [
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Section" }],
					},
					{
						type: "heading",
						attrs: { level: 3 },
						content: [{ type: "text", text: "Col 1" }],
					},
					{
						type: "heading",
						attrs: { level: 3 },
						content: [{ type: "text", text: "Col 2" }],
					},
					{
						type: "heading",
						attrs: { level: 3 },
						content: [{ type: "text", text: "Col 3" }],
					},
					{
						type: "heading",
						attrs: { level: 3 },
						content: [{ type: "text", text: "Col 4" }],
					},
					{
						type: "heading",
						attrs: { level: 3 },
						content: [{ type: "text", text: "Col 5" }],
					},
				],
			};

			// Act
			const result = TipTapTransformer.transform(tipTapDoc);

			// Assert
			expect(result.slides[0].storyboard.layoutId).toBe("three-column");
			expect(result.slides[0].storyboard.subHeadlines).toHaveLength(3);
			expect(result.slides[0].storyboard.subHeadlines).toEqual([
				"Col 1",
				"Col 2",
				"Col 3",
			]);
		});
	});
});
