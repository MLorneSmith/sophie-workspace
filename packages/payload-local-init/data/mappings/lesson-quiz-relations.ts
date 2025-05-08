import { QUIZZES } from '../quiz-definitions';

/**
 * Defines the relationship between course lessons and their associated quizzes.
 * Key: Lesson UUID
 * Value: Quiz UUID
 */
export const LESSON_QUIZ_RELATIONS: Record<string, string | null> = {
  'b1e873c4-6ee3-423c-8ac0-23d5bd5ad4c1':
    QUIZZES['our-process-quiz']?.id || null, // Our Process
  '82b4c8fb-49f9-4744-9abe-66bf2bbdbbfd': QUIZZES['the-who-quiz']?.id || null, // The Who
  '4197bbda-80a4-4cf6-b09e-668be2416115':
    QUIZZES['introductions-quiz']?.id || null, // The Why: Introductions
  'cf729d29-8734-4805-aded-c2d5ca5c463e':
    QUIZZES['why-next-steps-quiz']?.id || null, // The Why: Next Steps
  '795e647c-076d-4752-8f5e-9e22f9a1e5c7':
    QUIZZES['idea-generation-quiz']?.id || null, // Idea Generation
  'ff79145d-c2f7-468f-bf11-38ef3cc3783b': QUIZZES['structure-quiz']?.id || null, // What is Structure?
  'a6ef3743-5ee2-457e-a054-fc10c53aa842':
    QUIZZES['using-stories-quiz']?.id || null, // Using Stories
  '41c70129-a61e-4c28-9984-5d9d99eec970':
    QUIZZES['storyboards-film-quiz']?.id || null, // Storyboards in Film
  'fe87137c-66c5-44ac-83d7-0868f078af92':
    QUIZZES['storyboards-presentations-quiz']?.id || null, // Storyboards in Presentations
  '3a720817-1aae-4080-8f50-f81179d3dbd0':
    QUIZZES['visual-perception-quiz']?.id || null, // Visual Perception and Communication
  'ca6b3c4b-9278-43ca-8748-90e80ece8b3a':
    QUIZZES['overview-elements-of-design-quiz']?.id || null, // Overview of the Fundamental Elements of Design
  '199e1eb2-f307-4e25-8e20-434ce7331d06':
    QUIZZES['elements-of-design-detail-quiz']?.id || null, // The Fundamental Elements of Design in Detail
  'a41f704e-d373-421c-87ff-21fd58238c2d':
    QUIZZES['gestalt-principles-quiz']?.id || null, // Gestalt Principles of Visual Perception
  'e3a5f099-8e0c-4ec9-82ca-c34d5b2e055d':
    QUIZZES['slide-composition-quiz']?.id || null, // Slide Composition
  '72a33bdf-ffab-45e2-8d2c-08bd4d3b7458':
    QUIZZES['tables-vs-graphs-quiz']?.id || null, // Tables vs. Graphs
  '890f5ef0-f9e6-4c61-9c1b-1caeb9fcae0f':
    QUIZZES['basic-graphs-quiz']?.id || null, // Standard Graphs
  'e2579a77-933b-40fc-ace4-b091d3651297':
    QUIZZES['fact-persuasion-quiz']?.id || null, // Overview of Fact-based Persuasion
  '326996b2-e276-490e-80d7-aa84c048b79a':
    QUIZZES['specialist-graphs-quiz']?.id || null, // Specialist Graphs
  '7ac361db-1032-4d71-b7f8-6502747b1313':
    QUIZZES['preparation-practice-quiz']?.id || null, // Preparation and Practice
  '27c967c9-2d16-45c0-a6cd-7dc70e4e9f78':
    QUIZZES['performance-quiz']?.id || null, // Performance
};

// Helper to get the quiz ID for a lesson slug
export function getQuizIdForLesson(lessonSlug: string): string | null {
  // This helper now needs to look up the lesson UUID first.
  // Assuming lesson definitions will be available elsewhere to map slug to UUID.
  // For now, this function is deprecated in favor of looking up by lesson UUID directly.
  console.warn(
    'getQuizIdForLesson by slug is deprecated. Use lesson UUIDs directly.',
  );
  return null;
}

// Validation to ensure all referenced quizzes exist
export function validateLessonQuizRelations(): boolean {
  for (const quizId of Object.values(LESSON_QUIZ_RELATIONS)) {
    if (
      quizId !== null &&
      !Object.values(QUIZZES).some((quiz) => quiz.id === quizId)
    ) {
      console.error(
        `Validation Error: Quiz ID ${quizId} referenced in LESSON_QUIZ_RELATIONS does not exist in QUIZZES.`,
      );
      return false;
    }
  }
  return true;
}
