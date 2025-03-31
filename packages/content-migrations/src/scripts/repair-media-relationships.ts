/**
 * Script to repair media relationships in the database
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
 * Repairs media relationships in the database
 */
async function repairMediaRelationships() {
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

      // Get all tables with upload fields
      const collections = ['courses', 'course_lessons', 'posts'];

      for (const collection of collections) {
        console.log(`Repairing media relationships for ${collection}...`);

        // Find upload fields in this collection
        const uploadFields = await client.query(
          `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = $1
          AND column_name LIKE '%image_id%'
        `,
          [collection],
        );

        for (const field of uploadFields.rows) {
          const fieldName = field.column_name;
          console.log(`Repairing ${fieldName} in ${collection}...`);

          // Update relationship tables with media_id
          await client.query(`
            UPDATE payload.${collection}_rels
            SET media_id = ${collection}.${fieldName}
            FROM payload.${collection}
            WHERE ${collection}_rels._parent_id = ${collection}.id
            AND ${collection}.${fieldName} IS NOT NULL
          `);

          console.log(`Repaired ${fieldName} in ${collection}`);
        }
      }

      // Create a function to handle dynamic UUID tables
      console.log('Creating dynamic table handler function...');
      await client.query(`
        -- Create a function to handle dynamic UUID tables
        CREATE OR REPLACE FUNCTION payload.handle_dynamic_media_table(uuid_table text)
        RETURNS void AS $$
        BEGIN
          -- Create the dynamic table if it doesn't exist
          EXECUTE format('
            CREATE TABLE IF NOT EXISTS payload.%I (
              id uuid PRIMARY KEY,
              media_id uuid
            )', uuid_table);
            
          -- Populate it with data from our view
          EXECUTE format('
            INSERT INTO payload.%I (id, media_id)
            SELECT parent_id, media_id FROM payload.media_relationships
            ON CONFLICT (id) DO NOTHING
          ', uuid_table);
        END;
        $$ LANGUAGE plpgsql;
      `);

      console.log('Media relationships repaired!');
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

// Run the script
repairMediaRelationships().catch((error) => {
  console.error('Failed to repair media relationships:', error);
  process.exit(1);
});
