/**
 * Unit tests for storyboard-service.ts
 * Tests server actions for storyboard data management and transformation
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies before importing the module under test
const mockSupabaseClient = {
	from: vi.fn(() => ({
		select: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		single: vi.fn(),
		update: vi.fn().mockReturnThis(),
		order: vi.fn(),
	})),
};

const mockLogger = {
	error: vi.fn(),
	warn: vi.fn(),
	info: vi.fn(),
};

const mockTipTapTransformer = {
	transform: vi.fn(),
};

// Setup mocks
vi.mock("@kit/supabase/server-client", () => ({
	getSupabaseServerClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock("@kit/shared/logger", () => ({
	getLogger: vi.fn(() => Promise.resolve(mockLogger)),
}));

vi.mock("./tiptap-transformer", () => ({
	TipTapTransformer: mockTipTapTransformer,
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("@kit/next/actions", () => ({
	enhanceAction: vi.fn((fn, options) => {
		return async (data: any) => {
			// Validate with schema if provided
			if (options?.schema) {
				const result = options.schema.safeParse(data);
				if (!result.success) {
					throw new Error("Validation failed");
				}
				data = result.data;
			}

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

// Mock console.error to prevent test output pollution
const originalConsoleError = console.error;

// Import the functions to test after mocks are set up
import {
	getPresentationAction,
	getPresentationsAction,
	saveStoryboardAction,
} from "./storyboard-service";

describe("Storyboard Service", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Mock console.error to prevent test output pollution
		console.error = vi.fn();
	});

	afterEach(() => {
		// Restore console.error
		console.error = originalConsoleError;
	});

	describe("getPresentationAction", () => {
		const mockPresentationData = {
			id: "presentation-123",
			title: "Test Presentation",
			outline: {
				type: "doc",
				content: [
					{
						type: "heading",
						attrs: { level: 1 },
						content: [{ type: "text", text: "Test Title" }],
					},
				],
			},
			storyboard: {
				title: "Test Presentation",
				slides: [
					{
						id: "slide-1",
						title: "Test Title",
						layoutId: "title",
						content: [],
						order: 0,
					},
				],
			},
		};

		it("should successfully retrieve presentation with existing storyboard", async () => {
			// Arrange
			const mockQuery = mockSupabaseClient.from();
			mockQuery.single.mockResolvedValue({
				data: mockPresentationData,
				error: null,
			});

			// Act
			const result = await getPresentationAction({
				presentationId: "presentation-123",
			});

			// Assert
			expect(mockSupabaseClient.from).toHaveBeenCalledWith(
				"building_blocks_submissions",
			);
			expect(mockQuery.select).toHaveBeenCalledWith(
				"id, title, outline, storyboard",
			);
			expect(mockQuery.eq).toHaveBeenCalledWith("id", "presentation-123");
			expect(result).toEqual(mockPresentationData);
		});

		it("should generate storyboard from outline when storyboard is missing", async () => {
			// Arrange
			const presentationWithoutStoryboard = {
				...mockPresentationData,
				storyboard: null,
			};

			const mockQuery = mockSupabaseClient.from();
			mockQuery.single.mockResolvedValue({
				data: presentationWithoutStoryboard,
				error: null,
			});

			const mockGeneratedStoryboard = {
				title: "Test Presentation",
				slides: [
					{
						id: "generated-slide",
						title: "Generated",
						layoutId: "title",
						content: [],
						order: 0,
					},
				],
			};
			mockTipTapTransformer.transform.mockReturnValue(mockGeneratedStoryboard);
			mockQuery.update.mockResolvedValue({ data: null, error: null });

			// Act
			const result = await getPresentationAction({
				presentationId: "presentation-123",
			});

			// Assert
			expect(mockTipTapTransformer.transform).toHaveBeenCalledWith(
				mockPresentationData.outline,
				"Test Presentation",
			);
			expect(mockQuery.update).toHaveBeenCalledWith({
				storyboard: mockGeneratedStoryboard,
			});
			expect(result).toEqual({
				...presentationWithoutStoryboard,
				storyboard: mockGeneratedStoryboard,
			});
		});

		it("should handle missing storyboard column gracefully", async () => {
			// Arrange
			const storyboardColumnError = new Error(
				"column 'storyboard' does not exist",
			);
			const mockQuery = mockSupabaseClient.from();

			// First call fails with column error, second succeeds with fallback
			mockQuery.single
				.mockResolvedValueOnce({ data: null, error: storyboardColumnError })
				.mockResolvedValueOnce({
					data: {
						id: "presentation-123",
						title: "Test",
						outline: mockPresentationData.outline,
					},
					error: null,
				});

			const mockGeneratedStoryboard = {
				title: "Test",
				slides: [
					{
						id: "generated-slide",
						title: "Generated",
						layoutId: "title",
						content: [],
						order: 0,
					},
				],
			};
			mockTipTapTransformer.transform.mockReturnValue(mockGeneratedStoryboard);

			// Act
			const result = await getPresentationAction({
				presentationId: "presentation-123",
			});

			// Assert
			expect(mockLogger.error).toHaveBeenCalledWith(
				{
					error: storyboardColumnError.message,
					presentationId: "presentation-123",
				},
				"Error fetching presentation from Supabase",
			);
			expect(mockQuery.select).toHaveBeenCalledWith("id, title, outline");
			expect(mockTipTapTransformer.transform).toHaveBeenCalled();
			expect(result.storyboard).toEqual(mockGeneratedStoryboard);
		});

		it("should handle presentation not found", async () => {
			// Arrange
			const notFoundError = new Error("No rows returned");
			const mockQuery = mockSupabaseClient.from();
			mockQuery.single.mockResolvedValue({
				data: null,
				error: notFoundError,
			});

			// Act & Assert
			await expect(
				getPresentationAction({ presentationId: "non-existent" }),
			).rejects.toThrow("No rows returned");
		});

		it("should handle invalid JSON in outline", async () => {
			// Arrange
			const presentationWithInvalidOutline = {
				id: "presentation-123",
				title: "Test",
				outline: "invalid json string",
				storyboard: null,
			};

			const mockQuery = mockSupabaseClient.from();
			mockQuery.single.mockResolvedValue({
				data: presentationWithInvalidOutline,
				error: null,
			});

			mockTipTapTransformer.transform.mockImplementation(() => {
				throw new Error("Invalid JSON");
			});

			// Act
			const result = await getPresentationAction({
				presentationId: "presentation-123",
			});

			// Assert
			expect(result).toEqual(presentationWithInvalidOutline);
			expect(console.error).toHaveBeenCalledWith(
				"Error transforming outline to storyboard:",
				expect.any(Error),
			);
		});

		it("should validate input schema", async () => {
			// Act & Assert
			await expect(
				getPresentationAction({ presentationId: 123 } as any),
			).rejects.toThrow("Validation failed");
		});
	});

	describe("getPresentationsAction", () => {
		it("should successfully retrieve list of presentations", async () => {
			// Arrange
			const mockPresentations = [
				{
					id: "p1",
					title: "Presentation 1",
					created_at: "2025-01-01T00:00:00Z",
				},
				{
					id: "p2",
					title: "Presentation 2",
					created_at: "2025-01-02T00:00:00Z",
				},
			];

			const mockQuery = mockSupabaseClient.from();
			mockQuery.order.mockResolvedValue({
				data: mockPresentations,
				error: null,
			});

			// Act
			const result = await getPresentationsAction({});

			// Assert
			expect(mockSupabaseClient.from).toHaveBeenCalledWith(
				"building_blocks_submissions",
			);
			expect(mockQuery.select).toHaveBeenCalledWith("id, title, created_at");
			expect(mockQuery.order).toHaveBeenCalledWith("created_at", {
				ascending: false,
			});
			expect(result).toEqual(mockPresentations);
		});

		it("should return empty array when no presentations exist", async () => {
			// Arrange
			const mockQuery = mockSupabaseClient.from();
			mockQuery.order.mockResolvedValue({
				data: [],
				error: null,
			});

			// Act
			const result = await getPresentationsAction({});

			// Assert
			expect(result).toEqual([]);
		});

		it("should handle database query errors", async () => {
			// Arrange
			const dbError = new Error("Database connection failed");
			const mockQuery = mockSupabaseClient.from();
			mockQuery.order.mockResolvedValue({
				data: null,
				error: dbError,
			});

			// Act & Assert
			await expect(getPresentationsAction({})).rejects.toThrow(
				"Failed to fetch presentations",
			);

			expect(mockLogger.error).toHaveBeenCalledWith(
				{ error: dbError },
				"Error fetching presentations",
			);
		});
	});

	describe("saveStoryboardAction", () => {
		const mockStoryboardData = {
			title: "Test Presentation",
			slides: [
				{
					id: "slide-1",
					title: "Slide 1",
					slideType: "title" as const,
					subheadlines: [],
					layoutId: "title",
					content: [
						{
							type: "text" as const,
							text: "Sample content",
							columnIndex: 0,
						},
					],
					order: 0,
				},
			],
		};

		it("should successfully save valid storyboard data", async () => {
			// Arrange
			const mockQuery = mockSupabaseClient.from();
			mockQuery.eq.mockResolvedValue({
				data: null,
				error: null,
			});

			// Act
			const result = await saveStoryboardAction({
				presentationId: "presentation-123",
				storyboard: mockStoryboardData,
			});

			// Assert
			expect(mockSupabaseClient.from).toHaveBeenCalledWith(
				"building_blocks_submissions",
			);
			expect(mockQuery.update).toHaveBeenCalledWith({
				storyboard: mockStoryboardData,
			});
			expect(mockQuery.eq).toHaveBeenCalledWith("id", "presentation-123");
			expect(result).toEqual({ success: true });
		});

		it("should handle missing storyboard column error", async () => {
			// Arrange
			const storyboardColumnError = new Error(
				"column 'storyboard' does not exist",
			);
			const mockQuery = mockSupabaseClient.from();
			mockQuery.eq.mockResolvedValue({
				data: null,
				error: storyboardColumnError,
			});

			// Act & Assert
			await expect(
				saveStoryboardAction({
					presentationId: "presentation-123",
					storyboard: mockStoryboardData,
				}),
			).rejects.toThrow(
				"Storyboard feature is not fully set up yet. Please run the latest database migrations.",
			);

			expect(mockLogger.error).toHaveBeenCalledWith(
				{
					presentationId: "presentation-123",
					error: storyboardColumnError.message,
				},
				"Error saving storyboard to Supabase",
			);
		});

		it("should handle general database errors", async () => {
			// Arrange
			const dbError = new Error("Database constraint violation");
			const mockQuery = mockSupabaseClient.from();
			mockQuery.eq.mockResolvedValue({
				data: null,
				error: dbError,
			});

			// Act & Assert
			await expect(
				saveStoryboardAction({
					presentationId: "presentation-123",
					storyboard: mockStoryboardData,
				}),
			).rejects.toThrow(
				"Failed to save storyboard data. Please try again. Details: Database constraint violation",
			);

			expect(mockLogger.error).toHaveBeenCalledWith(
				{
					presentationId: "presentation-123",
					error: dbError.message,
				},
				"Error saving storyboard to Supabase",
			);
		});

		it("should validate storyboard data against schema", async () => {
			// Arrange
			const invalidStoryboardData = {
				title: 123, // Should be string
				slides: "invalid", // Should be array
			};

			// Act & Assert
			await expect(
				saveStoryboardAction({
					presentationId: "presentation-123",
					storyboard: invalidStoryboardData as any,
				}),
			).rejects.toThrow("Validation failed");
		});
	});

	describe("Edge Cases", () => {
		it("should handle null outline gracefully in getPresentationAction", async () => {
			// Arrange
			const presentationWithNullOutline = {
				id: "presentation-123",
				title: "Test",
				outline: null,
				storyboard: null,
			};

			const mockQuery = mockSupabaseClient.from();
			mockQuery.single.mockResolvedValue({
				data: presentationWithNullOutline,
				error: null,
			});

			// Act
			const result = await getPresentationAction({
				presentationId: "presentation-123",
			});

			// Assert
			expect(result).toEqual(presentationWithNullOutline);
			expect(mockTipTapTransformer.transform).not.toHaveBeenCalled();
		});

		it("should handle empty string presentation ID", async () => {
			// Act & Assert
			await expect(
				getPresentationAction({ presentationId: "" }),
			).rejects.toThrow("Validation failed");
		});
	});
});
