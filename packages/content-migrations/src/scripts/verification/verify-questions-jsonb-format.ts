/**
 * Enhanced Verify Questions JSONB Format Script
 *
 * This script verifies that the questions JSONB arrays in course_quizzes
 * are properly formatted according to Payload CMS expectations.
 *
 * Payload CMS requires a specific format for relationship fields:
 * {
 *   "questions": [
 *     {
 *       "id": "unique-entry-id",
 *       "relationTo": "quiz_questions",
 *       "value": {
 *         "id": "related-document-id"
 *       }
 *     }
 *   ]
 * }
 */
import { sql } from 'drizzle-orm';

import { getPayloadClient } from '../../utils/payload.js';

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
    // Get Payload client for proper database access with type safety
    const payload = await getPayloadClient();
    const db = payload.db.drizzle;

    logAction('Verifying quiz questions JSONB format');

    // 1. Get all quizzes with explicit type casting for safety
    const quizzes = await db.execute(sql.raw`
      SELECT 
        id::text, 
        title, 
        questions::text
      FROM 
        payload.course_quizzes
      WHERE 
        questions IS NOT NULL
    `);

    // 2. Get relationship counts with proper type casting
    const relationshipCounts = await db.execute(sql.raw`
      SELECT 
        _parent_id::text as quiz_id, 
        COUNT(quiz_questions_id) as rel_count
      FROM 
        payload.course_quizzes_rels
      WHERE 
        field = 'questions'
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
    const problemQuizzes = [];

    // Process each quiz
    for (const quiz of quizzes.rows) {
      try {
        // Parse questions JSONB safely
        let questions;
        try {
          questions =
            typeof quiz.questions === 'string'
              ? JSON.parse(quiz.questions)
              : quiz.questions;
        } catch (e) {
          logError(
            `Invalid JSON in questions for quiz "${quiz.title}" (${quiz.id}): ${e.message}`,
          );
          improperlyFormatted++;
          problemQuizzes.push({
            id: quiz.id,
            title: quiz.title,
            error: 'Invalid JSON',
            raw: quiz.questions.substring(0, 100) + '...', // Truncate for readability
          });
          continue;
        }

        // Validate array structure
        if (!Array.isArray(questions)) {
          logWarning(
            `Questions is not an array for quiz "${quiz.title}" (${quiz.id}), type: ${typeof questions}`,
          );
          improperlyFormatted++;
          problemQuizzes.push({
            id: quiz.id,
            title: quiz.title,
            error: 'Not an array',
            actual: typeof questions,
          });
          continue;
        }

        // Check for empty questions array
        if (questions.length === 0) {
          logWarning(`No questions for quiz "${quiz.title}" (${quiz.id})`);
          missingQuestions++;
          problemQuizzes.push({
            id: quiz.id,
            title: quiz.title,
            error: 'Empty questions array',
          });
          continue;
        }

        // Check format of each question
        const formatIssues = [];
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          if (
            !q ||
            typeof q !== 'object' ||
            !q.id ||
            !q.relationTo ||
            !q.value ||
            !q.value.id
          ) {
            formatIssues.push({
              index: i,
              actual: JSON.stringify(q),
              expected:
                '{ "id": "...", "relationTo": "quiz_questions", "value": { "id": "..." } }',
            });
          }
        }

        // Check relationship consistency
        const relationshipCount = relationshipMap.get(quiz.id) || 0;
        const arrayCount = questions.length;
        const hasRelationshipMatch = relationshipCount === arrayCount;

        // Determine if everything is correct
        if (formatIssues.length === 0 && hasRelationshipMatch) {
          correctlyFormatted++;
          // Log a sample of properly formatted quiz for reference
          if (correctlyFormatted === 1) {
            logAction(
              `Correctly formatted quiz example - "${quiz.title}": ${JSON.stringify(questions[0])}`,
            );
          }
          continue;
        }

        // Handle identified issues
        if (formatIssues.length > 0) {
          logWarning(
            `Quiz "${quiz.title}" (${quiz.id}) has ${formatIssues.length} improperly formatted questions`,
          );
          logAction(`First problematic question: ${formatIssues[0].actual}`);
          improperlyFormatted++;
          problemQuizzes.push({
            id: quiz.id,
            title: quiz.title,
            formatIssues: formatIssues.slice(0, 3), // Limit to first 3 issues for readability
          });
        } else if (!hasRelationshipMatch) {
          logWarning(
            `Quiz "${quiz.title}" (${quiz.id}) has ${arrayCount} questions in array but ${relationshipCount} in relationship table`,
          );
          relationshipMismatch++;
          problemQuizzes.push({
            id: quiz.id,
            title: quiz.title,
            error: 'Relationship mismatch',
            arrayCount,
            relCount: relationshipCount,
          });
        }
      } catch (error) {
        logError(
          `Error processing quiz "${quiz.title}" (${quiz.id}): ${error.message}`,
        );
        improperlyFormatted++;
        problemQuizzes.push({
          id: quiz.id,
          title: quiz.title,
          error: `Processing error: ${error.message}`,
        });
      }
    }

    // Special check for Performance Quiz (mentioned in logs as problematic)
    const performanceQuizzes = await db.execute(sql.raw`
      SELECT id::text, title, questions::text 
      FROM payload.course_quizzes 
      WHERE title LIKE '%Performance%'
    `);

    if (performanceQuizzes.rows.length > 0) {
      const performanceQuiz = performanceQuizzes.rows[0];
      logAction(
        `Found Performance Quiz: ${performanceQuiz.title} (${performanceQuiz.id})`,
      );

      try {
        // Get relationship count - Use string concatenation to avoid parameter issues
        const performanceRelsQuery = `
          SELECT COUNT(*) as count 
          FROM payload.course_quizzes_rels 
          WHERE _parent_id::text = '${performanceQuiz.id}' AND field = 'questions'
        `;
        const performanceRels = await db.execute(
          sql.raw([performanceRelsQuery]),
        );

        const relCount = parseInt(performanceRels.rows[0].count, 10);

        // Parse and analyze questions array
        let questions;
        try {
          questions =
            typeof performanceQuiz.questions === 'string'
              ? JSON.parse(performanceQuiz.questions)
              : performanceQuiz.questions;
        } catch (e) {
          questions = [];
          logError(`Error parsing Performance Quiz questions: ${e.message}`);
        }

        const arrayCount = Array.isArray(questions) ? questions.length : 0;

        logAction(`Performance Quiz detailed analysis:
          - Questions array length: ${arrayCount}
          - Relationship count: ${relCount}
          - First question format: ${arrayCount > 0 ? JSON.stringify(questions[0]) : 'N/A'}
        `);

        // Get the actual questions from relationship table for comparison - Use string concatenation for params
        const questionRelsQuery = `
          SELECT quiz_questions_id 
          FROM payload.course_quizzes_rels 
          WHERE _parent_id::text = '${performanceQuiz.id}' 
          AND field = 'questions'
        `;
        const questionRels = await db.execute(sql.raw([questionRelsQuery]));

        if (questionRels.rows.length > 0) {
          logAction(
            `Questions from relationship table: ${JSON.stringify(questionRels.rows.map((r) => r.quiz_questions_id).slice(0, 3))}...`,
          );
        }
      } catch (e) {
        logError(`Error analyzing Performance Quiz: ${e.message}`);
      }
    } else {
      logWarning(
        'Performance Quiz not found! This is concerning as it should exist.',
      );
    }

    // Check The Who Quiz specifically (mentioned in server logs)
    const whoQuiz = await db.execute(sql.raw`
      SELECT id::text, title, questions::text 
      FROM payload.course_quizzes 
      WHERE id::text = 'd5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0'::text 
      OR title LIKE '%Who%'
    `);

    if (whoQuiz.rows.length > 0) {
      logAction(
        `Found "The Who" Quiz: ${whoQuiz.rows[0].title} (${whoQuiz.rows[0].id})`,
      );

      // Check if it has questions in relationship table - Use string concatenation to avoid parameter issues
      const whoQuizRelsQuery = `
        SELECT COUNT(*) as count 
        FROM payload.course_quizzes_rels 
        WHERE _parent_id::text = '${whoQuiz.rows[0].id}' 
        AND field = 'questions'
      `;
      const whoQuizRels = await db.execute(sql.raw([whoQuizRelsQuery]));

      logAction(
        `"The Who" Quiz has ${whoQuizRels.rows[0].count} questions in relationship table`,
      );
    } else {
      logWarning(
        'The Who Quiz not found despite being referenced in server logs!',
      );
    }

    // Final report
    if (
      improperlyFormatted === 0 &&
      missingQuestions === 0 &&
      relationshipMismatch === 0
    ) {
      logSuccess(
        `All ${correctlyFormatted} quizzes have properly formatted questions arrays`,
      );
      return true;
    } else {
      logWarning(`
Verification results:
- Correctly formatted: ${correctlyFormatted}
- Improperly formatted: ${improperlyFormatted}
- Empty questions: ${missingQuestions}
- Relationship mismatches: ${relationshipMismatch}
        
Problem quizzes:
${JSON.stringify(problemQuizzes, null, 2)}
      `);
      return false;
    }
  } catch (error) {
    logError(`Verification failed: ${error.message}`);
    return false;
  }
};

// Execute if this script is run directly
// Using import.meta.url check for ES modules
const isMainModule =
  import.meta.url.endsWith('verify-questions-jsonb-format.ts') ||
  import.meta.url.endsWith('verify-questions-jsonb-format.js');

if (isMainModule) {
  verifyQuestionsJSONBFormat()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export default verifyQuestionsJSONBFormat;
