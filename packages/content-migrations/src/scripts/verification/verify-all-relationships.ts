/**
 * Verify All Relationships
 *
 * This script verifies that all relationships are properly established in the database.
 * It checks for bidirectional relationships between:
 * - Surveys and survey questions
 * - Course quizzes and quiz questions
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
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

console.log(`Loading environment variables from ${envFile}`);
dotenv.config({ path: path.resolve(__dirname, `../../../${envFile}`) });

/**
 * Verifies all relationships in the database
 */
async function verifyAllRelationships() {
  // Get the database connection string from the environment variables
  const databaseUri = process.env.DATABASE_URI;
  if (!databaseUri) {
    throw new Error('DATABASE_URI environment variable is not set');
  }

  console.log(`Connecting to database: ${databaseUri}`);

  // Create a connection pool
  const pool = new Pool({
    connectionString: databaseUri,
  });

  try {
    // Test the connection
    const client = await pool.connect();
    try {
      console.log('Connected to database');

      // Verify survey questions relationships
      console.log('\n--- Verifying Survey Questions Relationships ---');
      const surveyVerificationResult = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM payload.survey_questions_rels WHERE surveys_id IS NOT NULL) as questions_count,
          (SELECT COUNT(*) FROM payload.surveys_rels WHERE field = 'questions') as bidirectional_count;
      `);

      const surveyQuestionsCount = parseInt(
        surveyVerificationResult.rows[0]?.questions_count || '0',
      );
      const surveyBidirectionalCount = parseInt(
        surveyVerificationResult.rows[0]?.bidirectional_count || '0',
      );

      console.log(`Survey questions with surveys_id: ${surveyQuestionsCount}`);
      console.log(
        `Bidirectional relationships in surveys_rels: ${surveyBidirectionalCount}`,
      );

      if (surveyQuestionsCount === surveyBidirectionalCount) {
        console.log('✅ All survey relationships are properly established');
      } else {
        console.log('❌ Some survey relationships are missing');
        console.log(
          `  Missing: ${surveyQuestionsCount - surveyBidirectionalCount}`,
        );
      }

      // Verify quiz questions relationships
      console.log('\n--- Verifying Quiz Questions Relationships ---');
      const quizVerificationResult = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM payload.quiz_questions_rels WHERE field = 'quiz_id') as questions_count,
          (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'questions') as bidirectional_count;
      `);

      const quizQuestionsCount = parseInt(
        quizVerificationResult.rows[0]?.questions_count || '0',
      );
      const quizBidirectionalCount = parseInt(
        quizVerificationResult.rows[0]?.bidirectional_count || '0',
      );

      console.log(`Quiz questions with quiz_id: ${quizQuestionsCount}`);
      console.log(
        `Bidirectional relationships in course_quizzes_rels: ${quizBidirectionalCount}`,
      );

      if (quizQuestionsCount === quizBidirectionalCount) {
        console.log('✅ All quiz relationships are properly established');
      } else {
        console.log('❌ Some quiz relationships are missing');
        console.log(
          `  Missing: ${quizQuestionsCount - quizBidirectionalCount}`,
        );
      }

      // Verify field naming in quiz_questions_rels
      console.log('\n--- Verifying Field Naming in quiz_questions_rels ---');
      const quizFieldResult = await client.query(`
        SELECT COUNT(*) as count FROM payload.quiz_questions_rels WHERE field = 'quiz_id_id';
      `);

      const quizIdIdCount = parseInt(quizFieldResult.rows[0]?.count || '0');

      if (quizIdIdCount === 0) {
        console.log('✅ All field names in quiz_questions_rels are correct');
      } else {
        console.log(
          `❌ Found ${quizIdIdCount} records with incorrect field name 'quiz_id_id'`,
        );
      }

      // Verify field naming in survey_questions_rels
      console.log('\n--- Verifying Field Naming in survey_questions_rels ---');
      const surveyFieldResult = await client.query(`
        SELECT COUNT(*) as count FROM payload.survey_questions_rels WHERE field = 'surveys_id';
      `);

      const surveysIdCount = parseInt(surveyFieldResult.rows[0]?.count || '0');

      if (surveysIdCount === 0) {
        console.log('✅ All field names in survey_questions_rels are correct');
      } else {
        console.log(
          `❌ Found ${surveysIdCount} records with incorrect field name 'surveys_id'`,
        );
      }

      console.log('\nVerification completed');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error verifying relationships:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the verification if this script is executed directly
if (import.meta.url === import.meta.resolve('./verify-all-relationships.ts')) {
  verifyAllRelationships()
    .then(() => {
      console.log('\nVerification completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

export { verifyAllRelationships };
