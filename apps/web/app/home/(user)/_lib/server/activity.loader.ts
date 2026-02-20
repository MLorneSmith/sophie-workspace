import "server-only";

import { cache } from "react";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { getLogger } from "@kit/shared/logger";

import type { Database } from "~/lib/database.types";
import type {
	ActivityItem,
	AssessmentActivity,
	LessonActivity,
	PresentationActivity,
	QuizActivity,
} from "../types/activity.types";

type Client = SupabaseClient<Database>;

const PER_SOURCE_LIMIT = 5;
const TOTAL_LIMIT = 10;

/**
 * Loads recent activities from lesson_progress, quiz_attempts,
 * survey_responses, and building_blocks_submissions.
 *
 * Uses parallel fetches with per-source limits (UNION ALL equivalent),
 * then merges and sorts by timestamp (newest first).
 */
export const loadRecentActivities = cache(recentActivitiesLoader);

async function recentActivitiesLoader(): Promise<ActivityItem[]> {
	const client = getSupabaseServerClient<Database>();
	const logger = await getLogger();
	const ctx = { name: "recentActivitiesLoader" };

	try {
		// UNION ALL pattern: parallel fetch from each source with per-source limit
		const [lessons, quizzes, assessments, presentations] = await Promise.all([
			loadLessonActivities(client).catch((err) => {
				logger.warn(ctx, "Failed to load lesson activities: %o", err);
				return [] as LessonActivity[];
			}),
			loadQuizActivities(client).catch((err) => {
				logger.warn(ctx, "Failed to load quiz activities: %o", err);
				return [] as QuizActivity[];
			}),
			loadAssessmentActivities(client).catch((err) => {
				logger.warn(ctx, "Failed to load assessment activities: %o", err);
				return [] as AssessmentActivity[];
			}),
			loadPresentationActivities(client).catch((err) => {
				logger.warn(ctx, "Failed to load presentation activities: %o", err);
				return [] as PresentationActivity[];
			}),
		]);

		const allActivities: ActivityItem[] = [
			...lessons,
			...quizzes,
			...assessments,
			...presentations,
		];

		return allActivities
			.sort(
				(a, b) =>
					new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
			)
			.slice(0, TOTAL_LIMIT);
	} catch (err) {
		logger.error(ctx, "Activity loader failed: %o", err);
		return [];
	}
}

async function loadLessonActivities(client: Client): Promise<LessonActivity[]> {
	const { data, error } = await client
		.from("lesson_progress")
		.select("id, lesson_id, course_id, completion_percentage, completed_at")
		.not("completed_at", "is", null)
		.order("completed_at", { ascending: false })
		.limit(PER_SOURCE_LIMIT);

	if (error) throw error;
	if (!data) return [];

	return data.map((row) => ({
		activity_type: "lesson_completed" as const,
		id: row.id,
		title: "Lesson completed",
		timestamp: row.completed_at!,
		link: null,
		lessonId: row.lesson_id,
		courseId: row.course_id,
		completionPercentage: row.completion_percentage,
	}));
}

async function loadQuizActivities(client: Client): Promise<QuizActivity[]> {
	const { data, error } = await client
		.from("quiz_attempts")
		.select("id, quiz_id, score, passed, completed_at")
		.not("completed_at", "is", null)
		.order("completed_at", { ascending: false })
		.limit(PER_SOURCE_LIMIT);

	if (error) throw error;
	if (!data) return [];

	return data.map((row) => ({
		activity_type: "quiz_score" as const,
		id: row.id,
		title: `Quiz ${row.passed ? "passed" : "attempted"}`,
		timestamp: row.completed_at!,
		link: null,
		quizId: row.quiz_id,
		score: row.score,
		passed: row.passed,
	}));
}

async function loadAssessmentActivities(
	client: Client,
): Promise<AssessmentActivity[]> {
	const { data, error } = await client
		.from("survey_responses")
		.select("id, survey_id, highest_scoring_category, created_at")
		.eq("completed", true)
		.order("created_at", { ascending: false })
		.limit(PER_SOURCE_LIMIT);

	if (error) throw error;
	if (!data) return [];

	return data.map((row) => ({
		activity_type: "assessment_completed" as const,
		id: row.id,
		title: "Assessment completed",
		timestamp: row.created_at!,
		link: null,
		surveyId: row.survey_id,
		highestCategory: row.highest_scoring_category,
	}));
}

async function loadPresentationActivities(
	client: Client,
): Promise<PresentationActivity[]> {
	const { data, error } = await client
		.from("building_blocks_submissions")
		.select("id, title, created_at")
		.order("created_at", { ascending: false })
		.limit(PER_SOURCE_LIMIT);

	if (error) throw error;
	if (!data) return [];

	return data.map((row) => ({
		activity_type: "presentation_created" as const,
		id: row.id,
		title: row.title,
		timestamp: row.created_at!,
		link: null,
	}));
}
