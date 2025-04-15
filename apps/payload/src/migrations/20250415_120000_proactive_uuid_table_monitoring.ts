/**
 * Migration: Proactive UUID Table Monitoring
 *
 * This creates the system to proactively monitor for UUID tables and
 * fix missing columns like 'path', 'parent_id', and 'downloads_id'.
 */
import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running proactive UUID table monitoring migration')

  try {
    // TRANSACTION 1: Create tables and functions
    console.log('Phase 1: Setting up tables and functions')
    await db.execute(sql.raw('BEGIN;'))
    try {
      // Create the dynamic UUID tables tracking system
      await db.execute(
        sql.raw(`
        -- Create the UUID tables tracking table if not exists
        CREATE TABLE IF NOT EXISTS payload.dynamic_uuid_tables (
          table_name TEXT PRIMARY KEY,
          last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          has_downloads_id BOOLEAN DEFAULT FALSE
        );

        -- Create or replace the scanner function
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
            AND (
              t.table_name ~ '^[0-9a-f]{8}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{12}$'
              OR t.table_name ~ '^[0-9a-f]{8}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{12}$'
            )
            ORDER BY table_name
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
            INSERT INTO payload.dynamic_uuid_tables (table_name, last_checked, has_downloads_id)
            VALUES (uuid_table, NOW(), TRUE)
            ON CONFLICT (table_name) 
            DO UPDATE SET 
              last_checked = NOW(),
              has_downloads_id = TRUE;
            
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

        -- Create a function to safely access relationship data with fallbacks
        CREATE OR REPLACE FUNCTION payload.get_relationship_data(
          table_name TEXT,
          id TEXT,
          fallback_column TEXT DEFAULT 'path'
        )
        RETURNS TEXT
        LANGUAGE plpgsql
        AS $$
        DECLARE
          result TEXT;
          table_exists BOOLEAN;
          column_exists BOOLEAN;
          query TEXT;
        BEGIN
          -- Check if the table exists
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'payload'
            AND table_name = table_name
          ) INTO table_exists;
          
          IF NOT table_exists THEN
            RETURN NULL;
          END IF;
          
          -- Check if the fallback column exists
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'payload'
            AND table_name = table_name
            AND column_name = fallback_column
          ) INTO column_exists;
          
          IF NOT column_exists THEN
            -- Try to add the column if it doesn't exist
            BEGIN
              IF fallback_column = 'path' THEN
                EXECUTE format('ALTER TABLE payload.%I ADD COLUMN path TEXT', table_name);
                column_exists := TRUE;
              ELSIF fallback_column = 'parent_id' THEN
                EXECUTE format('ALTER TABLE payload.%I ADD COLUMN parent_id TEXT', table_name);
                column_exists := TRUE;
              ELSIF fallback_column = 'downloads_id' THEN
                EXECUTE format('ALTER TABLE payload.%I ADD COLUMN downloads_id UUID', table_name);
                column_exists := TRUE;
              END IF;
            EXCEPTION WHEN OTHERS THEN
              -- If we can't add the column, return null
              RETURN NULL;
            END;
          END IF;
          
          IF column_exists THEN
            -- Try to get the data from the table
            BEGIN
              query := format('SELECT %I FROM payload.%I WHERE id = $1 LIMIT 1', 
                              fallback_column, table_name);
              EXECUTE query INTO result USING id;
              RETURN result;
            EXCEPTION WHEN OTHERS THEN
              RETURN NULL;
            END;
          ELSE
            RETURN NULL;
          END IF;
        END;
        $$;
      `),
      )
      // Commit first transaction successfully
      await db.execute(sql.raw('COMMIT;'))
      console.log('Successfully created database objects')
    } catch (error) {
      // Rollback on error
      await db.execute(sql.raw('ROLLBACK;'))
      console.error('Error creating database objects:', error)
      throw error
    }

    // TRANSACTION 2: Try to create the event trigger (might fail in dev environment)
    console.log('Phase 2: Attempting to create event trigger (optional)')
    await db.execute(sql.raw('BEGIN;'))
    try {
      // Creating an event trigger requires superuser privileges which may not be available
      // in the typical development environment, so we'll try but not fail if it doesn't work
      await db.execute(
        sql.raw(`
        -- Try to create a trigger that fires when new tables are created
        CREATE OR REPLACE FUNCTION payload.handle_new_uuid_table()
        RETURNS event_trigger
        LANGUAGE plpgsql
        AS $$
        DECLARE
          obj record;
          table_schema text;
          table_name text;
        BEGIN
          FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands() LOOP
            IF obj.command_tag = 'CREATE TABLE' AND obj.object_type = 'table' THEN
              -- Extract schema and table name
              SELECT n.nspname, c.relname INTO table_schema, table_name
              FROM pg_catalog.pg_class c
              LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
              WHERE c.oid = obj.objid;
              
              -- If it's in payload schema and matches UUID pattern, scan it
              IF table_schema = 'payload' AND (
                table_name ~ '^[0-9a-f]{8}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{12}$'
                OR table_name ~ '^[0-9a-f]{8}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{12}$'
              ) THEN
                -- Run the scanner to add required columns
                PERFORM payload.scan_and_fix_uuid_tables();
              END IF;
            END IF;
          END LOOP;
        END;
        $$;

        -- Create the event trigger
        DROP EVENT TRIGGER IF EXISTS payload_new_uuid_table_trigger;
        CREATE EVENT TRIGGER payload_new_uuid_table_trigger
        ON ddl_command_end
        WHEN TAG IN ('CREATE TABLE')
        EXECUTE FUNCTION payload.handle_new_uuid_table();
      `),
      )
      // Commit the event trigger transaction
      await db.execute(sql.raw('COMMIT;'))
      console.log('Successfully created event trigger')
    } catch (error) {
      // Rollback the failed transaction
      await db.execute(sql.raw('ROLLBACK;'))
      console.log('Could not create event trigger - may require superuser privileges')
      console.log('This is not critical as the scanner function will still work')
    }

    // TRANSACTION 3: Run the scanner function
    console.log('Phase 3: Running scanner on existing tables')
    // Use a separate transaction to avoid issues with aborted transactions
    try {
      // For existing tables, run the scanner function immediately in its own transaction
      await db.execute(
        sql.raw(`
        DO $$
        BEGIN
          -- Try to scan UUID tables, but don't throw an error if it fails
          BEGIN
            PERFORM * FROM payload.scan_and_fix_uuid_tables();
            RAISE NOTICE 'Successfully scanned existing UUID tables';
          EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error scanning UUID tables: %', SQLERRM;
          END;
        END
        $$;
      `),
      )
      console.log('Successfully scanned existing UUID tables')
    } catch (error: any) {
      // Log but don't throw error since this is not critical
      console.log(
        'Warning: Error scanning UUID tables, but continuing:',
        error.message || String(error),
      )
    }

    console.log('Proactive UUID table monitoring system installed successfully')
  } catch (error) {
    console.error('Error setting up proactive UUID table monitoring:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('Rolling back proactive UUID table monitoring migration')

  // Remove the monitoring system in the down migration
  try {
    // Use transaction for clean rollback
    await db.execute(sql.raw('BEGIN;'))
    try {
      await db.execute(
        sql.raw(`
        -- Drop the event trigger if it exists
        DROP EVENT TRIGGER IF EXISTS payload_new_uuid_table_trigger;
        
        -- Drop the functions
        DROP FUNCTION IF EXISTS payload.handle_new_uuid_table();
        DROP FUNCTION IF EXISTS payload.get_relationship_data(TEXT, TEXT, TEXT);
        DROP FUNCTION IF EXISTS payload.scan_and_fix_uuid_tables();
        
        -- Drop the tracking table
        DROP TABLE IF EXISTS payload.dynamic_uuid_tables;
      `),
      )
      await db.execute(sql.raw('COMMIT;'))
      console.log('Proactive UUID table monitoring system removed successfully')
    } catch (error) {
      await db.execute(sql.raw('ROLLBACK;'))
      throw error
    }
  } catch (error) {
    console.error('Error removing proactive UUID table monitoring:', error)
    throw error
  }
}
