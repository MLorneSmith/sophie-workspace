"use client";

import { PayloadContentRenderer } from "@kit/cms/payload";
import { Button } from "@kit/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@kit/ui/card";
import {
	BookOpen,
	Briefcase,
	CheckCircle,
	CheckSquare,
	ChevronLeft,
	ChevronRight,
	Play,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

// Dynamically import the Confetti component to avoid SSR issues
const Confetti = dynamic(() => import("react-confetti"), { ssr: false });
// Import database types
import type { Database } from "~/lib/database.types";
import {
	submitQuizAttemptAction,
	updateLessonProgressAction,
} from "../../../_lib/server/server-actions";
// Import the QuizComponent and SurveyComponent
import { QuizComponent } from "./QuizComponent";
import { SurveyComponent } from "./SurveyComponent";

// Client-safe logger wrapper for development logging
const logger = {
	info: (...args: unknown[]) => {
		if (process.env.NODE_ENV === "development") {
			// biome-ignore lint/suspicious/noConsole: Development logging is allowed
			console.info(...args);
		}
	},
	error: (...args: unknown[]) => {
		if (process.env.NODE_ENV === "development") {
			// biome-ignore lint/suspicious/noConsole: Development logging is allowed
			console.error(...args);
		}
	},
	warn: (...args: unknown[]) => {
		if (process.env.NODE_ENV === "development") {
			// biome-ignore lint/suspicious/noConsole: Development logging is allowed
			console.warn(...args);
		}
	},
	debug: (...args: unknown[]) => {
		if (process.env.NODE_ENV === "development") {
			// biome-ignore lint/suspicious/noConsole: Development logging is allowed
			console.debug(...args);
		}
	},
};

// Type aliases for better readability
type QuizAttempt = Database["public"]["Tables"]["quiz_attempts"]["Row"];
type LessonProgress = Database["public"]["Tables"]["lesson_progress"]["Row"];
type SurveyResponse = Database["public"]["Tables"]["survey_responses"]["Row"];

// Payload CMS types (removed duplicates - these interfaces are defined below)

// Define types for content that can be rendered by PayloadContentRenderer
type PayloadContent = string | Record<string, unknown> | null | undefined;

interface PayloadLesson {
	title: string;
	content: PayloadContent;
	lessonNumber: number;
	lesson_number?: number | string;
	slug?: string;
	id: string;
	quiz_id?: string;
	quiz_id_id?: string;
	survey_id?: string;
	survey_id_id?: string;
	course?: string | { id?: string; value?: string };
	course_id?: string | { id?: string };
	estimated_duration?: number | null;
	bunny_video_id?: string | null;
	bunny_library_id?: string | null;
	video_source_type?: string | null;
	youtube_video_id?: string | null;
	lesson_image?: { url?: string } | string | null;
	todo?: PayloadContent;
	todo_complete_quiz?: boolean | null;
	todo_watch_content?: PayloadContent;
	todo_read_content?: PayloadContent;
	todo_course_project?: PayloadContent;
	downloads?: Download[];
}

interface Download {
	url?: string;
	title?: string;
	filename?: string;
	description?: string;
	mimeType?: string;
	filesize?: number;
}

interface PayloadQuiz {
	id: string;
	questions: Array<{
		question: string;
		questiontype: "single-answer" | "multi-answer";
		options: Array<{
			text: string;
			isCorrect: boolean;
		}>;
	}>;
	passingScore: number;
}

interface SimpleSurvey {
	id: string;
	title?: string;
	slug?: string;
	questions?: Array<{
		id: string;
		text?: string;
		question?: string;
		type?: string;
		category?: string;
		position?: number;
		options?: Array<{
			id?: string;
			text?: string;
			option?: string;
			score?: number;
		}>;
	}>;
}

interface LessonViewClientProps {
	lesson: PayloadLesson;
	quiz: PayloadQuiz | null;
	quizAttempts: QuizAttempt[];
	lessonProgress: LessonProgress | null;
	userId: string;
	survey?: SimpleSurvey | null;
	surveyResponses?: SurveyResponse[];
}

/**
 * Process r2file tags for file downloads in template content
 * Used as a fallback when template tags appear in content field
 */
function processR2FileTags(text: string): string {
	if (!text) return "";

	// Standard pattern
	const r2filePattern =
		/{%\s*r2file\s+awsurl="([^"]+)"\s+filedescription="([^"]+)"\s*\/%}/g;

	// Process standard format
	let processedText = text.replace(
		r2filePattern,
		(_match, url, description) => {
			return `
      <div class="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700 my-2">
        <div class="flex-grow">
          <p class="font-medium">${description}</p>
        </div>
        <a
          href="${url}"
          download
          class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          target="_blank"
          rel="noopener noreferrer"
          data-source="r2file-tag"
        >
          Download
        </a>
      </div>
    `;
		},
	);

	// Alternative format (in case order is different)
	const alternativePattern =
		/{%\s*r2file\s+filedescription="([^"]+)"\s+awsurl="([^"]+)"\s*\/%}/g;

	processedText = processedText.replace(
		alternativePattern,
		(_match, description, url) => {
			return `
      <div class="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700 my-2">
        <div class="flex-grow">
          <p class="font-medium">${description}</p>
        </div>
        <a
          href="${url}"
          download
          class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          target="_blank"
          rel="noopener noreferrer"
          data-source="r2file-alt-tag"
        >
          Download
        </a>
      </div>
    `;
		},
	);

	return processedText;
}

export function LessonViewClient({
	lesson,
	quiz,
	quizAttempts,
	lessonProgress,
	userId,
	survey,
	surveyResponses = [],
}: LessonViewClientProps) {
	const [isPending, startTransition] = useTransition();
	const [showQuiz, setShowQuiz] = useState(false);
	const [showSurvey, setShowSurvey] = useState(false);
	const [quizCompleted, setQuizCompleted] = useState(
		quizAttempts.length > 0 && quizAttempts[0]?.passed === true,
	);
	const [surveyCompleted, setSurveyCompleted] = useState(
		surveyResponses.length > 0 && surveyResponses[0]?.completed === true,
	);
	const [isMarkingCompleted, setIsMarkingCompleted] = useState(false);
	const [showConfetti, setShowConfetti] = useState(false);

	// Calculate progress
	const _progress = lessonProgress?.completion_percentage || 0;
	const isCompleted = !!lessonProgress?.completed_at;

	// Check if lesson has a quiz that was successfully loaded
	const hasQuiz =
		!!quiz &&
		!!quiz.id &&
		!!quiz.questions &&
		quiz.questions.length > 0 &&
		!!(lesson.quiz_id || lesson.quiz_id_id);

	// Check if lesson has a survey that was successfully loaded
	const hasSurvey =
		!!survey && !!survey.id && (!!lesson.survey_id || !!lesson.survey_id_id);

	// Extract course ID safely
	const getCourseId = (): string => {
		// Handle different possible formats of course relationship
		if (lesson.course) {
			if (typeof lesson.course === "object") {
				// If course is an object with id property
				if (lesson.course.id) {
					return lesson.course.id;
				}
				// If course is an object with value property (relationship format)
				if (lesson.course.value) {
					return lesson.course.value;
				}
			}
			// If course is a string ID
			if (typeof lesson.course === "string") {
				return lesson.course;
			}
		}
		// If course_id exists directly on the lesson
		if (lesson.course_id) {
			if (typeof lesson.course_id === "object" && lesson.course_id.id) {
				return lesson.course_id.id;
			}
			if (typeof lesson.course_id === "string") {
				return lesson.course_id;
			}
		}
		// Fallback to empty string if no course ID found
		return "";
	};

	// Get course ID
	const courseId = getCourseId();

	// Mark lesson as viewed when component mounts
	const markLessonAsViewed = useCallback(() => {
		if (!isCompleted) {
			startTransition(async () => {
				try {
					await updateLessonProgressAction({
						courseId,
						lessonId: lesson.id,
						completionPercentage: 50, // Mark as partially completed when viewed
					});
				} catch (_error) {
					toast.error("Failed to update lesson progress. Please try again.");
				}
			});
		}
	}, [isCompleted, courseId, lesson.id]);

	// Automatically show survey when component mounts if lesson has a survey and it's not completed
	useEffect(() => {
		if (hasSurvey && !surveyCompleted) {
			markLessonAsViewed();
			setShowSurvey(true);
		}
	}, [hasSurvey, surveyCompleted, markLessonAsViewed]);

	// Mark lesson as completed
	const markLessonAsCompleted = () => {
		setIsMarkingCompleted(true);

		startTransition(async () => {
			try {
				await updateLessonProgressAction({
					courseId,
					lessonId: lesson.id,
					completionPercentage: 100,
					completed: true,
				});
				// Add back a single toast notification in the bottom right
				toast.success("Lesson marked as completed!");
				// Update the state to reflect completion
				setIsMarkingCompleted(false);

				// Navigate to the next lesson automatically
				navigateToNextLesson();
			} catch (_error) {
				toast.error("Failed to mark lesson as completed. Please try again.");
				setIsMarkingCompleted(false);
			}
		});
	};

	// Handle quiz submission
	const handleQuizSubmit = (
		answers: Record<string, string | string[] | boolean>,
		score: number,
		passed: boolean,
	) => {
		startTransition(async () => {
			try {
				await submitQuizAttemptAction({
					courseId,
					lessonId: lesson.id,
					quizId: quiz?.id || "",
					answers,
					score,
					passed,
				});

				setQuizCompleted(passed);

				// If quiz is passed, mark lesson as completed but don't navigate automatically
				if (passed) {
					await updateLessonProgressAction({
						courseId,
						lessonId: lesson.id,
						completionPercentage: 100,
						completed: true,
					});

					// Remove automatic navigation - let user click the Next Lesson button in summary
				}
			} catch (_error) {
				toast.error("Failed to submit quiz. Please try again.");
			}
		});
	};

	// Function to find and navigate to the next lesson
	const navigateToNextLesson = async () => {
		try {
			// Import the getCourseLessons function
			const { getCourseLessons } = await import("@kit/cms/payload");

			// Fetch all lessons for this course
			const lessonsData = await getCourseLessons(courseId);

			if (lessonsData?.docs && lessonsData.docs.length > 0) {
				// Sort lessons by lesson_number
				const sortedLessons = [...lessonsData.docs].sort(
					(a, b) => a.lesson_number - b.lesson_number,
				);

				// Find the index of the current lesson
				const currentIndex = sortedLessons.findIndex(
					(lessonItem) => lessonItem.id === lesson.id,
				);

				// If we found the current lesson and it's not the last one
				if (currentIndex !== -1 && currentIndex < sortedLessons.length - 1) {
					// Get the next lesson
					const nextLesson = sortedLessons[currentIndex + 1];

					// Navigate to the next lesson
					window.location.href = `/home/course/lessons/${nextLesson.slug}`;
					return;
				}
			}

			// If we couldn't find the next lesson or there was an error, go back to the course page
			window.location.href = "/home/course";
		} catch (_error) {
			// Fallback to course page
			window.location.href = "/home/course";
		}
	};

	// Check if this is the congratulations lesson (identified by slug)
	const isCongratulationsLesson = lesson.slug === "congratulations";

	// Trigger confetti animation when congratulations lesson is viewed
	useEffect(() => {
		if (isCongratulationsLesson) {
			setShowConfetti(true);
		}
	}, [isCongratulationsLesson]);

	return (
		<div className="container mx-auto max-w-4xl p-4">
			{/* Confetti animation for congratulations lesson */}
			{showConfetti &&
				typeof document !== "undefined" &&
				createPortal(
					<Confetti numberOfPieces={500} recycle={false} />,
					document.body,
				)}

			{/* Lesson content */}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle>{lesson.title}</CardTitle>
					<div className="text-muted-foreground text-sm">
						{lesson.estimated_duration || 0} minutes
					</div>
				</CardHeader>
				<CardContent>
					{showSurvey && survey ? (
						<SurveyComponent
							survey={survey}
							surveyResponses={surveyResponses}
							userId={userId}
							onComplete={() => {
								setSurveyCompleted(true);
								setShowSurvey(false);
								// Mark lesson as completed when survey is completed
								markLessonAsCompleted();
							}}
						/>
					) : showQuiz ? (
						quiz && (
							<QuizComponent
								quiz={quiz}
								onSubmit={(answers, score, passed) =>
									handleQuizSubmit(
										answers as Record<string, string | string[] | boolean>,
										score,
										passed,
									)
								}
								previousAttempts={quizAttempts.map((attempt) => ({
									id: attempt.id,
									score: attempt.score || 0,
									passed: attempt.passed || false,
									answers: attempt.answers as Record<string, unknown>,
									created_at: attempt.started_at || "",
								}))}
								courseId={courseId}
								currentLessonId={lesson.id}
								currentLessonNumber={
									typeof lesson.lesson_number === "number"
										? lesson.lesson_number
										: Number(lesson.lesson_number) || 0
								}
							/>
						)
					) : (
						<>
							{/* Render Bunny.net Video if available */}
							{lesson.bunny_video_id && (
								<div className="my-8">
									<div className="relative" style={{ paddingBottom: "56.25%" }}>
										<iframe
											src={`https://iframe.mediadelivery.net/embed/${lesson.bunny_library_id || "264486"}/${lesson.bunny_video_id}`}
											loading="lazy"
											style={{
												border: "none",
												position: "absolute",
												top: 0,
												left: 0,
												height: "100%",
												width: "100%",
											}}
											allow="accelerometer; gyroscope; encrypted-media; picture-in-picture;"
											allowFullScreen={true}
											title={lesson.title}
										/>
									</div>
								</div>
							)}

							{/* Render External Video if available */}
							{lesson.youtube_video_id && lesson.video_source_type && (
								<div className="my-8">
									<div className="relative" style={{ paddingBottom: "56.25%" }}>
										<iframe
											src={
												lesson.video_source_type === "youtube"
													? `https://www.youtube.com/embed/${lesson.youtube_video_id}`
													: `https://player.vimeo.com/video/${lesson.youtube_video_id}`
											}
											loading="lazy"
											style={{
												border: "none",
												position: "absolute",
												top: 0,
												left: 0,
												height: "100%",
												width: "100%",
											}}
											allow="accelerometer; gyroscope; encrypted-media; picture-in-picture;"
											allowFullScreen={true}
											title="External Video"
										/>
									</div>
								</div>
							)}

							{/* Render Lesson Image if available and no video */}
							{lesson.lesson_image &&
								!lesson.bunny_video_id &&
								!lesson.youtube_video_id && (
									<div className="my-8">
										<img
											src={
												typeof lesson.lesson_image === "string"
													? lesson.lesson_image
													: lesson.lesson_image.url || ""
											}
											alt={lesson.title}
											className="w-full rounded-lg shadow-md"
											loading="lazy"
										/>
									</div>
								)}

							{/* Render To-Do Items if any exist */}
							{(lesson.todo ||
								lesson.todo_complete_quiz ||
								lesson.todo_watch_content ||
								lesson.todo_read_content ||
								lesson.todo_course_project) && (
								<div className="my-6">
									{/* General To-Do (first position) */}
									{lesson.todo && (
										<div className="mb-4 flex items-start">
											<CheckSquare className="text-primary mt-0.5 mr-2 h-5 w-5" />
											<div>
												<span className="font-medium">To-Do: </span>
												<div className="prose prose-sm dark:prose-invert">
													<PayloadContentRenderer content={lesson.todo} />
												</div>
											</div>
										</div>
									)}

									{/* Watch Content (second position) */}
									{lesson.todo_watch_content && (
										<div className="mb-4 flex items-start">
											<Play className="text-primary mt-0.5 mr-2 h-5 w-5" />
											<div>
												<span className="font-medium">Watch: </span>
												<div className="prose prose-sm dark:prose-invert">
													<PayloadContentRenderer
														content={lesson.todo_watch_content}
													/>
												</div>
											</div>
										</div>
									)}

									{/* Read Content (third position) */}
									{lesson.todo_read_content && (
										<div className="mb-4 flex items-start">
											<BookOpen className="text-primary mt-0.5 mr-2 h-5 w-5" />
											<div>
												<span className="font-medium">Read: </span>
												<div className="prose prose-sm dark:prose-invert">
													<PayloadContentRenderer
														content={lesson.todo_read_content}
													/>
												</div>
											</div>
										</div>
									)}

									{/* Course Project (fourth position) */}
									{lesson.todo_course_project && (
										<div className="mb-4 flex items-start">
											<Briefcase className="text-primary mt-0.5 mr-2 h-5 w-5" />
											<div>
												<span className="font-medium">Course Project: </span>
												<div className="prose prose-sm dark:prose-invert">
													<PayloadContentRenderer
														content={lesson.todo_course_project}
													/>
												</div>
											</div>
										</div>
									)}

									{/* Test Yourself: Complete Quiz (fifth position, renamed from To-Do: Complete Quiz) */}
									{lesson.todo_complete_quiz && (
										<div className="mb-4 flex items-start">
											<CheckSquare className="text-primary mt-0.5 mr-2 h-5 w-5" />
											<div>
												<span className="font-medium">Test Yourself: </span>
												<span>Complete the lesson quiz</span>
											</div>
										</div>
									)}
								</div>
							)}

							{/* Main content */}
							<div className="prose prose-sm dark:prose-invert max-w-none">
								<PayloadContentRenderer content={lesson.content as unknown} />
							</div>

							{/* Render Downloads with better error handling and diagnostics */}
							{(() => {
								// Debug logging in development
								if (process.env.NODE_ENV === "development") {
									logger.info("Lesson downloads:", {
										data: lesson.downloads
											? `${lesson.downloads.length} items`
											: "undefined",
									});

									if (lesson.downloads && lesson.downloads.length > 0) {
										logger.info("Downloads found for lesson", {
											lessonId: lesson.id,
											downloadCount: lesson.downloads.length,
										});
									}
								}

								// If downloads exist and are in the expected format
								if (
									lesson.downloads &&
									Array.isArray(lesson.downloads) &&
									lesson.downloads.length > 0
								) {
									return (
										<div className="my-6">
											<div className="space-y-2">
												{lesson.downloads.map(
													(download: Download, index: number) => {
														// Additional validation
														if (!download) {
															logger.warn("Empty download object found", {
																lessonId: lesson.id,
																downloadIndex: index,
															});
															return null;
														}

														if (!download.url) {
															logger.warn("Download missing URL", {
																lessonId: lesson.id,
																downloadIndex: index,
																downloadTitle: download.title,
																downloadFilename: download.filename,
															});

															// Fallback rendering for downloads without URL
															if (download.filename || download.description) {
																return (
																	<div
																		key={`download-${lesson.id}-${index}-${download.filename || index}`}
																		className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
																	>
																		<div className="flex-grow">
																			<p className="font-medium">
																				{download.description ||
																					download.filename}
																			</p>
																		</div>
																		<span className="text-sm text-gray-500 italic">
																			(Download URL not available)
																		</span>
																	</div>
																);
															}

															return null;
														}

														// Special handling for ZIP files
														const isZipFile =
															download.mimeType === "application/zip" ||
															download.filename?.toLowerCase().endsWith(".zip");

														const isPdfFile =
															download.mimeType === "application/pdf" ||
															download.filename?.toLowerCase().endsWith(".pdf");

														// Get file size in human-readable format
														const getFileSize = (bytes?: number) => {
															if (!bytes) return "";
															const sizes = ["Bytes", "KB", "MB", "GB"];
															if (bytes === 0) return "0 Byte";
															const i = Math.floor(
																Math.log(bytes) / Math.log(1024),
															);
															return `${Math.round(bytes / 1024 ** i)} ${sizes[i]}`;
														};

														const fileSize = getFileSize(download.filesize);

														return (
															<div
																key={`download-${lesson.id}-${index}-${download.url || download.filename || index}`}
																className="flex flex-col rounded-lg border border-gray-200 p-3 dark:border-gray-700"
															>
																<div className="flex items-center justify-between">
																	<div className="flex-grow">
																		<p className="font-medium">
																			{/* Enhanced display logic for download title/filename */}
																			{download.description &&
																			download.description !== "null"
																				? download.description
																				: download.title &&
																						download.title !== "null"
																					? download.title
																					: download.filename
																						? download.filename.replace(
																								/\.(pdf|zip)$/i,
																								"",
																							)
																						: "Download"}
																		</p>
																		{/* Show file type and size info */}
																		<p className="text-muted-foreground mt-0.5 text-xs">
																			{isZipFile && "ZIP Archive"}
																			{isPdfFile && "PDF Document"}
																			{fileSize && ` • ${fileSize}`}
																		</p>
																	</div>
																	<Button
																		asChild
																		variant="default"
																		size="default"
																		className="bg-primary text-primary-foreground"
																	>
																		<a
																			href={download.url}
																			download
																			target="_blank"
																			rel="noopener noreferrer"
																			data-source="lesson-downloads"
																		>
																			Download
																		</a>
																	</Button>
																</div>
															</div>
														);
													},
												)}
											</div>
										</div>
									);
								}

								// Fallback for template tags if no downloads relationship but content has r2file tags
								if (
									lesson.content &&
									typeof lesson.content === "string" &&
									lesson.content.includes("{%") &&
									lesson.content.includes("r2file")
								) {
									logger.info("Processing template tag downloads", {
										lessonId: lesson.id,
										contentLength: lesson.content.length,
									});

									// Extract download section from content
									const downloadSection = lesson.content.match(
										/### Lesson Downloads[\s\S]*?(?=###|$)/,
									);

									if (downloadSection?.[0]) {
										// If we found a download section, use our custom processor to render it
										return (
											<div className="my-6">
												<div
													className="template-downloads"
													// biome-ignore lint/security/noDangerouslySetInnerHtml: Rendering trusted course content with processed template tags
													dangerouslySetInnerHTML={{
														__html: processR2FileTags(downloadSection[0]),
													}}
												/>
											</div>
										);
									}
								}

								return null;
							})()}

							{/* Certificate link for congratulations lesson */}
							{isCongratulationsLesson && (
								<div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm dark:border-green-800 dark:bg-green-900/50">
									<h2 className="text-xl font-bold text-green-800 dark:text-green-300">
										Congratulations on completing the course! 🎉
									</h2>
									<p className="mt-2 text-green-700 dark:text-green-400">
										You've successfully completed all lessons in the course.
										Your certificate of completion is ready.
									</p>
									<div className="mt-4 flex justify-end">
										<Link href="/home/course/certificate">
											<Button className="bg-green-600 hover:bg-green-700">
												View Certificate
											</Button>
										</Link>
									</div>
								</div>
							)}
						</>
					)}
				</CardContent>
				<CardFooter className="flex justify-between">
					<Link href="/home/course">
						<Button variant="outline">
							<ChevronLeft className="mr-2 h-4 w-4" />
							Back to Course
						</Button>
					</Link>

					<div className="flex gap-2">
						{/* Survey Button */}
						{!showSurvey && !showQuiz && hasSurvey && !surveyCompleted && (
							<Button
								onClick={() => {
									markLessonAsViewed();
									setShowSurvey(true);
								}}
								disabled={isPending}
								className="bg-blue-600 hover:bg-blue-700"
							>
								Take Survey
								<ChevronRight className="ml-2 h-4 w-4" />
							</Button>
						)}

						{/* Quiz Button */}
						{!showSurvey && !showQuiz && hasQuiz && !quizCompleted && (
							<Button
								onClick={() => {
									markLessonAsViewed();
									setShowQuiz(true);
								}}
								disabled={isPending}
							>
								Take Quiz
								<ChevronRight className="ml-2 h-4 w-4" />
							</Button>
						)}

						{/* Mark as Completed Button */}
						{!showSurvey &&
							!showQuiz &&
							(!hasQuiz || quizCompleted) &&
							(!hasSurvey || surveyCompleted) &&
							(isCompleted ? (
								<>
									<Button
										disabled={true}
										className="mr-2 bg-green-600 hover:bg-green-700"
									>
										Completed
										<CheckCircle className="ml-2 h-4 w-4 text-green-200" />
									</Button>
									{/* Next Lesson Button - only show if lesson is completed */}
									<Button onClick={navigateToNextLesson}>
										Next Lesson
										<ChevronRight className="ml-2 h-4 w-4" />
									</Button>
								</>
							) : (
								<Button
									onClick={markLessonAsCompleted}
									disabled={isPending || isMarkingCompleted}
									className={
										isMarkingCompleted ? "bg-green-600 hover:bg-green-700" : ""
									}
								>
									{isMarkingCompleted ? "Marking..." : "Mark as Completed"}
									<CheckCircle
										className={`ml-2 h-4 w-4 ${isMarkingCompleted ? "text-green-200" : ""}`}
									/>
								</Button>
							))}
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}
