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
    
    -- Check if the downloads_diagnostic view already exists with proper columns
    -- If it doesn't exist, create it with the full complement of columns
    DO $$
    DECLARE 
      view_exists boolean;
      path_exists boolean;
    BEGIN
      -- Check if view exists
      SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'payload' 
        AND table_name = 'downloads_diagnostic'
      ) INTO view_exists;
      
      -- Check if path column exists in downloads table
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'downloads'
        AND column_name = 'path'
      ) INTO path_exists;
      
      -- Only create/replace view if it doesn't already exist with proper structure
      IF NOT view_exists THEN
        -- Drop any existing view just to be safe
        EXECUTE 'DROP VIEW IF EXISTS payload.downloads_diagnostic';
        
        -- Create the view with or without path based on its existence in downloads table
        IF path_exists THEN
          EXECUTE '
          CREATE VIEW payload.downloads_diagnostic AS
          SELECT 
            d.id,
            d.title,
            d.filename,
            d.url,
            d.mimetype,
            d.filesize,
            d.width,
            d.height,
            d.sizes_thumbnail_url,
            d.path,
            (SELECT count(*) AS count
              FROM payload.course_lessons_downloads
              WHERE (course_lessons_downloads.download_id = d.id)) AS lesson_count,
            (SELECT array_agg(cl.title) AS array_agg
              FROM (payload.course_lessons_downloads cld
                JOIN payload.course_lessons cl ON ((cld.lesson_id = cl.id)))
              WHERE (cld.download_id = d.id)) AS related_lessons
          FROM payload.downloads d';
        ELSE
          EXECUTE '
          CREATE VIEW payload.downloads_diagnostic AS
          SELECT 
            d.id,
            d.title,
            d.filename,
            d.url,
            d.mimetype,
            d.filesize,
            d.width,
            d.height,
            d.sizes_thumbnail_url,
            (SELECT count(*) AS count
              FROM payload.course_lessons_downloads
              WHERE (course_lessons_downloads.download_id = d.id)) AS lesson_count,
            (SELECT array_agg(cl.title) AS array_agg
              FROM (payload.course_lessons_downloads cld
                JOIN payload.course_lessons cl ON ((cld.lesson_id = cl.id)))
              WHERE (cld.download_id = d.id)) AS related_lessons
          FROM payload.downloads d';
        END IF;
        
        RAISE NOTICE 'Created downloads_diagnostic view';
      ELSE
        RAISE NOTICE 'Existing downloads_diagnostic view preserved';
      END IF;
    END
    $$;
  `)

  console.log('✅ Successfully updated scan_and_fix_uuid_tables function to handle views')
}

// Down migration to revert the function to its original state
export async function down({ payload }: MigrateDownArgs): Promise<void> {
  const dbAdapter = payload.db as unknown as PostgresAdapter

  await dbAdapter.drizzle.execute(sql`
    -- Drop the improved function
    DROP FUNCTION IF EXISTS payload.scan_and_fix_uuid_tables();
    
    -- We don't drop the downloads_diagnostic view here since it might be
    -- maintained by other migrations now. Instead, we preserve it.
    
    -- Create a simpler original version of the function
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
