import { LessonCompletion } from './CalculateLessonCompletions';

interface Course {
  id: string;
  title: string;
  total_lessons: number | null;
}

export function calculateCourseCompletion(
  course: Course,
  completions: LessonCompletion[],
): number {
  if (!course.total_lessons || course.total_lessons === 0) {
    return 0;
  }

  const completedLessons = completions.flatMap((c) => c.completed_lesson);
  const uniqueCompletedLessons = [...new Set(completedLessons)];
  const completionPercentage = Math.round(
    (uniqueCompletedLessons.length / course.total_lessons) * 100,
  );

  return Math.min(completionPercentage, 100);
}
