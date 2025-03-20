'use client';

import { useEffect, useState } from 'react';

import { Progress } from '@kit/ui/progress';

interface CourseProgressProps {
  userId: string;
  totalLessons: number;
}

export default function CourseProgress({
  userId,
  totalLessons,
}: CourseProgressProps) {
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompletions = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/lessons/completions?userId=${userId}`,
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || 'Failed to fetch lesson completions',
          );
        }

        const data = await response.json();
        const completions = data.completions || [];

        // Get unique completed lessons
        const uniqueCompletedLessons = new Set(
          completions.flatMap((completion: any) => completion.completed_lesson),
        );

        setCompletedCount(uniqueCompletedLessons.size);
      } catch (error) {
        console.error('Error fetching completions:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchCompletions();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Loading progress...</span>
        </div>
        <Progress value={0} className="h-2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-red-500">
          <span>Error: {error}</span>
        </div>
        <Progress value={0} className="h-2" />
      </div>
    );
  }

  const progressPercentage = Math.round((completedCount / totalLessons) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Course Progress</span>
        <span>
          {completedCount} of {totalLessons} lessons completed
        </span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
    </div>
  );
}
