'use client';

import { useState } from 'react';
import { useTransition } from 'react';

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
import { Progress } from '@kit/ui/progress';
import { Toaster } from '@kit/ui/sonner';

import {
  submitQuizAttemptAction,
  updateLessonProgressAction,
} from '../../../_lib/server/server-actions';
// Import the QuizComponent
import { QuizComponent } from './QuizComponent';

interface LessonViewClientProps {
  lesson: any;
  quiz: any;
  quizAttempts: any[];
  lessonProgress: any;
  userId: string;
}

export function LessonViewClient({
  lesson,
  quiz,
  quizAttempts,
  lessonProgress,
  userId,
}: LessonViewClientProps) {
  const [isPending, startTransition] = useTransition();
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(
    quizAttempts.length > 0 && quizAttempts[0].passed,
  );
  const [isMarkingCompleted, setIsMarkingCompleted] = useState(false);

  // Calculate progress
  const progress = lessonProgress?.completion_percentage || 0;
  const isCompleted = !!lessonProgress?.completed_at;

  // Check if lesson has a quiz that was successfully loaded
  const hasQuiz =
    !!quiz && !!quiz.id && !!(lesson.quiz_id || lesson.quiz_id_id);

  // Debug quiz data
  console.log('LessonViewClient - Quiz data:', {
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    quizExists: !!quiz,
    quizHasId: !!quiz?.id,
    quizId: quiz?.id,
    lessonQuizId: lesson.quiz_id,
    lessonQuizIdId: lesson.quiz_id_id,
    hasQuiz,
    quizCompleted,
    quizAttemptsCount: quizAttempts.length,
    isCompleted,
  });

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
    console.error(
      'LessonViewClient - No course ID found in lesson data:',
      lesson,
    );
    return '';
  };

  // Get course ID
  const courseId = getCourseId();

  // Debug course data
  console.log('LessonViewClient - Course data:', {
    courseId,
    courseObject: lesson.course,
    courseIdField: lesson.course_id,
  });

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
          console.error('Error marking lesson as viewed:', error);
          toast.error('Failed to update lesson progress. Please try again.');
        }
      });
    }
  };

  // Mark lesson as completed
  const markLessonAsCompleted = () => {
    setIsMarkingCompleted(true);
    toast.success('Marking lesson as completed...');

    startTransition(async () => {
      try {
        await updateLessonProgressAction({
          courseId,
          lessonId: lesson.id,
          completionPercentage: 100,
          completed: true,
        });
        toast.success('Lesson marked as completed!');
      } catch (error) {
        console.error('Error marking lesson as completed:', error);
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
        // Log the quiz ID for debugging
        console.log('LessonViewClient - Submitting quiz attempt:', {
          quizId: quiz.id,
          quizIdType: typeof quiz.id,
          lessonId: lesson.id,
          courseId,
        });

        await submitQuizAttemptAction({
          courseId,
          lessonId: lesson.id,
          quizId: quiz.id,
          answers,
          score,
          passed,
        });

        setQuizCompleted(passed);

        // If quiz is passed, mark lesson as completed
        if (passed) {
          await updateLessonProgressAction({
            courseId,
            lessonId: lesson.id,
            completionPercentage: 100,
            completed: true,
          });
        }

        toast.success('Quiz submitted successfully!');
      } catch (error) {
        console.error('Error submitting quiz:', error);
        toast.error('Failed to submit quiz. Please try again.');
      }
    });
  };

  return (
    <>
      <div className="container mx-auto max-w-4xl p-4">
        {/* Lesson content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{lesson.title}</CardTitle>
            <div className="text-muted-foreground text-sm">
              {lesson.estimatedDuration || 0} minutes
            </div>
          </CardHeader>
          <CardContent>
            {!showQuiz ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <PayloadContentRenderer content={lesson.content} />
              </div>
            ) : (
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
              {!showQuiz && hasQuiz && !quizCompleted && (
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

              {!showQuiz && (!hasQuiz || quizCompleted) && !isCompleted && (
                <Button
                  onClick={markLessonAsCompleted}
                  disabled={isPending || isMarkingCompleted}
                  className={
                    isMarkingCompleted ? 'bg-green-600 hover:bg-green-700' : ''
                  }
                >
                  {isMarkingCompleted ? 'Marking...' : 'Mark as Completed'}
                  <CheckCircle
                    className={`ml-2 h-4 w-4 ${isMarkingCompleted ? 'text-green-200' : ''}`}
                  />
                </Button>
              )}

              {showQuiz && (
                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={async () => {
                    try {
                      // Import the getCourseLessons function
                      const { getCourseLessons } = await import(
                        '@kit/cms/payload'
                      );

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
                        if (
                          currentIndex !== -1 &&
                          currentIndex < sortedLessons.length - 1
                        ) {
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
                      console.error('Error finding next lesson:', error);
                      // Fallback to course page
                      window.location.href = '/home/course';
                    }
                  }}
                >
                  Next Lesson
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Completed status */}
        {(isCompleted || isMarkingCompleted) && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm dark:border-green-800 dark:bg-green-900/50">
            <h2 className="text-xl font-bold text-green-800 dark:text-green-300">
              Lesson Completed! 🎉
            </h2>
            <p className="mt-2 text-green-700 dark:text-green-400">
              You have successfully completed this lesson.
            </p>
          </div>
        )}
      </div>
      <Toaster />
    </>
  );
}
