import pg from 'pg';

const { Client } = pg;

/**
 * Fix invalid quiz references in course lessons
 *
 * This script identifies lessons that reference non-existent quizzes
 * and nullifies these references to prevent 404 errors in the application.
 */
export async function fixInvalidQuizReferences(): Promise<void> {
  console.log('Fixing invalid quiz references...');

  const client = new Client({
    connectionString:
      process.env.DATABASE_URI ||
      'postgresql://postgres:postgres@localhost:54322/postgres',
  });

  try {
    await client.connect();
    await client.query('BEGIN');

    // First, identify and fix JSON object quiz IDs that might be stored as strings
    console.log('Checking for invalid JSON object quiz references...');
    const fixJsonResult = await client.query(`
      UPDATE payload.course_lessons
      SET quiz_id = NULL
      WHERE quiz_id IS NOT NULL 
        AND (
          quiz_id::text LIKE '{%}' 
          OR quiz_id::text = 'null'
          OR quiz_id::text = 'undefined'
          OR quiz_id::text = '{}' 
        )
      RETURNING id, title
    `);

    if (fixJsonResult.rowCount > 0) {
      console.log(
        `Fixed ${fixJsonResult.rowCount} lessons with invalid JSON object quiz references:`,
      );
      fixJsonResult.rows.forEach((row) => {
        console.log(`- Lesson ID: ${row.id}, Title: ${row.title}`);
      });
    }

    // Find and count remaining invalid references (direct UUID references)
    const checkResult = await client.query(`
      SELECT COUNT(*) as invalid_count
      FROM payload.course_lessons
      WHERE quiz_id IS NOT NULL 
        AND quiz_id::text NOT LIKE '{%}'
        AND NOT EXISTS (
          SELECT 1 FROM payload.course_quizzes WHERE id = course_lessons.quiz_id::uuid
        )
    `);

    const invalidCount = parseInt(
      checkResult.rows[0]?.invalid_count || '0',
      10,
    );

    if (invalidCount > 0) {
      console.log(`Found ${invalidCount} invalid quiz references`);

      // Update lessons to remove invalid quiz references
      const updateResult = await client.query(`
        UPDATE payload.course_lessons
        SET quiz_id = NULL
        WHERE quiz_id IS NOT NULL 
          AND NOT EXISTS (
            SELECT 1 FROM payload.course_quizzes WHERE id = course_lessons.quiz_id::uuid
          )
        RETURNING id, title
      `);

      console.log(
        `Updated ${updateResult.rowCount} lessons to remove invalid quiz references:`,
      );
      updateResult.rows.forEach((row) => {
        console.log(`- Lesson ID: ${row.id}, Title: ${row.title}`);
      });
    } else {
      console.log('No invalid quiz references found');
    }

    // Add course ID to all quizzes
    console.log('Adding course ID to quizzes...');

    // Get main course ID - needs to be a real ID from your database
    const courseResult = await client.query(`
      SELECT id FROM payload.courses
      WHERE slug = 'decks-for-decision-makers'
      LIMIT 1
    `);

    if (courseResult.rowCount > 0) {
      const courseId = courseResult.rows[0].id;

      // Update all quizzes to have this course ID
      const updateResult = await client.query(
        `
        UPDATE payload.course_quizzes
        SET course_id_id = $1
        WHERE course_id_id IS NULL
        RETURNING id, title
      `,
        [courseId],
      );

      console.log(
        `Updated ${updateResult.rowCount} quizzes to have course ID ${courseId}:`,
      );
      updateResult.rows.forEach((row) => {
        console.log(`- Quiz ID: ${row.id}, Title: ${row.title}`);
      });
    } else {
      console.warn(
        'Could not find main course ID. Please update quiz course IDs manually.',
      );
    }

    await client.query('COMMIT');
    console.log(
      'Successfully fixed invalid quiz references and added course IDs',
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fixing invalid quiz references:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the function if called directly
// ESM equivalent of require.main === module
if (import.meta.url.endsWith(process.argv[1])) {
  fixInvalidQuizReferences()
    .then(() => console.log('Complete'))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
