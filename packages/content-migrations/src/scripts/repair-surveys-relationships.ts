/**
 * Script to repair surveys relationships in the database
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
 * Repairs surveys relationships in the database
 */
async function repairSurveysRelationships() {
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

      // Get all tables with surveys relationships
      const collections = ['surveys'];

      for (const collection of collections) {
        console.log(`Repairing surveys relationships for ${collection}...`);

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

          // Update relationship tables with surveys_id
          await client.query(`
            UPDATE payload.${collection}_rels
            SET surveys_id = ${collection}.${fieldName}
            FROM payload.${collection}
            WHERE ${collection}_rels._parent_id = ${collection}.id
            AND ${collection}.${fieldName} IS NOT NULL
          `);

          console.log(`Repaired ${fieldName} in ${collection}`);
        }
      }

      // Create a function to handle dynamic UUID tables for surveys
      console.log('Creating dynamic table handler function for surveys...');
      await client.query(`
        -- Create a function to handle dynamic UUID tables for surveys
        CREATE OR REPLACE FUNCTION payload.handle_dynamic_surveys_table(uuid_table text)
        RETURNS void AS $$
        BEGIN
          -- Create the dynamic table if it doesn't exist
          EXECUTE format('
            CREATE TABLE IF NOT EXISTS payload.%I (
              id uuid PRIMARY KEY,
              surveys_id uuid
            )', uuid_table);
            
          -- Populate it with data from our view
          EXECUTE format('
            INSERT INTO payload.%I (id, surveys_id)
            SELECT parent_id, surveys_id FROM payload.surveys_relationships
            ON CONFLICT (id) DO NOTHING
          ', uuid_table);
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Create a universal function to handle any dynamic UUID table
      console.log('Creating universal dynamic table handler...');
      await client.query(`
        -- Create a function to handle any dynamic UUID table
        CREATE OR REPLACE FUNCTION payload.handle_all_dynamic_tables(uuid_table text)
        RETURNS void AS $$
        BEGIN
          -- Create the table if it doesn't exist
          EXECUTE format('
            CREATE TABLE IF NOT EXISTS payload.%I (
              id uuid PRIMARY KEY
            )', uuid_table);
          
          -- Add all relationship columns
          PERFORM payload.add_relationship_columns(uuid_table);
          
          -- Populate from all relationship views
          EXECUTE format('
            INSERT INTO payload.%I (id, media_id)
            SELECT parent_id, media_id FROM payload.media_relationships
            ON CONFLICT (id) DO UPDATE SET media_id = EXCLUDED.media_id
          ', uuid_table);
          
          EXECUTE format('
            INSERT INTO payload.%I (id, documentation_id)
            SELECT parent_id, documentation_id FROM payload.documentation_relationships
            ON CONFLICT (id) DO UPDATE SET documentation_id = EXCLUDED.documentation_id
          ', uuid_table);
          
          EXECUTE format('
            INSERT INTO payload.%I (id, posts_id)
            SELECT parent_id, posts_id FROM payload.posts_relationships
            ON CONFLICT (id) DO UPDATE SET posts_id = EXCLUDED.posts_id
          ', uuid_table);
          
          EXECUTE format('
            INSERT INTO payload.%I (id, surveys_id)
            SELECT parent_id, surveys_id FROM payload.surveys_relationships
            ON CONFLICT (id) DO UPDATE SET surveys_id = EXCLUDED.surveys_id
          ', uuid_table);
        END;
        $$ LANGUAGE plpgsql;
      `);

      console.log('Surveys relationships repaired!');
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

// Run the script
repairSurveysRelationships().catch((error) => {
  console.error('Failed to repair surveys relationships:', error);
  process.exit(1);
});
