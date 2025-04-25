/**
 * DEPRECATED: This script has been superseded by the consolidated quiz relationship migration
 * located at: apps/payload/src/migrations/20250425_150000_consolidated_quiz_relationship_fix.ts
 *
 * The new migration approach provides a more comprehensive solution that handles all aspects
 * of quiz relationships including course IDs.
 */
import { promises as fs } from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Client } = pg;

// Get directory and file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlPath = path.join(__dirname, 'fix-quiz-course-ids.sql');

export async function fixQuizCourseIds(): Promise<void> {
  console.log(
    '⚠️ DEPRECATED: This script has been superseded by the consolidated quiz relationship migration.',
  );
  console.log(
    'Please use the new migration approach for a more robust solution.',
  );
  console.log(
    'For verification, use: pnpm run verify:quiz-relationship-migration',
  );

  // Just return successfully without doing anything - the migration will handle it
  return;
}

// Get current quiz statistics - kept for reference but not used
async function getQuizStats(client: InstanceType<typeof Client>): Promise<{
  totalQuizzes: number;
  withDirectId: number;
  withRelationship: number;
}> {
  try {
    // Query quiz stats
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_quizzes,
        SUM(CASE WHEN course_id_id IS NOT NULL THEN 1 ELSE 0 END) as with_direct_id
      FROM payload.course_quizzes
    `);

    // Query relationship stats
    const relResult = await client.query(`
      SELECT COUNT(DISTINCT _parent_id) as with_relationship
      FROM payload.course_quizzes_rels
      WHERE field = 'course_id'
    `);

    const totalQuizzes = parseInt(statsResult.rows[0].total_quizzes || '0');
    const withDirectId = parseInt(statsResult.rows[0].with_direct_id || '0');
    const withRelationship = parseInt(
      relResult.rows[0].with_relationship || '0',
    );

    console.log(`- Total quizzes: ${totalQuizzes}`);
    console.log(`- Quizzes with direct course ID: ${withDirectId}`);
    console.log(`- Quizzes with relationship entries: ${withRelationship}`);

    return { totalQuizzes, withDirectId, withRelationship };
  } catch (error) {
    console.warn(`Could not get quiz stats: ${error}`);
    return { totalQuizzes: 0, withDirectId: 0, withRelationship: 0 };
  }
}

// Run the function if this file is executed directly
// ESM equivalent of require.main === module
if (import.meta.url.endsWith(process.argv[1])) {
  fixQuizCourseIds()
    .then(() => console.log('Quiz course ID fix completed'))
    .catch((error) => {
      console.error('Failed to fix quiz course IDs:', error);
      process.exit(1);
    });
}
