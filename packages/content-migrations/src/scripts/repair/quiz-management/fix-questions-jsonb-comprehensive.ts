/**
 * Comprehensive Quiz Questions JSONB Fix
 *
 * This script resolves the JSONB format issue with quiz questions by:
 * 1. Ensuring the relationship table entries exist (fixing data consistency)
 * 2. Correctly formatting the questions JSONB array to match Payload CMS's exact requirements
 * 3. Using direct SQL for maximum reliability with explicit type handling
 *
 * The core issue is that Payload CMS requires a specific format for polymorphic relationships:
 * [
 *   {
 *     "id": "question-id",
 *     "relationTo": "quiz_questions",
 *     "value": {
 *       "id": "question-id"
 *     }
 *   }
 * ]
 *
 * But our data is currently stored as simple string IDs:
 * ["question-id-1", "question-id-2"]
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

/**
 * Main function to fix quiz questions JSONB format comprehensively
 */
export const fixQuestionsJSONBComprehensive = async (): Promise<boolean> => {
  try {
    // Get Payload client for database access
    const payload = await getPayloadClient();
    const db = payload.db.drizzle;

    logAction('Starting comprehensive JSONB format fix');

    // Begin transaction
    await db.execute(sql.raw`BEGIN;`);

    // 1. Get all quizzes with their questions in any format
    const quizzes = await db.execute(sql.raw`
      SELECT 
        id::text as quiz_id,
        title as quiz_title,
        questions::text as questions_json
      FROM 
        payload.course_quizzes
    `);

    // Track our success rate
    let successCount = 0;
    let relationshipsAdded = 0;

    // 2. Process each quiz
    for (const quiz of quizzes.rows) {
      logAction(`Processing quiz: ${quiz.quiz_title} (${quiz.quiz_id})`);

      // Extract questionIds from both JSONB and relationship table for this quiz
      let questionIds: string[] = [];
      let parsedQuestions: any[] = [];

      // Parse the JSONB questions array if it exists
      if (quiz.questions_json && quiz.questions_json !== 'null') {
        try {
          parsedQuestions = JSON.parse(quiz.questions_json);

          // Handle different formats - extract question IDs regardless of format
          if (Array.isArray(parsedQuestions)) {
            questionIds = parsedQuestions
              .map((q) => {
                // Handle different possible formats
                if (typeof q === 'string') {
                  // Simple string ID format
                  return q;
                } else if (q && typeof q === 'object') {
                  if (q.id && q.relationTo && q.value && q.value.id) {
                    // Already correct format {id, relationTo, value: {id}}
                    return q.value.id;
                  } else if (q.value && typeof q.value === 'string') {
                    // Format {relationTo, value: "id"}
                    return q.value;
                  } else if (q.id && typeof q.id === 'string') {
                    // Format with just {id}
                    return q.id;
                  }
                }
                return null;
              })
              .filter((id) => id !== null); // Remove nulls
          }
        } catch (e) {
          logWarning(
            `Failed to parse questions JSON for quiz "${quiz.quiz_title}": ${e.message}`,
          );
        }
      }

      // Get relationship records
      const relationshipRecords = await db.execute(sql.raw`
        SELECT 
          quiz_questions_id::text as question_id,
          "order"::int as order_num
        FROM 
          payload.course_quizzes_rels
        WHERE 
          _parent_id::text = ${quiz.quiz_id}
          AND field = 'questions'
        ORDER BY 
          COALESCE("order", 0) ASC
      `);

      // Extract question IDs from relationship table
      const relationshipIds = relationshipRecords.rows.map(
        (r) => r.question_id,
      );

      // Combine all unique question IDs, prioritizing relationship table
      const allQuestionIds = [...new Set([...relationshipIds, ...questionIds])];

      if (allQuestionIds.length === 0) {
        logWarning(
          `No questions found for quiz "${quiz.quiz_title}" - skipping`,
        );
        continue;
      }

      // Log the data we found
      logAction(
        `Found ${questionIds.length} questions in JSONB and ${relationshipIds.length} in relationship table`,
      );

      // 3. Ensure all questions in the JSONB array have corresponding relationship entries
      for (let i = 0; i < allQuestionIds.length; i++) {
        const questionId = allQuestionIds[i];

        // Check if relationship exists
        const relationshipExists = relationshipIds.includes(questionId);

        // If no relationship exists, create one
        if (!relationshipExists) {
          await db.execute(sql.raw`
            INSERT INTO payload.course_quizzes_rels
            (_parent_id, field, quiz_questions_id, "order")
            VALUES (${quiz.quiz_id}, 'questions', ${questionId}, ${i})
          `);
          relationshipsAdded++;
          logAction(
            `Created missing relationship for quiz ${quiz.quiz_title} and question ${questionId}`,
          );
        }
      }

      // 4. Create perfectly formatted questions array matching Payload CMS's expectations
      const formattedQuestions = allQuestionIds.map((questionId, index) => ({
        id: questionId,
        relationTo: 'quiz_questions',
        value: {
          id: questionId,
        },
      }));

      // Convert to JSON with exact formatting
      const questionsJson = JSON.stringify(formattedQuestions);

      // 5. Update the JSONB field with precise format and type casting
      await db.execute(sql.raw`
        UPDATE payload.course_quizzes
        SET questions = ${questionsJson}::jsonb
        WHERE id::text = ${quiz.quiz_id}
      `);

      // Verify the update worked
      const verification = await db.execute(sql.raw`
        SELECT 
          jsonb_typeof(questions) as type,
          jsonb_array_length(questions) as count,
          questions::text as json_string
        FROM 
          payload.course_quizzes
        WHERE 
          id::text = ${quiz.quiz_id}
      `);

      if (verification.rows.length > 0) {
        const result = verification.rows[0];
        logAction(`Verified update for "${quiz.quiz_title}":
          - Type: ${result.type}
          - Count: ${result.count}
          - First element format: ${
            result.json_string && result.json_string !== 'null'
              ? JSON.parse(result.json_string)[0]
                ? JSON.stringify(JSON.parse(result.json_string)[0]).substring(
                    0,
                    100,
                  )
                : 'No elements'
              : 'null'
          }
        `);
      }

      logSuccess(
        `Fixed quiz "${quiz.quiz_title}" with ${formattedQuestions.length} questions`,
      );
      successCount++;
    }

    // 6. Process problem quizzes specifically mentioned in the verification reports
    const problemQuizIds = [
      '42564568-76bb-4405-88a9-8e9fd0a9154a', // The Fundamental Elements of Design in Detail Quiz
      '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', // Performance Quiz
      'd5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0', // The Who Quiz
    ];

    for (const quizId of problemQuizIds) {
      await fixSpecificQuiz(db, quizId);
    }

    // Commit transaction
    await db.execute(sql.raw`COMMIT;`);

    // Final summary
    logSuccess(`
    Comprehensive fix summary:
    - Total quizzes processed: ${successCount}
    - Missing relationships added: ${relationshipsAdded}
    - Special problem quizzes specifically addressed: ${problemQuizIds.length}
    `);

    return true;
  } catch (error) {
    logError(`Comprehensive format fix failed: ${error.message}`);
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

/**
 * Helper function to fix specific problematic quizzes
 */
async function fixSpecificQuiz(db: any, quizId: string): Promise<void> {
  try {
    // Get quiz info
    const quizInfo = await db.execute(sql.raw`
      SELECT title FROM payload.course_quizzes WHERE id::text = ${quizId}
    `);

    const quizTitle =
      quizInfo.rows.length > 0 ? quizInfo.rows[0].title : `Quiz ${quizId}`;
    logAction(
      `Applying special fix for problematic quiz: ${quizTitle} (${quizId})`,
    );

    // Get all relationship records for this quiz
    const relationshipRecords = await db.execute(sql.raw`
      SELECT 
        quiz_questions_id::text as question_id,
        "order"::int as order_num
      FROM 
        payload.course_quizzes_rels
      WHERE 
        _parent_id::text = ${quizId}
        AND field = 'questions'
      ORDER BY 
        COALESCE("order", 0) ASC
    `);

    if (relationshipRecords.rows.length === 0) {
      logWarning(`No relationship records found for quiz ${quizTitle}`);
      return;
    }

    // Extract question IDs from relationship records
    const questionIds = relationshipRecords.rows.map((r) => r.question_id);

    // Format questions exactly as required by Payload CMS
    const formattedQuestions = questionIds.map((id) => ({
      id: String(id),
      relationTo: 'quiz_questions',
      value: {
        id: String(id),
      },
    }));

    // Convert to JSON string
    const questionsJson = JSON.stringify(formattedQuestions);

    // Update with direct SQL to ensure exact JSONB format
    await db.execute(sql.raw`
      UPDATE payload.course_quizzes
      SET questions = ${questionsJson}::jsonb
      WHERE id::text = ${quizId}
    `);

    logSuccess(
      `Applied special fix to "${quizTitle}" with ${questionIds.length} questions`,
    );
  } catch (error) {
    logError(`Failed to fix specific quiz ${quizId}: ${error.message}`);
  }
}

// Execute if this script is run directly
if (import.meta.url.endsWith(process.argv[1])) {
  fixQuestionsJSONBComprehensive()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export default fixQuestionsJSONBComprehensive;
