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
        console.log('No database connection string found in environment variables, using default local connection');
        connectionString =
            'postgresql://postgres:postgres@localhost:54322/postgres?schema=payload';
    }
    // Connect to database
    const pool = new Pool({ connectionString });
    try {
        // Start transaction
        await pool.query('BEGIN');
        // 1. Fix missing bidirectional relationships between surveys and questions
        console.log('Fixing bidirectional relationships for surveys and questions...');
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
        // 2. Fix missing bidirectional relationships between quizzes and questions
        console.log('Fixing bidirectional relationships for quizzes and questions...');
        await pool.query(`
      -- Add missing relationships from questions to quizzes
      WITH questions_to_link AS (
        SELECT qq.id as question_id, qq.quiz_id_id as quiz_id
        FROM payload.quiz_questions qq
        JOIN payload.quiz_questions_rels qqr ON qq.id = qqr._parent_id
        WHERE qq.quiz_id_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 
          FROM payload.course_quizzes_rels cqr 
          WHERE cqr._parent_id = qq.quiz_id_id
          AND cqr.value = qq.id
        )
      )
      INSERT INTO payload.course_quizzes_rels (id, _parent_id, field, value, updated_at, created_at)
      SELECT
        gen_random_uuid(),
        quiz_id,
        'questions',
        question_id,
        NOW(),
        NOW()
      FROM questions_to_link;
    `);
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
        }
        catch (err) {
            console.log('Warning: UUID table scanner could not be run. This is not critical.');
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
    }
    catch (error) {
        // Rollback on error
        await pool.query('ROLLBACK');
        console.error('Error fixing edge cases:', error);
        process.exit(1);
    }
    finally {
        // Close database connection
        await pool.end();
    }
}
// Run the main function
main().catch((err) => {
    console.error('Unhandled error in edge case repairs:', err);
    process.exit(1);
});
