import pg from 'pg';

const { Client } = pg;

/**
 * Fix course IDs for all quizzes
 *
 * This script ensures that all quizzes have proper course IDs in both the
 * direct field and relationship tables
 */
export async function fixQuizCourseIds(): Promise<void> {
  console.log('============== QUIZ COURSE ID FIX ==============');
  console.log('Fixing quiz course IDs...');
  console.log('Loading environment variables...');
  // Import environment variables from .env.development
  try {
    // Try to load from the typical locations
    await import('dotenv').then((dotenv) =>
      dotenv.config({ path: '.env.development' }),
    );
  } catch (error) {
    console.log('Could not load dotenv, using default connection string');
  }

  console.log('Creating database client...');
  const client = new Client({
    connectionString:
      process.env.DATABASE_URI ||
      'postgresql://postgres:postgres@localhost:54322/postgres',
  });
  console.log(
    `Using connection string: ${process.env.DATABASE_URI || 'postgresql://postgres:postgres@localhost:54322/postgres'}`,
  );

  try {
    await client.connect();
    await client.query('BEGIN');

    // 1. Get main course ID - needs to be a real ID from your database
    let courseId = '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'; // Hardcoded fallback from known ID

    try {
      const courseResult = await client.query(`
        SELECT id FROM payload.courses
        WHERE slug = 'decks-for-decision-makers'
        LIMIT 1
      `);

      if (courseResult.rowCount > 0) {
        courseId = courseResult.rows[0].id;
      } else {
        console.log('Using hardcoded course ID as fallback');
      }
    } catch (error) {
      console.log('Error fetching course ID, using hardcoded fallback');
    }
    console.log(`Using course ID: ${courseId}`);

    // 2. Update all quizzes to have this course ID
    const quizResult = await client.query(`
      SELECT id, title FROM payload.course_quizzes
    `);

    console.log(`Found ${quizResult.rowCount} quizzes to update`);

    for (const quiz of quizResult.rows) {
      // Update direct field
      await client.query(
        `
        UPDATE payload.course_quizzes
        SET course_id_id = $1
        WHERE id = $2
      `,
        [courseId, quiz.id],
      );

      // Delete any existing relationship entries
      await client.query(
        `
        DELETE FROM payload.course_quizzes_rels
        WHERE _parent_id = $1 AND field = 'course_id'
      `,
        [quiz.id],
      );

      // Create relationship entry
      await client.query(
        `
        INSERT INTO payload.course_quizzes_rels
        (id, _parent_id, field, value, created_at, updated_at, courses_id)
        VALUES (gen_random_uuid(), $1, 'course_id', $2, NOW(), NOW(), $2)
      `,
        [quiz.id, courseId],
      );

      console.log(`Updated quiz: ${quiz.title} (${quiz.id})`);
    }

    // 3. Verify updates
    const verifyResult = await client.query(`
      SELECT 
        cq.id, 
        cq.title, 
        cq.course_id_id, 
        (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE _parent_id = cq.id AND field = 'course_id') as rel_count
      FROM payload.course_quizzes cq
    `);

    console.log('\nVerification results:');
    let allValid = true;

    verifyResult.rows.forEach((row) => {
      const valid = row.course_id_id === courseId && row.rel_count === '1';
      console.log(
        `Quiz "${row.title}": course_id = ${row.course_id_id}, rel_count = ${row.rel_count} - ${valid ? '✅' : '❌'}`,
      );
      if (!valid) allValid = false;
    });

    if (allValid) {
      console.log('\n✅ All quizzes have valid course IDs');
      await client.query('COMMIT');
    } else {
      console.error('\n❌ Some quizzes have invalid course IDs');
      await client.query('ROLLBACK');
      throw new Error('Verification failed');
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fixing quiz course IDs:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the function if called directly
// Using ESM-compatible approach to detect if run directly
const isMainModule = import.meta.url.endsWith(
  process.argv[1].replace(/^file:\/\//, ''),
);
if (isMainModule) {
  fixQuizCourseIds()
    .then(() => console.log('Complete'))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
