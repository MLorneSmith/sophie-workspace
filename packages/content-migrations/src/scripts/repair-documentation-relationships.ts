/**
 * Script to repair documentation relationships in the database
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
 * Repairs documentation relationships in the database
 */
async function repairDocumentationRelationships() {
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

      // Get all tables with documentation relationships
      const collections = ['documentation'];

      for (const collection of collections) {
        console.log(
          `Repairing documentation relationships for ${collection}...`,
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

          // Update relationship tables with documentation_id
          await client.query(`
            UPDATE payload.${collection}_rels
            SET documentation_id = ${collection}.${fieldName}
            FROM payload.${collection}
            WHERE ${collection}_rels._parent_id = ${collection}.id
            AND ${collection}.${fieldName} IS NOT NULL
          `);

          console.log(`Repaired ${fieldName} in ${collection}`);
        }
      }

      // Create a function to handle dynamic UUID tables
      console.log(
        'Creating dynamic table handler function for documentation...',
      );
      await client.query(`
        -- Create a function to handle dynamic UUID tables for documentation
        CREATE OR REPLACE FUNCTION payload.handle_dynamic_documentation_table(uuid_table text)
        RETURNS void AS $$
        BEGIN
          -- Create the dynamic table if it doesn't exist
          EXECUTE format('
            CREATE TABLE IF NOT EXISTS payload.%I (
              id uuid PRIMARY KEY,
              documentation_id uuid
            )', uuid_table);
            
          -- Populate it with data from our view
          EXECUTE format('
            INSERT INTO payload.%I (id, documentation_id)
            SELECT parent_id, documentation_id FROM payload.documentation_relationships
            ON CONFLICT (id) DO NOTHING
          ', uuid_table);
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Create a function to handle any dynamic UUID table
      console.log('Creating universal dynamic table handler...');
      await client.query(`
        -- Create a function to handle any dynamic UUID table
        CREATE OR REPLACE FUNCTION payload.create_dynamic_table(uuid_table text)
        RETURNS void AS $$
        DECLARE
          column_exists boolean;
        BEGIN
          -- Create the dynamic table if it doesn't exist
          EXECUTE format('
            CREATE TABLE IF NOT EXISTS payload.%I (
              id uuid PRIMARY KEY
            )', uuid_table);
          
          -- Check if media_id column exists
          EXECUTE format('
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = ''payload'' 
              AND table_name = ''%I''
              AND column_name = ''media_id''
            )', uuid_table) INTO column_exists;
          
          -- Add media_id column if it doesn't exist
          IF NOT column_exists THEN
            EXECUTE format('
              ALTER TABLE payload.%I 
              ADD COLUMN media_id uuid
            ', uuid_table);
          END IF;
          
          -- Check if documentation_id column exists
          EXECUTE format('
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = ''payload'' 
              AND table_name = ''%I''
              AND column_name = ''documentation_id''
            )', uuid_table) INTO column_exists;
          
          -- Add documentation_id column if it doesn't exist
          IF NOT column_exists THEN
            EXECUTE format('
              ALTER TABLE payload.%I 
              ADD COLUMN documentation_id uuid
            ', uuid_table);
          END IF;
          
          -- Add any other relationship columns here as needed
        END;
        $$ LANGUAGE plpgsql;
      `);

      console.log('Documentation relationships repaired!');
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

// Run the script
repairDocumentationRelationships().catch((error) => {
  console.error('Failed to repair documentation relationships:', error);
  process.exit(1);
});
