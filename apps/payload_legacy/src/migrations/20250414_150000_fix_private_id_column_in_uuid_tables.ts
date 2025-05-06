import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- First check if the function exists and drop it to update
    DROP FUNCTION IF EXISTS payload.scan_and_fix_uuid_tables();

    -- Create or replace the scanner function with private_id column support
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
      has_private_id BOOLEAN;
    BEGIN
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
        
        -- Check if private_id column exists
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'payload'
          AND table_name = uuid_table
          AND column_name = 'private_id'
        ) INTO has_private_id;
        
        -- Add private_id column if it doesn't exist
        IF NOT has_private_id THEN
          EXECUTE format('ALTER TABLE payload.%I ADD COLUMN private_id UUID', uuid_table);
          added_columns := array_append(added_columns, 'private_id');
        END IF;
        
        -- Update the tracking table
        INSERT INTO payload.dynamic_uuid_tables (table_name, last_checked)
        VALUES (uuid_table, NOW())
        ON CONFLICT (table_name) 
        DO UPDATE SET 
          last_checked = NOW();
        
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

    -- Update the get_relationship_data function to handle private_id
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
          ELSIF fallback_column = 'private_id' THEN
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN private_id UUID', table_name);
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

    -- Create ensure_relationship_columns function
    CREATE OR REPLACE FUNCTION payload.ensure_relationship_columns(table_name text)
    RETURNS void AS $$
    BEGIN
      -- Add parent_id if it doesn't exist
      EXECUTE 'ALTER TABLE ' || table_name || 
              ' ADD COLUMN IF NOT EXISTS parent_id UUID';
              
      -- Add downloads_id if it doesn't exist
      EXECUTE 'ALTER TABLE ' || table_name || 
              ' ADD COLUMN IF NOT EXISTS downloads_id UUID';
              
      -- Add private_id if it doesn't exist
      EXECUTE 'ALTER TABLE ' || table_name || 
              ' ADD COLUMN IF NOT EXISTS private_id UUID';
              
      -- Add other important relationship columns
      EXECUTE 'ALTER TABLE ' || table_name || 
              ' ADD COLUMN IF NOT EXISTS documentation_id UUID';
      EXECUTE 'ALTER TABLE ' || table_name || 
              ' ADD COLUMN IF NOT EXISTS courses_id UUID';
      EXECUTE 'ALTER TABLE ' || table_name || 
              ' ADD COLUMN IF NOT EXISTS course_lessons_id UUID';
      EXECUTE 'ALTER TABLE ' || table_name || 
              ' ADD COLUMN IF NOT EXISTS course_quizzes_id UUID';
      EXECUTE 'ALTER TABLE ' || table_name || 
              ' ADD COLUMN IF NOT EXISTS quiz_questions_id UUID';
    END;
    $$ LANGUAGE plpgsql;

    -- Run the scanner now to fix all existing UUID tables
    SELECT * FROM payload.scan_and_fix_uuid_tables();

    -- Enhance the downloads_relationships view to support private posts collection
    DROP VIEW IF EXISTS payload.downloads_relationships;
    CREATE VIEW payload.downloads_relationships AS
    -- Documentation downloads
    SELECT 
      doc.id::text as collection_id, 
      dl.id::text as download_id,
      'documentation' as collection_type,
      'documentation_rels' as table_name
    FROM payload.documentation doc
    LEFT JOIN payload.documentation_rels dr 
      ON (doc.id = dr._parent_id OR doc.id = dr.parent_id)
    LEFT JOIN payload.downloads dl 
      ON (dl.id = dr.value OR dl.id = dr.downloads_id)
    WHERE dl.id IS NOT NULL

    UNION ALL

    -- Course lessons downloads
    SELECT 
      cl.id::text as collection_id, 
      dl.id::text as download_id,
      'course_lessons' as collection_type,
      'course_lessons_rels' as table_name
    FROM payload.course_lessons cl
    LEFT JOIN payload.course_lessons_rels clr 
      ON (cl.id = clr._parent_id OR cl.id = clr.parent_id)
    LEFT JOIN payload.downloads dl 
      ON (dl.id = clr.value OR dl.id = clr.downloads_id)
    WHERE dl.id IS NOT NULL

    UNION ALL

    -- Courses downloads
    SELECT 
      c.id::text as collection_id, 
      dl.id::text as download_id,
      'courses' as collection_type,
      'courses_rels' as table_name
    FROM payload.courses c
    LEFT JOIN payload.courses_rels cr 
      ON (c.id = cr._parent_id OR c.id = cr.parent_id)
    LEFT JOIN payload.downloads dl 
      ON (dl.id = cr.value OR dl.id = cr.downloads_id)
    WHERE dl.id IS NOT NULL

    UNION ALL

    -- Course quizzes downloads
    SELECT 
      cq.id::text as collection_id, 
      dl.id::text as download_id,
      'course_quizzes' as collection_type,
      'course_quizzes_rels' as table_name
    FROM payload.course_quizzes cq
    LEFT JOIN payload.course_quizzes_rels cqr 
      ON (cq.id = cqr._parent_id OR cq.id = cqr.parent_id)
    LEFT JOIN payload.downloads dl 
      ON (dl.id = cqr.value OR dl.id = cqr.downloads_id)
    WHERE dl.id IS NOT NULL

    UNION ALL

    -- Private posts downloads (when private table exists)
    SELECT 
      p.id::text as collection_id, 
      dl.id::text as download_id,
      'private' as collection_type,
      'private_rels' as table_name
    FROM payload.private p
    LEFT JOIN payload.private_rels pr 
      ON (p.id = pr._parent_id OR p.id = pr.parent_id)
    LEFT JOIN payload.downloads dl 
      ON (dl.id = pr.value OR dl.id = pr.downloads_id)
    WHERE dl.id IS NOT NULL

    UNION ALL

    -- Posts downloads
    SELECT 
      p.id::text as collection_id, 
      dl.id::text as download_id,
      'posts' as collection_type,
      'posts_rels' as table_name
    FROM payload.posts p
    LEFT JOIN payload.posts_rels pr 
      ON (p.id = pr._parent_id OR p.id = pr.parent_id)
    LEFT JOIN payload.downloads dl 
      ON (dl.id = pr.value OR dl.id = pr.downloads_id)
    WHERE dl.id IS NOT NULL;
  `)

  console.log('✅ Added private_id column support to UUID tables fix mechanism')
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // We don't want to remove the enhancements in the down migration,
  // as they're critical for system functionality
  console.log('⚠️ Downgrade not implemented - keeping critical fixes')
}
