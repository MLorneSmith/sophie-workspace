import type { Database } from "~/lib/database.types";
import type { ActivityItem } from "../types/activity.types";

type Tables<T extends keyof Database["public"]["Tables"]> =
	Database["public"]["Tables"][T]["Row"];

// -- Course Progress Widget --

export interface CourseProgressData {
	courseProgress: Pick<
		Tables<"course_progress">,
		"completion_percentage" | "current_lesson_id" | "started_at"
	>;
	totalLessons: number;
	completedLessons: number;
}

// -- Skills Radar Widget --

export type SkillCategory =
	| "structure"
	| "story"
	| "substance"
	| "style"
	| "self-confidence";

export type CategoryScores = Record<SkillCategory, number>;

export interface SkillsRadarData {
	categoryScores: CategoryScores;
	highestCategory: SkillCategory | null;
	lowestCategory: SkillCategory | null;
	completedAt: string | null;
}

// -- Kanban Summary Widget --

type TaskStatus = Database["public"]["Enums"]["task_status"];

export interface KanbanSummaryData {
	doingCount: number;
	nextTask: Pick<Tables<"tasks">, "id" | "title" | "priority"> | null;
	totalTasks: number;
	statusCounts: Record<TaskStatus, number>;
}

// -- Activity Feed Widget --

export type ActivityType =
	| "presentation_created"
	| "lesson_completed"
	| "quiz_score"
	| "assessment_completed";

export interface ActivityFeedItem {
	id: string;
	type: ActivityType;
	title: string;
	timestamp: string;
	metadata: Record<string, unknown>;
}

// -- Quick Actions Widget --

export interface QuickActionData {
	id: string;
	label: string;
	href: string;
	icon: string;
	available: boolean;
}

// -- Coaching Sessions Widget --

export interface CoachingSessionData {
	id: string;
	title: string;
	date: string;
	time: string;
	joinLink: string | null;
	status: "upcoming" | "completed" | "cancelled";
}

// -- Presentations Table Widget --

export interface PresentationData {
	submission: Pick<
		Tables<"building_blocks_submissions">,
		"id" | "title" | "created_at" | "updated_at"
	>;
	hasOutline: boolean;
	hasStoryboard: boolean;
}

// -- Quick Actions Context Flags --

export interface QuickActionsContext {
	courseInProgress: boolean;
	assessmentCompleted: boolean;
	hasPresentationDrafts: boolean;
}

// -- Aggregated Dashboard Data --

export interface DashboardData {
	courseProgress: CourseProgressData | null;
	skillsRadar: SkillsRadarData | null;
	kanbanSummary: KanbanSummaryData | null;
	activities: ActivityItem[];
	activityFeed: ActivityFeedItem[];
	quickActions: QuickActionData[];
	quickActionsContext: QuickActionsContext;
	coachingSessions: CoachingSessionData[];
	presentations: PresentationData[];
}
