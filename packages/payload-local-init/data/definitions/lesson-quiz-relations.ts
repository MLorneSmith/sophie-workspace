import { LessonQuizRelation } from './quiz-types.js';
import { QUIZZES } from './quizzes.js';

/**
 * Defines which lessons have which quizzes.
 * This is the single source of truth for lesson-quiz relationships.
 */
export const LESSON_QUIZ_RELATIONS: LessonQuizRelation[] = [
  {
    lessonSlug: 'our-process',
    quizSlug: 'our-process-quiz',
  },
  {
    lessonSlug: 'the-who',
    quizSlug: 'the-who-quiz',
  },
  {
    lessonSlug: 'the-why-introductions',
    quizSlug: 'introductions-quiz',
  },
  {
    lessonSlug: 'the-why-next-steps',
    quizSlug: 'why-next-steps-quiz',
  },
  {
    lessonSlug: 'idea-generation',
    quizSlug: 'idea-generation-quiz',
  },
  {
    lessonSlug: 'what-is-structure',
    quizSlug: 'structure-quiz',
  },
  {
    lessonSlug: 'using-stories',
    quizSlug: 'using-stories-quiz',
  },
  {
    lessonSlug: 'storyboards-film',
    quizSlug: 'storyboards-in-film-quiz',
  },
  {
    lessonSlug: 'storyboards-presentations',
    quizSlug: 'storyboards-in-presentations-quiz',
  },
  {
    lessonSlug: 'visual-perception',
    quizSlug: 'visual-perception-quiz',
  },
  {
    lessonSlug: 'fundamental-design-overview',
    quizSlug: 'overview-elements-of-design-quiz',
  },
  {
    lessonSlug: 'fundamental-design-detail',
    quizSlug: 'elements-of-design-detail-quiz',
  },
  {
    lessonSlug: 'gestalt-principles',
    quizSlug: 'gestalt-principles-quiz',
  },
  {
    lessonSlug: 'slide-composition',
    quizSlug: 'slide-composition-quiz',
  },
  {
    lessonSlug: 'tables-vs-graphs',
    quizSlug: 'tables-vs-graphs-quiz',
  },
  {
    lessonSlug: 'basic-graphs',
    quizSlug: 'basic-graphs-quiz',
  },
  {
    lessonSlug: 'fact-based-persuasion',
    quizSlug: 'fact-persuasion-quiz',
  },
  {
    lessonSlug: 'specialist-graphs',
    quizSlug: 'specialist-graphs-quiz',
  },
  {
    lessonSlug: 'preparation-practice',
    quizSlug: 'preparation-practice-quiz',
  },
  {
    lessonSlug: 'performance',
    quizSlug: 'performance-quiz',
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
