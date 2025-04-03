/**
 * Verify Course Lessons Quiz ID Column
 *
 * This script verifies that the quiz_id_id column exists in the course_lessons table
 * and that its values match the quiz_id column.
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables based on the NODE_ENV
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

dotenv.config({ path: path.resolve(__dirname, '../../../', envFile) });

/**
 * Verifies the quiz_id_id column in the course_lessons table
 */
async function verifyCourseLessonsQuizIdColumn() {
  console.log('Verifying course_lessons quiz_id_id column...');

  // Get database connection string
  const databaseUri = process.env.DATABASE_URI;
  if (!databaseUri) {
    throw new Error('DATABASE_URI environment variable is not set');
  }

  // Connect to database
  const pool = new Pool({
    connectionString: databaseUri,
  });

  try {
    // Get a client from the pool
    const client = await pool.connect();
    try {
      console.log('Connected to database');

      // 1. Check if quiz_id_id column exists in course_lessons table
      console.log(
        'Checking if quiz_id_id column exists in course_lessons table...',
      );
      const columnExistsResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_lessons'
          AND column_name = 'quiz_id_id'
        ) AS exists;
      `);

      if (columnExistsResult.rows[0].exists) {
        console.log('✅ Column quiz_id_id exists in course_lessons table');
      } else {
        console.log(
          '❌ Column quiz_id_id does not exist in course_lessons table',
        );
        return false;
      }

      // 2. Check if values in quiz_id_id match quiz_id
      console.log('Checking if values in quiz_id_id match quiz_id...');
      const valuesMismatchResult = await client.query(`
        SELECT COUNT(*) as count
        FROM payload.course_lessons
        WHERE quiz_id IS NOT NULL
        AND (quiz_id_id IS NULL OR quiz_id_id != quiz_id);
      `);

      const mismatchCount = parseInt(valuesMismatchResult.rows[0].count);

      if (mismatchCount === 0) {
        console.log('✅ All quiz_id_id values match quiz_id values');
      } else {
        console.log(
          `❌ Found ${mismatchCount} lessons where quiz_id_id does not match quiz_id`,
        );
        return false;
      }

      // 3. Check if relationship entries exist in course_lessons_rels
      console.log(
        'Checking if relationship entries exist in course_lessons_rels...',
      );

      // First check if the course_lessons_rels table exists
      const tableExistsResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_lessons_rels'
        ) AS exists;
      `);

      if (!tableExistsResult.rows[0].exists) {
        console.log('⚠️ Table course_lessons_rels does not exist');
        return false;
      }

      // Check if field column exists in course_lessons_rels
      const fieldColumnExistsResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_lessons_rels'
          AND column_name = 'field'
        ) AS exists;
      `);

      if (!fieldColumnExistsResult.rows[0].exists) {
        console.log('⚠️ Column field does not exist in course_lessons_rels');
        return false;
      }

      // Check if value column exists in course_lessons_rels
      const valueColumnExistsResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_lessons_rels'
          AND column_name = 'value'
        ) AS exists;
      `);

      if (!valueColumnExistsResult.rows[0].exists) {
        console.log('⚠️ Column value does not exist in course_lessons_rels');
        return false;
      }

      // Check if relationship entries exist
      const relationshipsMissingResult = await client.query(`
        SELECT COUNT(*) as count
        FROM payload.course_lessons
        WHERE quiz_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM payload.course_lessons_rels
          WHERE _parent_id = course_lessons.id
          AND field = 'quiz_id_id'
          AND value = course_lessons.quiz_id
        );
      `);

      const missingCount = parseInt(relationshipsMissingResult.rows[0].count);

      if (missingCount === 0) {
        console.log('✅ All relationships exist in course_lessons_rels table');
      } else {
        console.log(
          `⚠️ Found ${missingCount} lessons missing relationship entries in course_lessons_rels`,
        );
        console.log(
          'Note: This may be expected if no relationships have been created yet',
        );
      }

      console.log('✅ Verification completed successfully');
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error verifying course_lessons quiz_id_id column:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the function if this script is executed directly
if (
  import.meta.url ===
  import.meta.resolve('./verify-course-lessons-quiz-id-column.ts')
) {
  verifyCourseLessonsQuizIdColumn()
    .then((success) => {
      if (success) {
        console.log('Verification passed');
        process.exit(0);
      } else {
        console.error('Verification failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Error during verification:', error);
      process.exit(1);
    });
}

export { verifyCourseLessonsQuizIdColumn };
