"use client";

import { useSupabase } from "@kit/supabase/hooks/use-supabase";
import { Badge } from "@kit/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { REQUIRED_LESSON_NUMBERS } from "~/lib/course/course-config";
import type { Database } from "~/lib/database.types";

import { CourseProgressBar } from "./CourseProgressBar";
import { RadialProgress } from "./RadialProgress";

/**
 * Transform image URLs to use the custom domain
 * @param url - Original URL
 * @returns Transformed URL or null if input is null
 */
function _transformImageUrl(url: string | null): string | null {
	if (!url) return null;

	// If the URL contains r2.cloudflarestorage.com, transform it to the custom domain
	if (url.includes("r2.cloudflarestorage.com")) {
		const filename = url.split("/").pop();
		return `https://images.slideheroes.com/${filename}`;
	}

	// If the URL is just a filename (no protocol/domain), add the custom domain
	if (!url.startsWith("http") && !url.startsWith("/")) {
		return `https://images.slideheroes.com/${url}`;
	}

	return url;
}

// Map of lesson keywords to placeholder images
const LESSON_PLACEHOLDER_MAP: Record<string, string> = {
	why: "/images/course-lessons/default-lesson.svg",
	tools: "/images/course-lessons/default-lesson.svg",
	design: "/images/course-lessons/default-lesson.svg",
	graphs: "/images/course-lessons/default-lesson.svg",
	presentation: "/images/course-lessons/default-lesson.svg",
	elements: "/images/course-lessons/default-lesson.svg",
	process: "/images/course-lessons/default-lesson.svg",
	structure: "/images/course-lessons/default-lesson.svg",
	perception: "/images/course-lessons/default-lesson.svg",
	performance: "/images/course-lessons/default-lesson.svg",
	practice: "/images/course-lessons/default-lesson.svg",
	storyboard: "/images/course-lessons/default-lesson.svg",
};

// Default placeholder image path
const DEFAULT_PLACEHOLDER = "/images/course-lessons/default-lesson.svg";

// Define type aliases for cleaner code
type Course = Database["payload"]["Tables"]["courses"]["Row"];
type CourseProgress = Database["public"]["Tables"]["course_progress"]["Row"];
type LessonProgress = Database["public"]["Tables"]["lesson_progress"]["Row"];
type QuizAttempt = Database["public"]["Tables"]["quiz_attempts"]["Row"];
// Extend the database type to include expanded thumbnail from Payload API (depth=2)
type CourseLessonRow = Database["payload"]["Tables"]["course_lessons"]["Row"];
type CourseLesson = CourseLessonRow & {
	thumbnail?: { url?: string } | null;
};

/**
 * Get the best placeholder image based on lesson title or filename
 */
function getPlaceholderImage(lesson: CourseLesson): string {
	if (!lesson?.title) return DEFAULT_PLACEHOLDER;

	const title = lesson.title.toLowerCase();

	// Check if any keywords match the lesson title
	for (const [keyword, imagePath] of Object.entries(LESSON_PLACEHOLDER_MAP)) {
		if (title.includes(keyword)) {
			return imagePath;
		}
	}

	// If no match found, return default
	return DEFAULT_PLACEHOLDER;
}

interface CourseDashboardClientProps {
	course: Course;
	courseProgress: CourseProgress | null;
	lessonProgress: LessonProgress[];
	quizAttempts: QuizAttempt[];
	userId: string;
}

export function CourseDashboardClient({
	course,
	courseProgress,
	lessonProgress,
	quizAttempts,
	userId: _userId,
}: CourseDashboardClientProps) {
	const _supabase = useSupabase();
	const [lessons, setLessons] = useState<CourseLesson[]>([]);
	const [displayedLessons, setDisplayedLessons] = useState<CourseLesson[]>([]);
	const [isCourseCompleted, setIsCourseCompleted] = useState<boolean>(false);
	// Cache to remember failed image URLs to prevent repeated errors
	const [_failedImageUrls, _setFailedImageUrls] = useState<Set<string>>(
		new Set(),
	);

	// Fetch lessons for this course
	const { data: lessonsData, isLoading } = useQuery({
		queryKey: ["course-lessons", course.id],
		queryFn: async () => {
			const response = await fetch(`/api/courses/${course.id}/lessons`);
			if (!response.ok) {
				throw new Error("Failed to fetch course lessons");
			}
			return response.json();
		},
	});

	useEffect(() => {
		if (lessonsData) {
			// Sort lessons by lesson_number as strings to maintain hierarchical order
			const sortedLessons = [...(lessonsData.docs || [])].sort((a, b) => {
				// Ensure lesson_number is treated as a string for proper sorting
				const aNum = String(a.lesson_number);
				const bNum = String(b.lesson_number);
				return aNum.localeCompare(bNum, undefined, { numeric: true });
			});

			setLessons(sortedLessons);
		}
	}, [lessonsData]);

	// Filter out lessons 801 and 802 unless course is completed
	// biome-ignore lint/correctness/useExhaustiveDependencies: lessonProgress is a prop, not an outer scope value
	useEffect(() => {
		if (lessons.length > 0) {
			// Count completed required lessons using our enhanced matching function
			const completedRequiredLessons = lessons.filter(
				(lesson) =>
					REQUIRED_LESSON_NUMBERS.includes(
						String(lesson.lesson_number || ""),
					) && getLessonCompletionStatus(lesson.id, lesson.lesson_number || 0),
			);

			// Course is completed when all required lessons are completed
			const isCompleted =
				courseProgress?.completed_at || // Trust the database flag if it's set
				(REQUIRED_LESSON_NUMBERS.length > 0 &&
					completedRequiredLessons.length >= REQUIRED_LESSON_NUMBERS.length);

			// Update the course completion state
			setIsCourseCompleted(Boolean(isCompleted));

			// If course is completed, show all lessons, otherwise hide post-completion lessons
			// These lessons are identified by their slugs: "congratulations" and "before-you-go"
			const POST_COMPLETION_SLUGS = ["congratulations", "before-you-go"];
			const filtered = isCompleted
				? lessons
				: lessons.filter(
						(lesson) => !POST_COMPLETION_SLUGS.includes(lesson.slug || ""),
					);

			setDisplayedLessons(filtered);
		}
	}, [lessons, lessonProgress, courseProgress]);

	// Get completion status for a specific lesson
	const getLessonCompletionStatus = (
		lessonId: string,
		lessonNumber: string | number | null,
	) => {
		// First try to match by lesson ID (exact match)
		const progressByID = lessonProgress.find((p) => p.lesson_id === lessonId);
		if (progressByID?.completed_at) {
			return true;
		}

		// If no match by ID, try to find a match by lesson number
		// This is a fallback mechanism for when lesson IDs change after database resets
		if (lessonNumber) {
			// Find all lessons with this lesson number in the database
			const matchingLessons = lessons.filter(
				(l) => String(l.lesson_number) === String(lessonNumber),
			);

			// Check if any of these lessons have a completion record
			for (const lesson of matchingLessons) {
				const progressByLesson = lessonProgress.find(
					(p) => p.lesson_id === lesson.id && p.completed_at,
				);
				if (progressByLesson) {
					return true;
				}
			}
		}

		return false;
	};

	// Get quiz score for a specific lesson
	const getLessonQuizScore = (lessonId: string) => {
		const attempts = quizAttempts
			.filter((a) => a.lesson_id === lessonId)
			.sort((a, b) => {
				const dateA = new Date(b.completed_at || 0).getTime();
				const dateB = new Date(a.completed_at || 0).getTime();
				return dateA - dateB;
			});

		return attempts.length > 0 && attempts[0] ? attempts[0].score : null;
	};

	// Loading state is handled by the loading.tsx file with GlobalLoader
	if (isLoading) {
		return null;
	}

	return (
		<div className="container mx-auto flex max-w-4xl flex-col space-y-6 p-4">
			<div>
				<h1 className="mb-4 text-center text-3xl font-bold">{course.title}</h1>
				<div className="mb-6">
					{course.description && (
						<div className="prose prose-sm max-w-none">
							{course.description}
						</div>
					)}
				</div>
			</div>

			<CourseProgressBar
				percentage={courseProgress?.completion_percentage || 0}
				totalLessons={REQUIRED_LESSON_NUMBERS.length}
				completedLessons={
					// Count completed required lessons using our enhanced matching function
					lessons.filter(
						(lesson) =>
							REQUIRED_LESSON_NUMBERS.includes(
								String(lesson.lesson_number || ""),
							) && getLessonCompletionStatus(lesson.id, lesson.lesson_number),
					).length
				}
			/>

			{displayedLessons.map((lesson) => {
				const isCompleted = getLessonCompletionStatus(
					lesson.id,
					lesson.lesson_number,
				);
				const quizScore = getLessonQuizScore(lesson.id);

				return (
					<div key={lesson.id}>
						<Link href={`/home/course/lessons/${lesson.slug}`}>
							<Card className="hover:shadow-sm hover:outline hover:outline-sky-500/50">
								<CardHeader className="hover:outline-sky-500">
									<div className="flex items-center justify-between">
										<CardTitle className="text-lg">{lesson.title}</CardTitle>
										<Badge variant={isCompleted ? "default" : "secondary"}>
											{isCompleted ? (
												<CheckCircle className="mr-1 h-4 w-4" />
											) : (
												<XCircle className="mr-1 h-4 w-4" />
											)}
											{isCompleted ? "Completed" : "Incomplete"}
										</Badge>
									</div>
								</CardHeader>
								<CardContent className="relative pb-8">
									<div className="flex flex-col gap-4 sm:flex-row">
										<div className="flex flex-1 flex-col gap-4 sm:flex-row">
											<div className="relative h-[155px] w-[275px] flex-shrink-0">
												{/* Don't display images for post-completion lessons */}
												{!["congratulations", "before-you-go"].includes(
													lesson.slug || "",
												) ? (
													<Image
														src={(() => {
															// Use thumbnail URL if available, otherwise fall back to placeholder
															// lesson.thumbnail is expanded by Payload API (depth=2)
															if (lesson.thumbnail?.url) {
																return (
																	_transformImageUrl(lesson.thumbnail.url) ||
																	getPlaceholderImage(lesson)
																);
															}
															return getPlaceholderImage(lesson);
														})()}
														alt={`Illustration for ${lesson.title}`}
														className="rounded-lg object-cover"
														fill
														sizes="(max-width: 640px) 100vw, 275px"
														priority={true}
														onError={(e) => {
															// Get the original source that failed
															const target = e.target as HTMLImageElement;
															// Set placeholder based on lesson title
															target.src = getPlaceholderImage(lesson);
														}}
													/>
												) : (
													<div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
														<span className="text-muted-foreground text-sm">
															No image required
														</span>
													</div>
												)}
											</div>
											<div className="flex-1">
												<p className="text-muted-foreground mr-28 ml-2">
													{lesson.description || "No description available."}
												</p>
											</div>
										</div>
										{isCompleted && quizScore !== null && (
											<div className="flex flex-col items-center justify-center">
												<h6 className="mb-2 font-semibold">Quiz Score</h6>
												<RadialProgress value={quizScore} />
											</div>
										)}
									</div>
									<div className="text-muted-foreground absolute right-4 bottom-2 text-sm">
										<p>{lesson.estimated_duration || 0} minutes</p>
									</div>
								</CardContent>
							</Card>
						</Link>
					</div>
				);
			})}

			{isCourseCompleted && (
				<div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm dark:border-green-800 dark:bg-green-900/50">
					<h2 className="text-xl font-bold text-green-800 dark:text-green-300">
						Course Complete! 🎉
					</h2>
					<p className="mt-2 text-green-700 dark:text-green-400">
						Congratulations on completing the course.
					</p>
					<div className="mt-4 flex justify-end">
						<Link href="/home/course/certificate">
							<button
								type="button"
								className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
							>
								View Certificate
							</button>
						</Link>
					</div>
				</div>
			)}
		</div>
	);
}
