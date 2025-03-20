'use client';

import { useEffect } from 'react';

import { useCourseStore } from '../../../../../_stores/course-store';
import { handleError } from '../../../_utils/errorHandling';

interface DatabaseLesson {
  id: string | null;
  lessonID: number;
  course_id: string | null;
  title: string;
  slug: string;
  order: number;
  quiz: string | null;
  created_at: string;
  updated_at: string | null;
  survey: string | null;
}

interface Lesson {
  id: string;
  lessonID: number;
  course_id: string;
  title: string;
  slug: string;
  order: number;
  quiz: string | null;
}

// Type guard to ensure lesson data is valid
const isValidLesson = (
  lesson: DatabaseLesson | null | undefined,
): lesson is DatabaseLesson & { id: string; course_id: string } => {
  return (
    !!lesson &&
    typeof lesson.id === 'string' &&
    lesson.id !== '' &&
    typeof lesson.course_id === 'string' &&
    lesson.course_id !== ''
  );
};

// Convert database lesson to app lesson type with type safety
const convertToLesson = (data: DatabaseLesson | undefined): Lesson | null => {
  if (!data || !isValidLesson(data)) return null;

  return {
    id: data.id,
    lessonID: data.lessonID,
    course_id: data.course_id,
    title: data.title,
    slug: data.slug,
    order: data.order,
    quiz: data.quiz,
  };
};

export function useNextLesson(courseId: string, lessonOrder: number) {
  const { setCurrentLesson, updateProgress } = useCourseStore();

  useEffect(() => {
    if (!courseId) {
      handleError(
        new Error('CourseId is undefined'),
        'Course information is missing',
      );
      return;
    }

    const fetchNextLessonSlug = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}/lessons`);
        if (!response.ok) {
          throw new Error('Failed to fetch lessons');
        }

        const { lessons: allLessons } = await response.json();

        if (!allLessons || allLessons.length === 0) {
          throw new Error('No lessons found for the course');
        }

        // Find current lesson index
        const currentIndex = allLessons.findIndex(
          (lesson: DatabaseLesson) => lesson && lesson.order === lessonOrder,
        );

        // Update current lesson in store
        if (currentIndex > -1) {
          const currentLesson = convertToLesson(allLessons[currentIndex]);
          const nextLesson =
            currentIndex < allLessons.length - 1
              ? convertToLesson(allLessons[currentIndex + 1])
              : null;

          if (currentLesson) {
            setCurrentLesson(currentLesson);

            if (nextLesson) {
              updateProgress(courseId, {
                currentLessonId: currentLesson.id,
                nextLessonId: nextLesson.id,
                completedLessons: [],
              });
            }
          }
        }
      } catch (error) {
        handleError(error, 'Error fetching next lesson');
      }
    };

    fetchNextLessonSlug();
  }, [courseId, lessonOrder, setCurrentLesson, updateProgress]);
}
