/**
 * Comprehensive Lesson-Quiz Relationship Fix
 *
 * This script combines functionality from:
 * - fix-lesson-quiz-field-name.ts
 * - fix-lesson-quiz-references.ts
 * - fix-lessons-quiz-references-sql.ts
 *
 * It handles all aspects of lesson-quiz relationships in both
 * direct field storage and relationship tables.
 */
import console from 'console';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Client } = pg;

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const connectionString =
  process.env.DATABASE_URI ||
  'postgresql://postgres:postgres@localhost:54322/postgres';

/**
 * Main entry point for comprehensive lesson-quiz relationship fixes
 */
export async function fixLessonQuizRelationshipsComprehensive(): Promise<void> {
  console.log('Starting comprehensive lesson-quiz relationship fix...');

  const client = new Client({ connectionString });

  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database');

    // Begin transaction
    await client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');

    // 1. Fix lesson-quiz field names
    await fixLessonQuizFieldNames(client);

    // 2. Fix direct lesson-quiz references
    await fixLessonQuizReferences(client);

    // 3. Fix lesson-quiz references with SQL approach
    await fixLessonQuizReferencesWithSql(client);

    // 4. Verify fixes were applied correctly
    await verifyLessonQuizRelationships(client);

    // Commit transaction if all operations were successful
    await client.query('COMMIT');
    console.log('Transaction committed successfully');
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error fixing lesson-quiz relationships:', error);
    throw error;
  } finally {
    // Close database connection
    await client.end();
    console.log('Database connection closed');
  }

  console.log('Comprehensive lesson-quiz relationship fix completed');
}

/**
 * Fix lesson-quiz field names
 * Consolidated from fix-lesson-quiz-field-name.ts
 */
async function fixLessonQuizFieldNames(
  client: InstanceType<typeof Client>,
): Promise<void> {
  console.log('Fixing lesson-quiz field names...');

  try {
    // Check if quiz_id column exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'payload' 
      AND table_name = 'course_lessons' 
      AND column_name = 'quiz_id'
    `);

    if (checkColumn.rowCount === 0) {
      console.log(
        'quiz_id column not found in course_lessons table, skipping field name fix',
      );
      return;
    }

    // Check for lessons with quiz_id but without quiz_id_id
    const result = await client.query(`
      SELECT id, quiz_id, quiz_id_id 
      FROM payload.course_lessons 
      WHERE quiz_id IS NOT NULL 
      AND (quiz_id_id IS NULL OR quiz_id_id = '')
    `);

    console.log(
      `Found ${result.rowCount} lessons with quiz_id but without quiz_id_id`,
    );

    if (result.rowCount > 0) {
      // Update quiz_id_id from quiz_id
      const updateResult = await client.query(`
        UPDATE payload.course_lessons 
        SET quiz_id_id = quiz_id 
        WHERE quiz_id IS NOT NULL 
        AND (quiz_id_id IS NULL OR quiz_id_id = '')
      `);

      console.log(
        `Updated ${updateResult.rowCount} lessons with quiz_id_id from quiz_id`,
      );
    }

    // Verify the fix
    const verifyResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.course_lessons 
      WHERE quiz_id IS NOT NULL 
      AND (quiz_id_id IS NULL OR quiz_id_id = '')
    `);

    if (parseInt(verifyResult.rows[0].count) === 0) {
      console.log('✅ All lessons now have quiz_id_id matching quiz_id');
    } else {
      console.warn(
        `⚠️ ${verifyResult.rows[0].count} lessons still have inconsistent field names`,
      );
    }
  } catch (error) {
    console.error('Error in fixLessonQuizFieldNames:', error);
    throw error;
  }
}

/**
 * Fix direct lesson-quiz references
 * Consolidated from fix-lesson-quiz-references.ts
 */
async function fixLessonQuizReferences(
  client: InstanceType<typeof Client>,
): Promise<void> {
  console.log('Fixing direct lesson-quiz references...');

  try {
    // Get all lessons with quiz relationships
    const lessonsResult = await client.query(`
      SELECT id, quiz_id_id 
      FROM payload.course_lessons 
      WHERE quiz_id_id IS NOT NULL AND quiz_id_id != ''
    `);

    console.log(`Found ${lessonsResult.rowCount} lessons with quiz references`);

    let fixedRelationships = 0;

    // Process each lesson
    for (const lesson of lessonsResult.rows) {
      const lessonId = lesson.id;
      const quizId = lesson.quiz_id_id;

      // Check if relationship exists in relationship table
      const relExistsResult = await client.query(
        `
        SELECT id 
        FROM payload.course_lessons_rels 
        WHERE _parent_id = $1 
        AND field = 'quiz_id' 
        AND value = $2
      `,
        [lessonId, quizId],
      );

      // If relationship doesn't exist, create it
      if (relExistsResult.rowCount === 0) {
        await client.query(
          `
          INSERT INTO payload.course_lessons_rels 
          (id, _parent_id, field, value, course_quizzes_id, created_at, updated_at) 
          VALUES 
          (gen_random_uuid(), $1, 'quiz_id', $2, $2, NOW(), NOW())
        `,
          [lessonId, quizId],
        );

        fixedRelationships++;
      }
    }

    console.log(`Created ${fixedRelationships} missing relationship entries`);
  } catch (error) {
    console.error('Error in fixLessonQuizReferences:', error);
    throw error;
  }
}

/**
 * Fix lesson-quiz references with SQL approach
 * Consolidated from fix-lessons-quiz-references-sql.ts
 */
async function fixLessonQuizReferencesWithSql(
  client: InstanceType<typeof Client>,
): Promise<void> {
  console.log('Fixing lesson-quiz references with SQL approach...');

  try {
    // 1. Create missing relationship entries based on quiz_id_id values
    const createRelResult = await client.query(`
      INSERT INTO payload.course_lessons_rels 
      (id, _parent_id, field, value, course_quizzes_id, created_at, updated_at)
      SELECT 
        gen_random_uuid(), 
        cl.id, 
        'quiz_id', 
        cl.quiz_id_id, 
        cl.quiz_id_id, 
        NOW(), 
        NOW()
      FROM 
        payload.course_lessons cl
      WHERE 
        cl.quiz_id_id IS NOT NULL 
        AND cl.quiz_id_id != '' 
        AND NOT EXISTS (
          SELECT 1 
          FROM payload.course_lessons_rels clr 
          WHERE clr._parent_id = cl.id 
          AND clr.field = 'quiz_id' 
          AND clr.value = cl.quiz_id_id
        )
    `);

    console.log(
      `Created ${createRelResult.rowCount} missing relationship entries from quiz_id_id values`,
    );

    // 2. Remove invalid relationships (where quiz doesn't exist)
    const removeInvalidRelsResult = await client.query(`
      DELETE FROM payload.course_lessons_rels clr
      WHERE clr.field = 'quiz_id' 
      AND NOT EXISTS (
        SELECT 1 
        FROM payload.course_quizzes cq 
        WHERE cq.id = clr.value
      )
      RETURNING id
    `);

    console.log(
      `Removed ${removeInvalidRelsResult.rowCount} invalid relationship entries`,
    );

    // 3. Ensure relationship table entries have course_quizzes_id set properly
    const fixCourseQuizzesIdResult = await client.query(`
      UPDATE payload.course_lessons_rels clr
      SET course_quizzes_id = clr.value
      WHERE clr.field = 'quiz_id' 
      AND (clr.course_quizzes_id IS NULL OR clr.course_quizzes_id != clr.value)
    `);

    console.log(
      `Fixed ${fixCourseQuizzesIdResult.rowCount} relationship entries with incorrect course_quizzes_id`,
    );
  } catch (error) {
    console.error('Error in fixLessonQuizReferencesWithSql:', error);
    throw error;
  }
}

/**
 * Verify lesson-quiz relationships
 */
async function verifyLessonQuizRelationships(
  client: InstanceType<typeof Client>,
): Promise<void> {
  console.log('Verifying lesson-quiz relationships...');

  try {
    // 1. Check for lessons with quiz_id_id but no relationship entry
    const missingRelsResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.course_lessons cl
      WHERE cl.quiz_id_id IS NOT NULL 
      AND cl.quiz_id_id != '' 
      AND NOT EXISTS (
        SELECT 1 
        FROM payload.course_lessons_rels clr 
        WHERE clr._parent_id = cl.id 
        AND clr.field = 'quiz_id' 
        AND clr.value = cl.quiz_id_id
      )
    `);

    const missingRels = parseInt(missingRelsResult.rows[0].count);

    // 2. Check for relationship entries with no matching quiz_id_id
    const inconsistentRelsResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.course_lessons_rels clr
      JOIN payload.course_lessons cl ON cl.id = clr._parent_id
      WHERE clr.field = 'quiz_id' 
      AND (cl.quiz_id_id IS NULL OR cl.quiz_id_id = '' OR cl.quiz_id_id != clr.value)
    `);

    const inconsistentRels = parseInt(inconsistentRelsResult.rows[0].count);

    // 3. Check for total number of lesson-quiz relationships
    const totalRelsResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.course_lessons_rels 
      WHERE field = 'quiz_id'
    `);

    const totalRels = parseInt(totalRelsResult.rows[0].count);

    // 4. Check total lessons with quiz_id_id
    const totalLessonsWithQuizResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.course_lessons 
      WHERE quiz_id_id IS NOT NULL AND quiz_id_id != ''
    `);

    const totalLessonsWithQuiz = parseInt(
      totalLessonsWithQuizResult.rows[0].count,
    );

    // Report results
    console.log('\nVerification Results:');
    console.log(`- Total lessons with quiz_id_id: ${totalLessonsWithQuiz}`);
    console.log(`- Total lesson-quiz relationships: ${totalRels}`);
    console.log(
      `- Lessons with quiz_id_id but no relationship: ${missingRels}`,
    );
    console.log(`- Inconsistent relationships: ${inconsistentRels}`);

    if (missingRels === 0 && inconsistentRels === 0) {
      console.log('✅ All lesson-quiz relationships are consistent');
    } else {
      console.warn('⚠️ Some lesson-quiz relationships are still inconsistent');
    }
  } catch (error) {
    console.error('Error in verifyLessonQuizRelationships:', error);
    throw error;
  }
}

// Run if executed directly
// ESM equivalent of require.main === module
if (import.meta.url.endsWith(process.argv[1])) {
  fixLessonQuizRelationshipsComprehensive()
    .then(() => console.log('Done'))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
