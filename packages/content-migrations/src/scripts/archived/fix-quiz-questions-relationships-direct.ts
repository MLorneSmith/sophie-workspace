/**
 * Fix Quiz Questions Relationships (Direct Database Access)
 *
 * This script fixes the bidirectional relationships between quizzes and quiz questions:
 * 1. Updates the quiz_id_id column to match the quiz_id column
 * 2. Creates entries in the quiz_questions_rels table with field = 'quiz_id' for each quiz question
 * 3. Creates bidirectional entries in the course_quizzes_rels table
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
 * Fix Quiz Questions Relationships using direct database access
 */
async function fixQuizQuestionsRelationshipsDirect() {
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
        // Step 1: Update quiz_id_id column to match quiz_id column
        console.log('Updating quiz_id_id column to match quiz_id column...');
        const updateResult = await client.query(`
          UPDATE payload.quiz_questions
          SET quiz_id_id = quiz_id
          WHERE quiz_id IS NOT NULL AND quiz_id_id IS NULL;
        `);

        console.log(`Updated ${updateResult.rowCount} quiz questions`);

        // Step 2: Ensure the quiz_questions_rels table exists
        console.log('Ensuring quiz_questions_rels table exists...');
        await client.query(`
          DO $$
          BEGIN
            -- Create the table if it doesn't exist
            IF NOT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'payload' 
              AND table_name = 'quiz_questions_rels'
            ) THEN
              CREATE TABLE payload.quiz_questions_rels (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                _parent_id uuid REFERENCES payload.quiz_questions(id) ON DELETE CASCADE,
                field VARCHAR(255),
                value uuid,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
            END IF;
          END $$;
        `);

        // Step 3: Insert relationships into quiz_questions_rels table
        console.log(
          'Inserting relationships into quiz_questions_rels table...',
        );
        const insertRelsResult = await client.query(`
          WITH questions_to_fix AS (
            SELECT id, quiz_id
            FROM payload.quiz_questions qq
            WHERE quiz_id IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM payload.quiz_questions_rels qr
              WHERE qr._parent_id = qq.id
              AND qr.field = 'quiz_id'
            )
          )
          INSERT INTO payload.quiz_questions_rels (id, _parent_id, field, value, updated_at, created_at)
          SELECT 
            gen_random_uuid(), 
            id, 
            'quiz_id', 
            quiz_id,
            NOW(),
            NOW()
          FROM questions_to_fix
          RETURNING _parent_id;
        `);

        console.log(
          `Created ${insertRelsResult.rowCount} relationships in quiz_questions_rels table`,
        );

        // Step 4: Ensure the course_quizzes_rels table exists
        console.log('Ensuring course_quizzes_rels table exists...');
        await client.query(`
          DO $$
          BEGIN
            -- Create the table if it doesn't exist
            IF NOT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'payload' 
              AND table_name = 'course_quizzes_rels'
            ) THEN
              CREATE TABLE payload.course_quizzes_rels (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                _parent_id uuid REFERENCES payload.course_quizzes(id) ON DELETE CASCADE,
                field VARCHAR(255),
                value uuid,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
            END IF;
          END $$;
        `);

        // Step 5: Insert bidirectional relationships into course_quizzes_rels table
        console.log(
          'Inserting bidirectional relationships into course_quizzes_rels table...',
        );
        const insertBidirectionalResult = await client.query(`
          WITH questions_to_fix AS (
            SELECT id, quiz_id
            FROM payload.quiz_questions qq
            WHERE quiz_id IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM payload.course_quizzes_rels cqr
              WHERE cqr._parent_id = qq.quiz_id
              AND cqr.field = 'questions'
              AND cqr.value = qq.id
            )
          )
          INSERT INTO payload.course_quizzes_rels (id, _parent_id, field, value, updated_at, created_at)
          SELECT 
            gen_random_uuid(), 
            quiz_id, 
            'questions', 
            id,
            NOW(),
            NOW()
          FROM questions_to_fix
          RETURNING _parent_id;
        `);

        console.log(
          `Created ${insertBidirectionalResult.rowCount} bidirectional relationships in course_quizzes_rels table`,
        );

        // Commit the transaction
        await client.query('COMMIT');
        console.log('Transaction committed successfully');

        // Verify the updates
        console.log('\nVerifying updates...');

        // Count quiz questions with quiz_id_id
        const quizIdIdResult = await client.query(`
          SELECT COUNT(*) as total, 
                 COUNT(CASE WHEN quiz_id_id IS NOT NULL THEN 1 END) as populated
          FROM "payload"."quiz_questions"
          WHERE "quiz_id" IS NOT NULL;
        `);

        const total = parseInt(quizIdIdResult.rows[0]?.total || '0');
        const populated = parseInt(quizIdIdResult.rows[0]?.populated || '0');

        console.log(`Quiz questions with quiz_id: ${total}`);
        console.log(`Quiz questions with quiz_id_id: ${populated}`);

        // Count relationships in quiz_questions_rels
        const relsResult = await client.query(`
          SELECT COUNT(*) as count
          FROM "payload"."quiz_questions_rels"
          WHERE "field" = 'quiz_id';
        `);

        const relsCount = parseInt(relsResult.rows[0]?.count || '0');
        console.log(
          `Relationships in quiz_questions_rels table with field 'quiz_id': ${relsCount}`,
        );

        // Count bidirectional relationships in course_quizzes_rels
        const bidirectionalResult = await client.query(`
          SELECT COUNT(*) as count
          FROM "payload"."course_quizzes_rels"
          WHERE "field" = 'questions';
        `);

        const bidirectionalCount = parseInt(
          bidirectionalResult.rows[0]?.count || '0',
        );
        console.log(
          `Bidirectional relationships in course_quizzes_rels table: ${bidirectionalCount}`,
        );

        console.log('\nFix complete!');

        // Return a summary of the fix
        return {
          quizQuestionsTotal: total,
          quizQuestionsWithQuizIdId: populated,
          relationshipsInQuizQuestionsRelsWithQuizId: relsCount,
          bidirectionalRelationshipsInCourseQuizzesRels: bidirectionalCount,
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
  import.meta.resolve('./fix-quiz-questions-relationships-direct.ts')
) {
  fixQuizQuestionsRelationshipsDirect()
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

export { fixQuizQuestionsRelationshipsDirect };
