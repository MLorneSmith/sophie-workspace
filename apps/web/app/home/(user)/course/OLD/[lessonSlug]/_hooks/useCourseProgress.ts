import { useMemo } from 'react';

import { Course, LessonCompletion } from '../types/courseTypes';

export function useCourseProgress(
  course: Course,
  lessonCompletions: LessonCompletion[],
) {
  const courseCompletionPercentage = useMemo(() => {
    const totalLessons = course.total_lessons ?? 1;
    const completedLessons = lessonCompletions?.length ?? 0;
    return Math.min(Math.round((completedLessons / totalLessons) * 100), 100);
  }, [course.total_lessons, lessonCompletions]);

  const isLessonCompleted = (lessonID: number) => {
    return (
      lessonCompletions?.some(
        (completion) => completion.completed_lesson === lessonID,
      ) ?? false
    );
  };

  const getLessonQuizScore = (lessonID: number): number => {
    const completion = lessonCompletions?.find(
      (completion) => completion.completed_lesson === lessonID,
    );
    return completion?.quiz_score ?? 0;
  };

  return {
    courseCompletionPercentage,
    isLessonCompleted,
    getLessonQuizScore,
  };
}
