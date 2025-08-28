/**
 * Unit tests for get-outline-suggestions.ts
 * Tests AI-powered outline suggestion generation with SCQA content processing
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/test-helpers";
import type { ActionResult } from "@/test/test-types";

// Mock AI Gateway - all exports should come from the main module
vi.mock("@kit/ai-gateway", () => ({
	getChatCompletion: vi.fn(),
	createQualityOptimizedConfig: vi.fn(),
	baseInstructions: "Base instructions for AI",
	improvementFormat: "Improvement format guidelines",
	outlineRewriteInstructions: "Outline rewrite instructions",
}));

// Mock enhanceAction to pass through the function
vi.mock("@kit/next/actions", () => ({
	enhanceAction: vi.fn((fn, options) => {
		return async (data: unknown) => {
			// Validate with schema if provided
			if (options?.schema) {
				const result = options.schema.safeParse(data);
				if (!result.success) {
					return { success: false, error: "Validation failed" };
				}
			}
			// Call function with mock user
			const mockUser = { id: "user-123", email: "test@example.com" };
			return fn(data, mockUser);
		};
	}),
}));

// Mock Supabase with a more direct approach
vi.mock("@kit/supabase/server-client", () => ({
	getSupabaseServerClient: vi.fn(),
}));

// Mock format conversion
vi.mock("../_components/editor/tiptap/utils/format-conversion", () => ({
	lexicalToTiptap: vi.fn(),
}));

import {
	getChatCompletion,
	createQualityOptimizedConfig,
} from "@kit/ai-gateway";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { lexicalToTiptap } from "../_components/editor/tiptap/utils/format-conversion";
// Import after mocks
import { getOutlineSuggestionsAction } from "./get-outline-suggestions";

describe("getOutlineSuggestionsAction", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Setup mock implementations
		vi.mocked(createQualityOptimizedConfig).mockReturnValue({
			model: "gpt-4",
			temperature: 0.7,
		});

		vi.mocked(getChatCompletion).mockResolvedValue({
			content: JSON.stringify({
				suggestions: [
					{ type: "improvement", text: "Suggestion 1" },
					{ type: "alternative", text: "Suggestion 2" },
				],
			}),
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
				feature: "outline-suggestions",
			},
		});
	});

	describe("Schema Validation", () => {
		it("should accept valid submissionId", async () => {
			// Arrange
			const validData = { submissionId: "valid-uuid-123" };

			// Setup Supabase mock
			const mockSupabaseClient = createMockSupabaseClient();
			mockSupabaseClient.from = vi.fn(() => ({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: {
						situation: '{"type":"doc","content":[]}',
						complication: '{"type":"doc","content":[]}',
						answer: '{"type":"doc","content":[]}',
					},
					error: null,
				}),
			})) as unknown;
			vi.mocked(getSupabaseServerClient).mockReturnValue(
				mockSupabaseClient as unknown as ReturnType<
					typeof getSupabaseServerClient
				>,
			);

			// Act
			const result = (await getOutlineSuggestionsAction(
				validData,
			)) as ActionResult;

			// Assert
			expect(result.success).toBe(true);
		});

		it("should reject empty submissionId", async () => {
			// Arrange
			const invalidData = { submissionId: "" };

			// Act
			const result = await getOutlineSuggestionsAction(invalidData);

			// Assert
			expect(result.error).toBe("Validation failed");
		});

		it("should reject missing submissionId", async () => {
			// Arrange
			const invalidData = {};

			// Act
			const result = await getOutlineSuggestionsAction(
				invalidData as Parameters<typeof getOutlineSuggestionsAction>[0],
			);

			// Assert
			expect(result.error).toBe("Validation failed");
		});
	});

	describe("Core Functionality", () => {
		it("should successfully generate outline suggestions", async () => {
			// Arrange
			const submissionData = {
				situation:
					'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Market situation"}]}]}',
				complication:
					'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Competition issue"}]}]}',
				answer:
					'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Our solution"}]}]}',
			};

			// Setup Supabase mock using the test helper
			const mockSupabaseClient = createMockSupabaseClient();
			mockSupabaseClient.from = vi.fn(() => ({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: submissionData,
					error: null,
				}),
			})) as unknown;
			vi.mocked(getSupabaseServerClient).mockReturnValue(
				mockSupabaseClient as unknown as ReturnType<
					typeof getSupabaseServerClient
				>,
			);

			const expectedSuggestions = {
				suggestions: [
					{ type: "improvement", text: "Suggestion 1" },
					{ type: "alternative", text: "Suggestion 2" },
				],
			};

			vi.mocked(getChatCompletion).mockResolvedValue({
				content: JSON.stringify(expectedSuggestions),
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
					feature: "outline-suggestions",
				},
			});

			// Act
			const result = await getOutlineSuggestionsAction({
				submissionId: "test-id",
			});

			// Assert
			expect(result.success).toBe(true);
			expect(result.data).toEqual(expectedSuggestions);
		});

		it("should handle Lexical to Tiptap conversion when needed", async () => {
			// Arrange
			const lexicalContent =
				'{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Lexical content","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}';

			const convertedTiptap = {
				type: "doc" as const,
				content: [
					{
						type: "paragraph" as const,
						content: [{ type: "text" as const, text: "Lexical content" }],
					},
				],
			};

			// Setup Supabase mock
			const mockSupabaseClient = createMockSupabaseClient();
			mockSupabaseClient.from = vi.fn(() => ({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: {
						situation: lexicalContent,
						complication: null,
						answer: null,
					},
					error: null,
				}),
			})) as unknown;
			vi.mocked(getSupabaseServerClient).mockReturnValue(
				mockSupabaseClient as unknown as ReturnType<
					typeof getSupabaseServerClient
				>,
			);

			vi.mocked(lexicalToTiptap).mockReturnValue(convertedTiptap);

			// Act
			const result = await getOutlineSuggestionsAction({
				submissionId: "test-id",
			});

			// Assert
			expect(result.success).toBe(true);
			expect(lexicalToTiptap).toHaveBeenCalledWith(lexicalContent);
			expect(getChatCompletion).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						role: "user",
						content: expect.stringMatching(/Situation:\s*Lexical content/),
					}),
				]),
				expect.any(Object),
			);
		});
	});

	describe("Text Extraction", () => {
		it("should extract text from simple paragraph nodes", async () => {
			// Arrange
			const simpleContent = {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: "Simple text" }],
					},
				],
			};

			// Setup Supabase mock
			const mockSupabaseClient = createMockSupabaseClient();
			mockSupabaseClient.from = vi.fn(() => ({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: {
						situation: JSON.stringify(simpleContent),
						complication: null,
						answer: null,
					},
					error: null,
				}),
			})) as unknown;
			vi.mocked(getSupabaseServerClient).mockReturnValue(
				mockSupabaseClient as unknown as ReturnType<
					typeof getSupabaseServerClient
				>,
			);

			// Act
			const result = await getOutlineSuggestionsAction({
				submissionId: "test-id",
			});

			// Assert
			expect(result.success).toBe(true);
			expect(getChatCompletion).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						role: "user",
						content: expect.stringMatching(/Situation:\s*Simple text/),
					}),
				]),
				expect.any(Object),
			);
		});

		it("should handle empty content gracefully", async () => {
			// Arrange
			// Setup Supabase mock
			const mockSupabaseClient = createMockSupabaseClient();
			mockSupabaseClient.from = vi.fn(() => ({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: {
						situation: null,
						complication: "",
						answer: '{"type":"doc","content":[]}',
					},
					error: null,
				}),
			})) as unknown;
			vi.mocked(getSupabaseServerClient).mockReturnValue(
				mockSupabaseClient as unknown as ReturnType<
					typeof getSupabaseServerClient
				>,
			);

			// Act
			const result = await getOutlineSuggestionsAction({
				submissionId: "test-id",
			});

			// Assert
			expect(result.success).toBe(true);
			expect(getChatCompletion).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						role: "user",
						content: expect.stringMatching(
							/Situation:\s*\n\nComplication:\s*\n\nAnswer:/,
						),
					}),
				]),
				expect.any(Object),
			);
		});
	});

	describe("Error Scenarios", () => {
		it("should handle database connection failure", async () => {
			// Arrange
			// Setup Supabase mock with error
			const mockSupabaseClient = createMockSupabaseClient();
			mockSupabaseClient.from = vi.fn(() => ({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: null,
					error: { message: "Connection timeout" },
				}),
			})) as unknown;
			vi.mocked(getSupabaseServerClient).mockReturnValue(
				mockSupabaseClient as unknown as ReturnType<
					typeof getSupabaseServerClient
				>,
			);

			// Act
			const result = await getOutlineSuggestionsAction({
				submissionId: "test-id",
			});

			// Assert
			expect(result.success).toBe(false);
			expect(result.error).toBe("Failed to fetch submission data");
		});

		it("should handle AI service failure", async () => {
			// Arrange
			// Setup Supabase mock for basic data
			const mockSupabaseClient = createMockSupabaseClient();
			mockSupabaseClient.from = vi.fn(() => ({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: {
						situation: '{"type":"doc","content":[]}',
						complication: '{"type":"doc","content":[]}',
						answer: '{"type":"doc","content":[]}',
					},
					error: null,
				}),
			})) as unknown;
			vi.mocked(getSupabaseServerClient).mockReturnValue(
				mockSupabaseClient as unknown as ReturnType<
					typeof getSupabaseServerClient
				>,
			);

			vi.mocked(getChatCompletion).mockRejectedValue(
				new Error("AI service unavailable"),
			);

			// Act
			const result = await getOutlineSuggestionsAction({
				submissionId: "test-id",
			});

			// Assert
			expect(result.success).toBe(false);
			expect(result.error).toBe("AI service unavailable");
		});

		it("should handle malformed JSON in AI response", async () => {
			// Arrange
			// Setup Supabase mock for basic data
			const mockSupabaseClient = createMockSupabaseClient();
			mockSupabaseClient.from = vi.fn(() => ({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: {
						situation: '{"type":"doc","content":[]}',
						complication: '{"type":"doc","content":[]}',
						answer: '{"type":"doc","content":[]}',
					},
					error: null,
				}),
			})) as unknown;
			vi.mocked(getSupabaseServerClient).mockReturnValue(
				mockSupabaseClient as unknown as ReturnType<
					typeof getSupabaseServerClient
				>,
			);

			vi.mocked(getChatCompletion).mockResolvedValue({
				content: "Invalid JSON response",
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
					feature: "outline-suggestions",
				},
			});

			// Act
			const result = await getOutlineSuggestionsAction({
				submissionId: "test-id",
			});

			// Assert
			expect(result.success).toBe(false);
			expect(result.error).toContain("Unexpected token");
		});
	});

	describe("Edge Cases", () => {
		it("should handle null/undefined content fields", async () => {
			// Arrange
			// Setup Supabase mock
			const mockSupabaseClient = createMockSupabaseClient();
			mockSupabaseClient.from = vi.fn(() => ({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: {
						situation: null,
						complication: undefined,
						answer: null,
					},
					error: null,
				}),
			})) as unknown;
			vi.mocked(getSupabaseServerClient).mockReturnValue(
				mockSupabaseClient as unknown as ReturnType<
					typeof getSupabaseServerClient
				>,
			);

			// Act
			const result = await getOutlineSuggestionsAction({
				submissionId: "test-id",
			});

			// Assert
			expect(result.success).toBe(true);
			expect(getChatCompletion).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						role: "user",
						content: expect.stringMatching(
							/Situation:\s*\n\nComplication:\s*\n\nAnswer:/,
						),
					}),
				]),
				expect.any(Object),
			);
		});

		it("should handle special characters and Unicode", async () => {
			// Arrange
			const unicodeContent = {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: "Special chars: 🚀 中文 €ñ" }],
					},
				],
			};

			// Setup Supabase mock
			const mockSupabaseClient = createMockSupabaseClient();
			mockSupabaseClient.from = vi.fn(() => ({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: {
						situation: JSON.stringify(unicodeContent),
						complication: null,
						answer: null,
					},
					error: null,
				}),
			})) as unknown;
			vi.mocked(getSupabaseServerClient).mockReturnValue(
				mockSupabaseClient as unknown as ReturnType<
					typeof getSupabaseServerClient
				>,
			);

			// Act
			const result = await getOutlineSuggestionsAction({
				submissionId: "test-id",
			});

			// Assert
			expect(result.success).toBe(true);
			expect(getChatCompletion).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						role: "user",
						content: expect.stringMatching(
							/Situation:\s*Special chars: 🚀 中文 €ñ/,
						),
					}),
				]),
				expect.any(Object),
			);
		});
	});
});
