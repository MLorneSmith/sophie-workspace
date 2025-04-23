import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration to fix the scan_and_fix_uuid_tables function
 *
 * This migration addresses the following:
 * 1. Updates the scan_and_fix_uuid_tables function to be compatible with current schema
 * 2. Fixes the error: "column has_parent_id of relation dynamic_uuid_tables does not exist"
 * 3. Creates a schema-aware version that works with both old and new schema versions
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running migration to fix UUID tables function')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // Add safe_insert_into_uuid_tables_tracking function
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION payload.safe_insert_into_uuid_tables_tracking(p_table_name TEXT) RETURNS void AS $$
      DECLARE
        column_exists BOOLEAN;
        has_created_at BOOLEAN;
        has_last_checked BOOLEAN;
        has_has_parent_id BOOLEAN;
        has_downloads_id BOOLEAN;
        column_names TEXT[];
      BEGIN
        -- Get column names for dynamic_uuid_tables
        SELECT array_agg(column_name) INTO column_names
        FROM information_schema.columns
        WHERE table_schema = 'payload'
        AND table_name = 'dynamic_uuid_tables';
        
        -- Determine which columns exist
        has_created_at := 'created_at' = ANY(column_names);
        has_last_checked := 'last_checked' = ANY(column_names);
        has_has_parent_id := 'has_parent_id' = ANY(column_names);
        has_downloads_id := 'has_downloads_id' = ANY(column_names);
        
        -- Schema-aware insert based on available columns
        IF has_created_at THEN
          IF has_has_parent_id THEN
            -- Both new created_at and old has_parent_id exist
            EXECUTE format('
              INSERT INTO payload.dynamic_uuid_tables (table_name, created_at, has_parent_id)
              VALUES (%L, NOW(), TRUE)
              ON CONFLICT (table_name)
              DO UPDATE SET created_at = NOW(), has_parent_id = TRUE', p_table_name);
          ELSIF has_downloads_id THEN
            -- New created_at and old has_downloads_id exist
            EXECUTE format('
              INSERT INTO payload.dynamic_uuid_tables (table_name, created_at, has_downloads_id)
              VALUES (%L, NOW(), TRUE)
              ON CONFLICT (table_name)
              DO UPDATE SET created_at = NOW(), has_downloads_id = TRUE', p_table_name);
          ELSE
            -- Only new created_at exists
            EXECUTE format('
              INSERT INTO payload.dynamic_uuid_tables (table_name, created_at)
              VALUES (%L, NOW())
              ON CONFLICT (table_name)
              DO UPDATE SET created_at = NOW()', p_table_name);
          END IF;
        ELSIF has_last_checked THEN
          IF has_has_parent_id THEN
            -- Legacy schema with both last_checked and has_parent_id
            EXECUTE format('
              INSERT INTO payload.dynamic_uuid_tables (table_name, last_checked, has_parent_id)
              VALUES (%L, NOW(), TRUE)
              ON CONFLICT (table_name)
              DO UPDATE SET last_checked = NOW(), has_parent_id = TRUE', p_table_name);
          ELSIF has_downloads_id THEN
            -- Legacy schema with last_checked and has_downloads_id
            EXECUTE format('
              INSERT INTO payload.dynamic_uuid_tables (table_name, last_checked, has_downloads_id)
              VALUES (%L, NOW(), TRUE)
              ON CONFLICT (table_name)
              DO UPDATE SET last_checked = NOW(), has_downloads_id = TRUE', p_table_name);
          ELSE
            -- Legacy schema with only last_checked
            EXECUTE format('
              INSERT INTO payload.dynamic_uuid_tables (table_name, last_checked)
              VALUES (%L, NOW())
              ON CONFLICT (table_name)
              DO UPDATE SET last_checked = NOW()', p_table_name);
          END IF;
        ELSE
          -- Fallback with just table_name
          EXECUTE format('
            INSERT INTO payload.dynamic_uuid_tables (table_name)
            VALUES (%L)
            ON CONFLICT (table_name) DO NOTHING', p_table_name);
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Drop the old scan_and_fix_uuid_tables function
    await db.execute(sql`
      DROP FUNCTION IF EXISTS payload.scan_and_fix_uuid_tables() CASCADE;
    `)

    // Create updated version of scan_and_fix_uuid_tables function
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION payload.scan_and_fix_uuid_tables(
        OUT table_name TEXT,
        OUT columns_added TEXT[]
      ) 
      RETURNS SETOF RECORD AS $$
      DECLARE
        uuid_table TEXT;
        added_columns TEXT[] := '{}'::TEXT[];
        has_path BOOLEAN;
        has_parent_id BOOLEAN;
        has_downloads_id BOOLEAN;
        has_private_id BOOLEAN;
        has_documentation_id BOOLEAN;
        dynamic_table_columns TEXT[];
      BEGIN
        -- Make sure the dynamic_uuid_tables table exists
        BEGIN
          -- Check if the table exists first
          PERFORM 1
          FROM information_schema.tables
          WHERE table_schema = 'payload'
          AND table_name = 'dynamic_uuid_tables';
          
          IF NOT FOUND THEN
            -- If not found, create the table
            CREATE TABLE payload.dynamic_uuid_tables (
              table_name TEXT PRIMARY KEY,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              primary_key TEXT DEFAULT 'parent_id',
              needs_path_column BOOLEAN DEFAULT TRUE
            );
          END IF;
        EXCEPTION WHEN OTHERS THEN
          -- Ignore errors and proceed
          RAISE NOTICE 'Error checking/creating dynamic_uuid_tables: %', SQLERRM;
        END;

        -- Loop through all tables in the payload schema that match UUID pattern
        FOR uuid_table IN 
          SELECT tables.table_name
          FROM information_schema.tables AS tables
          WHERE tables.table_schema = 'payload'
          AND (
            tables.table_name ~ '^[0-9a-f]{8}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{12}$'
            OR tables.table_name ~ '^[0-9a-f]{8}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{12}$'
          )
          ORDER BY tables.table_name
        LOOP
          -- Reset added columns for this table
          added_columns := '{}'::TEXT[];
          
          -- Check if path column exists
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'payload'
            AND table_name = uuid_table
            AND column_name = 'path'
          ) INTO has_path;
          
          -- Add path column if it doesn't exist
          IF NOT has_path THEN
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS path TEXT', uuid_table);
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
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS parent_id TEXT', uuid_table);
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
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS downloads_id UUID', uuid_table);
            added_columns := array_append(added_columns, 'downloads_id');
          END IF;
          
          -- Check if private_id column exists
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'payload'
            AND table_name = uuid_table
            AND column_name = 'private_id'
          ) INTO has_private_id;
          
          -- Add private_id column if it doesn't exist
          IF NOT has_private_id THEN
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS private_id UUID', uuid_table);
            added_columns := array_append(added_columns, 'private_id');
          END IF;
          
          -- Check if documentation_id column exists
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'payload'
            AND table_name = uuid_table
            AND column_name = 'documentation_id'
          ) INTO has_documentation_id;
          
          -- Add documentation_id column if it doesn't exist
          IF NOT has_documentation_id THEN
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS documentation_id UUID', uuid_table);
            added_columns := array_append(added_columns, 'documentation_id');
          END IF;
          
          -- Use safe tracking function to update the tracking table
          BEGIN
            PERFORM payload.safe_insert_into_uuid_tables_tracking(uuid_table);
          EXCEPTION WHEN OTHERS THEN
            -- Fallback basic insert if the function fails
            BEGIN
              EXECUTE format('
                INSERT INTO payload.dynamic_uuid_tables (table_name) 
                VALUES (%L) 
                ON CONFLICT (table_name) DO NOTHING', uuid_table);
            EXCEPTION WHEN OTHERS THEN
              -- If even this fails, just continue with processing
              RAISE NOTICE 'Error tracking UUID table %: %', uuid_table, SQLERRM;
            END;
          END;
          
          -- Only return tables that had columns added
          IF array_length(added_columns, 1) > 0 THEN
            table_name := uuid_table;
            columns_added := added_columns;
            RETURN NEXT;
          END IF;
        END LOOP;
        
        RETURN;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Successfully fixed UUID tables function')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error fixing UUID tables function:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('Rolling back UUID tables function fix')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // Drop the safe insert function
    await db.execute(sql`
      DROP FUNCTION IF EXISTS payload.safe_insert_into_uuid_tables_tracking(TEXT);
    `)

    // Reset to the original function (simplified version that may have errors)
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION payload.scan_and_fix_uuid_tables() RETURNS void AS $$
      DECLARE
        uuid_table TEXT;
      BEGIN
        -- Just a minimal implementation
        FOR uuid_table IN 
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'payload'
          AND (
            table_name ~ '^[0-9a-f]{8}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{12}$'
            OR table_name ~ '^[0-9a-f]{8}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{12}$'
          )
        LOOP
          -- Add minimal columns
          EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS path TEXT', uuid_table);
          EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS parent_id TEXT', uuid_table);
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Successfully rolled back UUID tables function fix')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error rolling back UUID tables function fix:', error)
    throw error
  }
}
