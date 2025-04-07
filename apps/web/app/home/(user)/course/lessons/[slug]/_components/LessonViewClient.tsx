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

        // If quiz is passed, mark lesson as completed
        if (passed) {
          await updateLessonProgressAction({
            courseId,
            lessonId: lesson.id,
            completionPercentage: 100,
            completed: true,
          });
        }
      } catch (error) {
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
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <PayloadContentRenderer content={lesson.content} />
              </div>
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
                  <Button
                    disabled={true}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Completed
                    <CheckCircle className="ml-2 h-4 w-4 text-green-200" />
                  </Button>
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
