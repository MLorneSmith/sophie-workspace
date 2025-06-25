/**
 * Unit tests for StoryboardService client-side service
 * Tests storyboard data operations, outline parsing, and slide generation
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StoryboardService } from "./storyboard-service-client";

// Mock dependencies
vi.mock("@kit/ui/sonner", () => ({
	toast: {
		error: vi.fn(),
	},
}));

// Mock the PRESET_LAYOUTS import
vi.mock("../types/index", () => {
	const MOCK_PRESET_LAYOUTS = [
		{
			id: "title",
			name: "Title Slide",
			contentAreas: [
				{
					id: "title-area",
					type: "text",
					position: { x: 0, y: 0, width: 100, height: 50 },
				},
			],
		},
		{
			id: "content",
			name: "Content Slide",
			contentAreas: [
				{
					id: "content-area",
					type: "text",
					position: { x: 0, y: 0, width: 100, height: 100 },
				},
			],
		},
	];

	return {
		PRESET_LAYOUTS: MOCK_PRESET_LAYOUTS,
		// Mock other exports that might be used
		SlideContent: {},
	};
});

// Define mock interface for test purposes
interface MockSupabaseClient {
	from: ReturnType<typeof vi.fn>;
	select: ReturnType<typeof vi.fn>;
	eq: ReturnType<typeof vi.fn>;
	single: ReturnType<typeof vi.fn>;
	update: ReturnType<typeof vi.fn>;
	order: ReturnType<typeof vi.fn>;
}

describe("StoryboardService", () => {
	let service: StoryboardService;
	let mockSupabase: MockSupabaseClient;

	// Create a chainable mock that properly returns itself
	const createChainableMock = () => {
		const chainMock = {
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			single: vi.fn().mockResolvedValue({ data: null, error: null }),
			update: vi.fn().mockReturnThis(),
			order: vi.fn().mockReturnThis(),
		};
		
		// Make each method return the chain itself
		chainMock.select.mockReturnValue(chainMock);
		chainMock.eq.mockReturnValue(chainMock);
		chainMock.update.mockReturnValue(chainMock);
		chainMock.order.mockReturnValue(chainMock);
		
		return chainMock;
	};

	beforeEach(() => {
		// Create proper Supabase mock with chaining
		mockSupabase = {
			from: vi.fn(),
			select: vi.fn(),
			eq: vi.fn(),
			single: vi.fn(),
			update: vi.fn(),
			order: vi.fn(),
		};

		// Set up from() to return a new chainable mock
		mockSupabase.from.mockReturnValue(createChainableMock());

		// Also set up the main mock object methods for backward compatibility
		mockSupabase.select.mockReturnValue(mockSupabase);
		mockSupabase.eq.mockReturnValue(mockSupabase);
		mockSupabase.update.mockReturnValue(mockSupabase);
		mockSupabase.order.mockReturnValue(mockSupabase);
		mockSupabase.single.mockResolvedValue({ data: null, error: null });

		service = new StoryboardService(mockSupabase as unknown as SupabaseClient);
	});

	describe("getStoryboard", () => {
		it("should return existing storyboard data", async () => {
			// Arrange
			const mockStoryboardData = {
				title: "Test Presentation",
				slides: [
					{
						id: "slide-1",
						headline: "Test Slide",
						order: 0,
						storyboard: {
							layoutId: "title",
							subHeadlines: [],
							contentAreas: [
								{
									id: "title-area",
									type: "text",
									position: { x: 0, y: 0, width: 100, height: 50 },
								},
							],
							settings: {
								chartTypes: {},
								imageSettings: {},
								tableSettings: {},
							},
						},
					},
				],
			};

			const mockData = {
				id: "submission-1",
				title: "Test Presentation",
				outline: "{}",
				storyboard: mockStoryboardData,
			};

			// Override the single method on the chain returned by from()
			const fromResult = mockSupabase.from();
			fromResult.single.mockResolvedValue({ data: mockData, error: null });

			// Act
			const result = await service.getStoryboard("submission-1");

			// Assert
			expect(result).toEqual(mockStoryboardData);
			expect(mockSupabase.from).toHaveBeenCalledWith(
				"building_blocks_submissions",
			);
			expect(fromResult.select).toHaveBeenCalledWith(
				"id, outline, storyboard, title",
			);
			expect(fromResult.eq).toHaveBeenCalledWith("id", "submission-1");
		});

		it("should generate storyboard from outline when storyboard is missing", async () => {
			// Arrange
			const mockOutline = {
				content: [
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "Main Title" }],
					},
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Slide 1" }],
					},
				],
			};

			const mockData = {
				id: "submission-1",
				title: "Test Presentation",
				outline: JSON.stringify(mockOutline),
				storyboard: null,
			};

			// Override the single method on the chain returned by from()
			const fromResult = mockSupabase.from();
			fromResult.single.mockResolvedValue({ data: mockData, error: null });
			
			// Mock the save operation - create a new chain for the update operation
			const updateChain = createChainableMock();
			updateChain.eq.mockResolvedValue({ error: null });
			mockSupabase.from.mockReturnValueOnce(fromResult).mockReturnValueOnce(updateChain);

			// Act
			const result = await service.getStoryboard("submission-1");

			// Assert
			expect(result?.title).toBe("Main Title");
			expect(result?.slides).toHaveLength(2);
			expect(result?.slides?.[0]?.title).toBe("Main Title");
			expect(result?.slides?.[1]?.title).toBe("Slide 1");
			expect(updateChain.update).toHaveBeenCalled(); // Should save generated storyboard
		});

		it("should handle missing storyboard column gracefully", async () => {
			// Arrange
			const columnError = new Error("column 'storyboard' does not exist");

			const mockOutline = {
				content: [
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "Fallback Title" }],
					},
				],
			};

			const fallbackData = {
				id: "submission-1",
				title: "Test Presentation",
				outline: JSON.stringify(mockOutline),
			};

			// Mock the first call to fail with column error
			const firstChain = createChainableMock();
			firstChain.single.mockResolvedValue({
				data: null,
				error: { message: "column 'storyboard' does not exist" },
			});
			
			// Mock the fallback call to succeed
			const secondChain = createChainableMock();
			secondChain.single.mockResolvedValue({
				data: fallbackData,
				error: null,
			});
			
			// Mock saveStoryboard call
			const updateChain = createChainableMock();
			updateChain.eq.mockResolvedValue({ error: null });
			
			mockSupabase.from
				.mockReturnValueOnce(firstChain)
				.mockReturnValueOnce(secondChain)
				.mockReturnValueOnce(updateChain);

			// Act
			const result = await service.getStoryboard("submission-1");

			// Assert
			expect(result?.title).toBe("Fallback Title");
			expect(result?.slides).toHaveLength(1);
			expect(secondChain.select).toHaveBeenCalledWith("id, outline, title"); // Fallback query
		});

		it("should throw error when submission not found", async () => {
			// Arrange
			const fromResult = mockSupabase.from();
			fromResult.single.mockResolvedValue({
				data: null,
				error: { message: "Submission not found" },
			});

			// Act & Assert
			await expect(service.getStoryboard("invalid-id")).rejects.toThrow(
				"Submission not found",
			);
		});

		it("should handle invalid JSON in outline", async () => {
			// Arrange
			const mockData = {
				id: "submission-1",
				title: "Test Presentation",
				outline: "invalid json{",
				storyboard: null,
			};

			const fromResult = mockSupabase.from();
			fromResult.single.mockResolvedValue({ data: mockData, error: null });

			// Act & Assert
			await expect(service.getStoryboard("submission-1")).rejects.toThrow(
				"Failed to generate storyboard from outline",
			);
		});
	});

	describe("saveStoryboard", () => {
		it("should save storyboard successfully", async () => {
			// Arrange
			const storyboardData = {
				title: "Test Presentation",
				slides: [],
			};

			// Create a chain for the update operation
			const updateChain = createChainableMock();
			updateChain.eq.mockResolvedValue({ error: null });
			mockSupabase.from.mockReturnValue(updateChain);

			// Act
			const result = await service.saveStoryboard(
				"submission-1",
				storyboardData,
			);

			// Assert
			expect(result).toBe(true);
			expect(mockSupabase.from).toHaveBeenCalledWith(
				"building_blocks_submissions",
			);
			expect(updateChain.update).toHaveBeenCalledWith({
				storyboard: storyboardData,
			});
			expect(updateChain.eq).toHaveBeenCalledWith("id", "submission-1");
		});

		it("should handle missing storyboard column during save", async () => {
			// Arrange
			const storyboardData = { title: "Test", slides: [] };
			const columnError = { message: "column 'storyboard' does not exist" };
			
			// Create a chain for the update operation
			const updateChain = createChainableMock();
			updateChain.eq.mockResolvedValue({ error: columnError });
			mockSupabase.from.mockReturnValue(updateChain);

			// Act
			const result = await service.saveStoryboard(
				"submission-1",
				storyboardData,
			);

			// Assert
			expect(result).toBe(false);
			const { toast } = await import("@kit/ui/sonner");
			expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
				"Storyboard feature is not fully set up yet. Database migration needed.",
			);
		});

		it("should handle database errors during save", async () => {
			// Arrange
			const storyboardData = { title: "Test", slides: [] };
			const dbError = { message: "Database connection failed" };

			// Create a chain for the update operation
			const updateChain = createChainableMock();
			updateChain.eq.mockResolvedValue({ error: dbError });
			mockSupabase.from.mockReturnValue(updateChain);

			// Act
			const result = await service.saveStoryboard("submission-1", storyboardData);

			// Assert
			expect(result).toBe(false);
			const { toast } = await import("@kit/ui/sonner");
			expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
				"Failed to save storyboard",
			);
		});

		it("should handle exceptions during save operation", async () => {
			// Arrange
			const storyboardData = { title: "Test", slides: [] };
			
			// Create a chain that throws an error
			const updateChain = createChainableMock();
			updateChain.update.mockImplementation(() => {
				throw new Error("Network error");
			});
			mockSupabase.from.mockReturnValue(updateChain);

			// Act
			const result = await service.saveStoryboard(
				"submission-1",
				storyboardData,
			);

			// Assert
			expect(result).toBe(false);
			const { toast } = await import("@kit/ui/sonner");
			expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
				"Failed to save storyboard",
			);
		});
	});

	describe("listPresentations", () => {
		it("should return list of presentations ordered by creation date", async () => {
			// Arrange
			const mockPresentations = [
				{ id: "sub-2", title: "Recent Presentation", created_at: "2024-01-02" },
				{ id: "sub-1", title: "Older Presentation", created_at: "2024-01-01" },
			];

			// Create a chain for the list operation
			const listChain = createChainableMock();
			listChain.order.mockResolvedValue({
				data: mockPresentations,
				error: null,
			});
			mockSupabase.from.mockReturnValue(listChain);

			// Act
			const result = await service.listPresentations();

			// Assert
			expect(result).toEqual(mockPresentations);
			expect(mockSupabase.from).toHaveBeenCalledWith(
				"building_blocks_submissions",
			);
			expect(listChain.select).toHaveBeenCalledWith("id, title, created_at");
			expect(listChain.order).toHaveBeenCalledWith("created_at", {
				ascending: false,
			});
		});

		it("should return empty array when no presentations exist", async () => {
			// Arrange
			const listChain = createChainableMock();
			listChain.order.mockResolvedValue({ data: [], error: null });
			mockSupabase.from.mockReturnValue(listChain);

			// Act
			const result = await service.listPresentations();

			// Assert
			expect(result).toEqual([]);
		});

		it("should handle database errors during listing", async () => {
			// Arrange
			const dbError = new Error("Database connection failed");
			const listChain = createChainableMock();
			listChain.order.mockResolvedValue({ data: null, error: dbError });
			mockSupabase.from.mockReturnValue(listChain);

			// Act & Assert
			await expect(service.listPresentations()).rejects.toThrow(
				"Failed to list presentations",
			);
		});
	});

	describe("generatePowerPoint", () => {
		it("should throw not implemented error", async () => {
			// Arrange
			const storyboardData = { title: "Test", slides: [] };

			// Act & Assert
			await expect(service.generatePowerPoint(storyboardData)).rejects.toThrow(
				"Failed to generate PowerPoint",
			);
		});
	});

	describe("generateStoryboardFromOutline (private method testing)", () => {
		it("should generate slides from headings with correct layouts", async () => {
			// Arrange
			const mockOutline = {
				content: [
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "Main Title" }],
					},
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Content Slide" }],
					},
				],
			};

			const mockData = {
				id: "submission-1",
				title: "Test Presentation",
				outline: JSON.stringify(mockOutline),
				storyboard: null,
			};

			const fromResult = mockSupabase.from();
			fromResult.single.mockResolvedValue({ data: mockData, error: null });
			
			// Mock the save operation
			const updateChain = createChainableMock();
			updateChain.eq.mockResolvedValue({ error: null });
			mockSupabase.from.mockReturnValueOnce(fromResult).mockReturnValueOnce(updateChain);

			// Act
			const result = await service.getStoryboard("submission-1");

			// Assert
			expect(result.slides).toHaveLength(2);
			expect(result.slides[0]?.layoutId).toBe("title"); // Level 1 heading
			expect(result.slides[1]?.layoutId).toBe("content"); // Level 2 heading
		});

		it("should handle subheadlines from level 3 headings", async () => {
			// Arrange
			const mockOutline = {
				content: [
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Main Slide" }],
					},
					{
						type: "heading",
						attrs: { level: 3 },
						content: [{ type: "text", text: "Subheading 1" }],
					},
					{
						type: "heading",
						attrs: { level: 3 },
						content: [{ type: "text", text: "Subheading 2" }],
					},
				],
			};

			const mockData = {
				id: "submission-1",
				title: "Test Presentation",
				outline: JSON.stringify(mockOutline),
				storyboard: null,
			};

			const fromResult = mockSupabase.from();
			fromResult.single.mockResolvedValue({ data: mockData, error: null });
			
			// Mock the save operation
			const updateChain = createChainableMock();
			updateChain.eq.mockResolvedValue({ error: null });
			mockSupabase.from.mockReturnValueOnce(fromResult).mockReturnValueOnce(updateChain);

			// Act
			const result = await service.getStoryboard("submission-1");

			// Assert
			expect(result.slides).toHaveLength(1);
			expect(result.slides[0]?.subheadlines).toEqual([
				"Subheading 1",
				"Subheading 2",
			]);
		});

		it("should create default title slide when no content exists", async () => {
			// Arrange
			const mockOutline = { content: [] };
			const mockData = {
				id: "submission-1",
				title: "Empty Presentation",
				outline: JSON.stringify(mockOutline),
				storyboard: null,
			};

			const fromResult = mockSupabase.from();
			fromResult.single.mockResolvedValue({ data: mockData, error: null });
			
			// Mock the save operation
			const updateChain = createChainableMock();
			updateChain.eq.mockResolvedValue({ error: null });
			mockSupabase.from.mockReturnValueOnce(fromResult).mockReturnValueOnce(updateChain);

			// Act
			const result = await service.getStoryboard("submission-1");

			// Assert
			expect(result.slides).toHaveLength(1);
			expect(result.slides[0]?.title).toBe("Empty Presentation");
			expect(result.slides[0]?.layoutId).toBe("title");
		});

		it("should extract title from first level 1 heading", async () => {
			// Arrange
			const mockOutline = {
				content: [
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Not Title" }],
					},
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "Actual Title" }],
					},
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "Another Title" }],
					},
				],
			};

			const mockData = {
				id: "submission-1",
				title: "Default Title",
				outline: JSON.stringify(mockOutline),
				storyboard: null,
			};

			const fromResult = mockSupabase.from();
			fromResult.single.mockResolvedValue({ data: mockData, error: null });
			
			// Mock the save operation
			const updateChain = createChainableMock();
			updateChain.eq.mockResolvedValue({ error: null });
			mockSupabase.from.mockReturnValueOnce(fromResult).mockReturnValueOnce(updateChain);

			// Act
			const result = await service.getStoryboard("submission-1");

			// Assert
			expect(result.title).toBe("Actual Title");
		});

		it("should handle nested text content in headings", async () => {
			// Arrange
			const mockOutline = {
				content: [
					{
						type: "heading",
						attrs: { level: 1 },
						content: [
							{ type: "text", text: "Start " },
							{
								type: "strong",
								content: [{ type: "text", text: "Bold" }],
							},
							{ type: "text", text: " End" },
						],
					},
				],
			};

			const mockData = {
				id: "submission-1",
				title: "Test",
				outline: JSON.stringify(mockOutline),
				storyboard: null,
			};

			const fromResult = mockSupabase.from();
			fromResult.single.mockResolvedValue({ data: mockData, error: null });
			
			// Mock the save operation
			const updateChain = createChainableMock();
			updateChain.eq.mockResolvedValue({ error: null });
			mockSupabase.from.mockReturnValueOnce(fromResult).mockReturnValueOnce(updateChain);

			// Act
			const result = await service.getStoryboard("submission-1");

			// Assert
			expect(result.title).toBe("Start Bold End");
			expect(result.slides[0]?.title).toBe("Start Bold End");
		});

		it("should handle outline without content property", async () => {
			// Arrange
			const mockOutline = {}; // No content property
			const mockData = {
				id: "submission-1",
				title: "Fallback Title",
				outline: JSON.stringify(mockOutline),
				storyboard: null,
			};

			const fromResult = mockSupabase.from();
			fromResult.single.mockResolvedValue({ data: mockData, error: null });
			
			// Mock the save operation
			const updateChain = createChainableMock();
			updateChain.eq.mockResolvedValue({ error: null });
			mockSupabase.from.mockReturnValueOnce(fromResult).mockReturnValueOnce(updateChain);

			// Act
			const result = await service.getStoryboard("submission-1");

			// Assert
			expect(result.slides).toHaveLength(1);
			expect(result.slides[0]?.title).toBe("Fallback Title");
			expect(result.slides[0]?.layoutId).toBe("title");
		});

		it("should assign proper order to slides", async () => {
			// Arrange
			const mockOutline = {
				content: [
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "Slide 1" }],
					},
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Slide 2" }],
					},
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Slide 3" }],
					},
				],
			};

			const mockData = {
				id: "submission-1",
				title: "Test",
				outline: JSON.stringify(mockOutline),
				storyboard: null,
			};

			const fromResult = mockSupabase.from();
			fromResult.single.mockResolvedValue({ data: mockData, error: null });
			
			// Mock the save operation
			const updateChain = createChainableMock();
			updateChain.eq.mockResolvedValue({ error: null });
			mockSupabase.from.mockReturnValueOnce(fromResult).mockReturnValueOnce(updateChain);

			// Act
			const result = await service.getStoryboard("submission-1");

			// Assert
			expect(result.slides).toHaveLength(3);
			expect(result.slides?.[0]?.order).toBe(0);
			expect(result.slides?.[1]?.order).toBe(1);
			expect(result.slides?.[2]?.order).toBe(2);
		});

		it("should handle nodes without text content", async () => {
			// Arrange
			const mockOutline = {
				content: [
					{
						type: "heading",
						attrs: { level: 1 },
						content: [], // No text content
					},
				],
			};

			const mockData = {
				id: "submission-1",
				title: "Test",
				outline: JSON.stringify(mockOutline),
				storyboard: null,
			};

			const fromResult = mockSupabase.from();
			fromResult.single.mockResolvedValue({ data: mockData, error: null });
			
			// Mock the save operation
			const updateChain = createChainableMock();
			updateChain.eq.mockResolvedValue({ error: null });
			mockSupabase.from.mockReturnValueOnce(fromResult).mockReturnValueOnce(updateChain);

			// Act
			const result = await service.getStoryboard("submission-1");

			// Assert
			expect(result.slides).toHaveLength(1);
			expect(result.slides[0]?.title).toBe(""); // Empty string from no content
		});
	});

	describe("edge cases and error handling", () => {
		it("should handle complex nested outline structure", async () => {
			// Arrange
			const complexOutline = {
				content: [
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "Main Title" }],
					},
					{
						type: "paragraph",
						content: [{ type: "text", text: "Some paragraph content" }],
					},
					{
						type: "heading",
						attrs: { level: 2 },
						content: [{ type: "text", text: "Section 1" }],
					},
					{
						type: "bulletList",
						content: [
							{
								type: "listItem",
								content: [
									{
										type: "paragraph",
										content: [{ type: "text", text: "Bullet point" }],
									},
								],
							},
						],
					},
					{
						type: "heading",
						attrs: { level: 3 },
						content: [{ type: "text", text: "Subsection" }],
					},
				],
			};

			const mockData = {
				id: "submission-1",
				title: "Complex Presentation",
				outline: JSON.stringify(complexOutline),
				storyboard: null,
			};

			const fromResult = mockSupabase.from();
			fromResult.single.mockResolvedValue({ data: mockData, error: null });
			
			// Mock the save operation
			const updateChain = createChainableMock();
			updateChain.eq.mockResolvedValue({ error: null });
			mockSupabase.from.mockReturnValueOnce(fromResult).mockReturnValueOnce(updateChain);

			// Act
			const result = await service.getStoryboard("submission-1");

			// Assert
			expect(result.title).toBe("Main Title");
			expect(result.slides).toHaveLength(2); // Level 1 and level 2 headings only
			expect(result.slides[0]?.title).toBe("Main Title");
			expect(result.slides[1]?.title).toBe("Section 1");
			expect(result.slides[1]?.subheadlines).toEqual(["Subsection"]);
		});

		it("should handle outline as object instead of string", async () => {
			// Arrange
			const mockOutline = {
				content: [
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "Object Title" }],
					},
				],
			};

			const mockData = {
				id: "submission-1",
				title: "Test",
				outline: mockOutline, // Object instead of string
				storyboard: null,
			};

			const fromResult = mockSupabase.from();
			fromResult.single.mockResolvedValue({ data: mockData, error: null });
			
			// Mock the save operation
			const updateChain = createChainableMock();
			updateChain.eq.mockResolvedValue({ error: null });
			mockSupabase.from.mockReturnValueOnce(fromResult).mockReturnValueOnce(updateChain);

			// Act
			const result = await service.getStoryboard("submission-1");

			// Assert
			expect(result.title).toBe("Object Title");
			expect(result.slides).toHaveLength(1);
		});
	});
});
