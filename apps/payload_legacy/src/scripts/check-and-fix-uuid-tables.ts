#!/usr/bin/env tsx
/**
 * Check and Fix UUID Tables Script
 *
 * This script checks if the UUID table scanner migration has been applied,
 * and can run it via SQL if needed. This is useful for environments where
 * the migration hasn't been applied yet or for quick fixes.
 *
 * Usage:
 *   pnpm tsx src/scripts/check-and-fix-uuid-tables.ts
 */

import dotenv from 'dotenv'
import path from 'path'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'

// Setup environment
dotenv.config()

async function checkAndFixUuidTables() {
  console.log(`=== UUID TABLE CHECKER AND FIXER ===`)
  console.log(`Timestamp: ${new Date().toISOString()}`)
  console.log()

  // Initialize Payload
  console.log('Initializing Payload...')
  const payload = await getPayload({
    config: process.env.PAYLOAD_CONFIG_PATH
      ? require(process.env.PAYLOAD_CONFIG_PATH)
      : {
          collections: [],
        },
  })

  console.log('Testing database connection...')
  try {
    // Simple test query to verify database connection
    const connectionTest = await payload.db.drizzle.execute(sql`SELECT NOW() as time`)
    console.log(
      `Database connection successful, server time: ${connectionTest?.rows?.[0]?.time || 'unknown'}`,
    )
  } catch (error) {
    console.error(`Database connection failed:`, error)
    process.exit(1)
  }

  // Check if the scanner function exists
  console.log('\nChecking for scanner function...')
  try {
    const functionTest = await payload.db.drizzle.execute(sql`
      SELECT EXISTS (
        SELECT FROM pg_proc
        WHERE pronamespace = 'payload'::regnamespace
        AND proname = 'scan_and_fix_uuid_tables'
      ) as exists
    `)

    const functionExists = functionTest?.rows?.[0]?.exists === true

    if (!functionExists) {
      console.log('❌ UUID table scanner function does not exist')
      console.log('Creating scanner function and related objects...')

      // Create the tracking table if it doesn't exist
      await payload.db.drizzle.execute(sql`
        CREATE TABLE IF NOT EXISTS payload.dynamic_uuid_tables (
          table_name TEXT PRIMARY KEY,
          last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          has_path_column BOOLEAN DEFAULT FALSE,
          added_columns TEXT[]
        );
      `)

      // Create the scanner function
      await payload.db.drizzle.execute(sql`
        CREATE OR REPLACE FUNCTION payload.scan_and_fix_uuid_tables()
        RETURNS TABLE(table_name TEXT, columns_added TEXT[])
        LANGUAGE plpgsql
        AS $$
        DECLARE
          uuid_table TEXT;
          added_columns TEXT[] := '{}';
          has_path BOOLEAN;
          has_parent_id BOOLEAN;
          has_downloads_id BOOLEAN;
        BEGIN
          -- Loop through all tables in the payload schema that match UUID pattern
          FOR uuid_table IN 
            SELECT t.table_name
            FROM information_schema.tables t
            WHERE t.table_schema = 'payload'
            AND t.table_name ~ '^[0-9a-f]{8}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{12}$'
          LOOP
            -- Reset added columns for this table
            added_columns := '{}';
            
            -- Check if path column exists
            SELECT EXISTS (
              SELECT FROM information_schema.columns
              WHERE table_schema = 'payload'
              AND table_name = uuid_table
              AND column_name = 'path'
            ) INTO has_path;
            
            -- Add path column if it doesn't exist
            IF NOT has_path THEN
              EXECUTE format('ALTER TABLE payload.%I ADD COLUMN path TEXT', uuid_table);
              added_columns := array_append(added_columns, 'path');
            END IF;
            
            -- Check if parent_id column exists
            SELECT EXISTS (
              SELECT FROM information_schema.columns
              WHERE table_schema = 'payload'
              AND table_name = uuid_table
              AND column_name = 'parent_id'
            ) INTO has_parent_id;
            
            -- Add parent_id column if it doesn't exist
            IF NOT has_parent_id THEN
              EXECUTE format('ALTER TABLE payload.%I ADD COLUMN parent_id TEXT', uuid_table);
              added_columns := array_append(added_columns, 'parent_id');
            END IF;
            
            -- Check if downloads_id column exists
            SELECT EXISTS (
              SELECT FROM information_schema.columns
              WHERE table_schema = 'payload'
              AND table_name = uuid_table
              AND column_name = 'downloads_id'
            ) INTO has_downloads_id;
            
            -- Add downloads_id column if it doesn't exist
            IF NOT has_downloads_id THEN
              EXECUTE format('ALTER TABLE payload.%I ADD COLUMN downloads_id UUID', uuid_table);
              added_columns := array_append(added_columns, 'downloads_id');
            END IF;
            
            -- Update the tracking table
            INSERT INTO payload.dynamic_uuid_tables (table_name, last_checked, has_path_column, added_columns)
            VALUES (uuid_table, NOW(), TRUE, added_columns)
            ON CONFLICT (table_name) 
            DO UPDATE SET 
              last_checked = NOW(),
              has_path_column = TRUE,
              added_columns = EXCLUDED.added_columns;
            
            -- Only return tables that had columns added
            IF array_length(added_columns, 1) > 0 THEN
              table_name := uuid_table;
              columns_added := added_columns;
              RETURN NEXT;
            END IF;
          END LOOP;
          
          RETURN;
        END;
        $$;
      `)

      // Create the view
      await payload.db.drizzle.execute(sql`
        CREATE OR REPLACE VIEW payload.downloads_relationships AS
        SELECT 
          t.table_name,
          c.column_name,
          c.data_type
        FROM 
          information_schema.tables t
        JOIN 
          information_schema.columns c 
          ON t.table_name = c.table_name AND t.table_schema = c.table_schema
        WHERE 
          t.table_schema = 'payload'
          AND t.table_name ~ '^[0-9a-f]{8}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{12}$'
          AND (c.column_name = 'path' OR c.column_name = 'parent_id' OR c.column_name = 'downloads_id');
      `)

      console.log('✅ Created scanner function and tracking table')
    } else {
      console.log('✅ Scanner function exists')
    }
  } catch (error) {
    console.error('Error checking scanner function:', error)
    process.exit(1)
  }

  // Run the scanner function
  console.log('\nRunning the scanner function to fix UUID tables...')
  try {
    const result = await payload.db.drizzle.execute(
      sql`SELECT * FROM payload.scan_and_fix_uuid_tables()`,
    )

    if (!result?.rows?.length) {
      console.log('No UUID tables required fixing')
    } else {
      console.log(`Fixed ${result.rows.length} UUID tables:`)
      for (const row of result.rows) {
        console.log(
          ` - ${row.table_name}: Added columns ${Array.isArray(row.columns_added) ? row.columns_added.join(', ') : 'none'}`,
        )
      }
    }

    console.log('\n✅ UUID tables scan and fix completed successfully')
  } catch (error) {
    console.error('❌ Error fixing UUID tables:', error)
    process.exit(1)
  }

  // Check tracking table contents
  console.log('\nChecking tracking table contents...')
  try {
    const trackingResult = await payload.db.drizzle.execute(sql`
      SELECT table_name, has_path_column, last_checked FROM payload.dynamic_uuid_tables ORDER BY last_checked DESC LIMIT 10
    `)

    console.log(`Found ${trackingResult.rows.length} tracked UUID tables:`)
    for (const row of trackingResult.rows) {
      console.log(
        ` - ${row.table_name}: ${row.has_path_column ? '✅' : '❌'} path column, last checked ${row.last_checked}`,
      )
    }
  } catch (error) {
    console.error('Error checking tracking table:', error)
  }

  // Close Payload (note: in newer versions, payload.shutdown might be different)
  try {
    // @ts-ignore - shutdown method might exist with different parameters in different payload versions
    await payload.shutdown()
  } catch (error) {
    console.log('Note: Could not properly shutdown Payload, but this is not critical')
  }

  console.log('\n=== SUMMARY ===')
  console.log('UUID tables have been scanned and fixed.')
  console.log('If you continue to experience "column X.path does not exist" errors, please:')
  console.log('1. Run the reset-and-migrate.ps1 script to apply all migrations')
  console.log(
    '2. Verify that the multi-tiered access approach is being used in the application code',
  )
  console.log('3. Check that the downloads_relationships view is correctly defined')
}

// Run the fix
checkAndFixUuidTables().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
