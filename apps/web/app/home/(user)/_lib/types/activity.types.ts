import type { Database } from "~/lib/database.types";

type Tables<T extends keyof Database["public"]["Tables"]> =
	Database["public"]["Tables"][T]["Row"];

export interface LessonActivity {
	activity_type: "lesson_completed";
	id: string;
	title: string;
	timestamp: string;
	link: string | null;
	lessonId: string;
	courseId: string;
	completionPercentage: number | null;
}

export interface QuizActivity {
	activity_type: "quiz_score";
	id: string;
	title: string;
	timestamp: string;
	link: string | null;
	quizId: string;
	score: number | null;
	passed: boolean | null;
}

export interface AssessmentActivity {
	activity_type: "assessment_completed";
	id: string;
	title: string;
	timestamp: string;
	link: string | null;
	surveyId: string;
	highestCategory: string | null;
}

export interface PresentationActivity {
	activity_type: "presentation_created";
	id: string;
	title: string;
	timestamp: string;
	link: string | null;
}

export type ActivityItem =
	| LessonActivity
	| QuizActivity
	| AssessmentActivity
	| PresentationActivity;
