/**
 * Script to update course progress for a test user with partial completion
 *
 * This script fetches the current lesson data from Payload CMS to ensure
 * it always uses the latest lesson IDs, even after database resets.
 *
 * Usage:
 *   npx tsx scripts/testing/update-test-user-progress.ts
 *   npx tsx scripts/testing/update-test-user-progress.ts --user test1@slideheroes.com
 *   npx tsx scripts/testing/update-test-user-progress.ts --range 6-28
 *   npx tsx scripts/testing/update-test-user-progress.ts --user test1@slideheroes.com --range 1-28
 *
 * Arguments:
 *   --user <email>   Target user email (default: test1@slideheroes.com)
 *   --range <start-end>   Lesson number range to mark complete (default: 6-28)
 *                         Uses actual lesson_number values from the database
 *   --help           Show this help message
 *
 * Examples:
 *   Mark lessons 6-28 complete for test1@slideheroes.com (default):
 *     npx tsx scripts/testing/update-test-user-progress.ts
 *
 *   Mark lessons 1-28 complete (all but lesson 29):
 *     npx tsx scripts/testing/update-test-user-progress.ts --range 1-28
 *
 *   Mark only lessons 10-20 complete:
 *     npx tsx scripts/testing/update-test-user-progress.ts --range 10-20
 */

import { parseArgs } from "node:util";
import { createServiceLogger } from "@kit/shared/logger";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import { loadTestEnv } from "./load-test-env";

// Load test environment variables
loadTestEnv();

// Initialize service logger
const { getLogger } = createServiceLogger("UPDATE_TEST_USER_PROGRESS");

// Parse command line arguments
function parseCliArgs() {
	const { values } = parseArgs({
		options: {
			user: {
				type: "string",
				short: "u",
				default: "test1@slideheroes.com",
			},
			range: {
				type: "string",
				short: "r",
				default: "6-28",
			},
			help: {
				type: "boolean",
				short: "h",
				default: false,
			},
		},
	});

	if (values.help) {
		console.log(`
Usage: npx tsx scripts/testing/update-test-user-progress.ts [options]

Options:
  --user, -u <email>       Target user email (default: test1@slideheroes.com)
  --range, -r <start-end>  Lesson number range to mark complete (default: 6-28)
                           Uses actual lesson_number values from the database
  --help, -h               Show this help message

Examples:
  # Mark lessons 6-28 complete for test1@slideheroes.com (default)
  npx tsx scripts/testing/update-test-user-progress.ts

  # Mark lessons 1-28 complete (all but lesson 29)
  npx tsx scripts/testing/update-test-user-progress.ts --range 1-28

  # Mark only lessons 10-20 complete for test2@slideheroes.com
  npx tsx scripts/testing/update-test-user-progress.ts --user test2@slideheroes.com --range 10-20
`);
		process.exit(0);
	}

	// Parse range
	const rangeMatch = values.range?.match(/^(\d+)-(\d+)$/);
	if (!rangeMatch) {
		console.error(
			`Error: Invalid range format "${values.range}". Expected format: start-end (e.g., 6-28)`,
		);
		process.exit(1);
	}

	const rangeStart = parseInt(rangeMatch[1], 10);
	const rangeEnd = parseInt(rangeMatch[2], 10);

	if (rangeStart < 1) {
		console.error("Error: Range start must be at least 1");
		process.exit(1);
	}

	if (rangeEnd < rangeStart) {
		console.error(
			"Error: Range end must be greater than or equal to range start",
		);
		process.exit(1);
	}

	return {
		userEmail: values.user as string,
		rangeStart,
		rangeEnd,
	};
}

// Lesson numbers that count toward completion are determined dynamically from Payload
// No hardcoded lesson numbers - we calculate completion based on all fetched lessons

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
	const cliArgs = parseCliArgs();

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

	const TEST_USER_EMAIL = cliArgs.userEmail;
	const RANGE_START = cliArgs.rangeStart;
	const RANGE_END = cliArgs.rangeEnd;

	/**
	 * Fetch course ID by course title from Payload CMS
	 * @param payloadUrl The Payload CMS URL
	 * @param courseTitle The course title to search for
	 * @returns The course ID UUID
	 */
	async function fetchCourseIdByTitle(
		payloadUrl: string,
		courseTitle: string,
	): Promise<string> {
		try {
			const response = await fetch(
				`${payloadUrl}/api/courses?where[title][equals]=${encodeURIComponent(courseTitle)}&limit=1`,
			);

			if (!response.ok) {
				throw new Error(`Failed to fetch courses: ${response.statusText}`);
			}

			const data = (await response.json()) as { docs?: Array<{ id: string }> };
			const courses = data.docs || [];

			if (courses.length === 0) {
				throw new Error(
					`Course not found: "${courseTitle}". Available courses should be seeded in Payload CMS.`,
				);
			}

			const courseId = courses[0].id;
			logger.info(`Found course "${courseTitle}" with ID: ${courseId}`, {
				operation: "fetch_course_id",
				courseTitle,
				courseId,
			});

			return courseId;
		} catch (error) {
			logger.error(`Error fetching course ID for "${courseTitle}":`, {
				operation: "fetch_course_id",
				error,
				courseTitle,
			});
			throw error;
		}
	}

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
			// Note: Payload uses 'course-lessons' (hyphenated) not 'course_lessons' (underscored)
			const response = await fetch(
				`${payloadUrl}/api/course-lessons?where[course_id][equals]=${courseId}&sort=lesson_number&limit=100`,
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
			throw new Error(
				`Failed to fetch lessons from Payload CMS for course ${courseId}. ` +
					`Ensure Payload CMS is running at ${payloadUrl} and the course ID is correct.`,
			);
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
			// Print configuration summary
			console.log("\n========================================");
			console.log("  Course Progress Update Script");
			console.log("========================================");
			console.log(`  User:  ${TEST_USER_EMAIL}`);
			console.log(`  Range: Lessons ${RANGE_START}-${RANGE_END}`);
			console.log("========================================\n");

			logger.info("Starting course progress update...", {
				userEmail: TEST_USER_EMAIL,
				rangeStart: RANGE_START,
				rangeEnd: RANGE_END,
			});

			// 1. Get the user
			const user = await getUser(TEST_USER_EMAIL);
			const userId = user.id;

			// 2. Dynamically fetch the course ID by title
			logger.info("Fetching course ID for 'Decks for Decision Makers'...");
			const COURSE_ID = await fetchCourseIdByTitle(
				payloadUrl,
				"Decks for Decision Makers",
			);

			// 3. Get all lessons for the course from Payload CMS
			logger.info("Fetching course lessons from Payload CMS...");
			const lessonsData = await fetchLessonsFromPayload(COURSE_ID);

			if (!lessonsData || lessonsData.length === 0) {
				throw new Error("No lessons found for the course");
			}

			// Sort lessons by lesson_number for consistent indexing
			lessonsData.sort((a, b) => {
				const numA = parseInt(String(a.lesson_number), 10);
				const numB = parseInt(String(b.lesson_number), 10);
				return numA - numB;
			});

			logger.info(`Found ${lessonsData.length} lessons`);

			// Validate range against available lessons
			const totalLessons = lessonsData.length;
			if (RANGE_END > totalLessons) {
				console.error(
					`Warning: Range end (${RANGE_END}) exceeds total lessons (${totalLessons}). Adjusting to ${totalLessons}.`,
				);
			}

			const effectiveRangeEnd = Math.min(RANGE_END, totalLessons);

			// 3. Mark lessons within range as complete
			const now = new Date().toISOString();
			let completedLessonsCount = 0;
			const skippedLessons: string[] = [];
			const markedLessons: string[] = [];

			for (let i = 0; i < lessonsData.length; i++) {
				const lesson = lessonsData[i];
				const lessonNumber = parseInt(String(lesson.lesson_number), 10);

				// Check if this lesson is within the range (using actual lesson_number, not array index)
				if (lessonNumber < RANGE_START || lessonNumber > effectiveRangeEnd) {
					skippedLessons.push(`${lesson.lesson_number}`);
					logger.info(
						`Skipping lesson ${lessonNumber}: ${lesson.title} - outside range`,
						{
							operation: "skip_lesson",
							lessonNumber,
							lessonId: lesson.id,
							reason: "outside_range",
						},
					);
					continue;
				}

				logger.info(
					`Marking lesson ${lessonNumber} as complete: ${lesson.title}`,
					{
						operation: "mark_lesson_complete",
						lessonNumber,
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

				markedLessons.push(`${lesson.lesson_number}`);
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
			// Count completed lessons dynamically based on fetched lessons from Payload
			const totalLessonsInCourse = lessonsData.length;
			const completedLessonsInProgress = lessonProgress.filter(
				(p: ProgressData) => p.completed_at !== null,
			).length;

			// Calculate completion percentage based on all lessons in the course
			const completionPercentage = Math.round(
				(completedLessonsInProgress / totalLessonsInCourse) * 100,
			);

			// Check if all lessons are completed
			const isCompleted = completedLessonsInProgress === totalLessonsInCourse;

			logger.info("Course progress summary", {
				operation: "course_progress_summary",
				userId,
				courseId: COURSE_ID,
				totalLessonsInCourse,
				completedLessonsInProgress,
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
				} else {
					// Clear completed_at if course is not complete (partial progress)
					updateData.completed_at = null;
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

			// Print final summary
			console.log("\n========================================");
			console.log("  Summary");
			console.log("========================================");
			console.log(`  User: ${TEST_USER_EMAIL}`);
			console.log(`  User ID: ${userId}`);
			console.log(`  Range: Lessons ${RANGE_START}-${effectiveRangeEnd}`);
			console.log(`  Total lessons in course: ${totalLessons}`);
			console.log(`  Lessons marked complete: ${completedLessonsCount}`);
			console.log(`  Lessons skipped: ${skippedLessons.length}`);
			console.log(`  Course completion: ${completionPercentage}%`);
			console.log(`  Course completed: ${isCompleted ? "YES" : "NO"}`);
			console.log("========================================");
			console.log("\n  Marked complete:");
			console.log(`    Lesson numbers: ${markedLessons.join(", ")}`);
			console.log("\n  Skipped (incomplete):");
			console.log(`    Lesson numbers: ${skippedLessons.join(", ")}`);
			console.log("========================================\n");

			logger.info(
				`Successfully updated course progress for ${TEST_USER_EMAIL}`,
				{
					operation: "update_complete",
					email: TEST_USER_EMAIL,
					userId,
					completedLessonsCount,
					skippedLessonsCount: skippedLessons.length,
					completionPercentage,
					isCompleted,
					markedLessons,
					skippedLessons,
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
