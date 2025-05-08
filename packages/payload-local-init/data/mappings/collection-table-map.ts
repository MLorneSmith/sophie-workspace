/**
 * Maps collection types to their corresponding table names in the database
 * This ensures consistent access to database tables across the application
 */

// Mapping of collection types to table names
export const COLLECTION_TABLE_NAMES: Record<string, string> = {
  documentation: 'documentation',
  course_lessons: 'course_lessons',
  courses: 'courses',
  course_quizzes: 'course_quizzes',
  quiz_questions: 'quiz_questions',
  surveys: 'surveys',
  survey_questions: 'survey_questions',
  downloads: 'downloads',
};

/**
 * Get the table name for a given collection type
 * @param collectionType The collection type
 * @returns The table name or null if not found
 */
export function getTableNameForCollection(
  collectionType: string,
): string | null {
  return COLLECTION_TABLE_NAMES[collectionType] || null;
}
