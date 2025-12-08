/**
 * Unit tests for assessment survey server actions
 * Tests survey response saving and survey completion functionality
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { completeSurveyAction, saveResponseAction } from "./server-actions";

// Mock the enhanced logger
vi.mock("@kit/shared/logger", () => ({
	createServiceLogger: vi.fn(() => ({
		getLogger: vi.fn().mockResolvedValue({
			info: vi.fn(),
			error: vi.fn(),
			warn: vi.fn(),
			debug: vi.fn(),
		}),
	})),
}));

// Mock enhanceAction to preserve schema validation
vi.mock("@kit/next/actions", () => ({
	enhanceAction: vi.fn((fn, options) => {
		return async (data: unknown) => {
			// Validate with schema if provided
			let validatedData = data;
			if (options?.schema) {
				const result = options.schema.safeParse(data);
				if (!result.success) {
					return { success: false, error: "Validation failed" } as const;
				}
				validatedData = result.data;
			}

			// Mock authenticated user
			const mockUser = {
				id: "user-123",
				email: "test@example.com",
				aud: "authenticated",
			};

			return fn(validatedData, mockUser);
		};
	}),
}));

// Mock Supabase client with proper method chaining
const createMockSupabaseChain = () => {
	const chain = {
		select: vi.fn(),
		insert: vi.fn(),
		update: vi.fn(),
		upsert: vi.fn(),
		eq: vi.fn(),
		maybeSingle: vi.fn(),
	};

	// Make all methods return the chain for proper chaining
	chain.select.mockReturnValue(chain);
	chain.insert.mockReturnValue(chain);
	chain.update.mockReturnValue(chain);
	chain.upsert.mockReturnValue(chain);
	chain.eq.mockReturnValue(chain);
	chain.maybeSingle.mockResolvedValue({ data: null, error: null });

	return chain;
};

const mockSupabaseClient = {
	from: vi.fn(() => createMockSupabaseChain()),
};

vi.mock("@kit/supabase/server-client", () => ({
	getSupabaseServerClient: vi.fn(() => mockSupabaseClient),
}));

// Mock CMS functions
const mockGetSurveyQuestions = vi.fn();

vi.mock("@kit/cms/payload", async () => ({
	getSurveyQuestions: mockGetSurveyQuestions,
}));

describe("Assessment Survey Server Actions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset Supabase mock to default behavior
		mockSupabaseClient.from.mockImplementation(() => createMockSupabaseChain());
		// Reset CMS mock
		mockGetSurveyQuestions.mockResolvedValue({
			docs: [
				{ id: "q1" },
				{ id: "q2" },
				{ id: "q3" },
				{ id: "q4" },
				{ id: "q5" },
			],
		});
	});

	describe("saveResponseAction", () => {
		describe("Schema Validation", () => {
			it("should accept valid response data", async () => {
				const chain = createMockSupabaseChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					questionId: "question-456",
					questionIndex: 0,
					response: "Strongly Agree",
					category: "communication",
					score: 5,
					totalQuestions: 5,
				};

				const result = await saveResponseAction(input);
				expect(result.success).toBe(true);
			});

			it("should reject response with missing surveyId", async () => {
				const input = {
					questionId: "question-456",
					questionIndex: 0,
					response: "Strongly Agree",
					category: "communication",
					score: 5,
					totalQuestions: 5,
				};

				const result = await saveResponseAction(
					input as Parameters<typeof saveResponseAction>[0],
				);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Validation failed");
			});

			it("should reject response with missing questionId", async () => {
				const input = {
					surveyId: "survey-123",
					questionIndex: 0,
					response: "Strongly Agree",
					category: "communication",
					score: 5,
					totalQuestions: 5,
				};

				const result = await saveResponseAction(
					input as Parameters<typeof saveResponseAction>[0],
				);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Validation failed");
			});

			it("should reject response with invalid questionIndex", async () => {
				const input = {
					surveyId: "survey-123",
					questionId: "question-456",
					questionIndex: "invalid" as unknown as number,
					response: "Strongly Agree",
					category: "communication",
					score: 5,
					totalQuestions: 5,
				};

				const result = await saveResponseAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Validation failed");
			});

			it("should reject response with invalid score type", async () => {
				const input = {
					surveyId: "survey-123",
					questionId: "question-456",
					questionIndex: 0,
					response: "Strongly Agree",
					category: "communication",
					score: "five" as unknown as number,
					totalQuestions: 5,
				};

				const result = await saveResponseAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Validation failed");
			});
		});

		describe("Core Functionality - New Response", () => {
			it("should create new survey response record when none exists", async () => {
				const chain = createMockSupabaseChain();
				chain.maybeSingle.mockResolvedValue({ data: null, error: null });
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					questionId: "question-456",
					questionIndex: 0,
					response: "Strongly Agree",
					category: "communication",
					score: 5,
					totalQuestions: 5,
				};

				await saveResponseAction(input);

				expect(mockSupabaseClient.from).toHaveBeenCalledWith(
					"survey_responses",
				);
				expect(chain.insert).toHaveBeenCalled();
			});

			it("should include user_id in new response", async () => {
				const chain = createMockSupabaseChain();
				chain.maybeSingle.mockResolvedValue({ data: null, error: null });
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					questionId: "question-456",
					questionIndex: 0,
					response: "Strongly Agree",
					category: "communication",
					score: 5,
					totalQuestions: 5,
				};

				await saveResponseAction(input);

				expect(chain.insert).toHaveBeenCalledWith(
					expect.objectContaining({
						user_id: "user-123",
						survey_id: "survey-123",
					}),
				);
			});

			it("should initialize category_scores for new response", async () => {
				const chain = createMockSupabaseChain();
				chain.maybeSingle.mockResolvedValue({ data: null, error: null });
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					questionId: "question-456",
					questionIndex: 0,
					response: "Strongly Agree",
					category: "communication",
					score: 5,
					totalQuestions: 5,
				};

				await saveResponseAction(input);

				expect(chain.insert).toHaveBeenCalledWith(
					expect.objectContaining({
						category_scores: { communication: 5 },
					}),
				);
			});

			it("should format response with timestamp", async () => {
				const chain = createMockSupabaseChain();
				chain.maybeSingle.mockResolvedValue({ data: null, error: null });
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					questionId: "question-456",
					questionIndex: 0,
					response: "Strongly Agree",
					category: "communication",
					score: 5,
					totalQuestions: 5,
				};

				const beforeCall = new Date().toISOString();
				await saveResponseAction(input);

				const insertCall = chain.insert.mock.calls[0]?.[0];
				expect(insertCall.responses).toHaveLength(1);
				expect(insertCall.responses[0]).toEqual(
					expect.objectContaining({
						questionId: "question-456",
						response: "Strongly Agree",
						score: 5,
						category: "communication",
						answeredAt: expect.any(String),
					}),
				);
			});
		});

		describe("Core Functionality - Update Existing Response", () => {
			it("should update existing response when one exists", async () => {
				const existingResponse = {
					id: "response-123",
					responses: [
						{
							questionId: "q1",
							response: "Agree",
							score: 4,
							category: "communication",
						},
					],
					category_scores: { communication: 4 },
				};

				const chain = createMockSupabaseChain();
				chain.maybeSingle.mockResolvedValue({
					data: existingResponse,
					error: null,
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					questionId: "question-456",
					questionIndex: 1,
					response: "Strongly Agree",
					category: "communication",
					score: 5,
					totalQuestions: 5,
				};

				await saveResponseAction(input);

				expect(chain.update).toHaveBeenCalled();
				expect(chain.eq).toHaveBeenCalledWith("id", "response-123");
			});

			it("should append new response to existing responses array", async () => {
				const existingResponse = {
					id: "response-123",
					responses: [
						{
							questionId: "q1",
							response: "Agree",
							score: 4,
							category: "communication",
						},
					],
					category_scores: { communication: 4 },
				};

				const chain = createMockSupabaseChain();
				chain.maybeSingle.mockResolvedValue({
					data: existingResponse,
					error: null,
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					questionId: "question-456",
					questionIndex: 1,
					response: "Strongly Agree",
					category: "design",
					score: 5,
					totalQuestions: 5,
				};

				await saveResponseAction(input);

				const updateCall = chain.update.mock.calls[0]?.[0];
				expect(updateCall.responses).toHaveLength(2);
			});

			it("should accumulate category scores", async () => {
				const existingResponse = {
					id: "response-123",
					responses: [],
					category_scores: { communication: 4 },
				};

				const chain = createMockSupabaseChain();
				chain.maybeSingle.mockResolvedValue({
					data: existingResponse,
					error: null,
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					questionId: "question-456",
					questionIndex: 1,
					response: "Strongly Agree",
					category: "communication",
					score: 5,
					totalQuestions: 5,
				};

				await saveResponseAction(input);

				const updateCall = chain.update.mock.calls[0]?.[0];
				expect(updateCall.category_scores.communication).toBe(9); // 4 + 5
			});

			it("should add new category to existing scores", async () => {
				const existingResponse = {
					id: "response-123",
					responses: [],
					category_scores: { communication: 4 },
				};

				const chain = createMockSupabaseChain();
				chain.maybeSingle.mockResolvedValue({
					data: existingResponse,
					error: null,
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					questionId: "question-456",
					questionIndex: 1,
					response: "Agree",
					category: "design",
					score: 4,
					totalQuestions: 5,
				};

				await saveResponseAction(input);

				const updateCall = chain.update.mock.calls[0]?.[0];
				expect(updateCall.category_scores).toEqual({
					communication: 4,
					design: 4,
				});
			});

			it("should set completed to true at 100% progress", async () => {
				const existingResponse = {
					id: "response-123",
					responses: [
						{ questionId: "q1", response: "A", score: 4, category: "c1" },
						{ questionId: "q2", response: "A", score: 4, category: "c1" },
						{ questionId: "q3", response: "A", score: 4, category: "c1" },
						{ questionId: "q4", response: "A", score: 4, category: "c1" },
					],
					category_scores: { c1: 16 },
				};

				const chain = createMockSupabaseChain();
				chain.maybeSingle.mockResolvedValue({
					data: existingResponse,
					error: null,
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				// Last question (index 4 of 5 questions = 100%)
				const input = {
					surveyId: "survey-123",
					questionId: "q5",
					questionIndex: 4,
					response: "Agree",
					category: "c1",
					score: 4,
					totalQuestions: 5,
				};

				await saveResponseAction(input);

				const updateCall = chain.update.mock.calls[0]?.[0];
				expect(updateCall.completed).toBe(true);
			});
		});

		describe("Progress Tracking", () => {
			it("should update survey_progress table", async () => {
				const chain = createMockSupabaseChain();
				chain.maybeSingle.mockResolvedValue({ data: null, error: null });
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					questionId: "question-456",
					questionIndex: 2,
					response: "Agree",
					category: "communication",
					score: 4,
					totalQuestions: 5,
				};

				await saveResponseAction(input);

				expect(mockSupabaseClient.from).toHaveBeenCalledWith("survey_progress");
				expect(chain.upsert).toHaveBeenCalled();
			});

			it("should calculate correct progress percentage", async () => {
				const chain = createMockSupabaseChain();
				chain.maybeSingle.mockResolvedValue({ data: null, error: null });
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					questionId: "question-456",
					questionIndex: 2, // 3rd question (0-indexed)
					response: "Agree",
					category: "communication",
					score: 4,
					totalQuestions: 5,
				};

				await saveResponseAction(input);

				// Progress: (2 + 1) / 5 * 100 = 60%
				expect(chain.upsert).toHaveBeenCalledWith(
					expect.objectContaining({
						progress_percentage: 60,
						current_question_index: 3,
					}),
					expect.any(Object),
				);
			});

			it("should use actual question count from CMS", async () => {
				// CMS returns 10 questions instead of provided 5
				mockGetSurveyQuestions.mockResolvedValue({
					docs: Array(10)
						.fill(null)
						.map((_, i) => ({ id: `q${i}` })),
				});

				const chain = createMockSupabaseChain();
				chain.maybeSingle.mockResolvedValue({ data: null, error: null });
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					questionId: "question-456",
					questionIndex: 4, // 5th question
					response: "Agree",
					category: "communication",
					score: 4,
					totalQuestions: 5, // User says 5, but CMS has 10
				};

				await saveResponseAction(input);

				// Should use actual count: (4 + 1) / 10 * 100 = 50%
				expect(chain.upsert).toHaveBeenCalledWith(
					expect.objectContaining({
						progress_percentage: 50,
						total_questions: 10,
					}),
					expect.any(Object),
				);
			});
		});

		describe("Error Handling", () => {
			it("should handle select error gracefully", async () => {
				const chain = createMockSupabaseChain();
				chain.maybeSingle.mockResolvedValue({
					data: null,
					error: { code: "PGRST123", message: "Database error" },
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					questionId: "question-456",
					questionIndex: 0,
					response: "Agree",
					category: "communication",
					score: 4,
					totalQuestions: 5,
				};

				const result = await saveResponseAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toContain("Error checking for existing response");
			});

			it("should handle insert error gracefully", async () => {
				const chain = createMockSupabaseChain();
				chain.maybeSingle.mockResolvedValue({ data: null, error: null });
				chain.insert.mockResolvedValue({
					data: null,
					error: { message: "Insert failed" },
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					questionId: "question-456",
					questionIndex: 0,
					response: "Agree",
					category: "communication",
					score: 4,
					totalQuestions: 5,
				};

				const result = await saveResponseAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toContain("Error inserting survey response");
			});

			it("should handle update error gracefully", async () => {
				const existingResponse = {
					id: "response-123",
					responses: [],
					category_scores: {},
				};

				const chain = createMockSupabaseChain();
				chain.maybeSingle.mockResolvedValue({
					data: existingResponse,
					error: null,
				});
				chain.update.mockReturnValue({
					...chain,
					eq: vi.fn().mockResolvedValue({
						data: null,
						error: { message: "Update failed" },
					}),
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					questionId: "question-456",
					questionIndex: 0,
					response: "Agree",
					category: "communication",
					score: 4,
					totalQuestions: 5,
				};

				const result = await saveResponseAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toContain("Error updating survey response");
			});

			it("should handle progress upsert error gracefully", async () => {
				let callCount = 0;
				(
					mockSupabaseClient.from as ReturnType<typeof vi.fn>
				).mockImplementation((table: string) => {
					const chain = createMockSupabaseChain();
					if (table === "survey_responses") {
						chain.maybeSingle.mockResolvedValue({ data: null, error: null });
					} else if (table === "survey_progress") {
						chain.upsert.mockResolvedValue({
							data: null,
							error: { message: "Upsert failed" },
						});
					}
					callCount++;
					return chain;
				});

				const input = {
					surveyId: "survey-123",
					questionId: "question-456",
					questionIndex: 0,
					response: "Agree",
					category: "communication",
					score: 4,
					totalQuestions: 5,
				};

				const result = await saveResponseAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toContain("Error updating survey progress");
			});

			it("should handle CMS error gracefully and use provided count", async () => {
				mockGetSurveyQuestions.mockResolvedValue({ docs: [] });

				const chain = createMockSupabaseChain();
				chain.maybeSingle.mockResolvedValue({ data: null, error: null });
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					questionId: "question-456",
					questionIndex: 2,
					response: "Agree",
					category: "communication",
					score: 4,
					totalQuestions: 5,
				};

				await saveResponseAction(input);

				// Should fall back to provided totalQuestions
				expect(chain.upsert).toHaveBeenCalledWith(
					expect.objectContaining({
						total_questions: 5,
					}),
					expect.any(Object),
				);
			});
		});

		describe("Edge Cases", () => {
			it("should handle empty category string", async () => {
				const chain = createMockSupabaseChain();
				chain.maybeSingle.mockResolvedValue({ data: null, error: null });
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					questionId: "question-456",
					questionIndex: 0,
					response: "Agree",
					category: "",
					score: 4,
					totalQuestions: 5,
				};

				await saveResponseAction(input);

				// Should use "general" as default category
				const insertCall = chain.insert.mock.calls[0]?.[0];
				expect(insertCall.category_scores).toHaveProperty("general");
			});

			it("should handle first question (index 0)", async () => {
				const chain = createMockSupabaseChain();
				chain.maybeSingle.mockResolvedValue({ data: null, error: null });
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					questionId: "question-456",
					questionIndex: 0,
					response: "Agree",
					category: "communication",
					score: 4,
					totalQuestions: 5,
				};

				await saveResponseAction(input);

				expect(chain.upsert).toHaveBeenCalledWith(
					expect.objectContaining({
						current_question_index: 1,
						progress_percentage: 20, // (0 + 1) / 5 * 100
					}),
					expect.any(Object),
				);
			});

			it("should handle non-array existing responses", async () => {
				const existingResponse = {
					id: "response-123",
					responses: "invalid", // Not an array
					category_scores: {},
				};

				const chain = createMockSupabaseChain();
				chain.maybeSingle.mockResolvedValue({
					data: existingResponse,
					error: null,
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					questionId: "question-456",
					questionIndex: 0,
					response: "Agree",
					category: "communication",
					score: 4,
					totalQuestions: 5,
				};

				await saveResponseAction(input);

				// Should handle gracefully and create new array
				const updateCall = chain.update.mock.calls[0]?.[0];
				expect(Array.isArray(updateCall.responses)).toBe(true);
				expect(updateCall.responses).toHaveLength(1);
			});
		});
	});

	describe("completeSurveyAction", () => {
		describe("Schema Validation", () => {
			it("should accept valid completion data", async () => {
				const chain = createMockSupabaseChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					responseId: "response-456",
					categoryScores: { communication: 20, design: 18 },
					highestScoringCategory: "communication",
					lowestScoringCategory: "design",
				};

				const result = await completeSurveyAction(input);
				expect(result.success).toBe(true);
			});

			it("should reject missing surveyId", async () => {
				const input = {
					responseId: "response-456",
					categoryScores: { communication: 20 },
					highestScoringCategory: "communication",
					lowestScoringCategory: "communication",
				};

				const result = await completeSurveyAction(
					input as unknown as Parameters<typeof completeSurveyAction>[0],
				);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Validation failed");
			});

			it("should reject missing responseId", async () => {
				const input = {
					surveyId: "survey-123",
					categoryScores: { communication: 20 },
					highestScoringCategory: "communication",
					lowestScoringCategory: "communication",
				};

				const result = await completeSurveyAction(
					input as unknown as Parameters<typeof completeSurveyAction>[0],
				);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Validation failed");
			});

			it("should reject invalid categoryScores type", async () => {
				const input = {
					surveyId: "survey-123",
					responseId: "response-456",
					categoryScores: "invalid" as unknown as Record<string, number>,
					highestScoringCategory: "communication",
					lowestScoringCategory: "design",
				};

				const result = await completeSurveyAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Validation failed");
			});
		});

		describe("Core Functionality", () => {
			it("should update survey response with completion data", async () => {
				const chain = createMockSupabaseChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					responseId: "response-456",
					categoryScores: { communication: 20, design: 18 },
					highestScoringCategory: "communication",
					lowestScoringCategory: "design",
				};

				await completeSurveyAction(input);

				expect(mockSupabaseClient.from).toHaveBeenCalledWith(
					"survey_responses",
				);
				expect(chain.update).toHaveBeenCalledWith(
					expect.objectContaining({
						completed: true,
						category_scores: { communication: 20, design: 18 },
						highest_scoring_category: "communication",
						lowest_scoring_category: "design",
					}),
				);
			});

			it("should set updated_at timestamp", async () => {
				const chain = createMockSupabaseChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					responseId: "response-456",
					categoryScores: { communication: 20 },
					highestScoringCategory: "communication",
					lowestScoringCategory: "communication",
				};

				const beforeCall = new Date().toISOString();
				await completeSurveyAction(input);
				const afterCall = new Date().toISOString();

				const updateCall = chain.update.mock.calls[0]?.[0];
				expect(
					new Date(updateCall.updated_at).getTime(),
				).toBeGreaterThanOrEqual(new Date(beforeCall).getTime());
				expect(new Date(updateCall.updated_at).getTime()).toBeLessThanOrEqual(
					new Date(afterCall).getTime(),
				);
			});

			it("should filter by responseId", async () => {
				const chain = createMockSupabaseChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					responseId: "response-456",
					categoryScores: { communication: 20 },
					highestScoringCategory: "communication",
					lowestScoringCategory: "communication",
				};

				await completeSurveyAction(input);

				expect(chain.eq).toHaveBeenCalledWith("id", "response-456");
			});

			it("should return success on completion", async () => {
				const chain = createMockSupabaseChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					responseId: "response-456",
					categoryScores: { communication: 20 },
					highestScoringCategory: "communication",
					lowestScoringCategory: "communication",
				};

				const result = await completeSurveyAction(input);
				expect(result).toEqual({ success: true });
			});
		});

		describe("Error Handling", () => {
			it("should handle update error gracefully", async () => {
				const chain = createMockSupabaseChain();
				chain.update.mockReturnValue({
					...chain,
					eq: vi.fn().mockResolvedValue({
						data: null,
						error: { message: "Update failed" },
					}),
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					responseId: "response-456",
					categoryScores: { communication: 20 },
					highestScoringCategory: "communication",
					lowestScoringCategory: "communication",
				};

				const result = await completeSurveyAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toContain("Error completing survey");
			});
		});

		describe("Edge Cases", () => {
			it("should handle empty categoryScores", async () => {
				const chain = createMockSupabaseChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					responseId: "response-456",
					categoryScores: {},
					highestScoringCategory: "",
					lowestScoringCategory: "",
				};

				const result = await completeSurveyAction(input);
				expect(result.success).toBe(true);
			});

			it("should handle same highest and lowest category", async () => {
				const chain = createMockSupabaseChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					surveyId: "survey-123",
					responseId: "response-456",
					categoryScores: { onlyCategory: 20 },
					highestScoringCategory: "onlyCategory",
					lowestScoringCategory: "onlyCategory",
				};

				const result = await completeSurveyAction(input);
				expect(result.success).toBe(true);

				const updateCall = chain.update.mock.calls[0]?.[0];
				expect(updateCall.highest_scoring_category).toBe("onlyCategory");
				expect(updateCall.lowest_scoring_category).toBe("onlyCategory");
			});

			it("should handle many categories", async () => {
				const chain = createMockSupabaseChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				const manyCategories: Record<string, number> = {};
				for (let i = 0; i < 20; i++) {
					manyCategories[`category${i}`] = i * 5;
				}

				const input = {
					surveyId: "survey-123",
					responseId: "response-456",
					categoryScores: manyCategories,
					highestScoringCategory: "category19",
					lowestScoringCategory: "category0",
				};

				const result = await completeSurveyAction(input);
				expect(result.success).toBe(true);
			});
		});
	});

	describe("Integration Scenarios", () => {
		it("should handle complete survey workflow: save responses -> complete", async () => {
			// Save multiple responses
			let callCount = 0;
			mockSupabaseClient.from.mockImplementation(() => {
				const chain = createMockSupabaseChain();
				if (callCount % 2 === 0) {
					chain.maybeSingle.mockResolvedValue({ data: null, error: null });
				}
				callCount++;
				return chain;
			});

			// Save first response
			const response1 = await saveResponseAction({
				surveyId: "survey-123",
				questionId: "q1",
				questionIndex: 0,
				response: "Strongly Agree",
				category: "communication",
				score: 5,
				totalQuestions: 2,
			});
			expect(response1.success).toBe(true);

			// Save second response
			const response2 = await saveResponseAction({
				surveyId: "survey-123",
				questionId: "q2",
				questionIndex: 1,
				response: "Agree",
				category: "design",
				score: 4,
				totalQuestions: 2,
			});
			expect(response2.success).toBe(true);

			// Complete survey
			const chain = createMockSupabaseChain();
			mockSupabaseClient.from.mockReturnValue(chain);

			const completion = await completeSurveyAction({
				surveyId: "survey-123",
				responseId: "response-456",
				categoryScores: { communication: 5, design: 4 },
				highestScoringCategory: "communication",
				lowestScoringCategory: "design",
			});
			expect(completion.success).toBe(true);
		});
	});
});
