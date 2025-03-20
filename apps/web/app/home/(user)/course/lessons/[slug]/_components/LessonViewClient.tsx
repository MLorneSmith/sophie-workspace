'use client';

import { useState } from 'react';
import { useTransition } from 'react';

import Link from 'next/link';

import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

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

import {
  submitQuizAttemptAction,
  updateLessonProgressAction,
} from '../../../_lib/server/server-actions';
// Import will be resolved when the component is created
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

  // Calculate progress
  const progress = lessonProgress?.completion_percentage || 0;
  const isCompleted = !!lessonProgress?.completed_at;

  // Mark lesson as viewed when component mounts
  const markLessonAsViewed = () => {
    if (!isCompleted) {
      startTransition(async () => {
        await updateLessonProgressAction({
          courseId: lesson.course.id,
          lessonId: lesson.id,
          completionPercentage: 50, // Mark as partially completed when viewed
        });
      });
    }
  };

  // Mark lesson as completed
  const markLessonAsCompleted = () => {
    startTransition(async () => {
      await updateLessonProgressAction({
        courseId: lesson.course.id,
        lessonId: lesson.id,
        completionPercentage: 100,
        completed: true,
      });
    });
  };

  // Handle quiz submission
  const handleQuizSubmit = (
    answers: Record<string, any>,
    score: number,
    passed: boolean,
  ) => {
    startTransition(async () => {
      await submitQuizAttemptAction({
        courseId: lesson.course.id,
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
          courseId: lesson.course.id,
          lessonId: lesson.id,
          completionPercentage: 100,
          completed: true,
        });
      }
    });
  };

  return (
    <div className="container mx-auto max-w-4xl p-4">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm">
          <span>Lesson Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

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
            {!showQuiz && quiz && !quizCompleted && (
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

            {!showQuiz && (!quiz || quizCompleted) && !isCompleted && (
              <Button onClick={markLessonAsCompleted} disabled={isPending}>
                Mark as Completed
                <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            )}

            {showQuiz && (
              <Button
                variant="outline"
                onClick={() => setShowQuiz(false)}
                disabled={isPending}
              >
                Back to Lesson
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Completed status */}
      {isCompleted && (
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
  );
}
