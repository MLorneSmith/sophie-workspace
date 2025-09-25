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
import { loadTestEnv } from "./load-test-env";

// Load test environment variables
loadTestEnv();

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

// Main async wrapper to enable top-level async logger usage
async function runScript() {
	const logger = await getLogger();

	// Load credentials from environment variables
	const supabaseUrl = process.env.TEST_SUPABASE_URL;
	const supabaseKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
	const payloadUrl = process.env.TEST_PAYLOAD_URL || "http://localhost:3020";

	// Validate that credentials are loaded
	if (!supabaseUrl || !supabaseKey) {
		throw new Error("Missing required test environment variables");
	}

	logger.info(`Supabase URL: ${supabaseUrl}`);
	logger.info(`Supabase Key: ${supabaseKey ? "********" : "undefined"}`);
	logger.info(`Payload URL: ${payloadUrl}`);

	// Supabase client setup
	const supabase = createClient(supabaseUrl, supabaseKey);

	// Course ID for "Decks for Decision Makers"
	const COURSE_ID = "3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8";
	const TEST_USER_EMAIL =
		process.env.TEST_USER_EMAIL || "test2@slideheroes.com";
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
		logger.info(
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

			logger.info(
				`Successfully fetched ${lessons.length} lessons from Payload CMS`,
				{
					operation: "fetch_lessons_payload",
					courseId,
					lessonCount: lessons.length,
				},
			);

			return lessons;
		} catch (error) {
			logger.error("Error fetching lessons from Payload CMS:", {
				operation: "fetch_lessons_payload",
				error,
				courseId,
			});

			// Fallback to fetching from Supabase if Payload API fails
			logger.info("Attempting to fetch lessons from Supabase as fallback...");

			try {
				// Try a direct query with the schema specified
				const { data, error: supabaseError } = await supabase
					.from("payload.course_lessons")
					.select("id, lesson_number, title")
					.eq("course_id", courseId)
					.order("lesson_number", { ascending: true });

				if (supabaseError) {
					// If that fails, try querying without the schema
					logger.info("Query with schema failed, trying without schema...");
					const { data: noSchemaData, error: noSchemaError } = await supabase
						.from("course_lessons")
						.select("id, lesson_number, title")
						.eq("course_id", courseId)
						.order("lesson_number", { ascending: true });

					if (noSchemaError) {
						throw noSchemaError;
					}

					logger.info(
						`Successfully fetched ${noSchemaData?.length || 0} lessons from Supabase without schema`,
						{
							operation: "fetch_lessons_supabase_no_schema",
							courseId,
							lessonCount: noSchemaData?.length || 0,
						},
					);
					return (noSchemaData as LessonData[]) || [];
				}

				logger.info(
					`Successfully fetched ${data?.length || 0} lessons from Supabase with schema`,
					{
						operation: "fetch_lessons_supabase",
						courseId,
						lessonCount: data?.length || 0,
					},
				);
				return (data as LessonData[]) || [];
			} catch (fallbackError) {
				logger.error("Fallback fetch also failed:", {
					operation: "fetch_lessons_fallback",
					error: fallbackError,
					courseId,
				});
				throw new Error(
					"Failed to fetch lessons from both Payload CMS and Supabase",
				);
			}
		}
	}

	/**
	 * Get user by email
	 * @param email The user's email
	 * @returns User data with ID
	 */
	async function getUser(email: string) {
		const { data, error } = await supabase
			.from("accounts")
			.select("id, name")
			.eq("email", email)
			.single();

		if (error) {
			logger.error("Error fetching user by email:", {
				operation: "fetch_user",
				error,
				email,
			});
			throw new Error(`Error fetching user by email: ${error.message}`);
		}

		if (!data) {
			logger.error(`User not found with email: ${email}`, {
				operation: "fetch_user",
				email,
			});
			throw new Error(`User not found with email: ${email}`);
		}

		logger.info(`User found with ID: ${data.id}`, {
			operation: "fetch_user",
			userId: data.id,
			name: data.name,
			email,
		});
		return data;
	}

	async function main() {
		try {
			logger.info("Starting course progress update...");

			// 1. Get the user
			const user = await getUser(TEST_USER_EMAIL);
			const userId = user.id;

			// 2. Get all lessons for the course from Payload CMS
			logger.info("Fetching course lessons from Payload CMS...");
			const lessonsData = await fetchLessonsFromPayload(COURSE_ID);

			if (!lessonsData || lessonsData.length === 0) {
				throw new Error("No lessons found for the course");
			}

			logger.info(`Found ${lessonsData.length} lessons`);

			// 3. Mark all lessons as complete except the excluded ones
			const now = new Date().toISOString();
			let completedLessonsCount = 0;

			for (const lesson of lessonsData) {
				// Skip excluded lessons
				if (EXCLUDED_LESSONS.includes(String(lesson.lesson_number))) {
					logger.info(
						`Skipping lesson ${lesson.lesson_number}: ${lesson.title}`,
						{
							operation: "skip_lesson",
							lessonNumber: lesson.lesson_number,
							lessonId: lesson.id,
						},
					);
					continue;
				}

				logger.info(
					`Marking lesson ${lesson.lesson_number} as complete: ${lesson.title}`,
					{
						operation: "mark_lesson_complete",
						lessonNumber: lesson.lesson_number,
						lessonId: lesson.id,
						userId,
					},
				);

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
						logger.error(
							`Failed to update lesson progress for lesson ${lesson.lesson_number}: ${updateError.message}`,
							{
								operation: "update_lesson_progress",
								error: updateError,
								lessonNumber: lesson.lesson_number,
								lessonId: lesson.id,
								userId,
							},
						);
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
						logger.error(
							`Failed to create lesson progress for lesson ${lesson.lesson_number}: ${insertError.message}`,
							{
								operation: "create_lesson_progress",
								error: insertError,
								lessonNumber: lesson.lesson_number,
								lessonId: lesson.id,
								userId,
							},
						);
						continue;
					}
				}

				completedLessonsCount++;
			}

			// Get all lesson progress records for this user and course
			const { data: lessonProgress, error: progressError } = await supabase
				.from("lesson_progress")
				.select("*")
				.eq("user_id", userId)
				.eq("course_id", COURSE_ID);

			if (progressError || !lessonProgress) {
				throw new Error(
					`Failed to fetch lesson progress: ${progressError?.message}`,
				);
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
						(p: ProgressData) =>
							p.lesson_id === lesson.id && p.completed_at !== null,
					);
				},
			).length;

			// Calculate completion percentage based on completed required lessons
			const completionPercentage = Math.round(
				(completedRequiredLessons / TOTAL_REQUIRED_LESSONS) * 100,
			);

			// Check if all required lessons are completed (including 702)
			const isCompleted = completedRequiredLessons === TOTAL_REQUIRED_LESSONS;

			logger.info("Course progress summary", {
				operation: "course_progress_summary",
				userId,
				courseId: COURSE_ID,
				totalRequiredLessons: TOTAL_REQUIRED_LESSONS,
				completedRequiredLessons,
				completionPercentage,
				isCompleted,
			});

			// Check if course progress already exists
			const { data: existingCourseProgress } = await supabase
				.from("course_progress")
				.select("*")
				.eq("user_id", userId)
				.eq("course_id", COURSE_ID)
				.single();

			if (existingCourseProgress) {
				// Update existing course progress
				const updateData: Record<string, unknown> = {
					completion_percentage: completionPercentage,
					last_accessed_at: now,
				};

				// Only set completed_at if the course is actually completed
				if (isCompleted) {
					updateData.completed_at = now;
					logger.info(
						"Course is now complete, setting completed_at timestamp",
						{
							operation: "update_course_progress",
							userId,
							courseId: COURSE_ID,
						},
					);
				}

				const { error: updateError } = await supabase
					.from("course_progress")
					.update(updateData)
					.eq("id", existingCourseProgress.id);

				if (updateError) {
					throw new Error(
						`Failed to update course progress: ${updateError.message}`,
					);
				}

				logger.info("Updated course progress record", {
					operation: "update_course_progress",
					userId,
					courseId: COURSE_ID,
					completionPercentage,
					isCompleted,
				});
			} else {
				// Create new course progress
				const insertData: Record<string, unknown> = {
					user_id: userId,
					course_id: COURSE_ID,
					started_at: now,
					last_accessed_at: now,
					completion_percentage: completionPercentage,
				};

				// Only set completed_at if the course is actually completed
				if (isCompleted) {
					insertData.completed_at = now;
					logger.info(
						"Course is complete, creating with completed_at timestamp",
						{
							operation: "create_course_progress",
							userId,
							courseId: COURSE_ID,
						},
					);
				}

				const { error: insertError } = await supabase
					.from("course_progress")
					.insert(insertData);

				if (insertError) {
					throw new Error(
						`Failed to create course progress: ${insertError.message}`,
					);
				}

				logger.info("Created new course progress record", {
					operation: "create_course_progress",
					userId,
					courseId: COURSE_ID,
					completionPercentage,
					isCompleted,
				});
			}

			logger.info(
				`Successfully updated course progress for ${TEST_USER_EMAIL}`,
				{
					operation: "update_complete",
					email: TEST_USER_EMAIL,
					userId,
					completedLessonsCount,
					completionPercentage,
					isCompleted,
				},
			);

			// If the course is now complete, trigger certificate generation
			if (isCompleted) {
				logger.info(
					"Course is complete! Certificate generation should be triggered.",
					{
						operation: "course_completion",
						userId,
						courseId: COURSE_ID,
					},
				);
			}

			logger.info("Done!");
		} catch (error) {
			logger.error("Error:", {
				operation: "main",
				error,
			});
			process.exit(1);
		}
	}

	// Run main function
	await main();
}

// Call runScript() and handle errors
runScript().catch(async (error) => {
	const logger = await getLogger();
	logger.error("Error in script execution:", {
		operation: "script_execution",
		error,
	});
	process.exit(1);
});
