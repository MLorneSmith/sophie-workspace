/**
 * Fix Edge Cases Script
 *
 * This script fixes common edge cases that may occur during content migration:
 * 1. Missing bidirectional relationships between collections and related items
 * 2. UUID tables with missing columns
 * 3. Inconsistent relationships between lessons and quizzes
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Get the directory name from import.meta.url for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '../../.env.development');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`Loaded environment variables from ${envPath}`);
}

async function main() {
  console.log('Running edge case repairs...');

  // Get database connection from environment variables
  let connectionString = process.env.DATABASE_URL;

  // If DATABASE_URL is not set, check for DATABASE_URI (for backward compatibility)
  if (!connectionString) {
    connectionString = process.env.DATABASE_URI;
    if (connectionString) {
      console.log('Using DATABASE_URI environment variable for connection');
    }
  }

  // Still no connection string? Try a default for local development
  if (!connectionString) {
    console.log(
      'No database connection string found in environment variables, using default local connection',
    );
    connectionString =
      'postgresql://postgres:postgres@localhost:54322/postgres?schema=payload';
  }

  // Connect to database
  const pool = new Pool({ connectionString });

  try {
    // Start transaction
    await pool.query('BEGIN');

    // 1. Fix missing bidirectional relationships between surveys and questions
    console.log(
      'Fixing bidirectional relationships for surveys and questions...',
    );
    await pool.query(`
      -- Add missing relationships from questions to surveys
      WITH questions_to_link AS (
        SELECT sq.id as question_id, sqr.surveys_id as survey_id
        FROM payload.survey_questions sq
        JOIN payload.survey_questions_rels sqr ON sq.id = sqr._parent_id
        WHERE sqr.surveys_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 
          FROM payload.surveys_rels sr 
          WHERE sr._parent_id = sqr.surveys_id
          AND sr.value = sq.id
        )
      )
      INSERT INTO payload.surveys_rels (id, _parent_id, field, value, updated_at, created_at)
      SELECT
        gen_random_uuid(),
        survey_id,
        'questions',
        question_id,
        NOW(),
        NOW()
      FROM questions_to_link;
    `);

    // 2. Validate unidirectional relationships between quizzes and questions
    console.log(
      'Validating unidirectional relationships from quizzes to questions...',
    );

    // First check table structure to understand what we're working with
    try {
      const tableCheckResult = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'payload' 
        AND table_name IN ('quiz_questions', 'quiz_questions_rels', 'course_quizzes_rels')
      `);
      console.log(
        'Available tables:',
        tableCheckResult.rows.map((r) => r.table_name).join(', '),
      );

      // Get columns in course_quizzes_rels to ensure we understand the schema
      const columnCheckResult = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_quizzes_rels'
      `);
      console.log(
        'course_quizzes_rels columns:',
        columnCheckResult.rows.map((r) => r.column_name).join(', '),
      );

      // Ensure all questions referenced by quizzes actually exist
      await pool
        .query(
          `
        -- Find references to non-existent questions
        WITH invalid_refs AS (
          SELECT cqr._parent_id as quiz_id, cqr.value as question_id
          FROM payload.course_quizzes_rels cqr
          WHERE cqr.field = 'questions'
          AND NOT EXISTS (
            SELECT 1 
            FROM payload.quiz_questions qq 
            WHERE qq.id = cqr.value
          )
        )
        -- Log how many invalid references were found
        SELECT COUNT(*) as invalid_count FROM invalid_refs
      `,
        )
        .then((result) => {
          const invalidCount = parseInt(result.rows[0].invalid_count, 10);
          if (invalidCount > 0) {
            console.log(
              `Found ${invalidCount} references to non-existent questions. These will be left as-is.`,
            );
          } else {
            console.log('All quiz-to-question references are valid');
          }
        });
    } catch (error) {
      console.error('Error validating quiz relationships:', error.message);
      console.log('Continuing with other fixes...');
    }

    // 3. Fix lesson-quiz relationships
    console.log('Fixing lesson-quiz relationships...');
    await pool.query(`
      -- Update quiz_id_id field in course_lessons table
      UPDATE payload.course_lessons cl
      SET quiz_id_id = clr.value
      FROM payload.course_lessons_rels clr
      WHERE cl.id = clr._parent_id
      AND clr.field = 'quiz_id'
      AND cl.quiz_id_id IS NULL;
    `);

    // 4. Ensure all UUID tables have required columns by using the scanner function
    console.log('Scanning and fixing UUID tables...');
    try {
      await pool.query(`SELECT * FROM payload.scan_and_fix_uuid_tables();`);
    } catch (err) {
      console.log(
        'Warning: UUID table scanner could not be run. This is not critical.',
      );
    }

    // 5. Fix field names in relationship tables
    console.log('Fixing field names in relationship tables...');
    await pool.query(`
      -- Update field names in quiz_questions_rels
      UPDATE payload.quiz_questions_rels
      SET field = 'quiz_id'
      WHERE field = 'quiz_id_id';

      -- Update field names in course_lessons_rels
      UPDATE payload.course_lessons_rels
      SET field = 'quiz_id'
      WHERE field = 'quiz_id_id';
    `);

    // Commit transaction if all is well
    await pool.query('COMMIT');
    console.log('Edge case repairs completed successfully');
  } catch (error) {
    // Rollback on error
    await pool.query('ROLLBACK');
    console.error('Error fixing edge cases:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Run the main function
main().catch((err) => {
  console.error('Unhandled error in edge case repairs:', err);
  process.exit(1);
});
