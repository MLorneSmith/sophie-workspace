import "server-only";

import { cache } from "react";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { getLogger } from "@kit/shared/logger";

import type { Database } from "~/lib/database.types";
import type {
	CategoryScores,
	CourseProgressData,
	DashboardData,
	KanbanSummaryData,
	PresentationData,
	SkillCategory,
	SkillsRadarData,
} from "../dashboard/types";
import type { ActivityItem } from "../types/activity.types";
import { loadRecentActivities } from "./activity.loader";

type Client = SupabaseClient<Database>;

export const loadDashboardPageData = cache(dashboardPageLoader);

async function dashboardPageLoader(): Promise<DashboardData> {
	const client = getSupabaseServerClient<Database>();
	const logger = await getLogger();
	const ctx = { name: "dashboardPageLoader" };

	try {
		const [
			courseProgress,
			,
			skillsRadar,
			kanbanSummary,
			presentations,
			activities,
		] = await Promise.all([
			loadCourseProgress(client).catch((err) => {
				logger.warn(ctx, "Failed to load course progress: %o", err);
				return null;
			}),
			loadQuizAttempts(client).catch((err) => {
				logger.warn(ctx, "Failed to load quiz attempts: %o", err);
				return null;
			}),
			loadSkillsData(client).catch((err) => {
				logger.warn(ctx, "Failed to load skills data: %o", err);
				return null;
			}),
			loadTasksSummary(client).catch((err) => {
				logger.warn(ctx, "Failed to load tasks summary: %o", err);
				return null;
			}),
			loadPresentations(client).catch((err) => {
				logger.warn(ctx, "Failed to load presentations: %o", err);
				return [] as PresentationData[];
			}),
			loadRecentActivities().catch((err) => {
				logger.warn(ctx, "Failed to load recent activities: %o", err);
				return [] as ActivityItem[];
			}),
		]);

		const courseInProgress =
			courseProgress !== null &&
			(courseProgress.courseProgress.completion_percentage ?? 0) < 100;
		const assessmentCompleted = skillsRadar !== null;
		const hasPresentationDrafts = presentations.length > 0;

		return {
			courseProgress,
			skillsRadar,
			kanbanSummary,
			activities,
			activityFeed: [],
			quickActions: [],
			quickActionsContext: {
				courseInProgress,
				assessmentCompleted,
				hasPresentationDrafts,
			},
			coachingSessions: [],
			presentations,
		};
	} catch (err) {
		logger.error(ctx, "Dashboard loader failed: %o", err);

		return {
			courseProgress: null,
			skillsRadar: null,
			kanbanSummary: null,
			activities: [],
			activityFeed: [],
			quickActions: [],
			quickActionsContext: {
				courseInProgress: false,
				assessmentCompleted: false,
				hasPresentationDrafts: false,
			},
			coachingSessions: [],
			presentations: [],
		};
	}
}

async function loadCourseProgress(
	client: Client,
): Promise<CourseProgressData | null> {
	const { data: progress, error: progressError } = await client
		.from("course_progress")
		.select("completion_percentage, current_lesson_id, started_at")
		.limit(1)
		.maybeSingle();

	if (progressError) {
		throw progressError;
	}

	if (!progress) {
		return null;
	}

	const { count, error: lessonsError } = await client
		.from("lesson_progress")
		.select("id", { count: "exact", head: true })
		.not("completed_at", "is", null);

	if (lessonsError) {
		throw lessonsError;
	}

	const { count: totalCount, error: totalError } = await client
		.from("lesson_progress")
		.select("id", { count: "exact", head: true });

	if (totalError) {
		throw totalError;
	}

	return {
		courseProgress: {
			completion_percentage: progress.completion_percentage,
			current_lesson_id: progress.current_lesson_id,
			started_at: progress.started_at,
		},
		totalLessons: totalCount ?? 0,
		completedLessons: count ?? 0,
	};
}

async function loadQuizAttempts(client: Client) {
	const { data, error } = await client
		.from("quiz_attempts")
		.select("score, passed")
		.order("started_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return data;
}

async function loadSkillsData(client: Client): Promise<SkillsRadarData | null> {
	const { data, error } = await client
		.from("survey_responses")
		.select(
			"category_scores, highest_scoring_category, lowest_scoring_category, created_at",
		)
		.eq("completed", true)
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!data?.category_scores) {
		return null;
	}

	return {
		categoryScores: data.category_scores as unknown as CategoryScores,
		highestCategory:
			(data.highest_scoring_category as SkillCategory | null) ?? null,
		lowestCategory:
			(data.lowest_scoring_category as SkillCategory | null) ?? null,
		completedAt: data.created_at ?? null,
	};
}

async function loadTasksSummary(
	client: Client,
): Promise<KanbanSummaryData | null> {
	const { data: allTasks, error } = await client
		.from("tasks")
		.select("id, title, priority, status");

	if (error) {
		throw error;
	}

	if (!allTasks || allTasks.length === 0) {
		return null;
	}

	const statusCounts = { do: 0, doing: 0, done: 0 };

	for (const task of allTasks) {
		statusCounts[task.status] = (statusCounts[task.status] ?? 0) + 1;
	}

	const doingTasks = allTasks.filter((t) => t.status === "doing");
	const firstDoing = doingTasks[0];
	const nextTask = firstDoing
		? {
				id: firstDoing.id,
				title: firstDoing.title,
				priority: firstDoing.priority,
			}
		: null;

	return {
		doingCount: doingTasks.length,
		nextTask,
		totalTasks: allTasks.length,
		statusCounts,
	};
}

async function loadPresentations(client: Client): Promise<PresentationData[]> {
	const { data, error } = await client
		.from("building_blocks_submissions")
		.select("id, title, created_at, updated_at, outline, storyboard")
		.order("created_at", { ascending: false });

	if (error) {
		throw error;
	}

	if (!data) {
		return [];
	}

	return data.map((row) => ({
		submission: {
			id: row.id,
			title: row.title,
			created_at: row.created_at,
			updated_at: row.updated_at,
		},
		hasOutline: row.outline !== null && row.outline !== "",
		hasStoryboard: row.storyboard !== null,
	}));
}
