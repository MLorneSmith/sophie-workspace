/**
 * Script to test certificate generation
 *
 * This script:
 * 1. Sets the PDF.co API key environment variable
 * 2. Marks all required lessons as completed for a test user
 * 3. Verifies that the course is marked as completed
 * 4. Checks if the certificate is generated
 */
import { createClient } from "@supabase/supabase-js";

import fetch from "node-fetch";

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

console.log(`Supabase URL: ${supabaseUrl}`);
console.log(`Supabase Key: ${supabaseKey ? "********" : "undefined"}`);
console.log(`Payload URL: ${payloadUrl}`);
console.log(`PDF.co API Key: ${PDF_CO_API_KEY ? "********" : "undefined"}`);

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
	console.log(
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

		console.log(
			`Successfully fetched ${lessons.length} lessons from Payload CMS`,
		);

		return lessons;
	} catch (error) {
		console.error("Error fetching lessons from Payload CMS:", error);

		// Fallback to fetching from Supabase if Payload API fails
		console.log("Attempting to fetch lessons from Supabase as fallback...");

		try {
			// Try a direct query with the schema specified
			const { data, error: supabaseError } = await supabase
				.from("payload.course_lessons")
				.select("id, lesson_number, title")
				.eq("course_id", courseId)
				.order("lesson_number", { ascending: true });

			if (supabaseError) {
				// If that fails, try querying without the schema
				console.log("Query with schema failed, trying without schema...");
				const { data: noSchemaData, error: noSchemaError } = await supabase
					.from("course_lessons")
					.select("id, lesson_number, title")
					.eq("course_id", courseId)
					.order("lesson_number", { ascending: true });

				if (noSchemaError) {
					throw noSchemaError;
				}

				console.log(
					`Successfully fetched ${noSchemaData?.length || 0} lessons from Supabase without schema`,
				);
				return noSchemaData || [];
			}

			console.log(
				`Successfully fetched ${data?.length || 0} lessons from Supabase with schema`,
			);
			return data || [];
		} catch (fallbackError) {
			console.error("Fallback fetch also failed:", fallbackError);
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
	console.log(`Generating certificate for user ${userId}...`);

	try {
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

		console.log("Certificate generated successfully!");
		console.log("Certificate ID:", result.certificateId);
		console.log("Certificate URL:", result.certificateUrl);

		return result;
	} catch (error) {
		console.error("Failed to generate certificate:", error);
		throw error;
	}
}

async function main() {
	try {
		console.log("Starting certificate generation test...");

		// 1. Get the user ID for test2@slideheroes.com
		console.log("Fetching user ID from accounts table...");
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
		console.log(`Found user ID: ${userId}`);
		console.log(`User name: ${fullName}`);

		// 2. Get all lessons for the course from Payload CMS
		console.log("Fetching course lessons from Payload CMS...");
		const lessonsData = await fetchLessonsFromPayload(COURSE_ID);

		if (!lessonsData || lessonsData.length === 0) {
			throw new Error("No lessons found for the course");
		}

		console.log(`Found ${lessonsData.length} lessons`);

		// 3. Mark all lessons as complete
		const now = new Date().toISOString();
		let completedLessonsCount = 0;

		for (const lesson of lessonsData) {
			console.log(
				`Marking lesson ${lesson.lesson_number} as complete: ${lesson.title}`,
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
					console.error(
						`Failed to update lesson progress for lesson ${lesson.lesson_number}: ${updateError.message}`,
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
					console.error(
						`Failed to create lesson progress for lesson ${lesson.lesson_number}: ${insertError.message}`,
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
					(p: any) => p.lesson_id === lesson.id && p.completed_at,
				);
			},
		).length;

		// Calculate completion percentage based on completed required lessons
		const completionPercentage = Math.round(
			(completedRequiredLessons / TOTAL_REQUIRED_LESSONS) * 100,
		);

		// Check if all required lessons are completed
		const isCompleted = completedRequiredLessons === TOTAL_REQUIRED_LESSONS;

		console.log(`Total required lessons: ${TOTAL_REQUIRED_LESSONS}`);
		console.log(`Completed required lessons: ${completedRequiredLessons}`);
		console.log(`Completion percentage: ${completionPercentage}%`);
		console.log(`Course completed: ${isCompleted ? "Yes" : "No"}`);

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

			console.log(
				"Marked course as completed by setting completed_at timestamp",
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

			console.log(
				"Created new course progress record with completed_at timestamp set",
			);
		}

		// 5. Generate certificate
		console.log("Generating certificate...");
		await generateCertificate(userId, fullName);

		// 6. Verify certificate was created
		console.log("Verifying certificate was created...");
		const { data: certificate, error: certificateError } = await supabase
			.from("certificates")
			.select("*")
			.eq("user_id", userId)
			.eq("course_id", COURSE_ID)
			.single();

		if (certificateError || !certificate) {
			console.error("Certificate not found in database");
		} else {
			console.log("Certificate found in database:");
			console.log(certificate);
		}

		// 7. Check if the certificate file exists in storage
		console.log("Checking if certificate file exists in storage...");
		const { data: storageData, error: storageError } = await supabase.storage
			.from("certificates")
			.list(`${userId}/${COURSE_ID}`);

		if (storageError) {
			console.error("Failed to list certificate files:", storageError.message);
		} else if (!storageData || storageData.length === 0) {
			console.error("No certificate files found in storage");
		} else {
			console.log("Certificate files found in storage:");
			console.log(storageData);
		}

		console.log(`Successfully updated course progress for ${TEST_USER_EMAIL}`);
		console.log(
			`Completed ${completedLessonsCount} lessons (${completionPercentage}%)`,
		);
		console.log("Done!");
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
}

// Call main() directly
main().catch((error) => {
	console.error("Error in main execution:", error);
	process.exit(1);
});
