import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("react", async () => {
	const actual = await vi.importActual<typeof import("react")>("react");
	return {
		...actual,
		cache: (fn: Function) => fn,
	};
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom: ReturnType<typeof vi.fn> = vi.fn();

vi.mock("@kit/supabase/server-client", () => ({
	getSupabaseServerClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock("@kit/shared/logger", () => ({
	getLogger: vi.fn(async () => ({
		warn: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
	})),
}));

import { loadRecentActivities } from "../activity.loader";

describe("loadRecentActivities", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	function mockFromResponses(
		responses: Record<string, { data: unknown[] | null; error: unknown }>,
	) {
		mockFrom.mockImplementation((table: string) => {
			const response = responses[table] ?? { data: [], error: null };
			return {
				select: vi.fn().mockReturnValue({
					not: vi.fn().mockReturnValue({
						order: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue(response),
						}),
					}),
					eq: vi.fn().mockReturnValue({
						order: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue(response),
						}),
					}),
					order: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue(response),
					}),
				}),
			};
		});
	}

	it("returns an empty array when no activities exist", async () => {
		mockFromResponses({
			lesson_progress: { data: [], error: null },
			quiz_attempts: { data: [], error: null },
			survey_responses: { data: [], error: null },
			building_blocks_submissions: { data: [], error: null },
		});

		const result = await loadRecentActivities();

		expect(result).toEqual([]);
	});

	it("returns activities sorted by timestamp (newest first)", async () => {
		mockFromResponses({
			lesson_progress: {
				data: [
					{
						id: "l1",
						lesson_id: "les-1",
						course_id: "c-1",
						completion_percentage: 100,
						completed_at: "2026-02-10T10:00:00Z",
					},
				],
				error: null,
			},
			quiz_attempts: {
				data: [
					{
						id: "q1",
						quiz_id: "quiz-1",
						score: 85,
						passed: true,
						completed_at: "2026-02-12T10:00:00Z",
					},
				],
				error: null,
			},
			survey_responses: {
				data: [
					{
						id: "s1",
						survey_id: "sur-1",
						highest_scoring_category: "structure",
						created_at: "2026-02-11T10:00:00Z",
					},
				],
				error: null,
			},
			building_blocks_submissions: {
				data: [
					{
						id: "p1",
						title: "My Presentation",
						created_at: "2026-02-09T10:00:00Z",
					},
				],
				error: null,
			},
		});

		const result = await loadRecentActivities();

		expect(result).toHaveLength(4);
		expect(result[0]!.activity_type).toBe("quiz_score");
		expect(result[1]!.activity_type).toBe("assessment_completed");
		expect(result[2]!.activity_type).toBe("lesson_completed");
		expect(result[3]!.activity_type).toBe("presentation_created");
	});

	it("queries all four activity source tables", async () => {
		mockFromResponses({
			lesson_progress: { data: [], error: null },
			quiz_attempts: { data: [], error: null },
			survey_responses: { data: [], error: null },
			building_blocks_submissions: { data: [], error: null },
		});

		await loadRecentActivities();

		const calledTables = mockFrom.mock.calls.map((call) => call[0] as string);
		expect(calledTables).toContain("lesson_progress");
		expect(calledTables).toContain("quiz_attempts");
		expect(calledTables).toContain("survey_responses");
		expect(calledTables).toContain("building_blocks_submissions");
	});

	it("returns empty array when a source errors (graceful fallback)", async () => {
		mockFromResponses({
			lesson_progress: { data: null, error: new Error("RLS error") },
			quiz_attempts: { data: [], error: null },
			survey_responses: { data: [], error: null },
			building_blocks_submissions: { data: [], error: null },
		});

		const result = await loadRecentActivities();

		expect(Array.isArray(result)).toBe(true);
	});

	it("limits total results to 10 items", async () => {
		const manyLessons = Array.from({ length: 5 }, (_, i) => ({
			id: `l${i}`,
			lesson_id: `les-${i}`,
			course_id: "c-1",
			completion_percentage: 100,
			completed_at: `2026-02-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
		}));
		const manyQuizzes = Array.from({ length: 5 }, (_, i) => ({
			id: `q${i}`,
			quiz_id: `quiz-${i}`,
			score: 80 + i,
			passed: true,
			completed_at: `2026-02-${String(i + 1).padStart(2, "0")}T11:00:00Z`,
		}));
		const manySurveys = Array.from({ length: 5 }, (_, i) => ({
			id: `s${i}`,
			survey_id: `sur-${i}`,
			highest_scoring_category: "structure",
			created_at: `2026-02-${String(i + 1).padStart(2, "0")}T12:00:00Z`,
		}));

		mockFromResponses({
			lesson_progress: { data: manyLessons, error: null },
			quiz_attempts: { data: manyQuizzes, error: null },
			survey_responses: { data: manySurveys, error: null },
			building_blocks_submissions: { data: [], error: null },
		});

		const result = await loadRecentActivities();

		expect(result.length).toBeLessThanOrEqual(10);
	});

	it("maps activity items with correct discriminated union types", async () => {
		mockFromResponses({
			lesson_progress: {
				data: [
					{
						id: "l1",
						lesson_id: "les-1",
						course_id: "c-1",
						completion_percentage: 75,
						completed_at: "2026-02-10T10:00:00Z",
					},
				],
				error: null,
			},
			quiz_attempts: { data: [], error: null },
			survey_responses: { data: [], error: null },
			building_blocks_submissions: { data: [], error: null },
		});

		const result = await loadRecentActivities();

		expect(result).toHaveLength(1);
		const item = result[0]!;
		expect(item.activity_type).toBe("lesson_completed");
		expect(item.id).toBe("l1");
		expect(item.title).toBe("Lesson completed");
		expect(item.timestamp).toBe("2026-02-10T10:00:00Z");
		expect(item.link).toBeNull();

		if (item.activity_type === "lesson_completed") {
			expect(item.lessonId).toBe("les-1");
			expect(item.courseId).toBe("c-1");
			expect(item.completionPercentage).toBe(75);
		}
	});
});
