/**
 * Course-Quiz Relationship Fix
 *
 * This script addresses a specific issue where quiz-question relationships are working,
 * but course-quiz relationships are missing. It:
 *
 * 1. Sets course_id_id field for all quizzes in course_quizzes table
 * 2. Creates required entries in course_quizzes_rels for the relationship
 * 3. Verifies fix consistency between direct field and relationship storage
 *
 * This is a highly focused fix that targets only the course-quiz relationship issue.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { Client } from 'pg';
import { fileURLToPath } from 'url';

// Get directory and file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlPath = path.join(__dirname, 'fix-course-quiz-relationships.sql');

export async function fixCourseQuizRelationships(): Promise<void> {
  // Get database connection string from environment or use default
  const connectionString =
    process.env.DATABASE_URI ||
    'postgresql://postgres:postgres@localhost:54322/postgres';

  console.log('Starting course-quiz relationship fix...');
  console.log(`Using connection string: ${connectionString}`);

  // Create database client
  const client = new Client({ connectionString });

  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database successfully');

    // Load SQL script
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    console.log('Loaded SQL script successfully');

    // First check the current state
    console.log('\nCurrent state before fix:');
    const beforeCounts = await getRelationshipCounts(client);

    // Execute SQL script as a single transaction
    console.log('\nExecuting fix script...');
    await client.query(sqlContent);

    // Get counts after fix
    console.log('\nState after fix:');
    const afterCounts = await getRelationshipCounts(client);

    // Report results
    console.log('\nResults summary:');
    console.log(
      `  - Direct field: ${beforeCounts.directCount} → ${afterCounts.directCount} quizzes linked to course`,
    );
    console.log(
      `  - Relationship entries: ${beforeCounts.relCount} → ${afterCounts.relCount} entries created`,
    );

    if (afterCounts.directCount === 0) {
      console.error('\n❌ Failed to fix direct quiz-course links');
    } else if (afterCounts.relCount === 0) {
      console.error('\n❌ Failed to create relationship entries');
    } else if (afterCounts.directCount !== afterCounts.relCount) {
      console.warn(
        '\n⚠️ Inconsistency between direct fields and relationship entries',
      );
    } else {
      console.log(
        `\n✅ Successfully fixed ${afterCounts.directCount} quiz-course relationships`,
      );
    }
  } catch (error) {
    console.error('Error fixing course-quiz relationships:', error);
    throw error;
  } finally {
    // Always disconnect from database
    await client.end();
    console.log('Disconnected from database');
  }
}

/**
 * Get counts of relationship fields and entries
 */
async function getRelationshipCounts(client: Client): Promise<{
  directCount: number;
  relCount: number;
}> {
  // Check direct field in course_quizzes
  const directResult = await client.query(
    `SELECT COUNT(*) as count FROM payload.course_quizzes WHERE course_id_id IS NOT NULL AND course_id_id != ''`,
  );

  // Check relationship entries in course_quizzes_rels
  const relResult = await client.query(
    `SELECT COUNT(*) as count FROM payload.course_quizzes_rels WHERE field = 'course_id'`,
  );

  const directCount = parseInt(directResult.rows[0].count);
  const relCount = parseInt(relResult.rows[0].count);

  console.log(`  - Quizzes with course_id_id set: ${directCount}`);
  console.log(`  - Quiz-course relationship entries: ${relCount}`);

  return { directCount, relCount };
}

// Run the function if this file is executed directly
if (require.main === module) {
  fixCourseQuizRelationships()
    .then(() => console.log('Course-quiz relationship fix completed'))
    .catch((error) => {
      console.error('Failed to fix course-quiz relationships:', error);
      process.exit(1);
    });
}
