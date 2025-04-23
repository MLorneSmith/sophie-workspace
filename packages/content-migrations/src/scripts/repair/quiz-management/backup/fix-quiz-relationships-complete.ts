/**
 * Comprehensive Quiz Relationship Fix
 *
 * This script fixes all issues with quiz relationships:
 * 1. Sets course_id_id on all quizzes with proper type casting
 * 2. Creates course relationship entries in course_quizzes_rels
 * 3. Creates bidirectional quiz-question relationships in course_quizzes_rels
 */
import { promises as fs } from 'fs';
import path from 'path';
import { Client } from 'pg';
import { fileURLToPath } from 'url';

// Get directory and file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlPath = path.join(__dirname, 'fix-quiz-relationships-complete.sql');

export async function fixQuizRelationshipsComplete(): Promise<void> {
  // Get database connection string from environment or use default
  const connectionString =
    process.env.DATABASE_URI ||
    'postgresql://postgres:postgres@localhost:54322/postgres';

  console.log('Starting comprehensive quiz relationship fix...');
  console.log(`Using connection string: ${connectionString}`);

  // Create database client
  const client = new Client({ connectionString });

  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database successfully');

    // Load and execute SQL script
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    console.log('Loaded SQL script successfully');

    // Execute SQL script - execute as a single command to maintain transaction integrity
    const result = await client.query(sqlContent);

    // Parse and log verification results
    const results = result.rows;
    if (results && results.length >= 3) {
      console.log('\nVerification Results:');
      console.log(
        `- Quizzes with course ID: ${results[0].quizzes_with_course_id}`,
      );
      console.log(`- Course relationships: ${results[1].course_relationships}`);
      console.log(
        `- Question relationships: ${results[2].question_relationships}`,
      );

      // Check if all quizzes have course IDs
      const allQuizzesResult = await client.query(
        'SELECT COUNT(*) as total FROM payload.course_quizzes',
      );
      const totalQuizzes = allQuizzesResult.rows[0].total;
      const quizzesWithCourseId = parseInt(results[0].quizzes_with_course_id);

      if (quizzesWithCourseId === totalQuizzes) {
        console.log(
          `\nSUCCESS: All ${totalQuizzes} quizzes now have course IDs`,
        );
      } else {
        console.warn(
          `\nWARNING: Only ${quizzesWithCourseId} of ${totalQuizzes} quizzes have course IDs`,
        );
      }
    } else {
      console.log(
        'Script executed but verification results were not as expected',
      );
    }

    console.log('\nQuiz relationship fix completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fixing quiz relationships:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  fixQuizRelationshipsComplete()
    .then(() => console.log('Quiz relationships fixed successfully'))
    .catch((error) => {
      console.error('Failed to fix quiz relationships:', error);
      process.exit(1);
    });
}
