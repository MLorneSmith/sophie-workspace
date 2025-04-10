'use client';

import { useEffect, useState, useTransition } from 'react';

import Link from 'next/link';

import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

import { PayloadContentRenderer } from '@kit/cms/payload';
import { Button } from '@kit/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';

import {
  submitQuizAttemptAction,
  updateLessonProgressAction,
} from '../../../_lib/server/server-actions';
// Import the QuizComponent and SurveyComponent
import { QuizComponent } from './QuizComponent';
import { SurveyComponent } from './SurveyComponent';

interface LessonViewClientProps {
  lesson: any;
  quiz: any;
  quizAttempts: any[];
  lessonProgress: any;
  userId: string;
  survey?: any;
  surveyResponses?: any[];
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
    quizAttempts.length > 0 && quizAttempts[0].passed,
  );
  const [surveyCompleted, setSurveyCompleted] = useState(
    surveyResponses.length > 0 && surveyResponses[0].completed,
  );
  const [isMarkingCompleted, setIsMarkingCompleted] = useState(false);

  // Calculate progress
  const progress = lessonProgress?.completion_percentage || 0;
  const isCompleted = !!lessonProgress?.completed_at;

  // Check if lesson has a quiz that was successfully loaded
  const hasQuiz =
    !!quiz && !!quiz.id && !!(lesson.quiz_id || lesson.quiz_id_id);

  // Check if lesson has a survey that was successfully loaded
  const hasSurvey =
    !!survey && !!survey.id && (!!lesson.survey_id || !!lesson.survey_id_id);

  // Extract course ID safely
  const getCourseId = () => {
    // Handle different possible formats of course relationship
    if (lesson.course) {
      if (typeof lesson.course === 'object') {
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
      if (typeof lesson.course === 'string') {
        return lesson.course;
      }
    }
    // If course_id exists directly on the lesson
    if (lesson.course_id) {
      return typeof lesson.course_id === 'object' && lesson.course_id.id
        ? lesson.course_id.id
        : lesson.course_id;
    }
    // Fallback to empty string if no course ID found
    return '';
  };

  // Get course ID
  const courseId = getCourseId();

  // Mark lesson as viewed when component mounts
  const markLessonAsViewed = () => {
    if (!isCompleted) {
      startTransition(async () => {
        try {
          await updateLessonProgressAction({
            courseId,
            lessonId: lesson.id,
            completionPercentage: 50, // Mark as partially completed when viewed
          });
        } catch (error) {
          toast.error('Failed to update lesson progress. Please try again.');
        }
      });
    }
  };

  // Automatically show survey when component mounts if lesson has a survey and it's not completed
  useEffect(() => {
    if (hasSurvey && !surveyCompleted) {
      markLessonAsViewed();
      setShowSurvey(true);
    }
  }, [hasSurvey, surveyCompleted, courseId, lesson.id, isCompleted]);

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
        toast.success('Lesson marked as completed!');
        // Update the state to reflect completion
        setIsMarkingCompleted(false);

        // Navigate to the next lesson automatically
        navigateToNextLesson();
      } catch (error) {
        toast.error('Failed to mark lesson as completed. Please try again.');
        setIsMarkingCompleted(false);
      }
    });
  };

  // Handle quiz submission
  const handleQuizSubmit = (
    answers: Record<string, any>,
    score: number,
    passed: boolean,
  ) => {
    startTransition(async () => {
      try {
        await submitQuizAttemptAction({
          courseId,
          lessonId: lesson.id,
          quizId: quiz.id,
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
      } catch (error) {
        toast.error('Failed to submit quiz. Please try again.');
      }
    });
  };

  // Function to find and navigate to the next lesson
  const navigateToNextLesson = async () => {
    try {
      // Import the getCourseLessons function
      const { getCourseLessons } = await import('@kit/cms/payload');

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
      window.location.href = '/home/course';
    } catch (error) {
      // Fallback to course page
      window.location.href = '/home/course';
    }
  };

  // Check if this is the congratulations lesson (801)
  const isCongratulationsLesson = lesson.lesson_number === '801';

  return (
    <>
      <div className="container mx-auto max-w-4xl p-4">
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
                  onSubmit={handleQuizSubmit}
                  previousAttempts={quizAttempts}
                  courseId={courseId}
                  currentLessonId={lesson.id}
                  currentLessonNumber={lesson.lesson_number}
                />
              )
            ) : (
              <>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <PayloadContentRenderer content={lesson.content} />
                </div>

                {/* Render Bunny.net Video if available */}
                {lesson.bunny_video_id && (
                  <div className="my-8">
                    <h3 className="mb-2 text-lg font-bold">Lesson Video</h3>
                    <div
                      className="relative"
                      style={{ paddingBottom: '56.25%' }}
                    >
                      <iframe
                        src={`https://iframe.mediadelivery.net/embed/${lesson.bunny_library_id || '264486'}/${lesson.bunny_video_id}`}
                        loading="lazy"
                        style={{
                          border: 'none',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: '100%',
                          width: '100%',
                        }}
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                        allowFullScreen={true}
                        title={lesson.title}
                      />
                    </div>
                  </div>
                )}

                {/* Render To-Do Items if any exist */}
                {(lesson.todo_complete_quiz ||
                  lesson.todo_watch_content ||
                  lesson.todo_read_content ||
                  lesson.todo_course_project) && (
                  <div className="my-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <h3 className="mb-2 text-lg font-semibold">
                      Lesson To-Do's
                    </h3>

                    {lesson.todo_complete_quiz && (
                      <div className="mb-2">
                        <h4 className="font-medium">To-Do</h4>
                        <ul className="list-disc pl-5">
                          <li>Complete the lesson quiz</li>
                        </ul>
                      </div>
                    )}

                    <div className="mb-2">
                      <h4 className="font-medium">Watch</h4>
                      <p>{lesson.todo_watch_content || 'None'}</p>
                    </div>

                    <div className="mb-2">
                      <h4 className="font-medium">Read</h4>
                      <p>{lesson.todo_read_content || 'None'}</p>
                    </div>

                    <div>
                      <h4 className="font-medium">Course Project</h4>
                      <p>{lesson.todo_course_project || 'None'}</p>
                    </div>
                  </div>
                )}

                {/* Render Downloads if available */}
                {lesson.downloads && lesson.downloads.length > 0 && (
                  <div className="my-6">
                    <h3 className="mb-2 text-lg font-semibold">
                      Lesson Downloads
                    </h3>
                    <div className="space-y-2">
                      {lesson.downloads.map((download: any, index: number) => {
                        // Ensure we have a download with URL
                        if (!download || !download.url) return null;

                        return (
                          <div
                            key={index}
                            className="flex items-center rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                          >
                            <div className="flex-grow">
                              <p className="font-medium">
                                {download.description || download.filename}
                              </p>
                            </div>
                            <a
                              href={download.url}
                              download
                              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Download
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                      isMarkingCompleted
                        ? 'bg-green-600 hover:bg-green-700'
                        : ''
                    }
                  >
                    {isMarkingCompleted ? 'Marking...' : 'Mark as Completed'}
                    <CheckCircle
                      className={`ml-2 h-4 w-4 ${isMarkingCompleted ? 'text-green-200' : ''}`}
                    />
                  </Button>
                ))}
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
