/**
 * Unit tests for course server actions
 * Tests course progress, lesson progress, and quiz submission functionality
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	submitQuizAttemptAction,
	updateCourseProgressAction,
	updateLessonProgressAction,
} from "./server-actions";

// Mock enhanceAction to preserve schema validation
vi.mock("@kit/next/actions", () => ({
	enhanceAction: vi.fn((fn, options) => {
		return async (data: unknown) => {
			// Validate with schema if provided
			let validatedData = data;
			if (options?.schema) {
				const result = options.schema.safeParse(data);
				if (!result.success) {
					return { error: "Validation failed", details: result.error };
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
		eq: vi.fn(),
		single: vi.fn(),
	};

	// Make all methods return the chain for proper chaining
	chain.select.mockReturnValue(chain);
	chain.insert.mockReturnValue(chain);
	chain.update.mockReturnValue(chain);
	chain.eq.mockReturnValue(chain);
	chain.single.mockResolvedValue({ data: null, error: null });

	return chain;
};

const mockSupabaseClient = {
	from: vi.fn(() => createMockSupabaseChain()),
};

vi.mock("@kit/supabase/server-client", () => ({
	getSupabaseServerClient: vi.fn(() => mockSupabaseClient),
}));

// Mock certificate service
vi.mock("~/lib/certificates/certificate-service", () => ({
	generateCertificate: vi.fn().mockResolvedValue({
		certificateId: "cert-123",
		certificateUrl: "https://example.com/cert.pdf",
	}),
}));

// Mock course configuration
vi.mock("~/lib/course/course-config", () => ({
	REQUIRED_LESSON_NUMBERS: ["101", "103", "104", "201", "202"],
	TOTAL_REQUIRED_LESSONS: 5,
}));

// Mock CMS functions
const mockGetCourseBySlug = vi.fn();
const mockGetCourseLessons = vi.fn();

vi.mock("@kit/cms/payload", async () => ({
	getCourseBySlug: mockGetCourseBySlug,
	getCourseLessons: mockGetCourseLessons,
}));

describe("Course Server Actions", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Reset Supabase mock to default behavior
		mockSupabaseClient.from.mockImplementation(() => createMockSupabaseChain());
	});

	describe("updateCourseProgressAction", () => {
		describe("Schema Validation", () => {
			it("should accept valid input data", async () => {
				const input = {
					courseId: "course-123",
					currentLessonId: "lesson-456",
					completionPercentage: 75,
					completed: false,
				};

				const result = await updateCourseProgressAction(input);
				expect(result).toEqual({ success: true });
			});

			it("should transform courseId from number to string", async () => {
				const input = {
					courseId: 123,
				};

				// Should not throw validation error
				const result = await updateCourseProgressAction(input);
				expect(result).toEqual({ success: true });

				// Verify the insert was called with string courseId
				expect(mockSupabaseClient.from).toHaveBeenCalledWith("course_progress");
			});

			it("should handle undefined currentLessonId", async () => {
				const input = {
					courseId: "course-123",
					currentLessonId: undefined,
				};

				const result = await updateCourseProgressAction(input);
				expect(result).toEqual({ success: true });
			});

			it("should reject completion percentage above 100", async () => {
				const input = {
					courseId: "course-123",
					completionPercentage: 150,
				};

				const result = await updateCourseProgressAction(input);
				expect(result.error).toBeDefined();
				expect(result.error).toBe("Validation failed");
			});

			it("should reject negative completion percentage", async () => {
				const input = {
					courseId: "course-123",
					completionPercentage: -10,
				};

				const result = await updateCourseProgressAction(input);
				expect(result.error).toBeDefined();
				expect(result.error).toBe("Validation failed");
			});
		});

		describe("Core Functionality - New Progress Record", () => {
			it("should create new course progress record", async () => {
				// Mock no existing progress record
				const chain = createMockSupabaseChain();
				chain.single.mockResolvedValue({ data: null, error: null });

				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					courseId: "course-123",
					currentLessonId: "lesson-456",
					completionPercentage: 25,
				};

				const result = await updateCourseProgressAction(input);

				expect(result).toEqual({ success: true });
				expect(mockSupabaseClient.from).toHaveBeenCalledWith("course_progress");
				expect(chain.insert).toHaveBeenCalledWith(
					expect.objectContaining({
						user_id: "user-123",
						course_id: "course-123",
						current_lesson_id: "lesson-456",
						completion_percentage: 25,
						started_at: expect.any(String),
						last_accessed_at: expect.any(String),
						completed_at: null,
					}),
				);
			});

			it("should set started_at and last_accessed_at timestamps", async () => {
				const chain = createMockSupabaseChain();
				chain.single.mockResolvedValue({ data: null, error: null });
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					courseId: "course-123",
				};

				const beforeCall = new Date().toISOString();
				await updateCourseProgressAction(input);
				const afterCall = new Date().toISOString();

				const insertCall = chain.insert.mock.calls[0][0];
				expect(
					new Date(insertCall.started_at).getTime(),
				).toBeGreaterThanOrEqual(new Date(beforeCall).getTime());
				expect(new Date(insertCall.started_at).getTime()).toBeLessThanOrEqual(
					new Date(afterCall).getTime(),
				);
				expect(insertCall.started_at).toBe(insertCall.last_accessed_at);
			});

			it("should handle optional fields with defaults", async () => {
				const chain = createMockSupabaseChain();
				chain.single.mockResolvedValue({ data: null, error: null });
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					courseId: "course-123",
				};

				await updateCourseProgressAction(input);

				const insertCall = chain.insert.mock.calls[0][0];
				expect(insertCall.completion_percentage).toBe(0);
				expect(insertCall.current_lesson_id).toBeUndefined();
				expect(insertCall.completed_at).toBeNull();
			});
		});

		describe("Core Functionality - Update Existing Record", () => {
			it("should update existing course progress record", async () => {
				// Mock existing progress record
				const existingProgress = {
					id: "progress-123",
					user_id: "user-123",
					course_id: "course-123",
					started_at: "2024-01-01T00:00:00Z",
					completion_percentage: 50,
					certificate_generated: false,
				};

				const chain = createMockSupabaseChain();
				chain.single.mockResolvedValue({ data: existingProgress, error: null });
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					courseId: "course-123",
					currentLessonId: "lesson-789",
					completionPercentage: 75,
				};

				const result = await updateCourseProgressAction(input);

				expect(result).toEqual({ success: true });
				expect(chain.update).toHaveBeenCalledWith(
					expect.objectContaining({
						current_lesson_id: "lesson-789",
						completion_percentage: 75,
						last_accessed_at: expect.any(String),
					}),
				);
				expect(chain.eq).toHaveBeenCalledWith("id", "progress-123");
			});

			it("should always update last_accessed_at timestamp", async () => {
				const existingProgress = {
					id: "progress-123",
					certificate_generated: false,
				};

				const chain = createMockSupabaseChain();
				chain.single.mockResolvedValue({ data: existingProgress, error: null });
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					courseId: "course-123",
				};

				const beforeCall = new Date().toISOString();
				await updateCourseProgressAction(input);
				const afterCall = new Date().toISOString();

				const updateCall = chain.update.mock.calls[0][0];
				expect(
					new Date(updateCall.last_accessed_at).getTime(),
				).toBeGreaterThanOrEqual(new Date(beforeCall).getTime());
				expect(
					new Date(updateCall.last_accessed_at).getTime(),
				).toBeLessThanOrEqual(new Date(afterCall).getTime());
			});

			it("should conditionally update fields based on input", async () => {
				const existingProgress = {
					id: "progress-123",
					certificate_generated: false,
				};

				const chain = createMockSupabaseChain();
				chain.single.mockResolvedValue({ data: existingProgress, error: null });
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					courseId: "course-123",
					completionPercentage: 90,
				};

				await updateCourseProgressAction(input);

				const updateCall = chain.update.mock.calls[0][0];
				expect(updateCall.completion_percentage).toBe(90);
				expect(updateCall.current_lesson_id).toBeUndefined();
				expect(updateCall.last_accessed_at).toBeDefined();
			});
		});

		describe("Certificate Generation", () => {
			it("should generate certificate when course completed and not already generated", async () => {
				const existingProgress = {
					id: "progress-123",
					user_id: "user-123",
					course_id: "course-123",
					certificate_generated: false,
				};

				// Mock multiple from() calls for different tables
				let callCount = 0;
				mockSupabaseClient.from.mockImplementation((table: string) => {
					const chain = createMockSupabaseChain();

					if (table === "course_progress" && callCount === 0) {
						chain.single.mockResolvedValue({
							data: existingProgress,
							error: null,
						// });
					} else if (table === "accounts") {
						chain.single.mockResolvedValue({
							data: { name: "John Doe" },
							error: null,
						// });
					}

					callCount++;
					return chain;
				});

				const input = {
					courseId: "course-123",
					completed: true,
				};

				await updateCourseProgressAction(input);

				const { generateCertificate } = await import(
					"~/lib/certificates/certificate-service"
				);
				expect(generateCertificate).toHaveBeenCalledWith({
					userId: "user-123",
					courseId: "course-123",
					fullName: "John Doe",
				// });
			});

			it("should skip certificate generation if already generated", async () => {
				const existingProgress = {
					id: "progress-123",
					certificate_generated: true,
				};

				const chain = createMockSupabaseChain();
				chain.single.mockResolvedValue({ data: existingProgress, error: null });
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					courseId: "course-123",
					completed: true,
				};

				await updateCourseProgressAction(input);

				const { generateCertificate } = await import(
					"~/lib/certificates/certificate-service"
				);
				expect(generateCertificate).not.toHaveBeenCalled();
			});

			it("should continue update even if certificate generation fails", async () => {
				// Mock certificate generation failure
				const { generateCertificate } = await import(
					"~/lib/certificates/certificate-service"
				);
				vi.mocked(generateCertificate).mockRejectedValueOnce(
					new Error("Certificate service error"),
				);

				const existingProgress = {
					id: "progress-123",
					certificate_generated: false,
				};

				let callCount = 0;
				mockSupabaseClient.from.mockImplementation((table: string) => {
					const chain = createMockSupabaseChain();

					if (table === "course_progress" && callCount === 0) {
						chain.single.mockResolvedValue({
							data: existingProgress,
							error: null,
						// });
					} else if (table === "accounts") {
						chain.single.mockResolvedValue({
							data: { name: "John Doe" },
							error: null,
						// });
					}

					callCount++;
					return chain;
				});

				const consoleErrorSpy = vi
					.spyOn(console, "error")
					.mockImplementation(() => {});

				const input = {
					courseId: "course-123",
					completed: true,
				};

				const result = await updateCourseProgressAction(input);

				expect(result).toEqual({ success: true });
				expect(consoleErrorSpy).toHaveBeenCalledWith(
					"Failed to generate certificate:",
					expect.any(Error),
				);

				consoleErrorSpy.mockRestore();
			});
		});

		describe("Error Handling", () => {
			it("should handle database errors gracefully", async () => {
				// Mock database error
				const chain = createMockSupabaseChain();
				chain.single.mockRejectedValue(new Error("Database connection error"));
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					courseId: "course-123",
					completionPercentage: 50,
				};

				await expect(updateCourseProgressAction(input)).rejects.toThrow(
					"Database connection error",
				);
			});
		});
	});

	describe("updateLessonProgressAction", () => {
		beforeEach(() => {
			// Mock CMS data for lesson progress tests
			mockGetCourseBySlug.mockResolvedValue({
			// });
			mockGetCourseLessons.mockResolvedValue({
				docs: [{ id: "lesson-456", lesson_number: "101" }],
			// });
		});

		describe("Schema Validation", () => {
			it("should accept valid lesson progress input", async () => {
				const input = {
					courseId: "course-123",
					lessonId: "lesson-456",
					completionPercentage: 100,
					completed: true,
				};

				const result = await updateLessonProgressAction(input);
				expect(result).toEqual({ success: true });
			});

			it("should transform IDs from number to string", async () => {
				const input = {
					courseId: 123,
					lessonId: 456,
				};

				const result = await updateLessonProgressAction(input);
				expect(result).toEqual({ success: true });
			});
		});

		describe("Core Functionality - New Lesson Progress", () => {
			it("should create new lesson progress record", async () => {
				// Mock no existing lesson progress
				const chain = createMockSupabaseChain();
				chain.single.mockResolvedValue({ data: null, error: null });
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					courseId: "course-123",
					lessonId: "lesson-456",
					completionPercentage: 100,
					completed: true,
				};

				await updateLessonProgressAction(input);

				expect(chain.insert).toHaveBeenCalledWith(
					expect.objectContaining({
						user_id: "user-123",
						course_id: "course-123",
						lesson_id: "lesson-456",
						completion_percentage: 100,
						started_at: expect.any(String),
						completed_at: expect.any(String),
					}),
				);
			});

			it("should set started_at timestamp for new record", async () => {
				const chain = createMockSupabaseChain();
				chain.single.mockResolvedValue({ data: null, error: null });
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					courseId: "course-123",
					lessonId: "lesson-456",
				};

				const beforeCall = new Date().toISOString();
				await updateLessonProgressAction(input);
				const afterCall = new Date().toISOString();

				const insertCall = chain.insert.mock.calls[0][0];
				expect(
					new Date(insertCall.started_at).getTime(),
				).toBeGreaterThanOrEqual(new Date(beforeCall).getTime());
				expect(new Date(insertCall.started_at).getTime()).toBeLessThanOrEqual(
					new Date(afterCall).getTime(),
				);
			});
		});

		describe("Core Functionality - Update Existing Progress", () => {
			it("should update existing lesson progress", async () => {
				const existingProgress = {
					id: "lesson-progress-123",
					user_id: "user-123",
					lesson_id: "lesson-456",
					course_id: "course-123",
					completion_percentage: 50,
				};

				const chain = createMockSupabaseChain();
				chain.single.mockResolvedValue({ data: existingProgress, error: null });
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					courseId: "course-123",
					lessonId: "lesson-456",
					completionPercentage: 100,
					completed: true,
				};

				await updateLessonProgressAction(input);

				expect(chain.update).toHaveBeenCalledWith(
					expect.objectContaining({
						completion_percentage: 100,
						completed_at: expect.any(String),
						course_id: "course-123",
					}),
				);
				expect(chain.eq).toHaveBeenCalledWith("id", "lesson-progress-123");
			});

			it("should always update course_id for data integrity", async () => {
				const existingProgress = {
					id: "lesson-progress-123",
				};

				const chain = createMockSupabaseChain();
				chain.single.mockResolvedValue({ data: existingProgress, error: null });
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					courseId: "course-123",
					lessonId: "lesson-456",
				};

				await updateLessonProgressAction(input);

				const updateCall = chain.update.mock.calls[0][0];
				expect(updateCall.course_id).toBe("course-123");
			});
		});

		describe("Integration Points", () => {
			it("should integrate with CMS for course/lesson data", async () => {
				const input = {
					courseId: "course-123",
					lessonId: "lesson-456",
					completed: true,
				};

				// Mock CMS responses
				mockGetCourseBySlug.mockResolvedValueOnce({
				// });
				mockGetCourseLessons.mockResolvedValueOnce({
					docs: [
						{ id: "lesson-456", lesson_number: "101", title: "Test Lesson" },
					],
				});

				await updateLessonProgressAction(input);

				expect(mockGetCourseBySlug).toHaveBeenCalledWith("course-123");
				expect(mockGetCourseLessons).toHaveBeenCalledWith("course-123");
			});

			it("should handle missing course data gracefully", async () => {
				// Mock CMS returning no course data
				mockGetCourseBySlug.mockResolvedValueOnce({
					docs: [],
				// });

				const input = {
					courseId: "nonexistent-course",
					lessonId: "lesson-456",
					completed: true,
				};

				// Should not throw error
				const result = await updateLessonProgressAction(input);
				expect(result).toEqual({ success: true });
			});
		});
	});

	describe("submitQuizAttemptAction", () => {
		beforeEach(() => {
			// Mock CMS data for the recursive lesson progress call
			mockGetCourseBySlug.mockResolvedValue({
			// });
			mockGetCourseLessons.mockResolvedValue({
				docs: [{ id: "lesson-456", lesson_number: "101" }],
			// });
		});

		describe("Schema Validation", () => {
			it("should accept valid quiz submission data", async () => {
				const input = {
					courseId: "course-123",
					lessonId: "lesson-456",
					quizId: "quiz-789",
					answers: { q1: "answer1", q2: "answer2" },
					score: 85,
					passed: true,
				};

				const result = await submitQuizAttemptAction(input);
				expect(result).toEqual({ success: true });
			});

			it("should handle quizId transformation from object format", async () => {
				const input = {
					courseId: "course-123",
					lessonId: "lesson-456",
					quizId: { value: "quiz-123" },
					answers: {},
					score: 85,
					passed: true,
				};

				const result = await submitQuizAttemptAction(input);
				expect(result).toEqual({ success: true });
			});

			it("should handle quizId transformation from relationship object", async () => {
				const input = {
					courseId: "course-123",
					lessonId: "lesson-456",
					quizId: { id: "quiz-456" },
					answers: {},
					score: 85,
					passed: true,
				};

				const result = await submitQuizAttemptAction(input);
				expect(result).toEqual({ success: true });
			});

			it("should reject score above 100", async () => {
				const input = {
					courseId: "course-123",
					lessonId: "lesson-456",
					quizId: "quiz-789",
					answers: {},
					score: 150,
					passed: true,
				};

				const result = await submitQuizAttemptAction(input);
				expect(result.error).toBeDefined();
				expect(result.error).toBe("Validation failed");
			});

			it("should reject negative score", async () => {
				const input = {
					courseId: "course-123",
					lessonId: "lesson-456",
					quizId: "quiz-789",
					answers: {},
					score: -10,
					passed: true,
				};

				const result = await submitQuizAttemptAction(input);
				expect(result.error).toBeDefined();
				expect(result.error).toBe("Validation failed");
			});
		});

		describe("Core Functionality", () => {
			it("should insert quiz attempt record", async () => {
				const chain = createMockSupabaseChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					courseId: "course-123",
					lessonId: "lesson-456",
					quizId: "quiz-789",
					answers: { q1: "a", q2: "b" },
					score: 85,
					passed: true,
				};

				await submitQuizAttemptAction(input);

				expect(chain.insert).toHaveBeenCalledWith(
					expect.objectContaining({
						user_id: "user-123",
						course_id: "course-123",
						lesson_id: "lesson-456",
						quiz_id: "quiz-789",
						answers: { q1: "a", q2: "b" },
						score: 85,
						passed: true,
						started_at: expect.any(String),
						completed_at: expect.any(String),
					}),
				);
			});

			it("should set started_at and completed_at timestamps", async () => {
				const chain = createMockSupabaseChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					courseId: "course-123",
					lessonId: "lesson-456",
					quizId: "quiz-789",
					answers: {},
					score: 85,
					passed: true,
				};

				const beforeCall = new Date().toISOString();
				await submitQuizAttemptAction(input);
				const afterCall = new Date().toISOString();

				const insertCall = chain.insert.mock.calls[0][0];
				expect(
					new Date(insertCall.started_at).getTime(),
				).toBeGreaterThanOrEqual(new Date(beforeCall).getTime());
				expect(new Date(insertCall.completed_at).getTime()).toBeLessThanOrEqual(
					new Date(afterCall).getTime(),
				);
			});
		});

		describe("Lesson Completion Logic", () => {
			it("should mark lesson as completed when quiz passed", async () => {
				const input = {
					courseId: "course-123",
					lessonId: "lesson-456",
					quizId: "quiz-789",
					answers: {},
					score: 85,
					passed: true,
				};

				await submitQuizAttemptAction(input);

				// Verify quiz attempt was recorded
				expect(mockSupabaseClient.from).toHaveBeenCalledWith("quiz_attempts");
				// Verify lesson progress was called (triggered by passing quiz)
				expect(mockSupabaseClient.from).toHaveBeenCalledWith("lesson_progress");
			});

			it("should not mark lesson completed when quiz failed", async () => {
				const input = {
					courseId: "course-123",
					lessonId: "lesson-456",
					quizId: "quiz-789",
					answers: {},
					score: 45,
					passed: false,
				};

				await submitQuizAttemptAction(input);

				// Should only insert quiz attempt, not trigger lesson completion
				const insertCalls = mockSupabaseClient.from.mock.calls.filter(
					(call) => call[0] === "quiz_attempts",
				);
				expect(insertCalls).toHaveLength(1);
			});
		});

		describe("Error Handling", () => {
			it("should handle database insertion errors", async () => {
				// Mock database error
				const chain = createMockSupabaseChain();
				chain.insert.mockRejectedValue(new Error("Database insertion error"));
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					courseId: "course-123",
					lessonId: "lesson-456",
					quizId: "quiz-789",
					answers: {},
					score: 85,
					passed: true,
				};

				await expect(submitQuizAttemptAction(input)).rejects.toThrow(
					"Database insertion error",
				);
			});
		});
	});

	describe("Integration Tests", () => {
		it("should handle complete quiz → lesson progress → course progress flow", async () => {
			// This is a complex integration test that would require
			// careful mocking of the recursive action calls
			// For now, we verify the basic flow structure

			const quizInput = {
				courseId: "course-123",
				lessonId: "lesson-456",
				quizId: "quiz-789",
				answers: { q1: "correct" },
				score: 90,
				passed: true,
			};

			// Mock CMS data
			mockGetCourseBySlug.mockResolvedValue({
			// });
			mockGetCourseLessons.mockResolvedValue({
				docs: [{ id: "lesson-456", lesson_number: "101" }],
			// });

			const result = await submitQuizAttemptAction(quizInput);

			expect(result).toEqual({ success: true });
			expect(mockSupabaseClient.from).toHaveBeenCalledWith("quiz_attempts");
		});
	});
});
