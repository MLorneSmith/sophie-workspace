/**
 * Verify Course Lessons
 *
 * This script verifies that the course_lessons table has the correct structure
 * and that the quiz_id_id column is properly populated.
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
const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
dotenv.config({ path: path.resolve(__dirname, '../../../', envFile) });
/**
 * Verifies the course_lessons table structure and data integrity
 */
async function verifyCourseLessons() {
    console.log('Verifying course_lessons table...');
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
    const pool = new Pool({
        connectionString,
    });
    try {
        // Get a client from the pool
        const client = await pool.connect();
        try {
            console.log('Connected to database');
            // Check if course_lessons table exists
            const tableExistsResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_lessons'
        ) AS exists;
      `);
            if (!tableExistsResult.rows[0].exists) {
                console.log('❌ Table course_lessons does not exist');
                return false;
            }
            console.log('✅ Table course_lessons exists');
            // Check if quiz_id_id column exists
            const quizIdIdColumnExistsResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_lessons'
          AND column_name = 'quiz_id_id'
        ) AS exists;
      `);
            if (!quizIdIdColumnExistsResult.rows[0].exists) {
                console.log('❌ Column quiz_id_id does not exist in course_lessons table');
                return false;
            }
            console.log('✅ Column quiz_id_id exists in course_lessons table');
            // Check if quiz_id column exists
            const quizIdColumnExistsResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_lessons'
          AND column_name = 'quiz_id'
        ) AS exists;
      `);
            if (!quizIdColumnExistsResult.rows[0].exists) {
                console.log('❌ Column quiz_id does not exist in course_lessons table');
                return false;
            }
            console.log('✅ Column quiz_id exists in course_lessons table');
            // Count lessons with quizzes
            const lessonsWithQuizzesResult = await client.query(`
        SELECT COUNT(*) FROM payload.course_lessons
        WHERE quiz_id IS NOT NULL;
      `);
            const lessonsWithQuizzesCount = parseInt(lessonsWithQuizzesResult.rows[0].count);
            console.log(`Found ${lessonsWithQuizzesCount} lessons with quiz_id assigned`);
            // Check if all lessons have quiz_id_id matching quiz_id
            const mismatchedLessonsResult = await client.query(`
        SELECT COUNT(*) FROM payload.course_lessons
        WHERE quiz_id IS NOT NULL
        AND (quiz_id_id IS NULL OR quiz_id_id != quiz_id);
      `);
            const mismatchedLessonsCount = parseInt(mismatchedLessonsResult.rows[0].count);
            if (mismatchedLessonsCount > 0) {
                console.log(`❌ Found ${mismatchedLessonsCount} lessons where quiz_id_id does not match quiz_id`);
                // Get details of mismatched lessons
                const mismatchedLessonsDetailsResult = await client.query(`
          SELECT id, title, quiz_id, quiz_id_id
          FROM payload.course_lessons
          WHERE quiz_id IS NOT NULL
          AND (quiz_id_id IS NULL OR quiz_id_id != quiz_id)
          LIMIT 5;
        `);
                console.log('Example of mismatched lessons:');
                mismatchedLessonsDetailsResult.rows.forEach((row) => {
                    console.log(`Lesson: ${row.title}, quiz_id: ${row.quiz_id}, quiz_id_id: ${row.quiz_id_id}`);
                });
                return false;
            }
            console.log('✅ All lessons have quiz_id_id matching quiz_id');
            // Check relationship tables
            console.log('Checking course_lessons_rels table...');
            const relsTableExistsResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_lessons_rels'
        ) AS exists;
      `);
            if (!relsTableExistsResult.rows[0].exists) {
                console.log('❌ Table course_lessons_rels does not exist');
                return false;
            }
            console.log('✅ Table course_lessons_rels exists');
            // Count relationships
            const relationshipsCountResult = await client.query(`
        SELECT COUNT(*) FROM payload.course_lessons_rels
        WHERE field = 'quiz_id' OR field = 'quiz_id_id';
      `);
            const relationshipsCount = parseInt(relationshipsCountResult.rows[0].count);
            console.log(`Found ${relationshipsCount} quiz relationships in course_lessons_rels table`);
            // Check if all lessons with quizzes have relationships
            const lessonsWithoutRelationshipsResult = await client.query(`
        SELECT COUNT(*) FROM payload.course_lessons cl
        WHERE cl.quiz_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM payload.course_lessons_rels clr
          WHERE clr._parent_id = cl.id
          AND (clr.field = 'quiz_id' OR clr.field = 'quiz_id_id')
        );
      `);
            const lessonsWithoutRelationshipsCount = parseInt(lessonsWithoutRelationshipsResult.rows[0].count);
            if (lessonsWithoutRelationshipsCount > 0) {
                console.log(`❌ Found ${lessonsWithoutRelationshipsCount} lessons with quizzes that don't have relationships in course_lessons_rels`);
                return false;
            }
            console.log('✅ All lessons with quizzes have relationships in course_lessons_rels');
            // Check if relationships have correct value
            const invalidRelationshipsResult = await client.query(`
        SELECT COUNT(*) FROM payload.course_lessons_rels clr
        JOIN payload.course_lessons cl ON cl.id = clr._parent_id
        WHERE (clr.field = 'quiz_id' OR clr.field = 'quiz_id_id')
        AND cl.quiz_id IS NOT NULL
        AND clr.value != cl.quiz_id;
      `);
            const invalidRelationshipsCount = parseInt(invalidRelationshipsResult.rows[0].count);
            if (invalidRelationshipsCount > 0) {
                console.log(`❌ Found ${invalidRelationshipsCount} relationships with incorrect value`);
                return false;
            }
            console.log('✅ All relationships have correct value');
            console.log('✅ Course lessons verification completed successfully');
            return true;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Error verifying course_lessons table:', error.message || String(error));
        throw error;
    }
    finally {
        await pool.end();
    }
}
// Run the function if this script is executed directly
if (import.meta.url === import.meta.resolve('./verify-course-lessons.ts')) {
    verifyCourseLessons()
        .then((success) => {
        if (success) {
            console.log('Course lessons verification passed');
            process.exit(0);
        }
        else {
            console.error('Course lessons verification failed');
            process.exit(1);
        }
    })
        .catch((error) => {
        console.error('Error during verification:', error);
        process.exit(1);
    });
}
export { verifyCourseLessons };
