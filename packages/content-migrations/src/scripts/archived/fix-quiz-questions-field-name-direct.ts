/**
 * Fix Quiz Questions Field Name (Direct Database Access)
 *
 * This script fixes the field name in the quiz_questions_rels table:
 * - Updates the field name from 'quiz_id_id' to 'quiz_id' to match the field name in the QuizQuestions collection
 *
 * This version uses direct database access instead of the Payload client,
 * so it doesn't require the Payload server to be running.
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

/**
 * Fix Quiz Questions Field Name using direct database access
 */
async function fixQuizQuestionsFieldNameDirect() {
  // Get the database connection string from the environment variables
  const databaseUri = process.env.DATABASE_URI;
  if (!databaseUri) {
    throw new Error('DATABASE_URI environment variable is not set');
  }

  console.log(`Connecting to database: ${databaseUri}`);

  // Create a connection pool
  const pool = new Pool({
    connectionString: databaseUri,
  });

  try {
    // Test the connection
    const client = await pool.connect();
    try {
      console.log('Connected to database');

      // Start a transaction
      await client.query('BEGIN');

      try {
        // Step 1: Get the current count of entries with field = 'quiz_id_id'
        console.log('Checking current entries with field = quiz_id_id...');
        const beforeResult = await client.query(`
          SELECT COUNT(*) as count 
          FROM payload.quiz_questions_rels 
          WHERE field = 'quiz_id_id';
        `);

        // @ts-ignore - Accessing result by index
        const beforeCount = parseInt(beforeResult.rows[0]?.count || '0');
        console.log(`Found ${beforeCount} entries with field = quiz_id_id`);

        // Step 2: Update the field name from 'quiz_id_id' to 'quiz_id'
        console.log('Updating field name from quiz_id_id to quiz_id...');
        const updateResult = await client.query(`
          UPDATE payload.quiz_questions_rels
          SET field = 'quiz_id'
          WHERE field = 'quiz_id_id';
        `);

        console.log(`Updated ${updateResult.rowCount} entries`);

        // Step 3: Get the count of entries with field = 'quiz_id' after the update
        const afterResult = await client.query(`
          SELECT COUNT(*) as count 
          FROM payload.quiz_questions_rels 
          WHERE field = 'quiz_id';
        `);

        // @ts-ignore - Accessing result by index
        const afterCount = parseInt(afterResult.rows[0]?.count || '0');
        console.log(`Found ${afterCount} entries with field = quiz_id`);

        // Verify that all entries were updated
        if (beforeCount !== afterCount) {
          console.warn(
            `Warning: Before count (${beforeCount}) does not match after count (${afterCount})`,
          );
        } else {
          console.log('✅ All entries were updated successfully');
        }

        // Commit the transaction
        await client.query('COMMIT');
        console.log('Transaction committed successfully');

        // Return a summary of the fix
        return {
          beforeCount,
          afterCount,
          updated: updateResult.rowCount,
        };
      } catch (error) {
        // Rollback the transaction if an error occurs
        await client.query('ROLLBACK');
        console.error('Transaction rolled back due to error:', error);
        throw error;
      }
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

// Run the fix if this script is executed directly
if (
  import.meta.url ===
  import.meta.resolve('./fix-quiz-questions-field-name-direct.ts')
) {
  fixQuizQuestionsFieldNameDirect()
    .then((result) => {
      console.log('\nFix Summary:');
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fix failed:', error);
      process.exit(1);
    });
}

export { fixQuizQuestionsFieldNameDirect };
