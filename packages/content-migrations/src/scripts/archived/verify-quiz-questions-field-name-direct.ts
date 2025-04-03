/**
 * Verify Quiz Questions Field Name (Direct Database Access)
 *
 * This script verifies that:
 * 1. The field name in the quiz_questions_rels table is 'quiz_id' (not 'quiz_id_id')
 * 2. The relationships in the quiz_questions_rels table exist
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
 * Verify Quiz Questions Field Name using direct database access
 */
async function verifyQuizQuestionsFieldNameDirect() {
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

      // Step 1: Check if there are any entries with field = 'quiz_id_id'
      console.log(
        'Checking if there are any entries with field = quiz_id_id...',
      );
      const quizIdIdResult = await client.query(`
        SELECT COUNT(*) as count
        FROM "payload"."quiz_questions_rels"
        WHERE "field" = 'quiz_id_id';
      `);

      // @ts-ignore - Accessing result by index
      const quizIdIdCount = parseInt(quizIdIdResult.rows[0]?.count || '0');

      console.log(`Entries with field = quiz_id_id: ${quizIdIdCount}`);

      if (quizIdIdCount === 0) {
        console.log('✅ No entries with field = quiz_id_id found');
      } else {
        console.log(
          `❌ Found ${quizIdIdCount} entries with field = quiz_id_id`,
        );
      }

      // Step 2: Check if there are entries with field = 'quiz_id'
      console.log('\nChecking if there are entries with field = quiz_id...');
      const quizIdResult = await client.query(`
        SELECT COUNT(*) as count
        FROM "payload"."quiz_questions_rels"
        WHERE "field" = 'quiz_id';
      `);

      // @ts-ignore - Accessing result by index
      const quizIdCount = parseInt(quizIdResult.rows[0]?.count || '0');

      console.log(`Entries with field = quiz_id: ${quizIdCount}`);

      if (quizIdCount > 0) {
        console.log('✅ Found entries with field = quiz_id');
      } else {
        console.log('❌ No entries with field = quiz_id found');
      }

      // Step 3: Check if the total number of quiz questions matches the number of entries with field = 'quiz_id'
      console.log(
        '\nChecking if all quiz questions have relationships with field = quiz_id...',
      );
      const quizQuestionsResult = await client.query(`
        SELECT COUNT(*) as count
        FROM "payload"."quiz_questions"
        WHERE "quiz_id" IS NOT NULL;
      `);

      // @ts-ignore - Accessing result by index
      const quizQuestionsCount = parseInt(
        quizQuestionsResult.rows[0]?.count || '0',
      );

      console.log(`Quiz questions with quiz_id: ${quizQuestionsCount}`);
      console.log(`Entries with field = quiz_id: ${quizIdCount}`);

      if (quizQuestionsCount === quizIdCount) {
        console.log(
          '✅ All quiz questions have relationships with field = quiz_id',
        );
      } else {
        console.log(
          `❌ ${quizQuestionsCount - quizIdCount} quiz questions are missing relationships with field = quiz_id`,
        );
      }

      console.log('\nVerification complete!');

      // Return a summary of the verification
      return {
        quizQuestionsCount,
        entriesWithQuizId: quizIdCount,
        entriesWithQuizIdId: quizIdIdCount,
      };
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

// Run the verification if this script is executed directly
if (
  import.meta.url ===
  import.meta.resolve('./verify-quiz-questions-field-name-direct.ts')
) {
  verifyQuizQuestionsFieldNameDirect()
    .then((result) => {
      console.log('\nVerification Summary:');
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

export { verifyQuizQuestionsFieldNameDirect };
