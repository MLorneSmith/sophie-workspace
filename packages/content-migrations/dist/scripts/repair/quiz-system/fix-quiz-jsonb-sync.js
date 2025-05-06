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
import { QUIZZES } from '../../../data/quizzes-quiz-questions-truth.js';
import { getClient } from '../../../utils/db/client.js';
// ADDED DEBUG LOG HERE
console.log(chalk.blue('DEBUG: Imported QUIZZES type:'), typeof QUIZZES);
console.log(chalk.blue('DEBUG: Imported QUIZZES keys:'), QUIZZES ? Object.keys(QUIZZES).length : 'undefined/null');
// Source of Truth
async function fixQuizJsonbSync() {
    console.log(chalk.cyan('\n=== Starting Quiz JSONB Synchronization Fix ===\n'));
    const client = await getClient();
    let quizzesProcessed = 0;
    let totalRelationshipsWritten = 0;
    try {
        // Start transaction
        await client.query('BEGIN');
        console.log(chalk.gray('Transaction started.'));
        const quizDefinitions = Object.values(QUIZZES);
        console.log(`Processing ${quizDefinitions.length} quizzes from source of truth...`);
        console.log(chalk.yellow('DEBUG: About to start processing loop...')); // ADDED LOG
        for (const quizDef of quizDefinitions) {
            const quizId = quizDef.id;
            const quizTitle = quizDef.title;
            // Get the definitive list of question IDs from the source of truth
            // DETAILED LOGGING ADDED HERE
            console.log(chalk.magenta(`  DEBUG: Full quizDef object:`), JSON.stringify(quizDef, null, 2));
            const definitiveQuestionIds = quizDef.questions.map((q) => q.id);
            console.log(chalk.magenta(`  DEBUG: Extracted definitiveQuestionIds:`), definitiveQuestionIds);
            console.log(`Processing quiz: "${quizTitle}" (${quizId}) - Expected questions: ${definitiveQuestionIds.length}`);
            // --- Step 1: (REMOVED) No longer need to manage _rels table for this test ---
            // **Attempt 1: Delete specifically invalid rows first (where related ID is NULL)**
            /* try {
              const deleteInvalidResult = await client.query(
                `
                DELETE FROM payload.course_quizzes_rels
                WHERE _parent_id = $1 AND quiz_questions_id IS NULL
              `,
                [quizId],
              );
              if (deleteInvalidResult.rowCount > 0) {
                console.log(
                  chalk.yellow(
                    `  - Deleted ${deleteInvalidResult.rowCount} invalid (NULL quiz_questions_id) relationship rows.`,
                  ),
                );
              }
            } catch (deleteInvalidError) {
              console.error(
                chalk.red(`  - Error deleting invalid rows for quiz ${quizId}:`),
                deleteInvalidError.message,
              );
              // Continue even if this fails, the next delete might still work
            } */
            // **Attempt 2: Delete ALL remaining relationship entries for this quiz ID to ensure a clean slate**
            /* const deleteResult = await client.query(
              `
              DELETE FROM payload.course_quizzes_rels
              WHERE _parent_id = $1
            `,
              [quizId],
            );
            if (deleteResult.rowCount > 0) {
              console.log(
                chalk.gray(
                  `  - Deleted ${deleteResult.rowCount} existing relationship rows.`,
                ),
              );
            } */
            // Insert correct relationship entries based on the source of truth
            // let insertedRels = 0; // No longer inserting into _rels
            // Use a standard for loop to get index for path and allow 'continue'
            /* for (let index = 0; index < definitiveQuestionIds.length; index++) {
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
                // insertedRels++;
              } catch (insertError) {
                console.error(
                  chalk.red(
                    `  - Error inserting relationship for question ${questionId}:`,
                  ),
                  insertError.message,
                );
                // Decide whether to throw or continue based on error type if needed
              }
            } */ // End for loop
            // totalRelationshipsWritten += insertedRels; // No longer tracking _rels inserts
            // console.log(
            //   chalk.gray(`  - Inserted ${insertedRels} relationship rows.`),
            // );
            // --- Step 2: Correct payload.course_quizzes.questions JSONB field ---
            // Construct the correctly formatted JSONB array string for the simple array field
            const correctJsonbArray = definitiveQuestionIds.map((questionId) => ({
                questionId: questionId, // Store just the ID
                id: uuidv4(), // Array fields still need a unique block ID
            }));
            const jsonbString = JSON.stringify(correctJsonbArray);
            // Update the questions field in the course_quizzes table
            const updateResult = await client.query(`
        UPDATE payload.course_quizzes 
        SET questions = $1::jsonb 
        WHERE id = $2
      `, [jsonbString, quizId]);
            if (updateResult.rowCount === 1) {
                console.log(chalk.gray(`  - Updated questions JSONB field with ${correctJsonbArray.length} entries.`));
            }
            else {
                console.warn(chalk.yellow(`  - Warning: Quiz ID ${quizId} not found in course_quizzes table for JSONB update.`));
            }
            quizzesProcessed++;
        }
        // Commit transaction
        await client.query('COMMIT');
        console.log(chalk.green('\nTransaction committed successfully.'));
        console.log(chalk.green(`✅ Successfully processed ${quizzesProcessed} quizzes.`));
        console.log(chalk.green(`✅ Total relationship rows written: ${totalRelationshipsWritten}.`));
        console.log(chalk.cyan('\n=== Quiz JSONB Synchronization Fix Completed ===\n'));
        return true;
    }
    catch (error) {
        // Rollback on error
        // ADDED DETAILED LOGGING HERE
        console.error(chalk.bgRed.white.bold('\n--- MAIN CATCH BLOCK ERROR ---'));
        console.error(chalk.red('\nError during quiz JSONB synchronization:'), error);
        console.error(chalk.red('Error Name:'), error.name);
        console.error(chalk.red('Error Message:'), error.message);
        if (error.stack) {
            console.error(chalk.red('Error Stack:'), error.stack);
        }
        console.error(chalk.bgRed.white.bold('--- END MAIN CATCH BLOCK ERROR ---'));
        try {
            await client.query('ROLLBACK');
            console.log(chalk.yellow('Transaction rolled back.'));
        }
        catch (rollbackError) {
            console.error(chalk.red('Failed to rollback transaction:'), rollbackError);
        }
        return false;
    }
    finally {
        await client.end();
        console.log(chalk.gray('Database connection closed.'));
    }
}
// Execute and return result code for script integration
fixQuizJsonbSync()
    .then((success) => {
    console.log(chalk.green(`Script finished with success status: ${success}`));
    process.exit(success ? 0 : 1);
})
    .catch((err) => {
    // ADDED DETAILED LOGGING HERE
    console.error(chalk.bgMagenta.white.bold('\n--- FINAL CATCH BLOCK ERROR ---'));
    console.error(chalk.magenta('Error caught by final .catch():'), err);
    console.error(chalk.magenta('Error Name:'), err?.name);
    console.error(chalk.magenta('Error Message:'), err?.message);
    if (err?.stack) {
        console.error(chalk.magenta('Error Stack:'), err.stack);
    }
    console.error(chalk.bgMagenta.white.bold('--- END FINAL CATCH BLOCK ERROR ---'));
    process.exit(1);
});
export default fixQuizJsonbSync;
