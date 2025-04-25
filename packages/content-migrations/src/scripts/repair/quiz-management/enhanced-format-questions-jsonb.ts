/**
 * Enhanced Quiz Questions JSONB Formatter
 *
 * This script converts quiz questions arrays to the format required by Payload CMS:
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
 *
 * The script handles various error cases and ensures proper type casting.
 */
import chalk from 'chalk';

import { executeSQL } from '../../../utils/db/execute-sql.js';

/**
 * Format quiz questions arrays to match Payload CMS expected format
 */
export const formatQuestionsJSONBEnhanced = async (): Promise<boolean> => {
  try {
    console.log(
      chalk.cyan('Running enhanced JSONB formatting for quiz questions'),
    );

    // Begin transaction
    await executeSQL('BEGIN;');

    try {
      // 1. Get all quizzes with their current questions array
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

      // Track progress
      let successCount = 0;
      let formatErrors = 0;

      // 2. Process each quiz
      for (const quiz of quizzes.rows) {
        try {
          let questions;

          // Parse questions if needed
          try {
            questions =
              typeof quiz.questions === 'string'
                ? JSON.parse(quiz.questions)
                : quiz.questions;
          } catch (e) {
            console.error(
              chalk.red(
                `Quiz ${quiz.title} (${quiz.id}) has invalid JSON in questions: ${e.message}`,
              ),
            );
            formatErrors++;
            continue;
          }

          // Skip if not an array
          if (!Array.isArray(questions)) {
            console.error(
              chalk.red(
                `Quiz ${quiz.title} (${quiz.id}) has non-array questions: ${typeof questions}`,
              ),
            );
            formatErrors++;
            continue;
          }

          // Format questions into Payload-compatible structure
          const formattedQuestions = questions.map((questionId) => {
            // Extract ID from various possible formats
            const id =
              typeof questionId === 'object'
                ? questionId.id ||
                  (questionId.value && questionId.value.id) ||
                  questionId
                : questionId;

            // Create properly formatted object
            return {
              id,
              relationTo: 'quiz_questions',
              value: {
                id,
              },
            };
          });

          // Log before and after state for the first few questions
          const beforeSample =
            Array.isArray(questions) && questions.length > 0
              ? JSON.stringify(questions.slice(0, 2))
              : 'empty or invalid';

          const afterSample =
            formattedQuestions.length > 0
              ? JSON.stringify(formattedQuestions.slice(0, 2))
              : 'empty';

          console.log(
            chalk.blue(
              `Quiz ${quiz.title} (${quiz.id}): Before: ${beforeSample}`,
            ),
          );
          console.log(
            chalk.blue(
              `Quiz ${quiz.title} (${quiz.id}): After: ${afterSample}`,
            ),
          );

          // Update with properly formatted questions JSONB
          await executeSQL(
            `
            UPDATE 
              payload.course_quizzes
            SET 
              questions = $1::jsonb
            WHERE 
              id::text = $2
          `,
            [JSON.stringify(formattedQuestions), quiz.id],
          );

          successCount++;
        } catch (error) {
          console.error(
            chalk.red(
              `Error formatting quiz ${quiz.title} (${quiz.id}): ${error.message}`,
            ),
          );
          formatErrors++;
        }
      }

      // 3. Special handling for problematic quizzes mentioned in server logs

      // The Who Quiz (mentioned in server logs with 404 errors)
      const whoQuiz = await executeSQL(`
        SELECT id::text, title FROM payload.course_quizzes 
        WHERE id::text = 'd5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0'::text
        OR title LIKE '%Who%'
      `);

      if (whoQuiz.rows.length > 0) {
        console.log(
          chalk.cyan(
            `Special handling for "The Who" Quiz: ${whoQuiz.rows[0].title} (${whoQuiz.rows[0].id})`,
          ),
        );

        // Get questions from relationship table
        const questionRels = await executeSQL(
          `
          SELECT quiz_questions_id FROM payload.course_quizzes_rels 
          WHERE _parent_id::text = $1 AND field = 'questions'
        `,
          [whoQuiz.rows[0].id],
        );

        if (questionRels.rows.length > 0) {
          // Format questions in the required structure
          const formattedQuestions = questionRels.rows.map((rel) => ({
            id: rel.quiz_questions_id,
            relationTo: 'quiz_questions',
            value: {
              id: rel.quiz_questions_id,
            },
          }));

          // Direct update
          await executeSQL(
            `
            UPDATE payload.course_quizzes
            SET questions = $1::jsonb
            WHERE id::text = $2
          `,
            [JSON.stringify(formattedQuestions), whoQuiz.rows[0].id],
          );

          console.log(
            chalk.green(
              `Directly fixed "The Who" Quiz with ${formattedQuestions.length} questions`,
            ),
          );
        } else {
          console.warn(
            chalk.yellow(
              `No questions found in relationships for "The Who" Quiz`,
            ),
          );
        }
      }

      // Performance Quiz
      const performanceQuiz = await executeSQL(`
        SELECT id::text, title FROM payload.course_quizzes 
        WHERE title LIKE '%Performance%'
      `);

      if (performanceQuiz.rows.length > 0) {
        console.log(
          chalk.cyan(
            `Special handling for Performance Quiz: ${performanceQuiz.rows[0].title} (${performanceQuiz.rows[0].id})`,
          ),
        );

        // Get questions from relationship table
        const questionRels = await executeSQL(
          `
          SELECT quiz_questions_id FROM payload.course_quizzes_rels 
          WHERE _parent_id::text = $1 AND field = 'questions'
        `,
          [performanceQuiz.rows[0].id],
        );

        if (questionRels.rows.length > 0) {
          // Format questions in the required structure
          const formattedQuestions = questionRels.rows.map((rel) => ({
            id: rel.quiz_questions_id,
            relationTo: 'quiz_questions',
            value: {
              id: rel.quiz_questions_id,
            },
          }));

          // Direct update
          await executeSQL(
            `
            UPDATE payload.course_quizzes
            SET questions = $1::jsonb
            WHERE id::text = $2
          `,
            [JSON.stringify(formattedQuestions), performanceQuiz.rows[0].id],
          );

          console.log(
            chalk.green(
              `Directly fixed Performance Quiz with ${formattedQuestions.length} questions`,
            ),
          );
        } else {
          console.warn(
            chalk.yellow(
              `No questions found in relationships for Performance Quiz`,
            ),
          );
        }
      }

      // 4. General fix - Update all quizzes based on relationship data
      // This ensures all quizzes have properly formatted questions arrays that match relationship data
      await executeSQL(`
        WITH quiz_questions AS (
          SELECT 
            _parent_id::text as quiz_id,
            jsonb_agg(
              jsonb_build_object(
                'id', quiz_questions_id,
                'relationTo', 'quiz_questions',
                'value', jsonb_build_object('id', quiz_questions_id)
              )
            ) as formatted_questions
          FROM 
            payload.course_quizzes_rels
          WHERE 
            field = 'questions'
            AND quiz_questions_id IS NOT NULL
          GROUP BY 
            _parent_id
        )
        UPDATE payload.course_quizzes q
        SET questions = qr.formatted_questions
        FROM quiz_questions qr
        WHERE q.id::text = qr.quiz_id::text
      `);

      // Commit transaction
      await executeSQL('COMMIT;');

      console.log(
        chalk.green(
          `Successfully formatted ${successCount} quizzes with ${formatErrors} errors`,
        ),
      );

      // Final verification
      const verificationCount = await executeSQL(`
        SELECT COUNT(*) as count
        FROM payload.course_quizzes
        WHERE jsonb_typeof(questions) = 'array'
          AND jsonb_array_length(questions) > 0
          AND questions @> '[{"relationTo": "quiz_questions"}]'
      `);

      console.log(
        chalk.green(
          `Verified ${verificationCount.rows[0].count} quizzes with properly formatted question arrays`,
        ),
      );

      return formatErrors === 0;
    } catch (error) {
      // Rollback transaction on error
      await executeSQL('ROLLBACK;');
      throw error;
    }
  } catch (error) {
    console.error(
      chalk.red(`Failed to format questions JSONB: ${error.message}`),
    );
    return false;
  }
};

/**
 * Main function
 */
async function main() {
  try {
    const success = await formatQuestionsJSONBEnhanced();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error(
      chalk.red('Unhandled error formatting quiz questions:'),
      error,
    );
    process.exit(1);
  }
}

// Run the script when called directly
if (require.main === module) {
  main();
}

export default formatQuestionsJSONBEnhanced;
