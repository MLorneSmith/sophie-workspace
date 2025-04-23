/**
 * Consolidated Quiz Course ID Fix
 *
 * This script ensures all quizzes have proper course IDs in both:
 * 1. Direct field storage (course_id_id column)
 * 2. Relationship tables (course_quizzes_rels entries)
 *
 * It also adds a trigger to prevent IDs from being reset and provides
 * comprehensive verification of the fix.
 *
 * This consolidates functionality from:
 * - fix-course-ids-final.ts
 * - fix-quiz-course-ids.ts
 */
import { promises as fs } from 'fs';
import path from 'path';
import { Client } from 'pg';
import { fileURLToPath } from 'url';

// Get directory and file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlPath = path.join(__dirname, 'fix-quiz-course-ids.sql');

export async function fixQuizCourseIds(): Promise<void> {
  console.log('============== CONSOLIDATED QUIZ COURSE ID FIX ==============');
  console.log('Fixing quiz course IDs with comprehensive approach...');

  // Load environment variables
  try {
    const dotenv = await import('dotenv');
    dotenv.config({ path: '.env.development' });
    console.log('Loaded environment variables');
  } catch (error) {
    console.log('Could not load dotenv, using default connection string');
  }

  // Get database connection string from environment or use default
  const connectionString =
    process.env.DATABASE_URI ||
    'postgresql://postgres:postgres@localhost:54322/postgres';

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
    const beforeStats = await getQuizStats(client);

    // Execute SQL script as a single transaction
    console.log('\nExecuting fix script...');
    const result = await client.query(sqlContent);

    // Get detailed status after the fix (from the result of the first SELECT query)
    const detailedStatus = result.rows;

    // Get summary stats after the fix
    console.log('\nState after fix:');
    const afterStats = await getQuizStats(client);

    // Print summary report
    console.log('\nFix Results:');
    console.log(`- Total quizzes: ${afterStats.totalQuizzes}`);
    console.log(
      `- Quizzes with direct course ID: ${beforeStats.withDirectId} → ${afterStats.withDirectId}`,
    );
    console.log(
      `- Quizzes with relationship entries: ${beforeStats.withRelationship} → ${afterStats.withRelationship}`,
    );

    // Determine if fix was successful
    const allValid =
      afterStats.withDirectId === afterStats.totalQuizzes &&
      afterStats.withRelationship === afterStats.totalQuizzes;

    if (allValid) {
      console.log('\n✅ SUCCESS: All quizzes now have proper course IDs');
    } else if (
      afterStats.withDirectId > beforeStats.withDirectId ||
      afterStats.withRelationship > beforeStats.withRelationship
    ) {
      console.log(
        '\n⚠️ PARTIAL SUCCESS: Some quizzes fixed, but issues remain',
      );
      console.log(
        `- ${afterStats.totalQuizzes - afterStats.withDirectId} quizzes missing direct course ID`,
      );
      console.log(
        `- ${afterStats.totalQuizzes - afterStats.withRelationship} quizzes missing relationship entries`,
      );
    } else {
      console.log('\n❌ FAILURE: No improvements were made');
    }

    // If there are invalid quizzes, list them
    const invalidQuizzes = detailedStatus.filter(
      (quiz) => quiz.status === 'INVALID',
    );
    if (invalidQuizzes.length > 0) {
      console.log('\nThe following quizzes still have issues:');
      invalidQuizzes.forEach((quiz) => {
        console.log(
          `- "${quiz.title}" (${quiz.id}): direct_id=${quiz.has_direct_id}, relationship=${quiz.has_relationship}`,
        );
      });
    }

    console.log('\nQuiz course ID fix completed');
  } catch (error) {
    console.error('Error fixing quiz course IDs:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

/**
 * Get current quiz statistics
 */
async function getQuizStats(client: Client): Promise<{
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
if (require.main === module) {
  fixQuizCourseIds()
    .then(() => console.log('Quiz course ID fix completed'))
    .catch((error) => {
      console.error('Failed to fix quiz course IDs:', error);
      process.exit(1);
    });
}
