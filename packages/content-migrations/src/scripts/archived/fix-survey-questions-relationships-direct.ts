/**
 * Fix Survey Questions Relationships Direct
 *
 * This script fixes the bidirectional relationships between surveys and survey questions
 * by ensuring that the surveys_rels table has the correct entries.
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
 * Fixes survey questions relationships directly in the database
 */
async function fixSurveyQuestionsRelationships() {
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

      // Step 1: Ensure the surveys_rels table exists with proper structure
      await client.query(`
        DO $$
        BEGIN
          -- Create the table if it doesn't exist
          IF NOT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'payload' 
            AND table_name = 'surveys_rels'
          ) THEN
            CREATE TABLE payload.surveys_rels (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              _parent_id uuid NOT NULL REFERENCES payload.surveys(id) ON DELETE CASCADE,
              field VARCHAR(255),
              value uuid,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          END IF;
          
          -- Add field column if it doesn't exist
          IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'payload' 
            AND table_name = 'surveys_rels'
            AND column_name = 'field'
          ) THEN
            ALTER TABLE payload.surveys_rels ADD COLUMN field VARCHAR(255);
          END IF;
          
          -- Add value column if it doesn't exist
          IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'payload' 
            AND table_name = 'surveys_rels'
            AND column_name = 'value'
          ) THEN
            ALTER TABLE payload.surveys_rels ADD COLUMN value uuid;
          END IF;
        END $$;
      `);

      // Step 2: Create bidirectional relationships between surveys and questions
      const result = await client.query(`
        WITH questions_to_link AS (
          SELECT sq.id as question_id, sqr.surveys_id as survey_id
          FROM payload.survey_questions sq
          JOIN payload.survey_questions_rels sqr ON sq.id = sqr._parent_id
          WHERE sqr.surveys_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM payload.surveys_rels sr
            WHERE sr._parent_id = sqr.surveys_id
            AND sr.field = 'questions'
            AND sr.value = sq.id
          )
        )
        INSERT INTO payload.surveys_rels (id, _parent_id, field, value, updated_at, created_at)
        SELECT 
          gen_random_uuid(), 
          survey_id, 
          'questions', 
          question_id,
          NOW(),
          NOW()
        FROM questions_to_link
        RETURNING id;
      `);

      const insertedCount = result.rowCount;
      console.log(
        `Created ${insertedCount} bidirectional relationships in surveys_rels table`,
      );

      // Verify the updates
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

      console.log(`Final verification:`);
      console.log(`- Survey questions with surveys_id: ${questionsCount}`);
      console.log(
        `- Bidirectional relationships in surveys_rels: ${bidirectionalCount}`,
      );

      if (questionsCount === bidirectionalCount) {
        console.log('✅ All relationships are properly established');
      } else {
        console.log('❌ Some relationships are still missing');
      }

      console.log(
        'Successfully completed fix for survey questions bidirectional relationships',
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fixing survey questions relationships:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
fixSurveyQuestionsRelationships().catch((error) => {
  console.error('Failed to fix survey questions relationships:', error);
  process.exit(1);
});
