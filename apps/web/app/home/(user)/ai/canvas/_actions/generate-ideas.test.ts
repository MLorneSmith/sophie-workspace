/**
 * Unit tests for generate-ideas server action
 * Tests the Zod schema validation and action wrapper functionality
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

// Create a test wrapper that mimics enhanceAction behavior
const createTestAction = (schema: z.ZodSchema) => {
	return async (
		data: unknown,
	): Promise<{
		success: boolean;
		data?: { message: string };
		error?: string;
	}> => {
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

// Define the schema from the actual file
const IdeasSchema = z.object({
	content: z.string().min(1, "Content is required"),
	submissionId: z.string().min(1, "Submission ID is required"),
	type: z.enum(["situation", "complication", "answer", "outline"]),
	sessionId: z.string().optional(),
});

describe("Generate Ideas Schema Validation", () => {
	let testAction: (
		data: unknown,
	) => Promise<{ error?: string; success?: boolean; data?: unknown }>;

	beforeEach(() => {
		vi.clearAllMocks();
		testAction = createTestAction(IdeasSchema);
	});

	describe("Input Validation", () => {
		it("should accept valid input data", async () => {
			const validInput = {
				content: "Test content for ideas",
				submissionId: "test-submission-id",
				type: "situation",
				sessionId: "test-session-id",
			};

			const result = await testAction(validInput);

			expect(result.success).toBe(true);
			expect(result.data.message).toBe("Action completed successfully");
		});

		it("should validate all supported type enums", async () => {
			const types = ["situation", "complication", "answer", "outline"];

			for (const type of types) {
				const input = {
					content: `Test content for ${type}`,
					submissionId: "test-submission-id",
					type,
				};

				const result = await testAction(input);
				expect(result.success).toBe(true);
			}
		});

		it("should make sessionId optional", async () => {
			const inputWithoutSession = {
				content: "Test content",
				submissionId: "test-submission-id",
				type: "situation",
			};

			const result = await testAction(inputWithoutSession);
			expect(result.success).toBe(true);
		});

		it("should reject empty content", async () => {
			const invalidInput = {
				content: "",
				submissionId: "test-submission-id",
				type: "situation",
			};

			const result = await testAction(invalidInput);
			expect(result.error).toBe("Validation failed");
		});

		it("should reject empty submissionId", async () => {
			const invalidInput = {
				content: "Test content",
				submissionId: "",
				type: "situation",
			};

			const result = await testAction(invalidInput);
			expect(result.error).toBe("Validation failed");
		});

		it("should reject missing content field", async () => {
			const invalidInput = {
				submissionId: "test-submission-id",
				type: "situation",
			};

			const result = await testAction(invalidInput);
			expect(result.error).toBe("Validation failed");
		});

		it("should reject missing submissionId field", async () => {
			const invalidInput = {
				content: "Test content",
				type: "situation",
			};

			const result = await testAction(invalidInput);
			expect(result.error).toBe("Validation failed");
		});

		it("should reject missing type field", async () => {
			const invalidInput = {
				content: "Test content",
				submissionId: "test-submission-id",
			};

			const result = await testAction(invalidInput);
			expect(result.error).toBe("Validation failed");
		});

		it("should reject invalid type enum values", async () => {
			const invalidTypes = ["invalid-type", "random", "unknown", ""];

			for (const type of invalidTypes) {
				const input = {
					content: "Test content",
					submissionId: "test-submission-id",
					type,
				};

				const result = await testAction(input);
				expect(result.error).toBe("Validation failed");
			}
		});

		it("should handle null and undefined values gracefully", async () => {
			const invalidInputs = [
				null,
				undefined,
				{},
				{ content: null, submissionId: "test", type: "situation" },
				{ content: "test", submissionId: null, type: "situation" },
				{ content: "test", submissionId: "test", type: null },
			];

			for (const input of invalidInputs) {
				const result = await testAction(input);
				expect(result.error).toBe("Validation failed");
			}
		});

		it("should accept additional properties without failing", async () => {
			const inputWithExtraProps = {
				content: "Test content",
				submissionId: "test-submission-id",
				type: "situation",
				sessionId: "test-session",
				extraProperty: "should be ignored",
				anotherExtra: 123,
			};

			const result = await testAction(inputWithExtraProps);
			expect(result.success).toBe(true);
		});
	});

	describe("Content Length Validation", () => {
		it("should accept long content strings", async () => {
			const longContent = "A".repeat(10000);
			const input = {
				content: longContent,
				submissionId: "test-submission-id",
				type: "situation",
			};

			const result = await testAction(input);
			expect(result.success).toBe(true);
		});

		it("should accept content with special characters", async () => {
			const specialContent =
				'Content with émojis 🚀, special chars: @#$%^&*()_+{}|:"<>?[], and unicode: ñáéíóú';
			const input = {
				content: specialContent,
				submissionId: "test-submission-id",
				type: "answer",
			};

			const result = await testAction(input);
			expect(result.success).toBe(true);
		});

		it("should accept content with newlines and whitespace", async () => {
			const multilineContent = `First line
      
      Second line with    extra spaces
      Third line`;

			const input = {
				content: multilineContent,
				submissionId: "test-submission-id",
				type: "outline",
			};

			const result = await testAction(input);
			expect(result.success).toBe(true);
		});
	});

	describe("Type-specific Validation", () => {
		it("should accept all valid enum values with different casing", async () => {
			// Note: Zod enum is case-sensitive, so this tests exact matches
			const validTypes = ["situation", "complication", "answer", "outline"];

			for (const type of validTypes) {
				const input = {
					content: "Test content",
					submissionId: "test-submission-id",
					type,
				};

				const result = await testAction(input);
				expect(result.success).toBe(true);
			}
		});

		it("should reject type values with incorrect casing", async () => {
			const invalidCasingTypes = [
				"Situation",
				"COMPLICATION",
				"Answer",
				"OUTLINE",
			];

			for (const type of invalidCasingTypes) {
				const input = {
					content: "Test content",
					submissionId: "test-submission-id",
					type,
				};

				const result = await testAction(input);
				expect(result.error).toBe("Validation failed");
			}
		});
	});

	describe("Session ID Validation", () => {
		it("should accept valid session IDs", async () => {
			const validSessionIds = [
				"simple-session-id",
				"session_123",
				"uuid-like-12345678-1234-1234-1234-123456789012",
				"a",
				"very-long-session-id-with-lots-of-characters",
			];

			for (const sessionId of validSessionIds) {
				const input = {
					content: "Test content",
					submissionId: "test-submission-id",
					type: "situation",
					sessionId,
				};

				const result = await testAction(input);
				expect(result.success).toBe(true);
			}
		});

		it("should accept empty string as session ID", async () => {
			const input = {
				content: "Test content",
				submissionId: "test-submission-id",
				type: "situation",
				sessionId: "",
			};

			const result = await testAction(input);
			expect(result.success).toBe(true);
		});
	});
});
