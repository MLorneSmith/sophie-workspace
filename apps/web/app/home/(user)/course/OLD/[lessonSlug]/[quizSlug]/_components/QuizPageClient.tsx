'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { Toaster } from '@kit/ui/sonner';

import { useCourseStore } from '~/_stores/course-store';

import courseConfig from '../../../../../../../config/courseConfig';
import { Course, QuizContentItem } from '../../../../_types/courseTypes';
import { QuizPost } from '../../[quizSlug]/_components/quiz';
import { useNextLesson } from '../../_hooks/useNextLesson';
import { QuizSummary } from './QuizSummary';
import { QuizQuestion } from './question';

interface QuizPageClientProps {
  post: QuizContentItem;
  currentLessonId: string;
  lessonOrder: number;
  lessonSlug: string;
  courseId?: string;
  course: Course;
  studentName: string | null;
  quizId: string;
}

interface QuestionResult {
  questionType: 'single-answer' | 'multi-answer';
  correct: boolean;
}

export function QuizPageClient(props: QuizPageClientProps) {
  const {
    post,
    currentLessonId,
    lessonOrder,
    lessonSlug,
    courseId: propsCourseId,
    course,
    studentName,
    quizId,
  } = props;

  const courseId = propsCourseId || course.id;

  const router = useRouter();
  const [isCompletingLesson, setIsCompletingLesson] = useState(false);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  // Zustand store hooks
  const { courseProgress, updateCourseProgress, quizState, updateQuizState } =
    useCourseStore();

  useNextLesson(courseId, lessonOrder);

  const correctAnswers = useMemo(
    () => questionResults.filter((result) => result.correct).length,
    [questionResults],
  );
  const isQuizCompleted = useMemo(
    () => currentQuestionIndex >= post.questions.length,
    [currentQuestionIndex, post.questions.length],
  );

  useEffect(() => {
    // Reset the local state when the component mounts or when quizId changes
    setQuestionResults([]);
    setCurrentQuestionIndex(0);
    setShowSummary(false);
  }, [quizId]);

  const handleQuizCompletion = useCallback(() => {
    if (!quizState.completed || quizState.currentQuizId !== quizId) {
      updateQuizState(quizId, correctAnswers, true);
    }
    setShowSummary(true);
    console.log('Quiz completed, showing summary');
  }, [quizId, correctAnswers, quizState, updateQuizState]);

  const handleRetry = useCallback(() => {
    updateQuizState(quizId, 0, false);
    setQuestionResults([]);
    setCurrentQuestionIndex(0);
    setShowSummary(false);
  }, [quizId, updateQuizState]);

  const handleLessonCompletion = useCallback(async () => {
    setIsCompletingLesson(true);
    const quizScore = Math.round(
      (correctAnswers / post.questions.length) * 100,
    );

    if (quizScore < courseConfig.quiz.passingScore) {
      toast.error(
        `You need a score of at least ${courseConfig.quiz.passingScore}% to complete the lesson.`,
      );
      setIsCompletingLesson(false);
      return;
    }

    try {
      if (!currentLessonId || !courseId) {
        throw new Error(
          `Invalid state: currentLessonId: ${currentLessonId}, courseId: ${courseId}`,
        );
      }

      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId,
          score: quizScore,
          lessonId: currentLessonId,
          lessonOrder,
          courseId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      const result = await response.json();

      if (result.success) {
        toast.success('Quiz completed successfully!');
        updateCourseProgress(courseId, currentLessonId);

        const progress = courseProgress[courseId];
        const nextLessonId = progress?.nextLessonId;

        if (nextLessonId) {
          // Use replace instead of push to prevent back navigation to completed quiz
          router.replace(`/home/course/${nextLessonId}`);
        } else {
          router.replace(`/home/course/completed`);
        }
      } else {
        throw new Error('Failed to complete quiz');
      }
    } catch (error) {
      console.error('Error in handleLessonCompletion:', error);
      toast.error('Failed to complete quiz. Please try again.');
    } finally {
      setIsCompletingLesson(false);
    }
  }, [
    correctAnswers,
    post.questions.length,
    currentLessonId,
    courseId,
    quizId,
    lessonOrder,
    router,
    courseProgress,
    updateCourseProgress,
  ]);

  const handleUpdateScore = useCallback(
    (isCorrect: boolean, questionType: 'single-answer' | 'multi-answer') => {
      setQuestionResults((prev) => [
        ...prev,
        { questionType, correct: isCorrect },
      ]);
      console.log('Question result updated:', isCorrect);
    },
    [],
  );

  const handleNextQuestion = useCallback(() => {
    setCurrentQuestionIndex((prevIndex) => {
      const newIndex = prevIndex + 1;
      console.log('Moving to next question. New index:', newIndex);
      if (newIndex >= post.questions.length) {
        handleQuizCompletion();
      }
      return newIndex;
    });
  }, [post.questions.length, handleQuizCompletion]);

  const memoizedQuizPost = useMemo(
    () => <QuizPost post={post} content={post.content} />,
    [post],
  );

  const memoizedQuizQuestion = useMemo(
    () => (
      <QuizQuestion
        post={post}
        currentQuestionIndex={currentQuestionIndex}
        updateScore={handleUpdateScore}
        onNextQuestion={handleNextQuestion}
        onQuizComplete={handleQuizCompletion}
      />
    ),
    [
      post,
      currentQuestionIndex,
      handleUpdateScore,
      handleNextQuestion,
      handleQuizCompletion,
    ],
  );

  if (!post || !courseId) {
    return <div>Error: Missing required data</div>;
  }

  return (
    <>
      <div>
        {quizState.completed && (
          <div className="mb-4 text-green-500">Quiz completed!</div>
        )}
        <div className={'container sm:max-w-none sm:p-0'}>
          {memoizedQuizPost}
          {!quizState.completed && !showSummary && (
            <div className="mt-8 flex justify-center">
              <h2 className="text-xl font-bold">
                Current Score: {correctAnswers} / {questionResults.length}
              </h2>
            </div>
          )}
        </div>
        <div>
          {!showSummary ? (
            memoizedQuizQuestion
          ) : (
            <QuizSummary
              correctAnswers={correctAnswers}
              totalQuestions={post.questions.length}
              onRetry={handleRetry}
              completeButton={
                <Button
                  onClick={handleLessonCompletion}
                  disabled={isCompletingLesson}
                >
                  {isCompletingLesson ? 'Completing...' : 'Complete Lesson'}
                </Button>
              }
            />
          )}
        </div>
      </div>
      <Toaster />
    </>
  );
}
