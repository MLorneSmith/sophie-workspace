'use client';

import { useEffect, useState } from 'react';

import { toast } from 'sonner';

import { useCourseStore } from '../../../../_stores/course-store';

interface User {
  id: string;
}

interface Props {
  user: User;
  courseId: string;
}

interface LessonCompletion {
  id: string;
  completed_lesson: number[];
  lesson_id: string;
  course_id: string;
  completed_at: string;
  quiz_score: number | null;
}

interface CompletionsResponse {
  completions: LessonCompletion[];
  currentLessonId: string | null;
  nextLessonId: string | null;
  error?: string;
}

export default function LessonCompletionsDisplay({ user, courseId }: Props) {
  const { courseProgress, updateProgress } = useCourseStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompletions = async () => {
      try {
        console.log('LessonCompletionsDisplay - Fetching completions:', {
          userId: user.id,
          courseId,
        });

        const response = await fetch(
          `/api/lessons/completions?userId=${user.id}&courseId=${courseId}`,
        );

        const data: CompletionsResponse = await response.json();
        console.log('LessonCompletionsDisplay - Response:', data);

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch lesson completions');
        }

        if (data.error) {
          throw new Error(data.error);
        }

        if (data.completions) {
          console.log(
            'LessonCompletionsDisplay - Processing completions:',
            data.completions,
          );
          const completedLessons = data.completions
            .map((completion: LessonCompletion) => completion.completed_lesson)
            .flat();

          console.log('LessonCompletionsDisplay - Updating store with:', {
            completedLessons,
            currentLessonId: data.currentLessonId,
            nextLessonId: data.nextLessonId,
          });

          // Update course store with completion data
          updateProgress(courseId, {
            completedLessons,
            currentLessonId: data.currentLessonId,
            nextLessonId: data.nextLessonId,
          });
        }
      } catch (err) {
        console.error('LessonCompletionsDisplay - Error:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        toast.error(`Failed to load lesson completion data: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletions();
  }, [user.id, courseId, updateProgress]);

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (isLoading) {
    return <div>Loading lesson completion data...</div>;
  }

  const progress = courseProgress[courseId];
  if (!progress) {
    return <div>No progress data available</div>;
  }

  const completedCount = progress.completedLessons.length;
  const nextLesson = progress.nextLessonId;

  return (
    <div className="mt-4">
      <div className="text-lg font-semibold">
        Completed Lessons: {completedCount}
      </div>
      {nextLesson && <div className="mt-2">Next Lesson: {nextLesson}</div>}
    </div>
  );
}
