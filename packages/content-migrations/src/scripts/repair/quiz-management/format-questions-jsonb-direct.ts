/**
 * Direct Questions JSONB Format Fix
 *
 * This script takes a direct approach to fixing the quiz questions JSONB format.
 * It queries all quizzes and their related questions, then directly updates
 * the questions field with a properly formatted JSONB array.
 */
import { sql } from 'drizzle-orm';

import { getPayloadClient } from '../../../utils/payload.js';

// Log utilities
function logAction(message: string) {
  console.log(`🔄 ${message}`);
}

function logSuccess(message: string) {
  console.log(`✅ ${message}`);
}

function logError(message: string) {
  console.error(`❌ ${message}`);
}

function logWarning(message: string) {
  console.warn(`⚠️ ${message}`);
}

export const formatQuestionsJSONBDirect = async (): Promise<boolean> => {
  try {
    // Get Payload client for database access
    const payload = await getPayloadClient();
    const db = payload.db.drizzle;

    logAction('Starting direct JSONB format fix');

    // Begin transaction
    await db.execute(sql.raw`BEGIN;`);

    // Get all quizzes
    const quizzes = await db.execute(sql.raw`
      SELECT
        id::text as quiz_id,
        title as quiz_title
      FROM
        payload.course_quizzes
    `);

    // Track our success rate
    let successCount = 0;
    let errorCount = 0;

    // Process each quiz
    for (const quiz of quizzes.rows) {
      logAction(`Processing quiz: ${quiz.quiz_title} (${quiz.quiz_id})`);

      try {
        // Get the questions for this quiz from relationship table
        const questionsResult = await db.execute(sql.raw`
          SELECT
            quiz_questions_id::text as question_id,
            COALESCE("order", 0)::int as order_num
          FROM
            payload.course_quizzes_rels
          WHERE
            _parent_id::text = ${quiz.quiz_id}
            AND field = 'questions'
          ORDER BY
            COALESCE("order", 0)::int ASC
        `);

        if (questionsResult.rows.length === 0) {
          logWarning(`No questions found for quiz ${quiz.quiz_title}`);
          continue;
        }

        // Create properly formatted questions array
        const formattedQuestions = questionsResult.rows.map((row) => ({
          id: row.question_id,
          relationTo: 'quiz_questions',
          value: {
            id: row.question_id,
          },
        }));

        // Convert to JSON string
        const questionsJson = JSON.stringify(formattedQuestions);

        // Update with direct SQL approach, embedding parameters
        await db.execute(sql.raw`
          UPDATE payload.course_quizzes
          SET questions = '${sql.raw(questionsJson)}'::jsonb
          WHERE id::text = '${sql.raw(quiz.quiz_id)}'
        `);

        logSuccess(
          `Updated ${formattedQuestions.length} questions for quiz "${quiz.quiz_title}"`,
        );
        successCount++;
      } catch (err) {
        logError(`Failed to process quiz ${quiz.quiz_title}: ${err.message}`);
        errorCount++;
      }
    }

    // Also handle specific problematic quizzes
    logAction('Processing specific problematic quizzes');

    // The Fundamental Elements of Design in Detail Quiz
    const designQuizId = '42564568-76bb-4405-88a9-8e9fd0a9154a';
    await fixSpecificQuiz(
      db,
      designQuizId,
      'The Fundamental Elements of Design in Detail Quiz',
    );

    // The Performance Quiz
    const performanceQuizId = '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d';
    await fixSpecificQuiz(db, performanceQuizId, 'Performance Quiz');

    // The Who Quiz
    const whoQuizId = 'd5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0';
    await fixSpecificQuiz(db, whoQuizId, 'The Who Quiz');

    // Commit transaction
    await db.execute(sql.raw`COMMIT;`);

    logSuccess(
      `Direct format fix complete: processed ${successCount} quizzes successfully, ${errorCount} with errors`,
    );
    return true;
  } catch (error) {
    logError(`Format fix failed: ${error.message}`);
    console.error(error);

    // Rollback transaction
    try {
      const payload = await getPayloadClient();
      const db = payload.db.drizzle;
      await db.execute(sql.raw`ROLLBACK;`);
    } catch (rollbackError) {
      logError(`Error rolling back transaction: ${rollbackError.message}`);
    }

    return false;
  }
};

// Helper function to fix a specific quiz
async function fixSpecificQuiz(db: any, quizId: string, quizName?: string) {
  try {
    logAction(`Fixing specific quiz: ${quizName} (${quizId})`);

    // Get the questions for this quiz
    const questionRels = await db.execute(sql.raw`
      SELECT
        quiz_questions_id::text as question_id,
        COALESCE("order", 0)::int as order_num
      FROM
        payload.course_quizzes_rels
      WHERE
        _parent_id::text = ${quizId}
        AND field = 'questions'
      ORDER BY
        COALESCE("order", 0)::int ASC
    `);

    if (questionRels.rows.length === 0) {
      logWarning(`No questions found for specific quiz ${quizName}`);
      return;
    }

    // Create properly formatted questions array with explicit string typing
    const formattedQuestions = questionRels.rows.map((row) => ({
      id: String(row.question_id),
      relationTo: 'quiz_questions',
      value: {
        id: String(row.question_id),
      },
    }));

    // Convert to JSON string
    const questionsJson = JSON.stringify(formattedQuestions);

    // Update with direct SQL and embedded parameters
    await db.execute(sql.raw`
      UPDATE payload.course_quizzes
      SET questions = '${sql.raw(questionsJson)}'::jsonb
      WHERE id::text = '${sql.raw(quizId)}'
    `);

    // Verify update
    const verifyResult = await db.execute(sql.raw`
      SELECT
        jsonb_typeof(questions) as type,
        jsonb_array_length(questions) as count,
        questions::text as json_str
      FROM
        payload.course_quizzes
      WHERE
        id::text = ${quizId}
    `);

    if (verifyResult.rows.length > 0) {
      const result = verifyResult.rows[0];
      logAction(`Verified fix for ${quizName}:
        - Type: ${result.type}
        - Count: ${result.count}
        - Format: ${result.json_str.substring(0, 100)}...
      `);
    }

    logSuccess(
      `Fixed specific quiz: ${quizName} with ${formattedQuestions.length} questions`,
    );
  } catch (error) {
    logError(`Failed to fix specific quiz ${quizName}: ${error.message}`);
  }
}

// Execute if this script is run directly
if (import.meta.url.endsWith(process.argv[1])) {
  formatQuestionsJSONBDirect()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export default formatQuestionsJSONBDirect;
