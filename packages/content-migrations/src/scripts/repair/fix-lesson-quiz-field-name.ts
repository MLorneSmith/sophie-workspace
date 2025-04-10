/**
 * Fix Lesson Quiz Field Name
 *
 * This script ensures that the field name for quiz relationships in course_lessons_rels
 * is consistent (using 'quiz_id' rather than 'quiz_id_id') and creates missing relationships.
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
  console.log('Running lesson-quiz relationship fix...');

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

    // 1. Fix field name in course_lessons_rels (change 'quiz_id_id' to 'quiz_id')
    console.log('Fixing field name in course_lessons_rels...');
    const updateFieldResult = await pool.query(`
      UPDATE payload.course_lessons_rels
      SET field = 'quiz_id'
      WHERE field = 'quiz_id_id';
    `);
    console.log(`Updated ${updateFieldResult.rowCount} relationship records`);

    // 2. Create missing quiz relationships in course_lessons_rels
    console.log('Creating missing relationships in course_lessons_rels...');
    const createRelationshipsResult = await pool.query(`
      WITH missing_relationships AS (
        SELECT 
          cl.id as lesson_id, 
          cl.quiz_id as quiz_id
        FROM payload.course_lessons cl
        WHERE cl.quiz_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM payload.course_lessons_rels clr
          WHERE clr._parent_id = cl.id
          AND (clr.field = 'quiz_id' OR clr.field = 'quiz_id_id')
          AND clr.value = cl.quiz_id
        )
      )
      INSERT INTO payload.course_lessons_rels (
        id, _parent_id, field, value, created_at, updated_at
      )
      SELECT
        gen_random_uuid(),
        lesson_id,
        'quiz_id',
        quiz_id,
        NOW(),
        NOW()
      FROM missing_relationships;
    `);
    console.log(
      `Created ${createRelationshipsResult.rowCount} missing relationships`,
    );

    // 3. Update quiz_id_id field in course_lessons where it's missing
    console.log('Updating quiz_id_id field in course_lessons...');
    const updateQuizIdIdResult = await pool.query(`
      UPDATE payload.course_lessons cl
      SET quiz_id_id = cl.quiz_id
      WHERE cl.quiz_id IS NOT NULL
      AND (cl.quiz_id_id IS NULL OR cl.quiz_id_id != cl.quiz_id);
    `);
    console.log(`Updated ${updateQuizIdIdResult.rowCount} lesson records`);

    // 4. Fix bidirectional relationships between lessons and quizzes
    console.log(
      'Creating bidirectional relationships between lessons and quizzes...',
    );
    const createBidirectionalResult = await pool.query(`
      WITH lessons_with_quizzes AS (
        SELECT 
          cl.id as lesson_id,
          cl.quiz_id as quiz_id
        FROM payload.course_lessons cl
        WHERE cl.quiz_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM payload.course_quizzes_rels cqr
          WHERE cqr._parent_id = cl.quiz_id
          AND cqr.field = 'lessons'
          AND cqr.value = cl.id
        )
      )
      INSERT INTO payload.course_quizzes_rels (
        id, _parent_id, field, value, created_at, updated_at
      )
      SELECT
        gen_random_uuid(),
        quiz_id,
        'lessons',
        lesson_id,
        NOW(),
        NOW()
      FROM lessons_with_quizzes;
    `);
    console.log(
      `Created ${createBidirectionalResult.rowCount} bidirectional relationships`,
    );

    // Commit transaction if all is well
    await pool.query('COMMIT');
    console.log('Lesson-quiz relationship fix completed successfully');
  } catch (error) {
    // Rollback on error
    await pool.query('ROLLBACK');
    console.error('Error fixing lesson-quiz relationships:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Run the main function
main().catch((err) => {
  console.error('Unhandled error in lesson-quiz relationship fix:', err);
  process.exit(1);
});
