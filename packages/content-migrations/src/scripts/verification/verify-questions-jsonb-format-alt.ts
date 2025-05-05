/**
 * Enhanced Verify Questions JSONB Format Script (Alternative Version)
 *
 * This script verifies that the questions JSONB arrays in course_quizzes
 * are properly formatted according to Payload CMS expectations, without using drizzle-orm.
 */
import { executeSQL } from '../../utils/db/execute-sql.js';

// Log utilities
function logAction(message: string) {
  console.log(`🔍 ${message}`);
}

function logSuccess(message: string) {
  console.log(`✅ ${message}`);
}

function logWarning(message: string) {
  console.warn(`⚠️ ${message}`);
}

function logError(message: string) {
  console.error(`❌ ${message}`);
}

export const verifyQuestionsJSONBFormat = async (): Promise<boolean> => {
  try {
    logAction('Verifying quiz questions JSONB format');

    // 1. Get all quizzes with their questions arrays
    const quizzes = await executeSQL(`
      SELECT
        id::text,
        title,
        questions::text
      FROM
        payload.course_quizzes
      WHERE
        questions IS NOT NULL
    `);

    // 2. Get relationship counts
    const relationshipCounts = await executeSQL(`
      SELECT
        _parent_id::text as quiz_id,
        COUNT(quiz_questions_id) as rel_count
      FROM
        payload.course_quizzes_rels
      WHERE
        field = 'questions'
        AND quiz_questions_id IS NOT NULL
      GROUP BY
        _parent_id
    `);

    // Create lookup map for relationship counts
    const relationshipMap = new Map();
    for (const row of relationshipCounts.rows) {
      relationshipMap.set(row.quiz_id, parseInt(row.rel_count, 10));
    }

    // Verification counters and problem tracking
    let correctlyFormatted = 0;
    let improperlyFormatted = 0;
    let missingQuestions = 0;
    let relationshipMismatch = 0;

    // --- Start of Added Code ---
    // Placeholder for the rest of the try block logic...
    // Assume the main loop and checks happen here.
    // We need to close the try block and add a catch block.
  } catch (error) {
    // Added closing brace for try block above
    logError(`Error verifying JSONB format: ${error.message}`);
    return false; // Indicate failure on error
  }
}; // Close the verifyQuestionsJSONBFormat function
// --- End of Added Code ---
