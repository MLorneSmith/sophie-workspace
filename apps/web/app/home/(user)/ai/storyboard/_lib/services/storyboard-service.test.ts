/**
 * Unit tests for storyboard-service.ts
 * Tests server actions for storyboard data management and transformation
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Setup mocks
vi.mock("@kit/supabase/server-client", () => ({
	getSupabaseServerClient: vi.fn(() => ({
		from: vi.fn(() => ({
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			single: vi.fn(),
			update: vi.fn().mockReturnThis(),
			order: vi.fn(),
		})),
	})),
}));

vi.mock("@kit/shared/logger", () => ({
	getLogger: vi.fn(() =>
		Promise.resolve({
			error: vi.fn(),
			warn: vi.fn(),
			info: vi.fn(),
		}),
	),
}));

vi.mock("./tiptap-transformer", () => ({
	TipTapTransformer: {
		transform: vi.fn(),
	},
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("@kit/next/actions", () => ({
	enhanceAction: vi.fn((fn, options) => {
		return async (inputData: unknown) => {
			let data = inputData;
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

import { getLogger } from "@kit/shared/logger";
// Import mocked modules
import { getSupabaseServerClient } from "@kit/supabase/server-client";
// Import the functions to test after mocks are set up
import {
	getPresentationAction,
	getPresentationsAction,
	saveStoryboardAction,
} from "./storyboard-service";
import { TipTapTransformer } from "./tiptap-transformer";

// Create typed mocks using vi.mocked
const mockSupabaseClient = vi.mocked(getSupabaseServerClient);
const mockLogger = vi.mocked(getLogger);
const mockTipTapTransformer = vi.mocked(TipTapTransformer);

// Create interfaces for better type safety in tests
interface MockSupabaseQuery {
	select: ReturnType<typeof vi.fn>;
	eq: ReturnType<typeof vi.fn>;
	single: ReturnType<typeof vi.fn>;
	update: ReturnType<typeof vi.fn>;
	order: ReturnType<typeof vi.fn>;
}

describe("Storyboard Service", () => {
	let mockQuery: MockSupabaseQuery;

	beforeEach(async () => {
		vi.clearAllMocks();

		// Mock console.error to prevent test output pollution
		console.error = vi.fn();

		// Set up fresh mock query object for each test
		mockQuery = {
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			single: vi.fn(),
			update: vi.fn(() => ({
				eq: vi.fn().mockResolvedValue({ data: null, error: null }),
			})),
			order: vi.fn(),
		};

		// Set up supabase client mock
		mockSupabaseClient.mockReturnValue({
			from: vi.fn().mockReturnValue(mockQuery),
		} as unknown as ReturnType<typeof getSupabaseServerClient>);

		// Set up logger mock
		mockLogger.mockReturnValue({
			error: vi.fn(),
			warn: vi.fn(),
			info: vi.fn(),
		} as unknown as ReturnType<typeof getLogger>);
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
			mockQuery.single.mockResolvedValue({
				data: mockPresentationData,
				error: null,
			});

			// Act
			const result = await getPresentationAction({
				presentationId: "presentation-123",
			});

			// Assert
			const supabaseInstance = mockSupabaseClient();
			expect(supabaseInstance.from).toHaveBeenCalledWith(
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

			mockQuery.single.mockResolvedValue({
				data: presentationWithoutStoryboard,
				error: null,
			});

			const mockGeneratedStoryboard = {
				title: "Test Presentation",
				slides: [
					{
						id: "generated-slide",
						slideType: "title" as const,
						title: "Generated",
						subheadlines: [],
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
						slideType: "title" as const,
						title: "Generated",
						subheadlines: [],
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
			const loggerInstance = await mockLogger();
			expect(loggerInstance.error).toHaveBeenCalledWith(
				"Error fetching presentation from Supabase",
				{
					error: storyboardColumnError.message,
					presentationId: "presentation-123",
				},
			);
			expect(mockQuery.select).toHaveBeenCalledWith("id, title, outline");
			expect(mockTipTapTransformer.transform).toHaveBeenCalled();
			expect(result.storyboard).toEqual(mockGeneratedStoryboard);
		});

		it("should handle presentation not found", async () => {
			// Arrange
			const notFoundError = new Error("No rows returned");
			mockQuery.single.mockResolvedValue({
				data: null,
				error: notFoundError,
			});

			// Act & Assert
			await expect(
				getPresentationAction({ presentationId: "non-existent" }),
			).rejects.toThrow("Failed to load presentation data.");
		});

		it("should handle invalid JSON in outline", async () => {
			// Arrange
			const presentationWithInvalidOutline = {
				id: "presentation-123",
				title: "Test",
				outline: "invalid json string",
				storyboard: null,
			};

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
			const loggerInstance = await mockLogger();
			expect(loggerInstance.error).toHaveBeenCalledWith(
				"Error transforming outline to storyboard",
				expect.objectContaining({
					error: expect.any(String),
					presentationId: "presentation-123",
				}),
			);
		});

		it("should validate input schema", async () => {
			// Act & Assert
			await expect(
				getPresentationAction({ presentationId: 123 } as unknown as Parameters<
					typeof getPresentationAction
				>[0]),
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

			mockQuery.order.mockResolvedValue({
				data: mockPresentations,
				error: null,
			});

			// Act
			const result = await getPresentationsAction({});

			// Assert
			const supabaseInstance = mockSupabaseClient();
			expect(supabaseInstance.from).toHaveBeenCalledWith(
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
			mockQuery.order.mockResolvedValue({
				data: null,
				error: dbError,
			});

			// Act & Assert
			await expect(getPresentationsAction({})).rejects.toThrow(
				"Failed to fetch presentations",
			);

			const loggerInstance = await mockLogger();
			expect(loggerInstance.error).toHaveBeenCalledWith(
				"Error fetching presentations",
				{ error: dbError },
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
			const mockUpdateChain = {
				eq: vi.fn().mockResolvedValue({
					data: null,
					error: null,
				}),
			};
			mockQuery.update.mockReturnValue(mockUpdateChain);

			// Act
			const result = await saveStoryboardAction({
				presentationId: "presentation-123",
				storyboard: mockStoryboardData,
			});

			// Assert
			const supabaseInstance = mockSupabaseClient();
			expect(supabaseInstance.from).toHaveBeenCalledWith(
				"building_blocks_submissions",
			);
			expect(mockQuery.update).toHaveBeenCalledWith({
				storyboard: mockStoryboardData,
			});
			expect(mockUpdateChain.eq).toHaveBeenCalledWith("id", "presentation-123");
			expect(result).toEqual({ success: true });
		});

		it("should handle missing storyboard column error", async () => {
			// Arrange
			const storyboardColumnError = new Error(
				"column 'storyboard' does not exist",
			);
			const mockUpdateChain = {
				eq: vi.fn().mockResolvedValue({
					data: null,
					error: storyboardColumnError,
				}),
			};
			mockQuery.update.mockReturnValue(mockUpdateChain);

			// Act & Assert
			await expect(
				saveStoryboardAction({
					presentationId: "presentation-123",
					storyboard: mockStoryboardData,
				}),
			).rejects.toThrow(
				"Storyboard feature is not fully set up yet. Please run the latest database migrations.",
			);

			const loggerInstance = await mockLogger();
			expect(loggerInstance.error).toHaveBeenCalledWith(
				"Error saving storyboard to Supabase",
				{
					presentationId: "presentation-123",
					error: storyboardColumnError.message,
				},
			);
		});

		it("should handle general database errors", async () => {
			// Arrange
			const dbError = new Error("Database constraint violation");
			const mockUpdateChain = {
				eq: vi.fn().mockResolvedValue({
					data: null,
					error: dbError,
				}),
			};
			mockQuery.update.mockReturnValue(mockUpdateChain);

			// Act & Assert
			await expect(
				saveStoryboardAction({
					presentationId: "presentation-123",
					storyboard: mockStoryboardData,
				}),
			).rejects.toThrow(
				"Failed to save storyboard data. Please try again. Details: Database constraint violation",
			);

			const loggerInstance = await mockLogger();
			expect(loggerInstance.error).toHaveBeenCalledWith(
				"Error saving storyboard to Supabase",
				{
					presentationId: "presentation-123",
					error: dbError.message,
				},
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
					storyboard: invalidStoryboardData as unknown as Parameters<
						typeof saveStoryboardAction
					>[0]["storyboard"],
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
			).rejects.toThrow("Failed to load presentation data.");
		});
	});
});
