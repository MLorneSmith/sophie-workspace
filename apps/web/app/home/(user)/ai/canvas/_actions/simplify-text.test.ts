/**
 * Unit tests for simplify-text server action
 * Tests schema validation, AI integration, and error handling
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionResult } from "@/test/test-types";

// Setup mocks
vi.mock("@kit/ai-gateway", () => ({
	getChatCompletion: vi.fn(),
}));

vi.mock("@kit/ai-gateway/src/configs/templates", () => ({
	createReasoningOptimizedConfig: vi.fn(),
}));

vi.mock("@kit/ai-gateway/src/prompts/prompt-manager", () => ({
	PromptManager: {
		compileTemplate: vi.fn(),
	},
}));

vi.mock("@kit/ai-gateway/src/prompts/templates/text-simplification", () => ({
	textSimplificationTemplate: [
		{
			role: "system",
			content: "You are a text simplification assistant.",
		},
		{
			role: "user",
			content: "Simplify this text: {{content}}",
		},
	],
}));

vi.mock("@kit/next/actions", () => ({
	enhanceAction: vi.fn((fn, options) => {
		return async (data: unknown) => {
			// Validate with schema if provided
			if (options?.schema) {
				const result = options.schema.safeParse(data);
				if (!result.success) {
					return { success: false, error: "Validation failed" } as const;
				}
			}
			// Mock authenticated user
			const mockUser = { id: "123", email: "test@example.com" };
			return fn(data, mockUser);
		};
	}),
}));

// Import after mocks are set up
import { getChatCompletion } from "@kit/ai-gateway";
import { createReasoningOptimizedConfig } from "@kit/ai-gateway/src/configs/templates";
import { PromptManager } from "@kit/ai-gateway/src/prompts/prompt-manager";
import { expectError } from "../../../../../../test/test-helpers";
import { simplifyTextAction } from "./simplify-text";

// Helper function to create proper CompletionResult mock
function createMockCompletionResult(content: string) {
	return {
		content,
		metadata: {
			requestId: "test-request-id",
			cost: 0.001,
			tokens: {
				prompt: 100,
				completion: 50,
				total: 150,
			},
			provider: "openai",
			model: "gpt-4",
			feature: "text-simplification",
		},
	};
}

describe("simplifyTextAction", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Setup default mock returns
		vi.mocked(createReasoningOptimizedConfig).mockReturnValue({
			model: "gpt-4",
			temperature: 0.7,
		});

		vi.mocked(PromptManager.compileTemplate).mockImplementation(
			(template: string, variables: Record<string, unknown>) => {
				return template.replace("{{content}}", String(variables.content || ""));
			},
		);

		// Default successful getChatCompletion
		vi.mocked(getChatCompletion).mockResolvedValue(
			createMockCompletionResult("Default simplified text"),
		);
	});

	describe("Schema Validation", () => {
		it("should validate required fields are present", async () => {
			// Arrange
			const validInput = {
				content: "Complex business terminology that needs simplification",
				userId: "user-123",
				canvasId: "canvas-456",
				sectionType: "situation",
			};

			vi.mocked(getChatCompletion).mockResolvedValue(
				createMockCompletionResult("Simplified text"),
			);

			// Act
			const result = await simplifyTextAction(validInput);

			// Assert
			expect(result.success).toBe(true);
			expect(result.response).toBeDefined();
			expect(result.response?.content).toBe("Simplified text");
		});

		it("should reject missing content field", async () => {
			// Arrange
			const invalidInput = {
				userId: "user-123",
				canvasId: "canvas-456",
				sectionType: "situation",
			};

			// Act
			const result = await simplifyTextAction(
				invalidInput as unknown as Parameters<typeof simplifyTextAction>[0],
			);

			// Assert
			expect(expectError(result as ActionResult)).toBe("Validation failed");
		});

		it("should reject missing userId field", async () => {
			// Arrange
			const invalidInput = {
				content: "Test content",
				canvasId: "canvas-456",
				sectionType: "situation",
			};

			// Act
			const result = await simplifyTextAction(
				invalidInput as unknown as Parameters<typeof simplifyTextAction>[0],
			);

			// Assert
			expect(expectError(result as ActionResult)).toBe("Validation failed");
		});

		it("should reject missing canvasId field", async () => {
			// Arrange
			const invalidInput = {
				content: "Test content",
				userId: "user-123",
				sectionType: "situation",
			};

			// Act
			const result = await simplifyTextAction(
				invalidInput as unknown as Parameters<typeof simplifyTextAction>[0],
			);

			// Assert
			expect(expectError(result as ActionResult)).toBe("Validation failed");
		});

		it("should reject missing sectionType field", async () => {
			// Arrange
			const invalidInput = {
				content: "Test content",
				userId: "user-123",
				canvasId: "canvas-456",
			};

			// Act
			const result = await simplifyTextAction(
				invalidInput as unknown as Parameters<typeof simplifyTextAction>[0],
			);

			// Assert
			expect(expectError(result as ActionResult)).toBe("Validation failed");
		});
	});

	describe("Core Functionality", () => {
		it("should successfully simplify text with valid input", async () => {
			// Arrange
			const mockResponse =
				"This is simplified text that's easier to understand.";
			vi.mocked(getChatCompletion).mockResolvedValue(
				createMockCompletionResult(mockResponse),
			);

			const input = {
				content: "Complex business synergies and paradigm shifts",
				userId: "user-123",
				canvasId: "canvas-456",
				sectionType: "situation",
			};

			// Act
			const result = await simplifyTextAction(input);

			// Assert
			expect(result).toEqual({
				success: true,
				response: createMockCompletionResult(mockResponse),
			});
		});

		it("should handle different section types", async () => {
			// Arrange
			const sectionTypes = ["situation", "complication", "answer", "outline"];

			for (const sectionType of sectionTypes) {
				// Clear mocks before each iteration
				vi.clearAllMocks();

				const input = {
					content: "Test content",
					userId: "user-123",
					canvasId: "canvas-456",
					sectionType,
				};

				// Act
				const result = await simplifyTextAction(input);

				// Assert - Just verify the action succeeds, config is created but not used
				expect(result.success).toBe(true);

				// Note: The config is created but not actually used in the current implementation
				// This is likely a potential optimization issue where the config parameter should be passed to getChatCompletion
			}
		});

		it("should process content through AI correctly", async () => {
			// Arrange
			const userId = "specific-user-id";
			const canvasId = "specific-canvas-id";
			const sectionType = "complication";
			const content = "Complex business jargon that needs simplification";
			const expectedResponse = "Simple business terms";

			vi.mocked(getChatCompletion).mockResolvedValue(
				createMockCompletionResult(expectedResponse),
			);

			const input = {
				content,
				userId,
				canvasId,
				sectionType,
			};

			// Act
			const result = await simplifyTextAction(input);

			// Assert
			expect(result).toEqual({
				success: true,
				response: createMockCompletionResult(expectedResponse),
			});

			// Verify the AI was called with compiled messages and correct options
			expect(getChatCompletion).toHaveBeenCalledWith(
				[
					{
						role: "system",
						content: "You are a text simplification assistant.",
					},
					{
						role: "user",
						content: `Simplify this text: ${content}`,
					},
				],
				{
					model: "gpt-4",
					temperature: 0.7,
				},
			);
		});
	});

	describe("AI Integration", () => {
		it("should compile prompt template correctly", async () => {
			// Arrange
			const content = "Complex technical jargon needs simplification";
			vi.mocked(getChatCompletion).mockResolvedValue(
				createMockCompletionResult("Simplified text"),
			);

			const input = {
				content,
				userId: "user-123",
				canvasId: "canvas-456",
				sectionType: "answer",
			};

			// Act
			await simplifyTextAction(input);

			// Assert
			expect(PromptManager.compileTemplate).toHaveBeenCalledWith(
				"Simplify this text: {{content}}",
				{ content },
			);
		});

		it("should use correct model and parameters", async () => {
			// Arrange
			vi.mocked(getChatCompletion).mockResolvedValue(
				createMockCompletionResult("Simplified text"),
			);

			const input = {
				content: "Test content",
				userId: "user-123",
				canvasId: "canvas-456",
				sectionType: "situation",
			};

			// Act
			await simplifyTextAction(input);

			// Assert
			expect(getChatCompletion).toHaveBeenCalledWith(
				[
					{
						role: "system",
						content: "You are a text simplification assistant.",
					},
					{
						role: "user",
						content: "Simplify this text: Test content",
					},
				],
				{
					model: "gpt-4",
					temperature: 0.7,
				},
			);
		});

		it("should handle long content strings", async () => {
			// Arrange
			const longContent = "A".repeat(5000);
			vi.mocked(getChatCompletion).mockResolvedValue(
				createMockCompletionResult("Simplified version"),
			);

			const input = {
				content: longContent,
				userId: "user-123",
				canvasId: "canvas-456",
				sectionType: "outline",
			};

			// Act
			const result = await simplifyTextAction(input);

			// Assert
			expect(result.success).toBe(true);
			expect(PromptManager.compileTemplate).toHaveBeenCalledWith(
				"Simplify this text: {{content}}",
				{ content: longContent },
			);
		});
	});

	describe("Error Scenarios", () => {
		it("should handle AI service failures", async () => {
			// Arrange
			const aiError = new Error("AI service unavailable");
			vi.mocked(getChatCompletion).mockRejectedValue(aiError);

			const input = {
				content: "Test content",
				userId: "user-123",
				canvasId: "canvas-456",
				sectionType: "situation",
			};

			// Act
			const result = await simplifyTextAction(input);

			// Assert
			expect(result).toEqual({
				success: false,
				error: "AI service unavailable",
			});
		});

		it("should handle prompt compilation failures", async () => {
			// Arrange
			const compileError = new Error("Template compilation failed");
			vi.mocked(PromptManager.compileTemplate).mockImplementation(() => {
				throw compileError;
			});

			const input = {
				content: "Test content",
				userId: "user-123",
				canvasId: "canvas-456",
				sectionType: "situation",
			};

			// Act
			const result = await simplifyTextAction(input);

			// Assert
			expect(result).toEqual({
				success: false,
				error: "Template compilation failed",
			});
		});

		it("should handle config creation failures", async () => {
			// Arrange
			const configError = new Error("Config creation failed");

			// Reset the mock and make it throw
			vi.mocked(createReasoningOptimizedConfig).mockReset();
			vi.mocked(createReasoningOptimizedConfig).mockImplementation(() => {
				throw configError;
			});

			const input = {
				content: "Test content",
				userId: "user-123",
				canvasId: "canvas-456",
				sectionType: "situation",
			};

			// Act
			const result = await simplifyTextAction(input);

			// Assert
			expect(result).toEqual({
				success: false,
				error: "Config creation failed",
			});
		});

		it("should handle unknown errors gracefully", async () => {
			// Arrange
			vi.mocked(getChatCompletion).mockRejectedValue("Unknown error");

			const input = {
				content: "Test content",
				userId: "user-123",
				canvasId: "canvas-456",
				sectionType: "situation",
			};

			// Act
			const result = await simplifyTextAction(input);

			// Assert
			expect(result).toEqual({
				success: false,
				error: "An unknown error occurred",
			});
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty content string", async () => {
			// Arrange
			vi.mocked(getChatCompletion).mockResolvedValue(
				createMockCompletionResult(""),
			); // AI might return empty response

			const input = {
				content: "",
				userId: "user-123",
				canvasId: "canvas-456",
				sectionType: "situation",
			};

			// Act
			const result = await simplifyTextAction(input);

			// Assert - Empty content is valid according to the schema, so it should succeed
			expect(result.success).toBe(true);
			expect(result.response).toEqual(createMockCompletionResult(""));
		});

		it("should handle special characters in content", async () => {
			// Arrange
			const content =
				'Content with émojis 🚀, special chars: @#$%^&*()_+{}|:"<>?, and unicode: ñáéíóú';
			vi.mocked(getChatCompletion).mockResolvedValue(
				createMockCompletionResult("Simplified special content"),
			);

			const input = {
				content,
				userId: "user-123",
				canvasId: "canvas-456",
				sectionType: "answer",
			};

			// Act
			const result = await simplifyTextAction(input);

			// Assert
			expect(result.success).toBe(true);
			expect(result.response).toEqual(
				createMockCompletionResult("Simplified special content"),
			);
		});

		it("should handle multiline content", async () => {
			// Arrange
			const multilineContent = `First line of complex text
			
			Second line with   extra spaces
			Third line with more content`;

			vi.mocked(getChatCompletion).mockResolvedValue(
				createMockCompletionResult("Simplified multiline"),
			);

			const input = {
				content: multilineContent,
				userId: "user-123",
				canvasId: "canvas-456",
				sectionType: "outline",
			};

			// Act
			const result = await simplifyTextAction(input);

			// Assert
			expect(result.success).toBe(true);
			expect(PromptManager.compileTemplate).toHaveBeenCalledWith(
				"Simplify this text: {{content}}",
				{ content: multilineContent },
			);
		});
	});
});
