import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add media_id column to all relationship tables
    DO $$
    DECLARE
      rel_table record;
    BEGIN
      FOR rel_table IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'payload' 
        AND table_name LIKE '%_rels'
      LOOP
        -- Check if media_id column already exists
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = rel_table.table_name
          AND column_name = 'media_id'
        ) THEN
          -- Add media_id column
          EXECUTE format('
            ALTER TABLE payload.%I 
            ADD COLUMN media_id uuid
          ', rel_table.table_name);
          
          -- Log the change
          RAISE NOTICE 'Added media_id column to %', rel_table.table_name;
        END IF;
      END LOOP;
    END $$;
    
    -- Create a view to help with debugging dynamic UUID tables
    DO $$
    BEGIN
      -- Drop the view if it already exists
      DROP VIEW IF EXISTS payload.media_relationships;
      
      -- Create the view
      CREATE VIEW payload.media_relationships AS
      SELECT 
        m.id AS media_id,
        'courses' AS parent_collection,
        c.id AS parent_id
      FROM 
        payload.media m
      JOIN 
        payload.courses c ON c.featured_image_id_id = m.id
      
      UNION ALL
      
      SELECT 
        m.id AS media_id,
        'course_lessons' AS parent_collection,
        cl.id AS parent_id
      FROM 
        payload.media m
      JOIN 
        payload.course_lessons cl ON cl.featured_image_id_id = m.id
      
      UNION ALL
      
      SELECT 
        m.id AS media_id,
        'posts' AS parent_collection,
        p.id AS parent_id
      FROM 
        payload.media m
      JOIN 
        payload.posts p ON p.image_id_id = m.id;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove media_id column from all relationship tables
    DO $$
    DECLARE
      rel_table record;
    BEGIN
      FOR rel_table IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'payload' 
        AND table_name LIKE '%_rels'
      LOOP
        -- Check if media_id column exists
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = rel_table.table_name
          AND column_name = 'media_id'
        ) THEN
          -- Remove media_id column
          EXECUTE format('
            ALTER TABLE payload.%I 
            DROP COLUMN media_id
          ', rel_table.table_name);
        END IF;
      END LOOP;
    END $$;
    
    -- Drop the view
    DROP VIEW IF EXISTS payload.media_relationships;
  `)
}
