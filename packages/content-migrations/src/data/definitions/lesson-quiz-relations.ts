import { LessonQuizRelation } from './quiz-types.js';
import { QUIZZES } from './quizzes.js';

/**
 * Defines which lessons have which quizzes.
 * This is the single source of truth for lesson-quiz relationships.
 */
export const LESSON_QUIZ_RELATIONS: LessonQuizRelation[] = [
  {
    lessonSlug: 'basic-graphs',
    quizSlug: 'basic-graphs-quiz',
  },
  {
    lessonSlug: 'elements-of-design-detail',
    quizSlug: 'elements-of-design-detail-quiz',
  },
  {
    lessonSlug: 'fact-persuasion',
    quizSlug: 'fact-persuasion-quiz',
  },
  {
    lessonSlug: 'gestalt-principles',
    quizSlug: 'gestalt-principles-quiz',
  },
  // Add all other lesson-quiz relationships
];

// Validation to ensure all referenced quizzes exist
export function validateLessonQuizRelations(): boolean {
  return LESSON_QUIZ_RELATIONS.every(
    (relation) => !!QUIZZES[relation.quizSlug],
  );
}

// Helper to get the quiz for a lesson
export function getQuizForLesson(lessonSlug: string): string | null {
  const relation = LESSON_QUIZ_RELATIONS.find(
    (r) => r.lessonSlug === lessonSlug,
  );
  return relation ? relation.quizSlug : null;
}

// Helper to get quiz ID for a lesson
export function getQuizIdForLesson(lessonSlug: string): string | null {
  const quizSlug = getQuizForLesson(lessonSlug);
  if (!quizSlug) return null;

  const quiz = QUIZZES[quizSlug];
  return quiz ? quiz.id : null;
}
