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
        console.log('No database connection string found in environment variables, using default local connection');
        connectionString =
            'postgresql://postgres:postgres@localhost:54322/postgres?schema=payload';
    }
    // Connect to database
    const pool = new Pool({ connectionString });
    try {
        // Start transaction
        await pool.query('BEGIN');
        // 0. First, remove duplicate relationships from both tables to prevent multiples
        console.log('Removing duplicate relationships...');
        const removeDuplicateFromLessons = await pool.query(`
      -- Get all duplicate groups
      WITH duplicates AS (
        SELECT field, value, _parent_id, COUNT(*) as count
        FROM payload.course_lessons_rels
        WHERE field IN ('quiz_id', 'quiz_id_id')
        GROUP BY field, value, _parent_id
        HAVING COUNT(*) > 1
      )
      -- Delete all but the first row in each duplicate group
      DELETE FROM payload.course_lessons_rels cl
      WHERE EXISTS (
        SELECT 1
        FROM duplicates d
        WHERE d.field = cl.field 
        AND d.value = cl.value 
        AND d._parent_id = cl._parent_id
      )
      AND cl.id NOT IN (
        SELECT cl_inner.id
        FROM payload.course_lessons_rels cl_inner
        JOIN duplicates d ON cl_inner.field = d.field AND cl_inner.value = d.value AND cl_inner._parent_id = d._parent_id
        ORDER BY cl_inner.id
        LIMIT 1
      );
    `);
        console.log(`Removed ${removeDuplicateFromLessons.rowCount} duplicate lesson-quiz relationships`);
        const removeDuplicateFromQuizzes = await pool.query(`
      -- Get all duplicate groups
      WITH duplicates AS (
        SELECT field, value, _parent_id, COUNT(*) as count
        FROM payload.course_quizzes_rels
        WHERE field = 'lessons'
        GROUP BY field, value, _parent_id
        HAVING COUNT(*) > 1
      )
      -- Delete all but the first row in each duplicate group
      DELETE FROM payload.course_quizzes_rels cq
      WHERE EXISTS (
        SELECT 1
        FROM duplicates d
        WHERE d.field = cq.field 
        AND d.value = cq.value 
        AND d._parent_id = cq._parent_id
      )
      AND cq.id NOT IN (
        SELECT cq_inner.id
        FROM payload.course_quizzes_rels cq_inner
        JOIN duplicates d ON cq_inner.field = d.field AND cq_inner.value = d.value AND cq_inner._parent_id = d._parent_id
        ORDER BY cq_inner.id
        LIMIT 1
      );
    `);
        console.log(`Removed ${removeDuplicateFromQuizzes.rowCount} duplicate quiz-lesson relationships`);
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
        console.log(`Created ${createRelationshipsResult.rowCount} missing relationships`);
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
        console.log('Creating bidirectional relationships between lessons and quizzes...');
        // First, identify lessons with quizzes
        const lessonsWithQuizzes = await pool.query(`
      SELECT 
        cl.id as lesson_id,
        cl.quiz_id as quiz_id
      FROM payload.course_lessons cl
      WHERE cl.quiz_id IS NOT NULL
    `);
        console.log(`Found ${lessonsWithQuizzes.rowCount} lessons with quiz_id set`);
        // Check for relationships in course_lessons_rels
        const lessonQuizRels = await pool.query(`
      SELECT 
        _parent_id as lesson_id, 
        value as quiz_id
      FROM payload.course_lessons_rels
      WHERE field = 'quiz_id'
    `);
        console.log(`Found ${lessonQuizRels.rowCount} existing lesson-to-quiz relationships`);
        // Check for relationships in course_quizzes_rels
        const quizLessonRels = await pool.query(`
      SELECT 
        _parent_id as quiz_id,
        value as lesson_id
      FROM payload.course_quizzes_rels
      WHERE field = 'lessons'
    `);
        console.log(`Found ${quizLessonRels.rowCount} existing quiz-to-lesson relationships`);
        // Create missing bidirectional relationships for lessons-to-quizzes
        const createLessonToQuizResult = await pool.query(`
      WITH lessons_with_quizzes AS (
        SELECT 
          cl.id as lesson_id,
          cl.quiz_id as quiz_id
        FROM payload.course_lessons cl
        WHERE cl.quiz_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM payload.course_lessons_rels clr
          WHERE clr._parent_id = cl.id
          AND clr.field = 'quiz_id'
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
      FROM lessons_with_quizzes;
    `);
        console.log(`Created ${createLessonToQuizResult.rowCount} missing lesson-to-quiz relationships`);
        // Create missing bidirectional relationships for quizzes-to-lessons
        const createQuizToLessonResult = await pool.query(`
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
        console.log(`Created ${createQuizToLessonResult.rowCount} missing quiz-to-lesson relationships`);
        // Add the course_lessons_id to course_quizzes_rels if needed
        console.log('Fixing relationship ID fields in course_quizzes_rels table...');
        // First check if the column exists
        const columnExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_quizzes_rels' 
        AND column_name = 'course_lessons_id'
      );
    `);
        if (!columnExists.rows[0].exists) {
            console.log('Adding course_lessons_id column to course_quizzes_rels table...');
            await pool.query(`
        ALTER TABLE payload.course_quizzes_rels 
        ADD COLUMN IF NOT EXISTS course_lessons_id UUID;
      `);
        }
        // Now update the course_lessons_id field to match the value field
        const updateCourseQuizzesRels = await pool.query(`
      UPDATE payload.course_quizzes_rels
      SET course_lessons_id = value::uuid
      WHERE field = 'lessons'
      AND (course_lessons_id IS NULL OR course_lessons_id IS DISTINCT FROM value::uuid);
    `);
        console.log(`Updated course_lessons_id for ${updateCourseQuizzesRels.rowCount} lesson relationships`);
        // Add the course_quizzes_id to course_lessons_rels if needed
        console.log('Fixing relationship ID fields in course_lessons_rels table...');
        // First check if the column exists
        const quizColumnExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons_rels' 
        AND column_name = 'course_quizzes_id'
      );
    `);
        if (!quizColumnExists.rows[0].exists) {
            console.log('Adding course_quizzes_id column to course_lessons_rels table...');
            await pool.query(`
        ALTER TABLE payload.course_lessons_rels 
        ADD COLUMN IF NOT EXISTS course_quizzes_id UUID;
      `);
        }
        // Now update the course_quizzes_id field to match the value field
        const updateCourseLessonsRels = await pool.query(`
      UPDATE payload.course_lessons_rels
      SET course_quizzes_id = value::uuid
      WHERE field = 'quiz_id'
      AND (course_quizzes_id IS NULL OR course_quizzes_id IS DISTINCT FROM value::uuid);
    `);
        console.log(`Updated course_quizzes_id for ${updateCourseLessonsRels.rowCount} quiz relationships`);
        // Verify relationships
        const verifyLessons = await pool.query(`
      SELECT COUNT(*) as lessons_with_quiz FROM payload.course_lessons WHERE quiz_id IS NOT NULL;
    `);
        const lessonsWithQuizCount = parseInt(verifyLessons.rows[0].lessons_with_quiz);
        const verifyLessonRels = await pool.query(`
      SELECT COUNT(*) as lesson_rels FROM payload.course_lessons_rels WHERE field = 'quiz_id';
    `);
        const lessonRelsCount = parseInt(verifyLessonRels.rows[0].lesson_rels);
        const verifyQuizRels = await pool.query(`
      SELECT COUNT(*) as quiz_rels FROM payload.course_quizzes_rels WHERE field = 'lessons';
    `);
        const quizRelsCount = parseInt(verifyQuizRels.rows[0].quiz_rels);
        // Verify quiz_questions_id is set in relationships
        const verifyQuizQuestionsId = await pool.query(`
      SELECT COUNT(*) as with_id FROM payload.course_quizzes_rels WHERE field = 'questions' AND quiz_questions_id IS NOT NULL;
    `);
        const quizQuestionsIdCount = parseInt(verifyQuizQuestionsId.rows[0].with_id);
        const verifyLessonsId = await pool.query(`
      SELECT COUNT(*) as with_id FROM payload.course_quizzes_rels WHERE field = 'lessons' AND course_lessons_id IS NOT NULL;
    `);
        const lessonsIdCount = parseInt(verifyLessonsId.rows[0].with_id);
        console.log(`Verification: ${lessonsWithQuizCount} lessons with quiz ${lessonRelsCount} lesson relationships ${quizRelsCount} quiz relationships`);
        console.log(`Quiz questions relationships: ${quizQuestionsIdCount} total ${quizQuestionsIdCount} with quiz_questions_id set`);
        console.log(`Lesson relationships in quizzes: ${lessonsIdCount} total ${lessonsIdCount} with course_lessons_id set`);
        if (lessonsWithQuizCount !== lessonRelsCount ||
            lessonsWithQuizCount !== quizRelsCount / 2) {
            console.warn(`Warning: Not all lesson-quiz relationships are bidirectional`);
            console.warn(`- Lessons with quiz: ${lessonsWithQuizCount}`);
            console.warn(`- Lesson relationships: ${lessonRelsCount}`);
            console.warn(`- Quiz relationships: ${quizRelsCount}`);
        }
        else {
            console.log(`✅ All lesson-quiz relationships are bidirectional`);
        }
        // Commit transaction if all is well
        await pool.query('COMMIT');
        console.log('Lesson-quiz relationship fix completed successfully');
    }
    catch (error) {
        // Rollback on error
        await pool.query('ROLLBACK');
        console.error('Error fixing lesson-quiz relationships:', error);
        process.exit(1);
    }
    finally {
        // Close database connection
        await pool.end();
    }
}
// Run the main function
main().catch((err) => {
    console.error('Unhandled error in lesson-quiz relationship fix:', err);
    process.exit(1);
});
