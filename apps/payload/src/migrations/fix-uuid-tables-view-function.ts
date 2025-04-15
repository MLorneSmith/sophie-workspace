import { PostgresAdapter } from '@payloadcms/db-postgres'
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Migration to update the scan_and_fix_uuid_tables function to safely handle views
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  // Get the database adapter for direct access
  const dbAdapter = payload.db as unknown as PostgresAdapter

  await dbAdapter.drizzle.execute(sql`
    -- First check if the function exists
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'scan_and_fix_uuid_tables' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'payload')
      ) THEN
        -- Drop the existing function to replace it
        DROP FUNCTION IF EXISTS payload.scan_and_fix_uuid_tables();
      END IF;
    END
    $$;

    -- Create improved function that checks if objects are views before trying to alter them
    CREATE OR REPLACE FUNCTION payload.scan_and_fix_uuid_tables()
    RETURNS VOID AS $$
    DECLARE
      table_name text;
      is_view boolean;
    BEGIN
      -- Loop through each table that matches the UUID pattern
      FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'payload' 
        AND (
          tablename ~ '^[0-9a-f]{8}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{12}$'
          OR tablename ~ '^[0-9a-f]{8}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{12}$'
        )
      LOOP
        -- Check if table is actually a view before modifying
        SELECT count(*) > 0 INTO is_view
        FROM pg_views
        WHERE schemaname = 'payload' AND viewname = table_name;
          
        -- Only attempt to ALTER if it's not a view
        IF NOT is_view THEN
          -- Add path column if missing
          EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS path TEXT', table_name);
          -- Add downloads_id column if missing 
          EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS downloads_id UUID', table_name);
          -- Add parent_id column if missing
          EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS parent_id UUID', table_name);
        END IF;
      END LOOP;
      
      -- Log info about processed tables
      RAISE NOTICE 'UUID table scanning completed successfully';
    END;
    $$ LANGUAGE plpgsql;
    
    -- Create a simple safeguard view for downloads
    -- This prevents errors when the dynamic UUID tables query runs
    CREATE OR REPLACE VIEW payload.downloads_diagnostic AS 
    SELECT 
      d.id,
      d.filename,
      d.url,
      COUNT(cld.id) AS lesson_refs
    FROM 
      payload.downloads d
    LEFT JOIN 
      payload.course_lessons_downloads cld ON d.id = cld.download_id
    GROUP BY
      d.id, d.filename, d.url;
      
    -- Note: Since this is a VIEW, it will not have the 'path' column
    -- that the scan_and_fix_uuid_tables function tries to add.
    -- But with our new check, the function will skip this safely.
  `)

  console.log('✅ Successfully updated scan_and_fix_uuid_tables function to handle views')
}

// Down migration to revert the function to its original state
export async function down({ payload }: MigrateDownArgs): Promise<void> {
  const dbAdapter = payload.db as unknown as PostgresAdapter

  await dbAdapter.drizzle.execute(sql`
    -- Drop the improved function
    DROP FUNCTION IF EXISTS payload.scan_and_fix_uuid_tables();
    
    -- Drop the downloads_diagnostic view 
    DROP VIEW IF EXISTS payload.downloads_diagnostic;
    
    -- Create a simpler original version
    CREATE OR REPLACE FUNCTION payload.scan_and_fix_uuid_tables()
    RETURNS VOID AS $$
    DECLARE
      table_name text;
    BEGIN
      -- Loop through each table that matches the UUID pattern
      FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'payload' 
        AND tablename ~ '^[0-9a-f]{8}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{12}$'
      LOOP
        -- Add path column if missing (without view check)
        EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS path TEXT', table_name);
      END LOOP;
    END;
    $$ LANGUAGE plpgsql;
  `)

  console.log('✅ Successfully reverted scan_and_fix_uuid_tables function to original state')
}
