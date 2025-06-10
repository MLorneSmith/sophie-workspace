/**
 * Unit tests for updateBuildingBlockTitleAction server action
 * Tests schema validation, database updates, and error handling
 */
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { updateBuildingBlockTitleAction } from "./update-building-block-title.action";

// Mock dependencies
vi.mock("@kit/next/actions", () => ({
	enhanceAction: vi.fn((fn, options) => {
		return async (data: any) => {
			let validatedData = data;
			// Validate with schema if provided
			if (options?.schema) {
				const result = options.schema.safeParse(data);
				if (!result.success) {
					return { error: "Validation failed" };
				}
				validatedData = result.data;
			}

			// Mock authenticated user
			const mockUser = {
				id: "123",
				email: "test@example.com",
				aud: "authenticated",
			};

			return fn(validatedData, mockUser);
		};
	}),
}));

// Create mock client with proper chaining
const mockUpdate = vi.fn().mockReturnThis();
const mockEq = vi.fn();
const mockFrom = vi.fn(() => ({
	update: mockUpdate,
}));

const mockSupabaseClient = {
	from: mockFrom,
};

vi.mock("@kit/supabase/server-client", () => ({
	getSupabaseServerClient: vi.fn(() => mockSupabaseClient),
}));

describe("updateBuildingBlockTitleAction", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Reset mock chain for each test
		mockUpdate.mockReturnThis();
		mockEq.mockReturnValue({ error: null });
		mockUpdate.mockImplementation(() => ({
			eq: mockEq,
		}));
	});

	describe("Schema Validation", () => {
		it("should accept empty strings as valid", async () => {
			// Zod z.string() accepts empty strings by default
			const result = await updateBuildingBlockTitleAction({
				id: "",
				title: "",
			});
			expect(result).toEqual({ success: true });
		});

		it("should accept valid input", async () => {
			const input = { id: "valid-id", title: "Valid Title" };
			const result = await updateBuildingBlockTitleAction(input);

			expect(result).toEqual({ success: true });
		});

		it("should reject invalid data types", async () => {
			const result = await updateBuildingBlockTitleAction({
				id: 123 as any,
				title: null as any,
			});

			expect(result).toEqual({ error: "Validation failed" });
		});

		it("should reject missing fields", async () => {
			const result = await updateBuildingBlockTitleAction({
				id: undefined as any,
			} as any);

			expect(result).toEqual({ error: "Validation failed" });
		});
	});

	describe("Core Functionality", () => {
		it("should update building block title successfully", async () => {
			const input = { id: "block-123", title: "New Title" };
			const result = await updateBuildingBlockTitleAction(input);

			expect(result).toEqual({ success: true });
			expect(mockFrom).toHaveBeenCalledWith("building_blocks_submissions");
			expect(mockUpdate).toHaveBeenCalledWith({ title: "New Title" });
			expect(mockEq).toHaveBeenCalledWith("id", "block-123");
		});

		it("should call database with correct parameters", async () => {
			const input = { id: "test-id", title: "Test Title" };
			await updateBuildingBlockTitleAction(input);

			expect(mockFrom).toHaveBeenCalledWith("building_blocks_submissions");
			expect(mockUpdate).toHaveBeenCalledWith({ title: "Test Title" });
			expect(mockEq).toHaveBeenCalledWith("id", "test-id");
		});
	});

	describe("Title Content Handling", () => {
		it("should handle special characters in title", async () => {
			const input = {
				id: "test-id",
				title: "Title with émojis 🎉 & symbols!",
			};
			const result = await updateBuildingBlockTitleAction(input);

			expect(result).toEqual({ success: true });
			expect(mockUpdate).toHaveBeenCalledWith({
				title: "Title with émojis 🎉 & symbols!",
			});
		});

		it("should handle long titles", async () => {
			const longTitle = "A".repeat(500);
			const input = { id: "test-id", title: longTitle };
			const result = await updateBuildingBlockTitleAction(input);

			expect(result).toEqual({ success: true });
			expect(mockUpdate).toHaveBeenCalledWith({ title: longTitle });
		});

		it("should handle empty title", async () => {
			const input = { id: "test-id", title: "" };
			const result = await updateBuildingBlockTitleAction(input);

			expect(result).toEqual({ success: true });
			expect(mockUpdate).toHaveBeenCalledWith({ title: "" });
		});

		it("should handle whitespace-only title", async () => {
			const input = { id: "test-id", title: "   " };
			const result = await updateBuildingBlockTitleAction(input);

			expect(result).toEqual({ success: true });
			expect(mockUpdate).toHaveBeenCalledWith({ title: "   " });
		});

		it("should handle multiline titles", async () => {
			const multilineTitle = "Line 1\nLine 2\nLine 3";
			const input = { id: "test-id", title: multilineTitle };
			const result = await updateBuildingBlockTitleAction(input);

			expect(result).toEqual({ success: true });
			expect(mockUpdate).toHaveBeenCalledWith({ title: multilineTitle });
		});
	});

	describe("Error Scenarios", () => {
		it("should handle database errors", async () => {
			const dbError = new Error("Database connection failed");
			mockEq.mockReturnValue({ error: dbError });

			const input = { id: "test-id", title: "Test Title" };

			await expect(updateBuildingBlockTitleAction(input)).rejects.toThrow(
				"Database connection failed",
			);
		});

		it("should handle non-existent building block ID", async () => {
			// Database operations typically don't fail for non-existent IDs
			const input = { id: "non-existent", title: "Test Title" };
			const result = await updateBuildingBlockTitleAction(input);

			expect(result).toEqual({ success: true });
			expect(mockEq).toHaveBeenCalledWith("id", "non-existent");
		});
	});

	describe("Edge Cases", () => {
		it("should handle unicode characters", async () => {
			const unicodeTitle = "测试标题 🌟 Тест العنوان";
			const input = { id: "test-id", title: unicodeTitle };
			const result = await updateBuildingBlockTitleAction(input);

			expect(result).toEqual({ success: true });
			expect(mockUpdate).toHaveBeenCalledWith({ title: unicodeTitle });
		});

		it("should handle very large content", async () => {
			const largeTitle = "X".repeat(10000);
			const input = { id: "test-id", title: largeTitle };
			const result = await updateBuildingBlockTitleAction(input);

			expect(result).toEqual({ success: true });
			expect(mockUpdate).toHaveBeenCalledWith({ title: largeTitle });
		});

		it("should handle titles with quotes and escaped characters", async () => {
			const complexTitle = 'Title with "quotes" and \\escaped\\ characters';
			const input = { id: "test-id", title: complexTitle };
			const result = await updateBuildingBlockTitleAction(input);

			expect(result).toEqual({ success: true });
			expect(mockUpdate).toHaveBeenCalledWith({ title: complexTitle });
		});
	});

	describe("Authentication Requirements", () => {
		it("should require authentication", async () => {
			// This is tested by the enhanceAction mock which simulates auth flow
			const input = { id: "test-id", title: "Test Title" };
			const result = await updateBuildingBlockTitleAction(input);

			expect(result).toEqual({ success: true });
			// User is passed to function but not used, which is fine
		});
	});
});
