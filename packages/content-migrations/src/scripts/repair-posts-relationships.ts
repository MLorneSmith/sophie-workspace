/**
 * Script to repair posts relationships in the database
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
 * Repairs posts relationships in the database
 */
async function repairPostsRelationships() {
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

      // Get all tables with posts relationships
      const collections = ['posts'];

      for (const collection of collections) {
        console.log(`Repairing posts relationships for ${collection}...`);

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

          // Update relationship tables with posts_id
          await client.query(`
            UPDATE payload.${collection}_rels
            SET posts_id = ${collection}.${fieldName}
            FROM payload.${collection}
            WHERE ${collection}_rels._parent_id = ${collection}.id
            AND ${collection}.${fieldName} IS NOT NULL
          `);

          console.log(`Repaired ${fieldName} in ${collection}`);
        }
      }

      // Create a function to handle dynamic UUID tables for posts
      console.log('Creating dynamic table handler function for posts...');
      await client.query(`
        -- Create a function to handle dynamic UUID tables for posts
        CREATE OR REPLACE FUNCTION payload.handle_dynamic_posts_table(uuid_table text)
        RETURNS void AS $$
        BEGIN
          -- Create the dynamic table if it doesn't exist
          EXECUTE format('
            CREATE TABLE IF NOT EXISTS payload.%I (
              id uuid PRIMARY KEY,
              posts_id uuid
            )', uuid_table);
            
          -- Populate it with data from our view
          EXECUTE format('
            INSERT INTO payload.%I (id, posts_id)
            SELECT parent_id, posts_id FROM payload.posts_relationships
            ON CONFLICT (id) DO NOTHING
          ', uuid_table);
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Create a universal function to handle any dynamic UUID table
      console.log('Creating universal dynamic table handler...');
      await client.query(`
        -- Create a function to handle any dynamic UUID table
        CREATE OR REPLACE FUNCTION payload.handle_any_dynamic_table(uuid_table text)
        RETURNS void AS $$
        BEGIN
          -- Create the table if it doesn't exist
          EXECUTE format('
            CREATE TABLE IF NOT EXISTS payload.%I (
              id uuid PRIMARY KEY
            )', uuid_table);
          
          -- Add all relationship columns
          PERFORM payload.add_relationship_columns(uuid_table);
        END;
        $$ LANGUAGE plpgsql;
      `);

      console.log('Posts relationships repaired!');
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

// Run the script
repairPostsRelationships().catch((error) => {
  console.error('Failed to repair posts relationships:', error);
  process.exit(1);
});
