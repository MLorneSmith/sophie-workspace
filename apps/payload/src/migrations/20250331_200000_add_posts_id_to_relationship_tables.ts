import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Step 1: Add posts_id column to all relationship tables
  await db.execute(sql`
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
        -- Check if posts_id column already exists
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = rel_table.table_name
          AND column_name = 'posts_id'
        ) THEN
          -- Add posts_id column
          EXECUTE format('ALTER TABLE payload.%I ADD COLUMN posts_id uuid', rel_table.table_name);
        END IF;
      END LOOP;
    END $$;
  `)

  // Step 2: Create a view for posts relationships
  await db.execute(sql`
    -- Drop the view if it already exists
    DROP VIEW IF EXISTS payload.posts_relationships;
    
    -- Create the view
    CREATE VIEW payload.posts_relationships AS
    SELECT 
      p.id AS posts_id,
      'posts' AS parent_collection,
      p.id AS parent_id
    FROM 
      payload.posts p;
  `)

  // Step 3: Update the add_relationship_columns function to include posts_id
  await db.execute(sql`
    -- Update the function to add posts_id column
    CREATE OR REPLACE FUNCTION payload.add_relationship_columns(table_name text) 
    RETURNS void AS $$
    BEGIN
      -- Add media_id column if it doesn't exist
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = table_name
        AND column_name = 'media_id'
      ) THEN
        EXECUTE format('ALTER TABLE payload.%I ADD COLUMN media_id uuid', table_name);
      END IF;
      
      -- Add documentation_id column if it doesn't exist
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = table_name
        AND column_name = 'documentation_id'
      ) THEN
        EXECUTE format('ALTER TABLE payload.%I ADD COLUMN documentation_id uuid', table_name);
      END IF;
      
      -- Add posts_id column if it doesn't exist
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = table_name
        AND column_name = 'posts_id'
      ) THEN
        EXECUTE format('ALTER TABLE payload.%I ADD COLUMN posts_id uuid', table_name);
      END IF;
    END;
    $$ LANGUAGE plpgsql;
  `)

  // Step 4: Create a function to handle dynamic UUID tables
  await db.execute(sql`
    -- Create a function to handle dynamic UUID tables
    CREATE OR REPLACE FUNCTION payload.handle_dynamic_uuid_table(uuid_table text)
    RETURNS void AS $$
    BEGIN
      -- Create the table if it doesn't exist
      EXECUTE format('
        CREATE TABLE IF NOT EXISTS payload.%I (
          id uuid PRIMARY KEY
        )', uuid_table);
      
      -- Add relationship columns
      PERFORM payload.add_relationship_columns(uuid_table);
    END;
    $$ LANGUAGE plpgsql;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove posts_id column from all relationship tables
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
        -- Check if posts_id column exists
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = rel_table.table_name
          AND column_name = 'posts_id'
        ) THEN
          -- Remove posts_id column
          EXECUTE format('ALTER TABLE payload.%I DROP COLUMN posts_id', rel_table.table_name);
        END IF;
      END LOOP;
    END $$;
    
    -- Drop the view
    DROP VIEW IF EXISTS payload.posts_relationships;
    
    -- Drop the functions
    DROP FUNCTION IF EXISTS payload.handle_dynamic_uuid_table;
  `)
}
