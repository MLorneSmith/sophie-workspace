/**
 * Verify Survey Questions Relationships Direct
 *
 * This script verifies the bidirectional relationships between surveys and survey questions
 * by checking that the surveys_rels table has the correct entries.
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
dotenv.config({ path: path.resolve(__dirname, `../../${envFile}`) });

/**
 * Verifies survey questions relationships directly in the database
 */
async function verifySurveyQuestionsRelationships() {
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

      // Verify the surveys_rels table exists
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'surveys_rels'
        ) AS exists;
      `);

      if (!tableExists.rows[0].exists) {
        console.error('❌ surveys_rels table does not exist');
        return;
      }

      console.log('✅ surveys_rels table exists');

      // Verify the field column exists
      const fieldColumnExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'surveys_rels'
          AND column_name = 'field'
        ) AS exists;
      `);

      if (!fieldColumnExists.rows[0].exists) {
        console.error('❌ field column does not exist in surveys_rels table');
        return;
      }

      console.log('✅ field column exists in surveys_rels table');

      // Verify the value column exists
      const valueColumnExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'surveys_rels'
          AND column_name = 'value'
        ) AS exists;
      `);

      if (!valueColumnExists.rows[0].exists) {
        console.error('❌ value column does not exist in surveys_rels table');
        return;
      }

      console.log('✅ value column exists in surveys_rels table');

      // Verify the relationships
      const verificationResult = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM payload.survey_questions_rels WHERE surveys_id IS NOT NULL) as questions_count,
          (SELECT COUNT(*) FROM payload.surveys_rels WHERE field = 'questions') as bidirectional_count;
      `);

      const questionsCount = parseInt(
        verificationResult.rows[0]?.questions_count || '0',
      );
      const bidirectionalCount = parseInt(
        verificationResult.rows[0]?.bidirectional_count || '0',
      );

      console.log(`Verification results:`);
      console.log(`- Survey questions with surveys_id: ${questionsCount}`);
      console.log(
        `- Bidirectional relationships in surveys_rels: ${bidirectionalCount}`,
      );

      if (questionsCount === bidirectionalCount) {
        console.log('✅ All relationships are properly established');
      } else {
        console.error('❌ Some relationships are missing');
        console.error(`  Missing: ${questionsCount - bidirectionalCount}`);
      }

      // Get survey details
      const surveyResult = await client.query(`
        SELECT id, title, slug FROM payload.surveys;
      `);

      if (surveyResult.rows.length === 0) {
        console.log('No surveys found in the database');
      } else {
        console.log(`Found ${surveyResult.rows.length} surveys:`);
        for (const survey of surveyResult.rows) {
          const questionCount = await client.query(
            `
            SELECT COUNT(*) FROM payload.surveys_rels 
            WHERE _parent_id = $1 AND field = 'questions';
          `,
            [survey.id],
          );

          console.log(
            `- ${survey.title} (${survey.slug}): ${questionCount.rows[0].count} questions`,
          );
        }
      }

      console.log('Survey questions relationships verification completed');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error verifying survey questions relationships:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
verifySurveyQuestionsRelationships().catch((error) => {
  console.error('Failed to verify survey questions relationships:', error);
  process.exit(1);
});
