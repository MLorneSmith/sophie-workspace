/**
 * Fix Quiz JSONB Synchronization
 *
 * This script synchronizes the payload.course_quizzes.questions JSONB field
 * and the payload.course_quizzes_rels table based on the single source of truth
 * defined in ../../data/quizzes-quiz-qestions-truth.ts.
 *
 * It ensures both representations of the quiz-question relationship are
 * consistent and correctly formatted for the Payload API.
 */
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';

import { QUIZZES } from '../../../data/quizzes-quiz-qestions-truth.js';
import { getClient } from '../../../utils/db/client.js';

// Source of Truth

async function fixQuizJsonbSync() {
  console.log(
    chalk.cyan('\n=== Starting Quiz JSONB Synchronization Fix ===\n'),
  );
  const client = await getClient();
  let quizzesProcessed = 0;
  let totalRelationshipsWritten = 0;

  try {
    // Start transaction
    await client.query('BEGIN');
    console.log(chalk.gray('Transaction started.'));

    const quizDefinitions = Object.values(QUIZZES);
    console.log(
      `Processing ${quizDefinitions.length} quizzes from source of truth...`,
    );

    for (const quizDef of quizDefinitions) {
      const quizId = quizDef.id;
      const quizTitle = quizDef.title;
      // Get the definitive list of question IDs from the source of truth
      const definitiveQuestionIds = quizDef.questions.map((q) => q.id);

      console.log(
        `Processing quiz: "${quizTitle}" (${quizId}) - Expected questions: ${definitiveQuestionIds.length}`,
      );

      // --- Step 1: Correct payload.course_quizzes_rels ---
      // Delete existing relationship entries for this quiz
      const deleteResult = await client.query(
        `
        DELETE FROM payload.course_quizzes_rels 
        WHERE _parent_id = $1 AND field = 'questions'
      `,
        [quizId],
      );
      if (deleteResult.rowCount > 0) {
        console.log(
          chalk.gray(
            `  - Deleted ${deleteResult.rowCount} existing relationship rows.`,
          ),
        );
      }

      // Insert correct relationship entries based on the source of truth
      let insertedRels = 0;
      // Use a standard for loop to get index for path and allow 'continue'
      for (let index = 0; index < definitiveQuestionIds.length; index++) {
        const questionId = definitiveQuestionIds[index];
        // Basic validation: Ensure questionId looks like a UUID
        if (!/^[0-9a-fA-F-]{36}$/.test(questionId)) {
          console.warn(
            chalk.yellow(
              `  - Skipping invalid question ID format "${questionId}" for quiz "${quizTitle}"`,
            ),
          );
          continue;
        }

        try {
          await client.query(
            `
            INSERT INTO payload.course_quizzes_rels 
            (id, _parent_id, field, path, quiz_questions_id, "order", created_at, updated_at) -- Added "order" column
            VALUES (
              gen_random_uuid(), 
              $1, -- _parent_id (quizId)
              $2, -- field ('questions')
              $3, -- path (e.g., 'questions.0', 'questions.1')
              $4, -- quiz_questions_id (questionId)
              $5, -- order (index)
              NOW(),
              NOW()
            )
            ON CONFLICT (id) DO NOTHING; 
          `,
            // Parameters match the placeholders $1, $2, $3, $4, $5
            [quizId, 'questions', `questions.${index}`, questionId, index], // Pass index for path and order
          );
          insertedRels++;
        } catch (insertError) {
          console.error(
            chalk.red(
              `  - Error inserting relationship for question ${questionId}:`,
            ),
            insertError.message,
          );
          // Decide whether to throw or continue based on error type if needed
        }
      } // End for loop
      totalRelationshipsWritten += insertedRels; // Note: This might be slightly off if inserts fail, but good enough for logging
      console.log(
        chalk.gray(`  - Inserted ${insertedRels} relationship rows.`),
      );

      // --- Step 2: Correct payload.course_quizzes.questions JSONB field ---
      // Construct the correctly formatted JSONB array string
      const correctJsonbArray = definitiveQuestionIds.map((questionId) => ({
        id: uuidv4(), // Generate a unique ID for the array entry, required by Payload
        relationTo: 'quiz_questions',
        value: { id: questionId }, // The actual related question ID
      }));

      const jsonbString = JSON.stringify(correctJsonbArray);

      // Update the questions field in the course_quizzes table
      const updateResult = await client.query(
        `
        UPDATE payload.course_quizzes 
        SET questions = $1::jsonb 
        WHERE id = $2
      `,
        [jsonbString, quizId],
      );

      if (updateResult.rowCount === 1) {
        console.log(
          chalk.gray(
            `  - Updated questions JSONB field with ${correctJsonbArray.length} entries.`,
          ),
        );
      } else {
        console.warn(
          chalk.yellow(
            `  - Warning: Quiz ID ${quizId} not found in course_quizzes table for JSONB update.`,
          ),
        );
      }
      quizzesProcessed++;
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log(chalk.green('\nTransaction committed successfully.'));
    console.log(
      chalk.green(`✅ Successfully processed ${quizzesProcessed} quizzes.`),
    );
    console.log(
      chalk.green(
        `✅ Total relationship rows written: ${totalRelationshipsWritten}.`,
      ),
    );
    console.log(
      chalk.cyan('\n=== Quiz JSONB Synchronization Fix Completed ===\n'),
    );
    return true;
  } catch (error) {
    // Rollback on error
    console.error(
      chalk.red('\nError during quiz JSONB synchronization:'),
      error,
    );
    try {
      await client.query('ROLLBACK');
      console.log(chalk.yellow('Transaction rolled back.'));
    } catch (rollbackError) {
      console.error(
        chalk.red('Failed to rollback transaction:'),
        rollbackError,
      );
    }
    return false;
  } finally {
    await client.end();
    console.log(chalk.gray('Database connection closed.'));
  }
}

// Execute and return result code for script integration
fixQuizJsonbSync()
  .then((success) => process.exit(success ? 0 : 1))
  .catch((err) => {
    console.error(chalk.red('Unhandled error:'), err);
    process.exit(1);
  });

export default fixQuizJsonbSync;
