/**
 * Script to repair all relationships in the database
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
 * Repairs all relationships in the database
 */
async function repairAllRelationships() {
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

      // Get all collections that might have relationships
      const collections = [
        'media',
        'documentation',
        'posts',
        'surveys',
        'survey_questions',
        'courses',
        'course_lessons',
        'course_quizzes',
        'quiz_questions',
        'users',
        'payload_preferences',
        'payload_locked_documents',
      ];

      // For each collection, repair its relationships
      for (const collection of collections) {
        console.log(`Repairing relationships for ${collection}...`);

        // Find relationship fields in this collection
        const relationshipFields = await client.query(
          `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = $1
          AND column_name LIKE '%_id'
          AND column_name NOT IN ('id', '_parent_id', 'parent_id')
        `,
          [collection],
        );

        for (const field of relationshipFields.rows) {
          const fieldName = field.column_name;
          console.log(`Repairing ${fieldName} in ${collection}...`);

          // Check if the column exists in the relationship table
          const columnExists = await client.query(
            `
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'payload' 
              AND table_name = $1
              AND column_name = $2
            ) AS exists
          `,
            [`${collection}_rels`, fieldName],
          );

          if (columnExists.rows[0].exists) {
            // Check if the parent_id column exists
            const parentIdExists = await client.query(
              `
              SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'payload' 
                AND table_name = $1
                AND column_name = $2
              ) AS exists
            `,
              [`${collection}_rels`, '_parent_id'],
            );

            const parentIdColumn = parentIdExists.rows[0].exists
              ? '_parent_id'
              : 'parent_id';

            // Update relationship tables with the appropriate ID
            try {
              await client.query(`
                UPDATE payload.${collection}_rels
                SET ${fieldName} = ${collection}.${fieldName}
                FROM payload.${collection}
                WHERE ${collection}_rels.${parentIdColumn} = ${collection}.id
                AND ${collection}.${fieldName} IS NOT NULL
              `);
              console.log(`Repaired ${fieldName} in ${collection}`);
            } catch (error) {
              console.error(
                `Error repairing ${fieldName} in ${collection}:`,
                error,
              );
            }
          } else {
            console.log(
              `Column ${fieldName} does not exist in ${collection}_rels, skipping`,
            );
          }
        }
      }

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

      // Note: We're not creating an event trigger because it requires superuser privileges
      // If you have superuser privileges, you can uncomment the following code:
      /*
      console.log(
        'Creating trigger to automatically handle dynamic UUID tables...',
      );
      await client.query(`
        -- Create a trigger to automatically handle dynamic UUID tables
        DROP EVENT TRIGGER IF EXISTS handle_dynamic_uuid_tables;
        
        CREATE EVENT TRIGGER handle_dynamic_uuid_tables
        ON ddl_command_end
        WHEN tag IN ('CREATE TABLE')
        EXECUTE FUNCTION payload.create_dynamic_uuid_table();
      `);
      */

      console.log('All relationships repaired!');
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

// Run the script
repairAllRelationships().catch((error) => {
  console.error('Failed to repair relationships:', error);
  process.exit(1);
});
