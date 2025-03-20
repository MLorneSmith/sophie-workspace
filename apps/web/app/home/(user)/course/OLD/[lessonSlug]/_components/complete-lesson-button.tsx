'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@kit/ui/button';

import { getNextLesson } from '../../_utils/lessons';

interface CompleteLessonButtonProps {
  lessonId: string;
  lessonSlug: string;
  completedLessonNumber: number;
  courseId: string;
  courseTitle: string;
}

export default function CompleteLessonButton({
  lessonId,
  lessonSlug,
  completedLessonNumber,
  courseId,
  courseTitle,
}: CompleteLessonButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const router = useRouter();

  const handleComplete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/lessons/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
          lessonOrder: completedLessonNumber,
          courseId,
          courseTitle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete lesson');
      }

      setIsCompleted(true);
      toast.success('Lesson completed successfully!');

      // Get next lesson
      const nextLesson = await getNextLesson(lessonSlug);
      
      // If there's a next lesson, redirect to it
      if (nextLesson) {
        router.push(`/home/course/${nextLesson.slug}`);
      } else {
        // If this was the last lesson, redirect to course dashboard
        router.push('/home/course');
      }

    } catch (err) {
      console.error('Error completing lesson:', err);
      const errorMessage = 'An error occurred while completing the lesson. Please try again or contact support.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="font-medium text-green-600 dark:text-green-400">
        ✓ Lesson completed
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded bg-red-100 p-4 text-red-700">
          {error}
          <button
            className="ml-2 text-sm underline"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      <Button onClick={handleComplete} disabled={isLoading}>
        {isLoading ? 'Completing...' : 'Complete lesson'}
      </Button>
    </div>
  );
}
