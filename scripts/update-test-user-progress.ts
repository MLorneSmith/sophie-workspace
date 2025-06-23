/**
 * Script to update course progress for test2@slideheroes.com
 * Marks all lessons as complete except for 801 and 802
 *
 * This script fetches the current lesson data from Payload CMS to ensure
 * it always uses the latest lesson IDs, even after database resets.
 *
 * Note: Lesson 702 is now included as completed to trigger course completion
 * and certificate generation.
 */

import { createServiceLogger } from "@kit/shared/logger";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

// Initialize service logger
const { getLogger } = createServiceLogger("UPDATE_TEST_USER_PROGRESS");

// Import the required lesson numbers directly to avoid ESM import issues
const REQUIRED_LESSON_NUMBERS = [
	"101",
	"103",
	"104",
	"201",
	"202",
	"203",
	"204",
	"301",
	"302",
	"401",
	"402",
	"403",
	"501",
	"502",
	"503",
	"504",
	"511",
	"602",
	"603",
	"604",
	"611",
	"701",
	"702",
];

const TOTAL_REQUIRED_LESSONS = REQUIRED_LESSON_NUMBERS.length; // 23

// Define types
interface LessonData {
	id: string;
	lesson_number: string | number;
	title: string;
	[key: string]: unknown;
}

interface ProgressData {
	id: string;
	user_id: string;
	course_id: string;
	lesson_id?: string;
	completion_percentage: number;
	completed_at: string | null;
	[key: string]: unknown;
}

// Hardcoded Supabase credentials
// In a production environment, these should be loaded from environment variables
const supabaseUrl = "http://127.0.0.1:54321";
const supabaseKey =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// Payload CMS URL
const payloadUrl =
	process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3020";

// TODO: Async logger needed
// (await getLogger()).info(`Supabase URL: ${supabaseUrl}`);
// TODO: Async logger needed
// (await getLogger()).info(`Supabase Key: ${supabaseKey ? "********" : "undefined"}`);
// TODO: Async logger needed
// (await getLogger()).info(`Payload URL: ${payloadUrl}`);

// Supabase client setup
const supabase = createClient(supabaseUrl, supabaseKey);

// Course ID for "Decks for Decision Makers"
const COURSE_ID = "3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8";
const TEST_USER_EMAIL = "test2@slideheroes.com";
// Only exclude the congratulations and final lessons, not 702 which is required for completion
const EXCLUDED_LESSONS = ["801", "802"];

/**
 * Fetch lessons from Payload CMS
 * @param courseId The course ID to fetch lessons for
 * @returns Array of lesson data
 */
async function fetchLessonsFromPayload(
	courseId: string,
): Promise<LessonData[]> {
	(await getLogger()).info(
		`Fetching lessons from Payload CMS for course ID: ${courseId}...`,
	);

	try {
		// Use the Payload API to get the current lessons
		const response = await fetch(
			`${payloadUrl}/api/course_lessons?where[course_id][equals]=${courseId}&sort=lesson_number&limit=100`,
		);

		if (!response.ok) {
			throw new Error(`Failed to fetch lessons: ${response.statusText}`);
		}

		const data = (await response.json()) as { docs?: LessonData[] };
		const lessons = data.docs || [];

		// TODO: Async logger needed
		// (await getLogger()).info(`Successfully fetched ${lessons.length} lessons from Payload CMS`, { data:  });

		// Log the first few lessons for debugging
		if (lessons.length > 0) {
			// TODO: Async logger needed
			// (await getLogger()).info("Sample lessons:");
			for (const _lesson of lessons.slice(0, 3)) {
				// TODO: Async logger needed
				// (await getLogger()).info(`  - ${lesson.id}: Lesson ${lesson.lesson_number} - ${lesson.title}`, { data:  });
			}
		}

		return lessons;
	} catch (_error) {
		// TODO: Async logger needed
		// (await getLogger()).error("Error fetching lessons from Payload CMS:", { data: error });

		// Fallback to fetching from Supabase if Payload API fails
		// TODO: Async logger needed
		// (await getLogger()).info("Attempting to fetch lessons from Supabase as fallback...");

		try {
			// Try a direct query with the schema specified
			const { data, error: supabaseError } = await supabase
				.from("payload.course_lessons")
				.select("id, lesson_number, title")
				.eq("course_id", courseId)
				.order("lesson_number", { ascending: true });

			if (supabaseError) {
				// If that fails, try querying without the schema
				// TODO: Async logger needed
				// (await getLogger()).info("Query with schema failed, { data: trying without schema..." });
				const { data: noSchemaData, error: noSchemaError } = await supabase
					.from("course_lessons")
					.select("id, lesson_number, title")
					.eq("course_id", courseId)
					.order("lesson_number", { ascending: true });

				if (noSchemaError) {
					throw noSchemaError;
				}

				// TODO: Async logger needed
				// (await getLogger()).info(`Successfully fetched ${noSchemaData?.length || 0} lessons from Supabase without schema`, { data:  });
				return noSchemaData || [];
			}

			// TODO: Async logger needed
			// (await getLogger()).info(`Successfully fetched ${data?.length || 0} lessons from Supabase with schema`, { data:  });
			return data || [];
		} catch (_fallbackError) {
			// TODO: Async logger needed
			// (await getLogger()).error("Fallback fetch also failed:", { data: fallbackError });
			throw new Error(
				"Failed to fetch lessons from both Payload CMS and Supabase",
			);
		}
	}
}

async function main() {
	try {
		(await getLogger()).info(
			"Starting course progress update for test user...",
		);

		// 1. Get the user ID for test2@slideheroes.com
		// Try to get the user directly from the accounts table
		(await getLogger()).info("Fetching user ID from accounts table...");
		const { data: accountData, error: accountError } = await supabase
			.from("accounts")
			.select("id")
			.eq("email", TEST_USER_EMAIL)
			.single();

		if (accountError || !accountData) {
			throw new Error(
				`Failed to find user with email ${TEST_USER_EMAIL}: ${accountError?.message || "User not found"}`,
			);
		}

		const userId = accountData.id;
		// TODO: Async logger needed
		// (await getLogger()).info(`Found user ID: ${userId}`);

		// 2. Get all lessons for the course from Payload CMS
		// TODO: Async logger needed
		// (await getLogger()).info("Fetching course lessons from Payload CMS...");

		// Fetch lessons from Payload CMS instead of using hardcoded data
		const lessonsData = await fetchLessonsFromPayload(COURSE_ID);

		if (!lessonsData || lessonsData.length === 0) {
			throw new Error("No lessons found for the course");
		}

		// TODO: Async logger needed
		// (await getLogger()).info(`Found ${lessonsData.length} lessons`);

		// 3. Mark all lessons as complete except for excluded ones
		const now = new Date().toISOString();
		let _completedLessonsCount = 0;

		// We're now including lesson 702 as completed to trigger course completion
		// TODO: Async logger needed
		// (await getLogger()).info("Including lesson 702 as completed to trigger course completion", { data:  });

		// Now mark all other lessons as complete except for excluded ones
		for (const lesson of lessonsData as LessonData[]) {
			// Skip excluded lessons
			if (EXCLUDED_LESSONS.includes(String(lesson.lesson_number))) {
				// TODO: Async logger needed
				// (await getLogger()).info(`Skipping lesson ${lesson.lesson_number}: ${lesson.title}`);
				continue;
			}

			// TODO: Async logger needed
			// (await getLogger()).info(`Marking lesson ${lesson.lesson_number} as complete: ${lesson.title}`, { data:  });

			// Check if lesson progress already exists
			const { data: existingProgress } = await supabase
				.from("lesson_progress")
				.select("*")
				.eq("user_id", userId)
				.eq("lesson_id", lesson.id)
				.single();

			if (existingProgress) {
				// Update existing progress
				const { error: updateError } = await supabase
					.from("lesson_progress")
					.update({
						completion_percentage: 100,
						completed_at: now,
					})
					.eq("id", existingProgress.id);

				if (updateError) {
					// TODO: Async logger needed
					// (await getLogger()).error(`Failed to update lesson progress for lesson ${lesson.lesson_number}: ${updateError.message}`, { data:  });
					continue;
				}
			} else {
				// Create new progress
				const { error: insertError } = await supabase
					.from("lesson_progress")
					.insert({
						user_id: userId,
						course_id: COURSE_ID,
						lesson_id: lesson.id,
						started_at: now,
						completed_at: now,
						completion_percentage: 100,
					});

				if (insertError) {
					// TODO: Async logger needed
					// (await getLogger()).error(`Failed to create lesson progress for lesson ${lesson.lesson_number}: ${insertError.message}`, { data:  });
					continue;
				}
			}

			_completedLessonsCount++;
		}

		// Get all lesson progress records for this user and course
		const { data: lessonProgress } = await supabase
			.from("lesson_progress")
			.select("*")
			.eq("user_id", userId)
			.eq("course_id", COURSE_ID);

		if (!lessonProgress) {
			throw new Error("Failed to fetch lesson progress");
		}

		// 4. Update overall course progress
		// Count completed required lessons
		const completedRequiredLessons = REQUIRED_LESSON_NUMBERS.filter(
			(lessonNumber: string) => {
				// Find the lesson with this number
				const lesson = lessonsData.find(
					(l) => String(l.lesson_number) === lessonNumber,
				);

				if (!lesson) return false;

				// Check if this lesson is completed
				return lessonProgress.some(
					(p: ProgressData) => p.lesson_id === lesson.id && p.completed_at,
				);
			},
		).length;

		// Calculate completion percentage based on completed required lessons
		const completionPercentage = Math.round(
			(completedRequiredLessons / TOTAL_REQUIRED_LESSONS) * 100,
		);

		// Check if all required lessons are completed
		const isCompleted = completedRequiredLessons === TOTAL_REQUIRED_LESSONS;

		// TODO: Async logger needed
		// (await getLogger()).info(`Total required lessons: ${TOTAL_REQUIRED_LESSONS}`);
		// TODO: Async logger needed
		// (await getLogger()).info(`Completed required lessons: ${completedRequiredLessons}`);
		// TODO: Async logger needed
		// (await getLogger()).info(`Completion percentage: ${completionPercentage}%`);
		// TODO: Async logger needed
		// (await getLogger()).info(`Course completed: ${isCompleted ? "Yes" : "No"}`);

		// Check if course progress already exists
		const { data: existingCourseProgress } = await supabase
			.from("course_progress")
			.select("*")
			.eq("user_id", userId)
			.eq("course_id", COURSE_ID)
			.single();

		if (existingCourseProgress) {
			// Update existing course progress
			const { error: updateError } = await supabase
				.from("course_progress")
				.update({
					completion_percentage: completionPercentage,
					completed_at: isCompleted ? now : null, // Only set completed_at if course is actually complete
					last_accessed_at: now,
				})
				.eq("id", existingCourseProgress.id);

			if (updateError) {
				throw new Error(
					`Failed to update course progress: ${updateError.message}`,
				);
			}

			// TODO: Async logger needed
			// (await getLogger()).info(isCompleted
			//		? "Marked course as completed by setting completed_at timestamp"
			//		: "Updated course progress without marking as completed");
		} else {
			// Create new course progress
			const { error: insertError } = await supabase
				.from("course_progress")
				.insert({
					user_id: userId,
					course_id: COURSE_ID,
					started_at: now,
					last_accessed_at: now,
					completion_percentage: completionPercentage,
					completed_at: isCompleted ? now : null, // Only set completed_at if course is actually complete
				});

			if (insertError) {
				throw new Error(
					`Failed to create course progress: ${insertError.message}`,
				);
			}

			// TODO: Async logger needed
			// (await getLogger()).info(isCompleted
			//		? "Created new course progress record with completed_at timestamp set"
			//		: "Created new course progress record without marking as completed");
		}

		// TODO: Async logger needed
		// (await getLogger()).info(`Successfully updated course progress for ${TEST_USER_EMAIL}`);
		// TODO: Async logger needed
		// (await getLogger()).info(
		//	`Completed ${completedLessonsCount}/${TOTAL_REQUIRED_LESSONS} lessons (${completionPercentage}%)`,
		// );
		// TODO: Async logger needed
		// (await getLogger()).info("Done!");
	} catch (_error) {
		// TODO: Async logger needed
		// (await getLogger()).error("Error:", { data: error });
		process.exit(1);
	}
}

// Call main() directly
main().catch((_error) => {
	// TODO: Async logger needed
	// (await getLogger()).error("Error in main execution:", { data: error });
	process.exit(1);
});
