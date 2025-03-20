'use client';

import { Progress } from '@kit/ui/progress';

interface CourseProgressBarProps {
  percentage: number;
  totalLessons: number;
  completedLessons: number;
}

export function CourseProgressBar({
  percentage,
  totalLessons,
  completedLessons,
}: CourseProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Course Progress</span>
        <span>
          {completedLessons} of {totalLessons} lessons completed
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
