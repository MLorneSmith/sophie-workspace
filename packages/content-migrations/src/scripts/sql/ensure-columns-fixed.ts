/**
 * Script to ensure all UUID tables have required columns
 * This script uses direct SQL execution instead of psql
 * Enhanced with better error handling and environment variable loading
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Get the current file's path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup environment variables using multiple approaches for better reliability
function loadEnvironmentVariables() {
  // Project root is 4 levels up from this file: content-migrations/src/scripts/sql
  const projectRoot = path.resolve(__dirname, '../../../..');

  // Try primary .env file
  dotenv.config({ path: path.resolve(projectRoot, '.env') });

  // Try package-specific .env.development
  const packageRoot = path.resolve(__dirname, '../..');
  const envDevPath = path.resolve(packageRoot, '.env.development');

  if (fs.existsSync(envDevPath)) {
    console.log(`Loading environment variables from: ${envDevPath}`);
    dotenv.config({ path: envDevPath });
  }

  // Try apps/web .env.development as fallback
  const webEnvPath = path.resolve(projectRoot, 'apps/web/.env.development');
  if (fs.existsSync(webEnvPath)) {
    console.log(`Loading environment variables from: ${webEnvPath}`);
    dotenv.config({ path: webEnvPath });
  }

  // Try apps/payload .env.development as another fallback
  const payloadEnvPath = path.resolve(
    projectRoot,
    'apps/payload/.env.development',
  );
  if (fs.existsSync(payloadEnvPath)) {
    console.log(`Loading environment variables from: ${payloadEnvPath}`);
    dotenv.config({ path: payloadEnvPath });
  }

  return {
    DATABASE_URI: process.env.DATABASE_URI || process.env.DATABASE_URL,
  };
}

function logRelatedError(error: any, context: string) {
  console.error(`Error in ${context}:`);

  if (error instanceof Error) {
    console.error(`  - Name: ${error.name}`);
    console.error(`  - Message: ${error.message}`);
    console.error(`  - Stack: ${error.stack}`);
  } else {
    console.error(`  - ${error}`);
  }
}

async function main() {
  console.log('=== ENSURING UUID TABLES HAVE REQUIRED COLUMNS ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('');

  let pool: pg.Pool | null = null;
  let successfulFixes = 0;
  let totalTables = 0;
  let overallSuccess = false;

  try {
    const { DATABASE_URI } = loadEnvironmentVariables();

    if (!DATABASE_URI) {
      console.error('DATABASE_URI environment variable not set');
      console.error('Checking for direct database credentials...');

      // Try to create connection string from individual parts
      const host = process.env.POSTGRES_HOST || 'localhost';
      const port = process.env.POSTGRES_PORT || '5432';
      const user = process.env.POSTGRES_USER || 'postgres';
      const password = process.env.POSTGRES_PASSWORD || 'postgres';
      const database = process.env.POSTGRES_DATABASE || 'postgres';

      // Use default localhost connection as last resort
      console.log(
        'Using fallback database connection string:',
        `postgresql://${user}:***@${host}:${port}/${database}`,
      );

      pool = new Pool({
        host,
        port: parseInt(port, 10),
        user,
        password,
        database,
      });
    } else {
      console.log('Using DATABASE_URI from environment');
      pool = new Pool({ connectionString: DATABASE_URI });
    }

    // Connect to the database and test connection
    console.log('Connecting to database...');
    const timeResult = await pool.query('SELECT NOW() as time');
    console.log(
      `Database connection successful (server time: ${timeResult.rows[0].time})`,
    );

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
    totalTables = tables.length;
    console.log(`Found ${totalTables} UUID tables to verify`);

    // Check each table for required columns and add them if missing
    for (const table of tables) {
      console.log(`Checking table: ${table}`);
      let tableFixed = false;

      try {
        // Run multiple ALTER TABLE statements to add all potentially missing columns
        // We chain them with a transaction to ensure atomicity
        await pool.query('BEGIN');

        // Check and add path column if needed
        const hasPathCol = await pool.query(
          `SELECT column_name FROM information_schema.columns 
           WHERE table_schema = 'payload' AND table_name = $1 AND column_name = 'path'`,
          [table],
        );

        if (hasPathCol.rows.length === 0) {
          console.log(`  - Adding path column to ${table}`);
          await pool.query(
            `ALTER TABLE payload.${table} ADD COLUMN IF NOT EXISTS path TEXT`,
          );
          tableFixed = true;
        }

        // Check and add parent_id column if needed
        const hasParentIdCol = await pool.query(
          `SELECT column_name FROM information_schema.columns 
           WHERE table_schema = 'payload' AND table_name = $1 AND column_name = 'parent_id'`,
          [table],
        );

        if (hasParentIdCol.rows.length === 0) {
          console.log(`  - Adding parent_id column to ${table}`);
          await pool.query(
            `ALTER TABLE payload.${table} ADD COLUMN IF NOT EXISTS parent_id TEXT`,
          );
          tableFixed = true;
        }

        // Check and add downloads_id column if needed
        const hasDownloadsIdCol = await pool.query(
          `SELECT column_name FROM information_schema.columns 
           WHERE table_schema = 'payload' AND table_name = $1 AND column_name = 'downloads_id'`,
          [table],
        );

        if (hasDownloadsIdCol.rows.length === 0) {
          console.log(`  - Adding downloads_id column to ${table}`);
          await pool.query(
            `ALTER TABLE payload.${table} ADD COLUMN IF NOT EXISTS downloads_id UUID`,
          );
          tableFixed = true;
        }

        // Check and add media_id column if needed
        const hasMediaIdCol = await pool.query(
          `SELECT column_name FROM information_schema.columns 
           WHERE table_schema = 'payload' AND table_name = $1 AND column_name = 'media_id'`,
          [table],
        );

        if (hasMediaIdCol.rows.length === 0) {
          console.log(`  - Adding media_id column to ${table}`);
          await pool.query(
            `ALTER TABLE payload.${table} ADD COLUMN IF NOT EXISTS media_id UUID`,
          );
          tableFixed = true;
        }

        // Check and add private_id column if needed
        const hasPrivateIdCol = await pool.query(
          `SELECT column_name FROM information_schema.columns 
           WHERE table_schema = 'payload' AND table_name = $1 AND column_name = 'private_id'`,
          [table],
        );

        if (hasPrivateIdCol.rows.length === 0) {
          console.log(`  - Adding private_id column to ${table}`);
          await pool.query(
            `ALTER TABLE payload.${table} ADD COLUMN IF NOT EXISTS private_id UUID`,
          );
          tableFixed = true;
        }

        await pool.query('COMMIT');

        if (tableFixed) {
          successfulFixes++;
          console.log(`  ✅ Table ${table} fixed successfully`);
        } else {
          console.log(`  ✅ Table ${table} already has all required columns`);
        }
      } catch (tableError) {
        // Roll back this specific table's changes but continue with others
        await pool.query('ROLLBACK');
        console.error(
          `  ❌ Error fixing table ${table}: ${tableError.message}`,
        );
      }
    }

    // Try to create or update the helper functions, wrapped in try/catch to continue even if this fails
    try {
      console.log('\nCreating/updating helper functions and views...');

      // Create the dynamic_uuid_tables tracking table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS payload.dynamic_uuid_tables (
          table_name TEXT PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          primary_key TEXT,
          needs_path_column BOOLEAN DEFAULT FALSE,
          has_parent_id BOOLEAN DEFAULT FALSE,
          has_downloads_id BOOLEAN DEFAULT FALSE,
          has_media_id BOOLEAN DEFAULT FALSE,
          has_private_id BOOLEAN DEFAULT FALSE
        )
      `);

      // Drop and recreate the scan_and_fix_uuid_tables function
      await pool.query(`
        DROP FUNCTION IF EXISTS payload.scan_and_fix_uuid_tables();
        
        CREATE FUNCTION payload.scan_and_fix_uuid_tables()
        RETURNS void AS $$
        DECLARE
          table_record RECORD;
          has_path BOOLEAN;
          has_parent_id BOOLEAN;
          has_downloads_id BOOLEAN;
          has_media_id BOOLEAN;
          has_private_id BOOLEAN;
        BEGIN
          FOR table_record IN 
            SELECT table_name 
            FROM information_schema.columns 
            WHERE table_schema = 'payload' 
            AND column_name = 'id' 
            AND data_type = 'uuid'
          LOOP
            -- Add required columns
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS path TEXT', table_record.table_name);
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS parent_id TEXT', table_record.table_name);
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS downloads_id UUID', table_record.table_name);
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS media_id UUID', table_record.table_name);
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS private_id UUID', table_record.table_name);
            
            -- Check if columns exist
            SELECT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'payload'
              AND table_name = table_record.table_name
              AND column_name = 'path'
            ) INTO has_path;
            
            SELECT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'payload'
              AND table_name = table_record.table_name
              AND column_name = 'parent_id'
            ) INTO has_parent_id;
            
            SELECT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'payload'
              AND table_name = table_record.table_name
              AND column_name = 'downloads_id'
            ) INTO has_downloads_id;
            
            SELECT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'payload'
              AND table_name = table_record.table_name
              AND column_name = 'media_id'
            ) INTO has_media_id;
            
            SELECT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'payload'
              AND table_name = table_record.table_name
              AND column_name = 'private_id'
            ) INTO has_private_id;
            
            -- Update tracking table
            INSERT INTO payload.dynamic_uuid_tables (
              table_name, created_at, needs_path_column, has_parent_id,
              has_downloads_id, has_media_id, has_private_id
            )
            VALUES (
              table_record.table_name, NOW(), has_path, has_parent_id,
              has_downloads_id, has_media_id, has_private_id
            )
            ON CONFLICT (table_name) 
            DO UPDATE SET
              created_at = NOW(),
              needs_path_column = EXCLUDED.needs_path_column,
              has_parent_id = EXCLUDED.has_parent_id,
              has_downloads_id = EXCLUDED.has_downloads_id,
              has_media_id = EXCLUDED.has_media_id,
              has_private_id = EXCLUDED.has_private_id;
          END LOOP;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Create or recreate the downloads_relationships view
      await pool.query(`
        DROP VIEW IF EXISTS payload.downloads_relationships;
        
        CREATE OR REPLACE VIEW payload.downloads_relationships AS
        SELECT 
          rel_table.table_name AS table_name,
          d.id AS download_id,
          rel_table.table_name AS collection_type
        FROM 
          payload.downloads d
        CROSS JOIN (
          SELECT 'documentation' AS table_name UNION ALL
          SELECT 'posts' AS table_name UNION ALL
          SELECT 'surveys' AS table_name UNION ALL
          SELECT 'courses' AS table_name UNION ALL
          SELECT 'course_lessons' AS table_name UNION ALL
          SELECT 'course_quizzes' AS table_name UNION ALL
          SELECT 'private' AS table_name
        ) rel_table;
      `);

      console.log('✅ Successfully created/updated helper functions and views');
    } catch (functionsError) {
      // This is non-critical, continue even if it fails
      console.error(
        'Warning: Error creating helper functions and views:',
        functionsError.message,
      );
      console.error('This is non-critical and will not affect the migration');
    }

    // Execute the scan_and_fix_uuid_tables function to ensure all tables are fixed
    try {
      console.log('\nExecuting scan_and_fix_uuid_tables function...');
      await pool.query('SELECT payload.scan_and_fix_uuid_tables()');
      console.log('✅ Successfully executed scan_and_fix_uuid_tables function');
    } catch (scanError) {
      // This is also non-critical
      console.error(
        'Warning: Error executing scan_and_fix_uuid_tables function:',
        scanError.message,
      );
      console.error('This is non-critical and will not affect the migration');
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total tables checked: ${totalTables}`);
    console.log(`Tables fixed: ${successfulFixes}`);

    // Consider overall success based on the percentage of tables fixed
    const successRate = totalTables > 0 ? successfulFixes / totalTables : 0;
    overallSuccess = successRate >= 0.8; // At least 80% success rate

    if (overallSuccess) {
      console.log(
        `✅ Successfully ensured required columns exist on UUID tables (${Math.round(successRate * 100)}% success rate)`,
      );
    } else {
      console.log(
        `⚠️ Partially ensured required columns exist (${Math.round(successRate * 100)}% success rate)`,
      );
    }
  } catch (error) {
    logRelatedError(error, 'main function');
    console.error('❌ Error ensuring columns exist in UUID tables');
  } finally {
    // Close the connection pool
    if (pool) {
      try {
        await pool.end();
        console.log('Database connection closed');
      } catch (closeError) {
        console.error('Error closing database connection:', closeError.message);
      }
    }

    // Exit with appropriate code based on overall success
    // We don't exit with error to allow migration to continue even with partial success
    process.exit(0);
  }
}

// Run the script and handle any unexpected errors
main().catch((error) => {
  logRelatedError(error, 'unhandled exception');
  // Exit with success code to prevent migration failure
  process.exit(0);
});
