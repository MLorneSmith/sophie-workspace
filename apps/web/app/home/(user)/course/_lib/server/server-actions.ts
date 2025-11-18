"use server";

import { enhanceAction } from "@kit/next/actions";
import { createServiceLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";
import { generateCertificate } from "~/lib/certificates/certificate-service";
import {
	REQUIRED_LESSON_NUMBERS,
	TOTAL_REQUIRED_LESSONS,
} from "~/lib/course/course-config";
import type { Database } from "~/lib/database.types";

const { getLogger } = createServiceLogger("COURSE-SERVER-ACTIONS");

// Start or update course progress
const _UpdateCourseProgressSchema = z.object({
	courseId: z.union([z.string(), z.number()]).transform((val) => String(val)),
	currentLessonId: z
		.union([z.string(), z.number(), z.undefined()])
		.transform((val) => (val !== undefined ? String(val) : undefined))
		.optional(),
	completionPercentage: z.number().min(0).max(100).optional(),
	completed: z.boolean().optional(),
});

export const updateCourseProgressAction = enhanceAction(
	async (data, user) => {
		const supabase = getSupabaseServerClient();
		const now = new Date().toISOString();

		// Check if the user already has a course progress record
		const { data: existingProgress } = await supabase
			.from("course_progress")
			.select("*")
			.eq("user_id", user.id)
			.eq("course_id", data.courseId)
			.single();

		if (existingProgress) {
			// Update existing record
			const updateData: Database["public"]["Tables"]["course_progress"]["Update"] =
				{
					last_accessed_at: now,
				};

			if (data.currentLessonId) {
				updateData.current_lesson_id = data.currentLessonId;
			}

			if (data.completionPercentage !== undefined) {
				updateData.completion_percentage = data.completionPercentage;
			}

			if (data.completed) {
				updateData.completed_at = now;

				// Generate a certificate if one hasn't been generated yet
				if (!existingProgress.certificate_generated) {
					try {
						// Get the user's full name from the accounts table
						const { data: accountData } = await supabase
							.from("accounts")
							.select("name")
							.eq("id", user.id)
							.single();

						const fullName = accountData?.name || user.email || "Student";

						// Generate the certificate
						await generateCertificate({
							userId: user.id,
							courseId: data.courseId,
							fullName,
						});

						// Mark the certificate as generated
						updateData.certificate_generated = true;
					} catch (error) {
						const logger = await getLogger();
						logger.error("Failed to generate certificate", {
							operation: "certificate_generation",
							error,
							userId: user.id,
							courseId: data.courseId,
						});
						// Continue with the update even if certificate generation fails
					}
				}
			}

			await supabase
				.from("course_progress")
				.update(updateData)
				.eq("id", existingProgress.id);
		} else {
			// Create new record
			await supabase.from("course_progress").insert({
				user_id: user.id,
				course_id: data.courseId,
				started_at: now,
				last_accessed_at: now,
				current_lesson_id: data.currentLessonId,
				completion_percentage: data.completionPercentage || 0,
				completed_at: data.completed ? now : null,
			});
		}

		return { success: true };
	},
	{
		auth: true,
		schema: _UpdateCourseProgressSchema,
	},
);

// Update lesson progress
const _UpdateLessonProgressSchema = z.object({
	courseId: z.union([z.string(), z.number()]).transform((val) => String(val)),
	lessonId: z.union([z.string(), z.number()]).transform((val) => String(val)),
	completionPercentage: z.number().min(0).max(100).optional(),
	completed: z.boolean().optional(),
});

export const updateLessonProgressAction = enhanceAction(
	async (data, user) => {
		const supabase = getSupabaseServerClient();
		const now = new Date().toISOString();

		// Check if the user already has a lesson progress record
		const { data: existingProgress } = await supabase
			.from("lesson_progress")
			.select("*")
			.eq("user_id", user.id)
			.eq("lesson_id", data.lessonId)
			.single();

		if (existingProgress) {
			// Update existing record
			const updateData: Database["public"]["Tables"]["lesson_progress"]["Update"] =
				{};

			if (data.completionPercentage !== undefined) {
				updateData.completion_percentage = data.completionPercentage;
			}

			if (data.completed) {
				updateData.completed_at = now;
			}

			// Always update course_id to ensure it's set correctly
			updateData.course_id = data.courseId;

			await supabase
				.from("lesson_progress")
				.update(updateData)
				.eq("id", existingProgress.id);
		} else {
			// Create new record
			const newRecord = {
				user_id: user.id,
				course_id: data.courseId,
				lesson_id: data.lessonId,
				started_at: now,
				completed_at: data.completed ? now : null,
				completion_percentage: data.completionPercentage || 0,
			};

			await supabase.from("lesson_progress").insert(newRecord);
		}

		// Update overall course progress
		const { data: lessonProgress } = await supabase
			.from("lesson_progress")
			.select("*")
			.eq("user_id", user.id)
			.eq("course_id", data.courseId);

		// Get total lessons for this course from Payload CMS
		const { getCourseBySlug, getCourseLessons } = await import(
			"@kit/cms/payload"
		);
		const courseData = await getCourseBySlug(data.courseId);

		if (courseData?.docs?.[0]) {
			const course = courseData.docs[0];
			const lessonsData = await getCourseLessons(course.id);

			if (lessonsData?.docs && lessonProgress) {
				// Log the required lesson numbers for debugging
				const logger = await getLogger();
				logger.debug("Course progress calculation", {
					operation: "lesson_progress_update",
					requiredLessonNumbers: REQUIRED_LESSON_NUMBERS,
					totalRequiredLessons: TOTAL_REQUIRED_LESSONS,
					userId: user.id,
					courseId: data.courseId,
				});

				// Count completed lessons that are in the required list
				const completedRequiredLessons = lessonProgress.filter((p) => {
					// Find the lesson for this progress
					const lesson = lessonsData.docs.find(
						(l: { id: string }) => l.id === p.lesson_id,
					);

					// Only count if it's in our required list and is completed
					const isCompleted =
						p.completed_at &&
						lesson &&
						REQUIRED_LESSON_NUMBERS.includes(String(lesson.lesson_number));

					// Log each completed required lesson for debugging
					if (isCompleted) {
						logger.debug("Required lesson completed", {
							operation: "lesson_completion_tracking",
							lessonNumber: lesson.lesson_number,
							lessonTitle: lesson.title,
							userId: user.id,
							courseId: data.courseId,
						});
					}

					return isCompleted;
				}).length;

				// Calculate completion percentage
				const courseCompletionPercentage = Math.round(
					(completedRequiredLessons / TOTAL_REQUIRED_LESSONS) * 100,
				);

				// Course is completed when all required lessons are done
				const isCompleted = completedRequiredLessons >= TOTAL_REQUIRED_LESSONS;

				logger.info("Course progress updated", {
					operation: "course_progress_calculation",
					completedRequiredLessons,
					totalRequiredLessons: TOTAL_REQUIRED_LESSONS,
					courseCompletionPercentage,
					isCompleted,
					userId: user.id,
					courseId: data.courseId,
				});

				// Update course progress with completion status
				await updateCourseProgressAction({
					courseId: data.courseId,
					completionPercentage: courseCompletionPercentage,
					completed: isCompleted,
				});
			}
		}

		return { success: true };
	},
	{
		auth: true,
		schema: _UpdateLessonProgressSchema,
	},
);

// Submit quiz attempt
const SubmitQuizAttemptSchema = z.object({
	courseId: z.union([z.string(), z.number()]).transform((val) => String(val)),
	lessonId: z.union([z.string(), z.number()]).transform((val) => String(val)),
	quizId: z.any().transform((val) => {
		if (typeof val === "string" || typeof val === "number") {
			return String(val);
		}
		if (val && typeof val === "object") {
			// Handle relationship object format
			if ("value" in val && typeof val.value === "string") {
				return String(val.value);
			}
			if ("id" in val && typeof val.id === "string") {
				return String(val.id);
			}
		}
		// Fallback to stringifying the object
		return String(val);
	}),
	answers: z.record(z.string(), z.any()),
	score: z.number().min(0).max(100),
	passed: z.boolean(),
});

export const submitQuizAttemptAction = enhanceAction(
	async (data, user) => {
		const supabase = getSupabaseServerClient();
		const now = new Date().toISOString();

		// Insert the quiz attempt
		await supabase.from("quiz_attempts").insert({
			user_id: user.id,
			course_id: data.courseId,
			lesson_id: data.lessonId,
			quiz_id: data.quizId,
			started_at: now, // In a real implementation, this would be from when the quiz was started
			completed_at: now,
			score: data.score,
			passed: data.passed,
			answers: data.answers,
		});

		// If passed, mark the lesson as completed
		if (data.passed) {
			await updateLessonProgressAction({
				courseId: data.courseId,
				lessonId: data.lessonId,
				completed: true,
				completionPercentage: 100,
			});
		}

		return { success: true };
	},
	{
		auth: true,
		schema: SubmitQuizAttemptSchema,
	},
);
