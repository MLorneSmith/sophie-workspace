/**
 * Script to test certificate generation
 *
 * This script:
 * 1. Sets the PDF.co API key environment variable
 * 2. Marks all required lessons as completed for a test user
 * 3. Verifies that the course is marked as completed
 * 4. Checks if the certificate is generated
 */

import { createServiceLogger } from "@kit/shared/logger";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

// Initialize service logger
const { getLogger } = createServiceLogger("TEST_CERTIFICATE_GENERATION");

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

// Main async wrapper to enable top-level async logger usage
async function runScript() {
	const logger = await getLogger();

	// Hardcoded Supabase credentials
	// In a production environment, these should be loaded from environment variables
	const supabaseUrl = "http://127.0.0.1:54321";
	const supabaseKey =
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

	// Payload CMS URL
	const payloadUrl =
		process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3020";

	// PDF.co API key - use the one from .env.development
	const PDF_CO_API_KEY =
		"msmith@slideheroes.com_r1i3TNuZXbKw1ZediQnpYsYFCJRZdwJprwYZEtxFXoK6pxhIbPO4oAT74cXfMuLX";

	// Set the PDF.co API key environment variable
	process.env.PDF_CO_API_KEY = PDF_CO_API_KEY;

	logger.info(`Supabase URL: ${supabaseUrl}`);
	logger.info(`Supabase Key: ${supabaseKey ? "********" : "undefined"}`);
	logger.info(`Payload URL: ${payloadUrl}`);
	logger.info(`PDF.co API Key: ${PDF_CO_API_KEY ? "********" : "undefined"}`);

	// Supabase client setup
	const supabase = createClient(supabaseUrl, supabaseKey);

	// Course ID for "Decks for Decision Makers"
	const COURSE_ID = "3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8";
	const TEST_USER_EMAIL = "test2@slideheroes.com";

	/**
	 * Fetch lessons from Payload CMS
	 * @param courseId The course ID to fetch lessons for
	 * @returns Array of lesson data
	 */
	async function fetchLessonsFromPayload(courseId: string): Promise<unknown[]> {
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

			const data = (await response.json()) as { docs?: unknown[] };
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
					return noSchemaData || [];
				}

				logger.info(
					`Successfully fetched ${data?.length || 0} lessons from Supabase with schema`,
					{
						operation: "fetch_lessons_supabase",
						courseId,
						lessonCount: data?.length || 0,
					},
				);
				return data || [];
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
	 * Generate a certificate for the user
	 */
	async function generateCertificate(userId: string, fullName: string) {
		logger.info(`Generating certificate for user ${userId}...`);
		// Import the certificate service
		// Use dynamic import with .js extension for ESM compatibility
		const { generateCertificate } = await import(
			"../apps/web/lib/certificates/certificate-service.js"
		);

		// Generate the certificate
		const result = await generateCertificate({
			userId,
			courseId: COURSE_ID,
			fullName,
		});

		logger.info("Certificate generated successfully!", {
			operation: "generate_certificate",
			userId,
			certificateId: result.certificateId,
			certificateUrl: result.certificateUrl,
		});

		return result;
	}

	async function main() {
		try {
			logger.info("Starting certificate generation test...");

			// 1. Get the user ID for test2@slideheroes.com
			logger.info("Fetching user ID from accounts table...");
			const { data: accountData, error: accountError } = await supabase
				.from("accounts")
				.select("id, name")
				.eq("email", TEST_USER_EMAIL)
				.single();

			if (accountError || !accountData) {
				throw new Error(
					`Failed to find user with email ${TEST_USER_EMAIL}: ${accountError?.message || "User not found"}`,
				);
			}

			const userId = accountData.id;
			const fullName = accountData.name || TEST_USER_EMAIL;
			logger.info(`Found user ID: ${userId}`, {
				operation: "fetch_user",
				userId,
				fullName,
				email: TEST_USER_EMAIL,
			});

			// 2. Get all lessons for the course from Payload CMS
			logger.info("Fetching course lessons from Payload CMS...");
			const lessonsData = await fetchLessonsFromPayload(COURSE_ID);

			if (!lessonsData || lessonsData.length === 0) {
				throw new Error("No lessons found for the course");
			}

			logger.info(`Found ${lessonsData.length} lessons`);

			// 3. Mark all lessons as complete
			const now = new Date().toISOString();
			let completedLessonsCount = 0;

			for (const lesson of lessonsData) {
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
						(p: { lesson_id: string; completed_at: string | null }) =>
							p.lesson_id === lesson.id && p.completed_at,
					);
				},
			).length;

			// Calculate completion percentage based on completed required lessons
			const completionPercentage = Math.round(
				(completedRequiredLessons / TOTAL_REQUIRED_LESSONS) * 100,
			);

			// Check if all required lessons are completed
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
				const { error: updateError } = await supabase
					.from("course_progress")
					.update({
						completion_percentage: completionPercentage,
						completed_at: now, // Set completed_at to mark as completed
						last_accessed_at: now,
					})
					.eq("id", existingCourseProgress.id);

				if (updateError) {
					throw new Error(
						`Failed to update course progress: ${updateError.message}`,
					);
				}

				logger.info(
					"Marked course as completed by setting completed_at timestamp",
					{
						operation: "update_course_progress",
						userId,
						courseId: COURSE_ID,
						completionPercentage,
					},
				);
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
						completed_at: now, // Set completed_at to mark as completed
					});

				if (insertError) {
					throw new Error(
						`Failed to create course progress: ${insertError.message}`,
					);
				}

				logger.info(
					"Created new course progress record with completed_at timestamp set",
					{
						operation: "create_course_progress",
						userId,
						courseId: COURSE_ID,
						completionPercentage,
					},
				);
			}

			// 5. Generate certificate
			logger.info("Generating certificate...");
			await generateCertificate(userId, fullName);

			// 6. Verify certificate was created
			logger.info("Verifying certificate was created...");
			const { data: certificate, error: certificateError } = await supabase
				.from("certificates")
				.select("*")
				.eq("user_id", userId)
				.eq("course_id", COURSE_ID)
				.single();

			if (certificateError || !certificate) {
				logger.error("Certificate not found in database", {
					operation: "verify_certificate_db",
					error: certificateError,
					userId,
					courseId: COURSE_ID,
				});
			} else {
				logger.info("Certificate found in database", {
					operation: "verify_certificate_db",
					certificate,
					userId,
					courseId: COURSE_ID,
				});
			}

			// 7. Check if the certificate file exists in storage
			logger.info("Checking if certificate file exists in storage...");
			const { data: storageData, error: storageError } = await supabase.storage
				.from("certificates")
				.list(`${userId}/${COURSE_ID}`);

			if (storageError) {
				logger.error("Failed to list certificate files:", {
					operation: "verify_certificate_storage",
					error: storageError.message,
					userId,
					courseId: COURSE_ID,
				});
			} else if (!storageData || storageData.length === 0) {
				logger.error("No certificate files found in storage", {
					operation: "verify_certificate_storage",
					userId,
					courseId: COURSE_ID,
				});
			} else {
				logger.info("Certificate files found in storage", {
					operation: "verify_certificate_storage",
					files: storageData,
					userId,
					courseId: COURSE_ID,
				});
			}

			logger.info(
				`Successfully updated course progress for ${TEST_USER_EMAIL}`,
				{
					operation: "test_complete",
					email: TEST_USER_EMAIL,
					userId,
					completedLessonsCount,
					completionPercentage,
				},
			);
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
