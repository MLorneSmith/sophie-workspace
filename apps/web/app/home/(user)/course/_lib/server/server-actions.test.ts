/**
 * Unit tests for course server actions
 * Tests progress tracking, completion logic, and quiz submission functionality
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Import functions to test
import {
	updateCourseProgressAction,
	updateLessonProgressAction,
	submitQuizAttemptAction,
} from "./server-actions";

// Mock dependencies
vi.mock("@kit/next/actions", () => ({
	enhanceAction: vi.fn((fn, options) => {
		return async (data: any) => {
			// Validate with schema if provided
			if (options?.schema) {
				const result = options.schema.safeParse(data);
				if (!result.success) {
					return { error: "Validation failed" };
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

// Create comprehensive Supabase client mock
const mockSupabaseClient = {
	from: vi.fn((table: string) => {
		const queryBuilder = {
			select: vi.fn().mockReturnThis(),
			insert: vi.fn().mockReturnThis(),
			update: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			single: vi.fn(),
		};
		return queryBuilder;
	}),
};

vi.mock("@kit/supabase/server-client", () => ({
	getSupabaseServerClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock("~/lib/certificates/certificate-service", () => ({
	generateCertificate: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("~/lib/course/course-config", () => ({
	REQUIRED_LESSON_NUMBERS: ["1", "2", "3", "4", "5"],
	TOTAL_REQUIRED_LESSONS: 5,
}));

const mockGetCourseBySlug = vi.fn();
const mockGetCourseLessons = vi.fn();

vi.mock("@kit/cms/payload", async () => {
	return {
		getCourseBySlug: mockGetCourseBySlug,
		getCourseLessons: mockGetCourseLessons,
	};
});

// Test data factories
function createMockUser() {
	return {
		id: "user-123",
		email: "test@example.com",
		aud: "authenticated" as const,
	};
}

function createMockCourseProgress(overrides: any = {}) {
	return {
		id: "progress-123",
		user_id: "user-123",
		course_id: "course-1",
		started_at: "2024-01-01T00:00:00.000Z",
		last_accessed_at: "2024-01-01T00:00:00.000Z",
		completion_percentage: 0,
		completed_at: null,
		certificate_generated: false,
		current_lesson_id: null,
		...overrides,
	};
}

function createMockLessonProgress(overrides: any = {}) {
	return {
		id: "lesson-progress-123",
		user_id: "user-123",
		course_id: "course-1",
		lesson_id: "lesson-1",
		started_at: "2024-01-01T00:00:00.000Z",
		completed_at: null,
		completion_percentage: 0,
		...overrides,
	};
}

function createMockLesson(lessonNumber: string, overrides: any = {}) {
	return {
		id: `lesson-${lessonNumber}`,
		lesson_number: lessonNumber,
		title: `Lesson ${lessonNumber}`,
		...overrides,
	};
}

describe("Course Server Actions", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Reset Supabase mock responses
		mockSupabaseClient.from.mockImplementation((table: string) => {
			const queryBuilder = {
				select: vi.fn().mockReturnThis(),
				insert: vi.fn().mockReturnThis(),
				update: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({ data: null, error: null }),
			};
			return queryBuilder;
		});
	});

	describe("updateCourseProgressAction", () => {
		describe("Core Functionality", () => {
			it("creates new course progress record for new user", async () => {
				// Arrange: No existing progress found
				const mockFrom = mockSupabaseClient.from as any;
				mockFrom.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi.fn().mockResolvedValue({ data: null, error: null }),
				});

				const insertMock = vi.fn().mockResolvedValue({ data: {}, error: null });
				mockFrom.mockReturnValueOnce({
					insert: insertMock,
				});

				const input = {
					courseId: "course-1",
					currentLessonId: "lesson-1",
					completionPercentage: 25,
				};

				// Act
				const result = await updateCourseProgressAction(input);

				// Assert
				expect(result).toEqual({ success: true });
				expect(insertMock).toHaveBeenCalledWith({
					user_id: "user-123",
					course_id: "course-1",
					started_at: expect.any(String),
					last_accessed_at: expect.any(String),
					current_lesson_id: "lesson-1",
					completion_percentage: 25,
					completed_at: null,
				});
			});

			it("updates existing course progress record", async () => {
				// Arrange: Existing progress found
				const existingProgress = createMockCourseProgress({
					completion_percentage: 25,
				});

				const mockFrom = mockSupabaseClient.from as any;
				mockFrom.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi
						.fn()
						.mockResolvedValue({ data: existingProgress, error: null }),
				});

				const updateMock = vi.fn().mockResolvedValue({ data: {}, error: null });
				mockFrom.mockReturnValueOnce({
					update: updateMock,
					eq: vi.fn().mockReturnThis(),
				});

				const input = {
					courseId: "course-1",
					currentLessonId: "lesson-2",
					completionPercentage: 50,
				};

				// Act
				const result = await updateCourseProgressAction(input);

				// Assert
				expect(result).toEqual({ success: true });
				expect(updateMock).toHaveBeenCalledWith({
					last_accessed_at: expect.any(String),
					current_lesson_id: "lesson-2",
					completion_percentage: 50,
				});
			});

			it("handles course completion and certificate generation", async () => {
				// Arrange: Existing progress without certificate
				const existingProgress = createMockCourseProgress({
					certificate_generated: false,
				});

				const mockFrom = mockSupabaseClient.from as any;

				// Mock existing progress query
				mockFrom.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi
						.fn()
						.mockResolvedValue({ data: existingProgress, error: null }),
				});

				// Mock account query for name
				mockFrom.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi.fn().mockResolvedValue({
						data: { name: "John Doe" },
						error: null,
					}),
				});

				// Mock progress update
				const updateMock = vi.fn().mockResolvedValue({ data: {}, error: null });
				mockFrom.mockReturnValueOnce({
					update: updateMock,
					eq: vi.fn().mockReturnThis(),
				});

				const input = {
					courseId: "course-1",
					completed: true,
					completionPercentage: 100,
				};

				// Act
				const result = await updateCourseProgressAction(input);

				// Assert
				expect(result).toEqual({ success: true });
				expect(updateMock).toHaveBeenCalledWith({
					last_accessed_at: expect.any(String),
					completion_percentage: 100,
					completed_at: expect.any(String),
					certificate_generated: true,
				});
			});

			it("avoids duplicate certificate generation", async () => {
				// Arrange: Existing progress with certificate already generated
				const existingProgress = createMockCourseProgress({
					certificate_generated: true,
				});

				const mockFrom = mockSupabaseClient.from as any;
				mockFrom.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi
						.fn()
						.mockResolvedValue({ data: existingProgress, error: null }),
				});

				const updateMock = vi.fn().mockResolvedValue({ data: {}, error: null });
				mockFrom.mockReturnValueOnce({
					update: updateMock,
					eq: vi.fn().mockReturnThis(),
				});

				const { generateCertificate } = await import(
					"~/lib/certificates/certificate-service"
				);

				const input = {
					courseId: "course-1",
					completed: true,
					completionPercentage: 100,
				};

				// Act
				const result = await updateCourseProgressAction(input);

				// Assert
				expect(result).toEqual({ success: true });
				expect(generateCertificate).not.toHaveBeenCalled();
				expect(updateMock).toHaveBeenCalledWith({
					last_accessed_at: expect.any(String),
					completion_percentage: 100,
					completed_at: expect.any(String),
				});
			});
		});

		describe("Schema Validation", () => {
			it("transforms courseId from number to string", async () => {
				// Arrange
				const mockFrom = mockSupabaseClient.from as any;
				mockFrom.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi.fn().mockResolvedValue({ data: null, error: null }),
				});

				const insertMock = vi.fn().mockResolvedValue({ data: {}, error: null });
				mockFrom.mockReturnValueOnce({
					insert: insertMock,
				});

				const input = {
					courseId: 123 as any, // Number input
					currentLessonId: "lesson-1",
				};

				// Act
				const result = await updateCourseProgressAction(input);

				// Assert
				expect(result).toEqual({ success: true });
				expect(insertMock).toHaveBeenCalledWith(
					expect.objectContaining({
						course_id: "123", // Should be transformed to string
					}),
				);
			});

			it("validates completion percentage bounds", async () => {
				// Test invalid negative percentage
				const invalidInput1 = {
					courseId: "course-1",
					completionPercentage: -10,
				};

				const result1 = await updateCourseProgressAction(invalidInput1);
				expect(result1).toEqual({ error: "Validation failed" });

				// Test invalid high percentage
				const invalidInput2 = {
					courseId: "course-1",
					completionPercentage: 150,
				};

				const result2 = await updateCourseProgressAction(invalidInput2);
				expect(result2).toEqual({ error: "Validation failed" });
			});
		});

		describe("Error Handling", () => {
			it("handles certificate generation failure gracefully", async () => {
				// Arrange: Mock certificate generation to fail
				const { generateCertificate } = await import(
					"~/lib/certificates/certificate-service"
				);
				vi.mocked(generateCertificate).mockRejectedValueOnce(
					new Error("Certificate service unavailable"),
				);

				const existingProgress = createMockCourseProgress({
					certificate_generated: false,
				});

				const mockFrom = mockSupabaseClient.from as any;

				// Mock existing progress query
				mockFrom.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi
						.fn()
						.mockResolvedValue({ data: existingProgress, error: null }),
				});

				// Mock account query
				mockFrom.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi.fn().mockResolvedValue({
						data: { name: "John Doe" },
						error: null,
					}),
				});

				// Mock progress update
				const updateMock = vi.fn().mockResolvedValue({ data: {}, error: null });
				mockFrom.mockReturnValueOnce({
					update: updateMock,
					eq: vi.fn().mockReturnThis(),
				});

				const consoleSpy = vi
					.spyOn(console, "error")
					.mockImplementation(() => {});

				const input = {
					courseId: "course-1",
					completed: true,
				};

				// Act
				const result = await updateCourseProgressAction(input);

				// Assert: Should still succeed despite certificate failure
				expect(result).toEqual({ success: true });
				expect(consoleSpy).toHaveBeenCalledWith(
					"Failed to generate certificate:",
					expect.any(Error),
				);
				expect(updateMock).toHaveBeenCalledWith(
					expect.objectContaining({
						completed_at: expect.any(String),
					}),
				);

				consoleSpy.mockRestore();
			});
		});
	});

	describe("updateLessonProgressAction", () => {
		describe("Core Functionality", () => {
			it("creates new lesson progress record", async () => {
				// Arrange: No existing lesson progress
				const mockFrom = mockSupabaseClient.from as any;

				// Mock lesson progress query (not found)
				mockFrom.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi.fn().mockResolvedValue({ data: null, error: null }),
				});

				// Mock lesson progress insert
				const insertMock = vi.fn().mockResolvedValue({ data: {}, error: null });
				mockFrom.mockReturnValueOnce({
					insert: insertMock,
				});

				// Mock lesson progress query for course calculation
				mockFrom.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
				});

				// Mock CMS calls
				mockGetCourseBySlug.mockResolvedValue({
					docs: [{ id: "course-1", title: "Test Course" }],
				});
				mockGetCourseLessons.mockResolvedValue({
					docs: [
						createMockLesson("1"),
						createMockLesson("2"),
						createMockLesson("3"),
					],
				});

				const input = {
					courseId: "course-1",
					lessonId: "lesson-1",
					completionPercentage: 100,
					completed: true,
				};

				// Act
				const result = await updateLessonProgressAction(input);

				// Assert
				expect(result).toEqual({ success: true });
				expect(insertMock).toHaveBeenCalledWith({
					user_id: "user-123",
					course_id: "course-1",
					lesson_id: "lesson-1",
					started_at: expect.any(String),
					completed_at: expect.any(String),
					completion_percentage: 100,
				});
			});

			it("updates existing lesson progress", async () => {
				// Arrange: Existing lesson progress
				const existingProgress = createMockLessonProgress({
					completion_percentage: 50,
				});

				const mockFrom = mockSupabaseClient.from as any;

				// Mock lesson progress query (found)
				mockFrom.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi
						.fn()
						.mockResolvedValue({ data: existingProgress, error: null }),
				});

				// Mock lesson progress update
				const updateMock = vi.fn().mockResolvedValue({ data: {}, error: null });
				mockFrom.mockReturnValueOnce({
					update: updateMock,
					eq: vi.fn().mockReturnThis(),
				});

				// Mock lesson progress query for course calculation
				mockFrom.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
				});

				// Mock CMS calls
				mockGetCourseBySlug.mockResolvedValue({
					docs: [{ id: "course-1" }],
				});
				mockGetCourseLessons.mockResolvedValue({
					docs: [createMockLesson("1")],
				});

				const input = {
					courseId: "course-1",
					lessonId: "lesson-1",
					completionPercentage: 100,
					completed: true,
				};

				// Act
				const result = await updateLessonProgressAction(input);

				// Assert
				expect(result).toEqual({ success: true });
				expect(updateMock).toHaveBeenCalledWith({
					completion_percentage: 100,
					completed_at: expect.any(String),
					course_id: "course-1",
				});
			});
		});

		describe("Progress Calculation Logic", () => {
			it("calculates correct progress percentage for required lessons", async () => {
				// Arrange: 2 out of 5 required lessons completed
				const mockFrom = mockSupabaseClient.from as any;

				// Mock lesson progress creation
				mockFrom.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi.fn().mockResolvedValue({ data: null, error: null }),
				});
				mockFrom.mockReturnValueOnce({
					insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
				});

				// Mock lesson progress query for calculation
				const lessonProgress = [
					{ lesson_id: "lesson-1", completed_at: "2024-01-01T00:00:00.000Z" },
					{ lesson_id: "lesson-2", completed_at: "2024-01-01T00:00:00.000Z" },
					{ lesson_id: "lesson-6", completed_at: "2024-01-01T00:00:00.000Z" }, // Not required
				];
				mockFrom.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
				});

				// Mock CMS calls
				mockGetCourseBySlug.mockResolvedValue({
					docs: [{ id: "course-1" }],
				});
				mockGetCourseLessons.mockResolvedValue({
					docs: [
						createMockLesson("1"), // Required
						createMockLesson("2"), // Required
						createMockLesson("3"), // Required
						createMockLesson("4"), // Required
						createMockLesson("5"), // Required
						createMockLesson("6"), // Not required
					],
				});

				// Set up lesson progress query to return our mock data
				mockSupabaseClient.from.mockImplementation((table: string) => {
					if (table === "lesson_progress" && mockFrom.mock.calls.length === 3) {
						return {
							select: vi.fn().mockReturnValue(lessonProgress),
							eq: vi.fn().mockReturnThis(),
							insert: vi.fn().mockReturnThis(),
							update: vi.fn().mockReturnThis(),
							single: vi.fn(),
						};
					}
					return {
						select: vi.fn().mockReturnThis(),
						insert: vi.fn().mockReturnThis(),
						update: vi.fn().mockReturnThis(),
						eq: vi.fn().mockReturnThis(),
						single: vi.fn(),
					};
				});

				const consoleSpy = vi
					.spyOn(console, "log")
					.mockImplementation(() => {});

				const input = {
					courseId: "course-1",
					lessonId: "lesson-2",
					completed: true,
				};

				// Act
				const result = await updateLessonProgressAction(input);

				// Assert
				expect(result).toEqual({ success: true });

				// Verify console logs show correct calculation
				expect(consoleSpy).toHaveBeenCalledWith(
					expect.stringContaining(
						"Course completion: 2/5 required lessons (40%)",
					),
				);

				consoleSpy.mockRestore();
			});

			it("triggers course completion when all required lessons done", async () => {
				// Arrange: All 5 required lessons completed
				const mockFrom = mockSupabaseClient.from as any;

				// Mock lesson progress creation
				mockFrom.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi.fn().mockResolvedValue({ data: null, error: null }),
				});
				mockFrom.mockReturnValueOnce({
					insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
				});

				// Mock lesson progress query showing all required lessons completed
				const lessonProgress = [
					{ lesson_id: "lesson-1", completed_at: "2024-01-01T00:00:00.000Z" },
					{ lesson_id: "lesson-2", completed_at: "2024-01-01T00:00:00.000Z" },
					{ lesson_id: "lesson-3", completed_at: "2024-01-01T00:00:00.000Z" },
					{ lesson_id: "lesson-4", completed_at: "2024-01-01T00:00:00.000Z" },
					{ lesson_id: "lesson-5", completed_at: "2024-01-01T00:00:00.000Z" },
				];
				mockFrom.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
				});

				// Mock CMS calls
				mockGetCourseBySlug.mockResolvedValue({
					docs: [{ id: "course-1" }],
				});
				mockGetCourseLessons.mockResolvedValue({
					docs: [
						createMockLesson("1"),
						createMockLesson("2"),
						createMockLesson("3"),
						createMockLesson("4"),
						createMockLesson("5"),
					],
				});

				// Set up lesson progress query to return our mock data
				mockSupabaseClient.from.mockImplementation((table: string) => {
					if (table === "lesson_progress" && mockFrom.mock.calls.length === 3) {
						return {
							select: vi.fn().mockReturnValue(lessonProgress),
							eq: vi.fn().mockReturnThis(),
						};
					}
					return {
						select: vi.fn().mockReturnThis(),
						insert: vi.fn().mockReturnThis(),
						update: vi.fn().mockReturnThis(),
						eq: vi.fn().mockReturnThis(),
						single: vi.fn(),
					};
				});

				const consoleSpy = vi
					.spyOn(console, "log")
					.mockImplementation(() => {});

				const input = {
					courseId: "course-1",
					lessonId: "lesson-5",
					completed: true,
				};

				// Act
				const result = await updateLessonProgressAction(input);

				// Assert
				expect(result).toEqual({ success: true });

				// Verify console logs show course completion
				expect(consoleSpy).toHaveBeenCalledWith(
					expect.stringContaining(
						"Course completion: 5/5 required lessons (100%)",
					),
				);
				expect(consoleSpy).toHaveBeenCalledWith("Course completed: Yes");

				consoleSpy.mockRestore();
			});
		});

		describe("Schema Validation", () => {
			it("transforms courseId and lessonId from numbers to strings", async () => {
				// Arrange
				const mockFrom = mockSupabaseClient.from as any;
				mockFrom.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi.fn().mockResolvedValue({ data: null, error: null }),
				});

				const insertMock = vi.fn().mockResolvedValue({ data: {}, error: null });
				mockFrom.mockReturnValueOnce({
					insert: insertMock,
				});

				// Mock remaining calls for course calculation
				mockFrom.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
				});

				mockGetCourseBySlug.mockResolvedValue({ docs: [{ id: "123" }] });
				mockGetCourseLessons.mockResolvedValue({
					docs: [createMockLesson("1")],
				});

				const input = {
					courseId: 123 as any,
					lessonId: 456 as any,
					completed: true,
				};

				// Act
				const result = await updateLessonProgressAction(input);

				// Assert
				expect(result).toEqual({ success: true });
				expect(insertMock).toHaveBeenCalledWith(
					expect.objectContaining({
						course_id: "123",
						lesson_id: "456",
					}),
				);
			});
		});
	});

	describe("submitQuizAttemptAction", () => {
		describe("Core Functionality", () => {
			it("records quiz attempt successfully", async () => {
				// Arrange
				const mockFrom = mockSupabaseClient.from as any;
				const insertMock = vi.fn().mockResolvedValue({ data: {}, error: null });
				mockFrom.mockReturnValueOnce({
					insert: insertMock,
				});

				const input = {
					courseId: "course-1",
					lessonId: "lesson-1",
					quizId: "quiz-1",
					answers: { "0": [1], "1": [0, 2] },
					score: 85,
					passed: true,
				};

				// Act
				const result = await submitQuizAttemptAction(input);

				// Assert
				expect(result).toEqual({ success: true });
				expect(insertMock).toHaveBeenCalledWith({
					user_id: "user-123",
					course_id: "course-1",
					lesson_id: "lesson-1",
					quiz_id: "quiz-1",
					started_at: expect.any(String),
					completed_at: expect.any(String),
					score: 85,
					passed: true,
					answers: { "0": [1], "1": [0, 2] },
				});
			});

			it("triggers lesson completion on passing quiz", async () => {
				// Arrange: Mock successful quiz attempt and lesson progress update
				const mockFrom = mockSupabaseClient.from as any;

				// Mock quiz attempt insert
				mockFrom.mockReturnValueOnce({
					insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
				});

				// Mock lesson progress queries and updates for updateLessonProgressAction
				mockFrom.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi.fn().mockResolvedValue({ data: null, error: null }),
				});
				mockFrom.mockReturnValueOnce({
					insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
				});
				mockFrom.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
				});

				// Mock CMS calls
				mockGetCourseBySlug.mockResolvedValue({
					docs: [{ id: "course-1" }],
				});
				mockGetCourseLessons.mockResolvedValue({
					docs: [createMockLesson("1")],
				});

				const input = {
					courseId: "course-1",
					lessonId: "lesson-1",
					quizId: "quiz-1",
					answers: {},
					score: 85,
					passed: true,
				};

				// Act
				const result = await submitQuizAttemptAction(input);

				// Assert
				expect(result).toEqual({ success: true });
				// Verify that lesson progress functions were called due to passing quiz
				expect(mockFrom).toHaveBeenCalledWith("quiz_attempts");
				expect(mockFrom).toHaveBeenCalledWith("lesson_progress");
			});

			it("does not complete lesson on failing quiz", async () => {
				// Arrange: Mock failing quiz
				const mockFrom = mockSupabaseClient.from as any;
				const insertMock = vi.fn().mockResolvedValue({ data: {}, error: null });
				mockFrom.mockReturnValueOnce({
					insert: insertMock,
				});

				const input = {
					courseId: "course-1",
					lessonId: "lesson-1",
					quizId: "quiz-1",
					answers: {},
					score: 45,
					passed: false,
				};

				// Act
				const result = await submitQuizAttemptAction(input);

				// Assert
				expect(result).toEqual({ success: true });
				expect(insertMock).toHaveBeenCalledWith(
					expect.objectContaining({
						passed: false,
						score: 45,
					}),
				);
				// Should only have one call to mockFrom (for quiz_attempts), no lesson_progress calls
				expect(mockFrom).toHaveBeenCalledTimes(1);
				expect(mockFrom).toHaveBeenCalledWith("quiz_attempts");
			});
		});

		describe("Schema Validation", () => {
			it("handles complex quizId transformation", async () => {
				// Arrange
				const mockFrom = mockSupabaseClient.from as any;
				const insertMock = vi.fn().mockResolvedValue({ data: {}, error: null });
				mockFrom.mockReturnValueOnce({
					insert: insertMock,
				});

				// Test different quizId formats
				const testCases = [
					{ input: "quiz-1" as any, expected: "quiz-1" },
					{ input: 123 as any, expected: "123" },
					{ input: { value: "quiz-2" } as any, expected: "quiz-2" },
					{ input: { id: "quiz-3" } as any, expected: "quiz-3" },
				];

				for (const testCase of testCases) {
					mockFrom.mockClear();
					mockFrom.mockReturnValueOnce({
						insert: insertMock,
					});

					const input = {
						courseId: "course-1",
						lessonId: "lesson-1",
						quizId: testCase.input,
						answers: {},
						score: 85,
						passed: true,
					};

					// Act
					const result = await submitQuizAttemptAction(input);

					// Assert
					expect(result).toEqual({ success: true });
					expect(insertMock).toHaveBeenCalledWith(
						expect.objectContaining({
							quiz_id: testCase.expected,
						}),
					);
				}
			});

			it("validates score bounds", async () => {
				// Test invalid scores
				const invalidScores = [-10, 150];

				for (const score of invalidScores) {
					const input = {
						courseId: "course-1",
						lessonId: "lesson-1",
						quizId: "quiz-1",
						answers: {},
						score,
						passed: false,
					};

					const result = await submitQuizAttemptAction(input);
					expect(result).toEqual({ error: "Validation failed" });
				}
			});

			it("validates answers structure", async () => {
				// Arrange
				const mockFrom = mockSupabaseClient.from as any;
				const insertMock = vi.fn().mockResolvedValue({ data: {}, error: null });
				mockFrom.mockReturnValueOnce({
					insert: insertMock,
				});

				const complexAnswers = {
					"0": [1, 2],
					"1": [0],
					text_question: "Some text answer",
				};

				const input = {
					courseId: "course-1",
					lessonId: "lesson-1",
					quizId: "quiz-1",
					answers: complexAnswers,
					score: 85,
					passed: true,
				};

				// Act
				const result = await submitQuizAttemptAction(input);

				// Assert
				expect(result).toEqual({ success: true });
				expect(insertMock).toHaveBeenCalledWith(
					expect.objectContaining({
						answers: complexAnswers,
					}),
				);
			});
		});
	});
});
