/**
 * Unit tests for PowerPoint generation server action
 * Tests the generatePowerPointAction for creating PowerPoint files from storyboard data
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StoryboardData } from "../types";
import { generatePowerPointAction } from "./powerpoint-actions";

// Mock enhanceAction to preserve schema validation
vi.mock("@kit/next/actions", () => ({
	enhanceAction: vi.fn((fn, _options) => {
		return async (data: unknown) => {
			// Mock authenticated user
			const mockUser = {
				id: "user-123",
				email: "test@example.com",
				aud: "authenticated",
			};

			return fn(data, mockUser);
		};
	}),
}));

// Hoist mock to avoid initialization order issues
const { mockGenerateFromStoryboard, MockPptxGenerator } = vi.hoisted(() => {
	const mockGenerateFromStoryboard = vi.fn();
	return {
		mockGenerateFromStoryboard,
		MockPptxGenerator: class {
			generateFromStoryboard = mockGenerateFromStoryboard;
		},
	};
});

vi.mock("../services/powerpoint/pptx-generator", () => ({
	PptxGenerator: MockPptxGenerator,
}));

describe("PowerPoint Actions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Default mock implementation
		mockGenerateFromStoryboard.mockResolvedValue(
			Buffer.from("mock-pptx-content"),
		);
	});

	describe("generatePowerPointAction", () => {
		const validStoryboard: StoryboardData = {
			title: "Test Presentation",
			slides: [
				{
					id: "slide-1",
					title: "Introduction",
					headline: "Welcome to the presentation",
					layoutId: "title-slide",
					order: 0,
					content: [
						{
							id: "content-1",
							area: "main",
							type: "text",
							text: "This is the introduction slide",
							columnIndex: 0,
						},
					],
				},
				{
					id: "slide-2",
					title: "Main Content",
					headline: "Key Points",
					layoutId: "content-slide",
					order: 1,
					content: [
						{
							id: "content-2",
							area: "main",
							type: "bullet",
							text: "First point",
							columnIndex: 0,
						},
						{
							id: "content-3",
							area: "main",
							type: "bullet",
							text: "Second point",
							columnIndex: 0,
						},
					],
				},
			],
		};

		describe("Core Functionality", () => {
			it("should generate PowerPoint from valid storyboard", async () => {
				const result = await generatePowerPointAction(validStoryboard);

				expect(result.success).toBe(true);
				expect(result.data).toBeDefined();
			});

			it("should return base64 encoded data", async () => {
				const mockBuffer = Buffer.from("test-pptx-content");
				mockGenerateFromStoryboard.mockResolvedValue(mockBuffer);

				const result = await generatePowerPointAction(validStoryboard);

				expect(result.success).toBe(true);
				expect(result.data).toBe(mockBuffer.toString("base64"));
			});

			it("should pass storyboard data to generator", async () => {
				await generatePowerPointAction(validStoryboard);

				expect(mockGenerateFromStoryboard).toHaveBeenCalledWith(
					validStoryboard,
				);
			});

			it("should call generateFromStoryboard on the generator", async () => {
				await generatePowerPointAction(validStoryboard);

				expect(mockGenerateFromStoryboard).toHaveBeenCalledWith(
					validStoryboard,
				);
			});
		});

		describe("Storyboard Variants", () => {
			it("should handle storyboard with single slide", async () => {
				const singleSlideStoryboard: StoryboardData = {
					title: "Single Slide",
					slides: [
						{
							id: "slide-1",
							title: "Only Slide",
							headline: "The only slide",
							layoutId: "title-slide",
							order: 0,
							content: [],
						},
					],
				};

				const result = await generatePowerPointAction(singleSlideStoryboard);
				expect(result.success).toBe(true);
			});

			it("should handle storyboard with empty slides array", async () => {
				const emptyStoryboard: StoryboardData = {
					title: "Empty Presentation",
					slides: [],
				};

				const result = await generatePowerPointAction(emptyStoryboard);
				expect(result.success).toBe(true);
			});

			it("should handle storyboard with multiple content types", async () => {
				const multiContentStoryboard: StoryboardData = {
					title: "Multi-content Presentation",
					slides: [
						{
							id: "slide-1",
							title: "Mixed Content",
							headline: "Various content types",
							layoutId: "content-slide",
							order: 0,
							content: [
								{
									id: "c1",
									area: "main",
									type: "text",
									text: "Regular text",
									columnIndex: 0,
								},
								{
									id: "c2",
									area: "main",
									type: "bullet",
									text: "Bullet point",
									columnIndex: 0,
								},
								{
									id: "c3",
									area: "main",
									type: "subbullet",
									text: "Sub-bullet",
									columnIndex: 0,
								},
								{
									id: "c4",
									area: "sidebar",
									type: "image",
									imageUrl: "https://example.com/image.jpg",
									columnIndex: 1,
								},
							],
						},
					],
				};

				const result = await generatePowerPointAction(multiContentStoryboard);
				expect(result.success).toBe(true);
				expect(mockGenerateFromStoryboard).toHaveBeenCalledWith(
					multiContentStoryboard,
				);
			});

			it("should handle storyboard with subheadlines", async () => {
				const subheadlineStoryboard: StoryboardData = {
					title: "Presentation with Subheadlines",
					slides: [
						{
							id: "slide-1",
							title: "Main Title",
							headline: "Main headline",
							layoutId: "title-slide",
							order: 0,
							subheadlines: [
								"First subheadline",
								"Second subheadline",
								"Third subheadline",
							],
							content: [],
						},
					],
				};

				const result = await generatePowerPointAction(subheadlineStoryboard);
				expect(result.success).toBe(true);
			});

			it("should handle storyboard with chart content", async () => {
				const chartStoryboard: StoryboardData = {
					title: "Chart Presentation",
					slides: [
						{
							id: "slide-1",
							title: "Data Visualization",
							headline: "Q4 Results",
							layoutId: "chart-slide",
							order: 0,
							content: [
								{
									id: "c1",
									area: "chart",
									type: "chart",
									chartType: "bar",
									chartData: {
										labels: ["Q1", "Q2", "Q3", "Q4"],
										values: [100, 150, 200, 250],
									},
									columnIndex: 0,
								},
							],
						},
					],
				};

				const result = await generatePowerPointAction(chartStoryboard);
				expect(result.success).toBe(true);
			});

			it("should handle storyboard with table content", async () => {
				const tableStoryboard: StoryboardData = {
					title: "Table Presentation",
					slides: [
						{
							id: "slide-1",
							title: "Data Table",
							headline: "Comparison Data",
							layoutId: "table-slide",
							order: 0,
							content: [
								{
									id: "c1",
									area: "table",
									type: "table",
									tableData: {
										headers: ["Product", "Price", "Quantity"],
										rows: [
											["A", "$10", "100"],
											["B", "$20", "50"],
										],
									},
									columnIndex: 0,
								},
							],
						},
					],
				};

				const result = await generatePowerPointAction(tableStoryboard);
				expect(result.success).toBe(true);
			});

			it("should handle storyboard with formatting options", async () => {
				const formattedStoryboard: StoryboardData = {
					title: "Formatted Presentation",
					slides: [
						{
							id: "slide-1",
							title: "Styled Content",
							headline: "With formatting",
							layoutId: "content-slide",
							order: 0,
							content: [
								{
									id: "c1",
									area: "main",
									type: "text",
									text: "Bold and colored text",
									columnIndex: 0,
									formatting: {
										fontSize: 24,
										color: "#FF0000",
										bold: true,
										italic: false,
										underline: false,
									},
								},
							],
						},
					],
				};

				const result = await generatePowerPointAction(formattedStoryboard);
				expect(result.success).toBe(true);
			});
		});

		describe("Error Handling", () => {
			it("should handle generator error gracefully", async () => {
				mockGenerateFromStoryboard.mockRejectedValue(
					new Error("Generator failed"),
				);

				const result = await generatePowerPointAction(validStoryboard);

				expect(result.success).toBe(false);
				expect(result.error).toBe(
					"Failed to generate PowerPoint: Generator failed",
				);
			});

			it("should handle non-Error exceptions", async () => {
				mockGenerateFromStoryboard.mockRejectedValue("String error");

				const result = await generatePowerPointAction(validStoryboard);

				expect(result.success).toBe(false);
				expect(result.error).toBe(
					"Failed to generate PowerPoint: Unknown error occurred",
				);
			});

			it("should handle generator returning null", async () => {
				mockGenerateFromStoryboard.mockResolvedValue(null);

				// This might throw or return error depending on implementation
				const result = await generatePowerPointAction(validStoryboard);

				// The base64 conversion of null would fail
				expect(result.success).toBe(false);
			});

			it("should handle generator returning undefined", async () => {
				mockGenerateFromStoryboard.mockResolvedValue(undefined);

				const result = await generatePowerPointAction(validStoryboard);

				expect(result.success).toBe(false);
			});
		});

		describe("Edge Cases", () => {
			it("should handle very long presentation title", async () => {
				const longTitleStoryboard: StoryboardData = {
					title: "A".repeat(1000),
					slides: [
						{
							id: "slide-1",
							title: "Slide",
							headline: "Headline",
							layoutId: "title-slide",
							order: 0,
							content: [],
						},
					],
				};

				const result = await generatePowerPointAction(longTitleStoryboard);
				expect(result.success).toBe(true);
			});

			it("should handle special characters in content", async () => {
				const specialCharsStoryboard: StoryboardData = {
					title: "Special Characters: <>&\"'",
					slides: [
						{
							id: "slide-1",
							title: "Unicode: 日本語 🎉",
							headline: "Emoji & Symbols: ™ © ® €",
							layoutId: "content-slide",
							order: 0,
							content: [
								{
									id: "c1",
									area: "main",
									type: "text",
									text: "Math: ∑ ∏ √ ∞ ≠ ≤ ≥",
									columnIndex: 0,
								},
							],
						},
					],
				};

				const result = await generatePowerPointAction(specialCharsStoryboard);
				expect(result.success).toBe(true);
			});

			it("should handle large number of slides", async () => {
				const manySlides: StoryboardData = {
					title: "Large Presentation",
					slides: Array.from({ length: 100 }, (_, i) => ({
						id: `slide-${i}`,
						title: `Slide ${i + 1}`,
						headline: `Headline ${i + 1}`,
						layoutId: "content-slide",
						order: i,
						content: [
							{
								id: `c${i}`,
								area: "main",
								type: "text" as const,
								text: `Content for slide ${i + 1}`,
								columnIndex: 0,
							},
						],
					})),
				};

				const result = await generatePowerPointAction(manySlides);
				expect(result.success).toBe(true);
			});

			it("should handle slides with many content items", async () => {
				const manyContentItems: StoryboardData = {
					title: "Dense Content",
					slides: [
						{
							id: "slide-1",
							title: "Many Items",
							headline: "Lots of content",
							layoutId: "content-slide",
							order: 0,
							content: Array.from({ length: 50 }, (_, i) => ({
								id: `c${i}`,
								area: "main",
								type: "bullet" as const,
								text: `Bullet point ${i + 1}`,
								columnIndex: i % 3,
							})),
						},
					],
				};

				const result = await generatePowerPointAction(manyContentItems);
				expect(result.success).toBe(true);
			});

			it("should handle different layout types", async () => {
				const layoutStoryboard: StoryboardData = {
					title: "Layout Showcase",
					slides: [
						{
							id: "s1",
							title: "Title",
							headline: "Title Slide",
							layoutId: "title-slide",
							order: 0,
							content: [],
						},
						{
							id: "s2",
							title: "Content",
							headline: "Content Slide",
							layoutId: "content-slide",
							order: 1,
							content: [],
						},
						{
							id: "s3",
							title: "Two Column",
							headline: "Two Column Slide",
							layoutId: "two-column",
							order: 2,
							content: [],
						},
						{
							id: "s4",
							title: "Image",
							headline: "Image Slide",
							layoutId: "image-slide",
							order: 3,
							content: [],
						},
					],
				};

				const result = await generatePowerPointAction(layoutStoryboard);
				expect(result.success).toBe(true);
			});
		});

		describe("Authentication", () => {
			it("should require authentication", async () => {
				// The enhanceAction mock provides auth: true
				// This test verifies the action runs with an authenticated user
				const result = await generatePowerPointAction(validStoryboard);

				expect(result.success).toBe(true);
			});
		});

		describe("Performance", () => {
			it("should handle generation within reasonable time", async () => {
				const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
				mockGenerateFromStoryboard.mockResolvedValue(largeBuffer);

				const startTime = Date.now();
				const result = await generatePowerPointAction(validStoryboard);
				const endTime = Date.now();

				expect(result.success).toBe(true);
				// Base64 encoding of 10MB should be fast
				expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
			});
		});
	});
});
