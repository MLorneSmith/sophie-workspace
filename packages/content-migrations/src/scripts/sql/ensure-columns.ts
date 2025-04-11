/**
 * Script to ensure all UUID tables have required columns
 * This script uses direct SQL execution instead of psql
 */
import pg from 'pg';

import { getEnvVars } from '../../utils/get-env-vars.js';

const { Pool } = pg;

async function main() {
  console.log('=== ENSURING UUID TABLES HAVE REQUIRED COLUMNS ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('');

  const { DATABASE_URI } = getEnvVars();

  if (!DATABASE_URI) {
    console.error('DATABASE_URI environment variable not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: DATABASE_URI,
  });

  try {
    // Connect to the database
    console.log('Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');

    // Get all tables in the payload schema that have id column of UUID type
    console.log('Finding UUID tables...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.columns 
      WHERE table_schema = 'payload' 
      AND column_name = 'id' 
      AND data_type = 'uuid'
    `);

    const tables = tablesResult.rows.map((row) => row.table_name);
    console.log(`Found ${tables.length} UUID tables`);

    // Check each table for the path column and add it if missing
    let fixedTables = 0;

    for (const table of tables) {
      console.log(`Checking table: ${table}`);

      // Check if path column exists
      const columnResult = await pool.query(
        `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = $1 
        AND column_name = 'path'
      `,
        [table],
      );

      // If path column doesn't exist, add it
      if (columnResult.rows.length === 0) {
        console.log(`Adding path column to ${table}...`);
        await pool.query(`
          ALTER TABLE payload.${table} 
          ADD COLUMN IF NOT EXISTS path TEXT
        `);
        fixedTables++;
      }
    }

    console.log(`Fixed ${fixedTables} tables`);

    // Drop function first to avoid "cannot change return type of existing function" error
    console.log('Creating scan_and_fix_uuid_tables function...');
    try {
      // First drop the function if it exists
      await pool.query(`
        DO $$ 
        BEGIN
          IF EXISTS (
            SELECT 1 FROM pg_proc 
            JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
            WHERE proname = 'scan_and_fix_uuid_tables' 
            AND pg_namespace.nspname = 'payload'
          ) THEN
            DROP FUNCTION payload.scan_and_fix_uuid_tables();
          END IF;
        END $$;
      `);

      // Then create the function
      await pool.query(`
        CREATE FUNCTION payload.scan_and_fix_uuid_tables()
        RETURNS void AS $$
        DECLARE
          table_record RECORD;
        BEGIN
          FOR table_record IN 
            SELECT table_name 
            FROM information_schema.columns 
            WHERE table_schema = 'payload' 
            AND column_name = 'id' 
            AND data_type = 'uuid'
          LOOP
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS path TEXT', table_record.table_name);
          END LOOP;
        END;
        $$ LANGUAGE plpgsql;
      `);

      console.log('✅ Successfully created scan_and_fix_uuid_tables function');
    } catch (error) {
      console.log('Warning: Could not recreate function:', error);
      console.log('This is non-critical and will not affect the migration');
    }

    // Update the downloads_relationships view if it exists
    const viewExists = await pool.query(`
      SELECT 1 
      FROM information_schema.views 
      WHERE table_schema = 'payload' 
      AND table_name = 'downloads_relationships'
    `);

    if (viewExists.rows.length > 0) {
      console.log('Recreating downloads_relationships view...');
      await pool.query(`
        DROP VIEW IF EXISTS payload.downloads_relationships;
        
        CREATE OR REPLACE VIEW payload.downloads_relationships AS
        SELECT 
          collection_rel.id AS collection_id,
          download.id AS download_id,
          collection_rel_type.table_name AS collection_type,
          collection_rel_type.table_name
        FROM 
          payload.downloads download
        LEFT JOIN LATERAL (
          SELECT 'documentation' AS table_name UNION
          SELECT 'posts' AS table_name UNION
          SELECT 'surveys' AS table_name UNION
          SELECT 'courses' AS table_name UNION
          SELECT 'course_lessons' AS table_name UNION
          SELECT 'course_quizzes' AS table_name
        ) collection_rel_type ON true
        LEFT JOIN LATERAL (
          SELECT id FROM payload.documentation WHERE id IS NOT NULL
          UNION ALL
          SELECT id FROM payload.posts WHERE id IS NOT NULL
          UNION ALL 
          SELECT id FROM payload.surveys WHERE id IS NOT NULL
          UNION ALL
          SELECT id FROM payload.courses WHERE id IS NOT NULL
          UNION ALL
          SELECT id FROM payload.course_lessons WHERE id IS NOT NULL
          UNION ALL
          SELECT id FROM payload.course_quizzes WHERE id IS NOT NULL
        ) collection_rel(id) ON true;
      `);
    }

    console.log(
      '✅ Successfully ensured required columns exist on all UUID tables',
    );
  } catch (error) {
    console.error('Error ensuring columns exist:', error);
    process.exit(1);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the script
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
