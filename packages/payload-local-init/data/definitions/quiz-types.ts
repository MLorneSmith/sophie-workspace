/**
 * Type definitions for the quiz system
 */

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string; // Corrected type to string
}

export interface QuizDefinition {
  id: string; // Fixed UUID
  slug: string; // Slug for URL and file references
  title: string; // Human-readable title
  description: string; // Description of the quiz
  passingScore: number; // Score needed to pass (percentage)
  questions: QuizQuestion[]; // All questions for this quiz
}

export interface LessonQuizRelation {
  lessonSlug: string;
  quizSlug: string; // References a QuizDefinition's slug
}

// Schema validation functions
export function validateQuizDefinition(quiz: QuizDefinition): boolean {
  // Basic validation
  if (!quiz.id || !quiz.slug || !quiz.title) return false;

  // UUID validation
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(quiz.id)) return false;

  // Ensure all questions have valid IDs and options
  return quiz.questions.every(
    (
      q: QuizQuestion, // Add explicit type QuizQuestion for parameter q
    ) =>
      !!q.id &&
      !!q.text &&
      Array.isArray(q.options) &&
      q.options.length > 0 &&
      q.correctOptionIndex >= 0 &&
      q.correctOptionIndex < q.options.length,
  );
}
