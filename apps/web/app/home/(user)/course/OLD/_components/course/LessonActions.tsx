'use client';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { Button } from '@kit/ui/button';

interface LessonActionsProps {
  lessonId: string;
  lessonSlug: string;
  courseId: string;
  lessonNumber: number;
  quizSlug: string | null;
}

export function LessonActions({
  lessonId,
  lessonSlug,
  courseId,
  lessonNumber,
  quizSlug,
}: LessonActionsProps) {
  const router = useRouter();

  const handleComplete = async () => {
    try {
      const response = await fetch('/api/lessons/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
          lessonOrder: lessonNumber,
          courseId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete lesson');
      }

      toast.success('Lesson completed successfully!');

      // Navigate based on response
      if (quizSlug) {
        // If there's a quiz, go to the quiz
        router.push(`/home/course/${lessonSlug}/${quizSlug}`);
      } else if (data.nextLessonSlug) {
        // If there's a next lesson, go to that lesson
        await router.push(`/home/course/${data.nextLessonSlug}`);
      } else {
        // If this was the last lesson, go to course dashboard
        await router.push('/home/course');
      }

      // Refresh the page to update any UI that depends on the completion status
      router.refresh();
    } catch (error) {
      console.error('Error completing lesson:', error);
      toast.error(
        'An error occurred while completing the lesson. Please try again.',
      );
    }
  };

  return (
    <div className="flex gap-4">
      {quizSlug ? (
        <Button
          onClick={() => router.push(`/home/course/${lessonSlug}/${quizSlug}`)}
        >
          Take Quiz
        </Button>
      ) : (
        <Button onClick={handleComplete}>Complete lesson</Button>
      )}
    </div>
  );
}
