/**
 * Script to repair survey_questions relationships in the database
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

/**
 * Repairs survey_questions relationships in the database
 */
async function repairSurveyQuestionsRelationships() {
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

      // Get all tables with survey_questions relationships
      const collections = ['survey_questions'];

      for (const collection of collections) {
        console.log(
          `Repairing survey_questions relationships for ${collection}...`,
        );

        // Find relationship fields in this collection
        const relationshipFields = await client.query(
          `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = $1
          AND column_name LIKE '%_id'
        `,
          [collection],
        );

        for (const field of relationshipFields.rows) {
          const fieldName = field.column_name;
          console.log(`Repairing ${fieldName} in ${collection}...`);

          // Update relationship tables with survey_questions_id
          await client.query(`
            UPDATE payload.${collection}_rels
            SET survey_questions_id = ${collection}.${fieldName}
            FROM payload.${collection}
            WHERE ${collection}_rels._parent_id = ${collection}.id
            AND ${collection}.${fieldName} IS NOT NULL
          `);

          console.log(`Repaired ${fieldName} in ${collection}`);
        }
      }

      // Create a function to handle dynamic UUID tables for survey_questions
      console.log(
        'Creating dynamic table handler function for survey_questions...',
      );
      await client.query(`
        -- Create a function to handle dynamic UUID tables for survey_questions
        CREATE OR REPLACE FUNCTION payload.handle_dynamic_survey_questions_table(uuid_table text)
        RETURNS void AS $$
        BEGIN
          -- Create the dynamic table if it doesn't exist
          EXECUTE format('
            CREATE TABLE IF NOT EXISTS payload.%I (
              id uuid PRIMARY KEY,
              survey_questions_id uuid
            )', uuid_table);
            
          -- Populate it with data from our view
          EXECUTE format('
            INSERT INTO payload.%I (id, survey_questions_id)
            SELECT parent_id, survey_questions_id FROM payload.survey_questions_relationships
            ON CONFLICT (id) DO NOTHING
          ', uuid_table);
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Create a universal function to handle all relationship columns
      console.log('Creating universal relationship handler...');
      await client.query(`
        -- Create a function to handle all relationship columns
        CREATE OR REPLACE FUNCTION payload.handle_all_relationship_columns(uuid_table text)
        RETURNS void AS $$
        BEGIN
          -- Create the table if it doesn't exist
          EXECUTE format('
            CREATE TABLE IF NOT EXISTS payload.%I (
              id uuid PRIMARY KEY
            )', uuid_table);
          
          -- Add all relationship columns
          PERFORM payload.add_relationship_columns(uuid_table);
          
          -- Populate from all relationship views if they exist
          BEGIN
            EXECUTE format('
              INSERT INTO payload.%I (id, media_id)
              SELECT parent_id, media_id FROM payload.media_relationships
              ON CONFLICT (id) DO UPDATE SET media_id = EXCLUDED.media_id
            ', uuid_table);
          EXCEPTION WHEN undefined_table THEN
            -- View doesn't exist, skip
          END;
          
          BEGIN
            EXECUTE format('
              INSERT INTO payload.%I (id, documentation_id)
              SELECT parent_id, documentation_id FROM payload.documentation_relationships
              ON CONFLICT (id) DO UPDATE SET documentation_id = EXCLUDED.documentation_id
            ', uuid_table);
          EXCEPTION WHEN undefined_table THEN
            -- View doesn't exist, skip
          END;
          
          BEGIN
            EXECUTE format('
              INSERT INTO payload.%I (id, posts_id)
              SELECT parent_id, posts_id FROM payload.posts_relationships
              ON CONFLICT (id) DO UPDATE SET posts_id = EXCLUDED.posts_id
            ', uuid_table);
          EXCEPTION WHEN undefined_table THEN
            -- View doesn't exist, skip
          END;
          
          BEGIN
            EXECUTE format('
              INSERT INTO payload.%I (id, surveys_id)
              SELECT parent_id, surveys_id FROM payload.surveys_relationships
              ON CONFLICT (id) DO UPDATE SET surveys_id = EXCLUDED.surveys_id
            ', uuid_table);
          EXCEPTION WHEN undefined_table THEN
            -- View doesn't exist, skip
          END;
          
          BEGIN
            EXECUTE format('
              INSERT INTO payload.%I (id, survey_questions_id)
              SELECT parent_id, survey_questions_id FROM payload.survey_questions_relationships
              ON CONFLICT (id) DO UPDATE SET survey_questions_id = EXCLUDED.survey_questions_id
            ', uuid_table);
          EXCEPTION WHEN undefined_table THEN
            -- View doesn't exist, skip
          END;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Create a function to handle all dynamic UUID tables
      console.log('Creating function to handle all dynamic UUID tables...');
      await client.query(`
        -- Create a function to handle all dynamic UUID tables
        CREATE OR REPLACE FUNCTION payload.handle_all_dynamic_tables()
        RETURNS void AS $$
        DECLARE
          uuid_table record;
        BEGIN
          -- Get all tables with UUID pattern names
          FOR uuid_table IN 
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'payload' 
            AND table_name ~ '[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}'
          LOOP
            -- Add all relationship columns to the table
            PERFORM payload.handle_all_relationship_columns(uuid_table.table_name);
          END LOOP;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Run the function to handle all dynamic UUID tables
      console.log('Running function to handle all dynamic UUID tables...');
      await client.query(`
        -- Run the function to handle all dynamic UUID tables
        SELECT payload.handle_all_dynamic_tables();
      `);

      console.log('Survey questions relationships repaired!');
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

// Run the script
repairSurveyQuestionsRelationships().catch((error) => {
  console.error('Failed to repair survey questions relationships:', error);
  process.exit(1);
});
