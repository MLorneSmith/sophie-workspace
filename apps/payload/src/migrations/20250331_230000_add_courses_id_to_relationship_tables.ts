import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Step 1: Add courses_id column to all relationship tables
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
        -- Check if courses_id column already exists
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = rel_table.table_name
          AND column_name = 'courses_id'
        ) THEN
          -- Add courses_id column
          EXECUTE format('ALTER TABLE payload.%I ADD COLUMN courses_id uuid', rel_table.table_name);
        END IF;
      END LOOP;
    END $$;
  `)

  // Step 2: Create a view for courses relationships
  await db.execute(sql`
    -- Drop the view if it already exists
    DROP VIEW IF EXISTS payload.courses_relationships;
    
    -- Create the view
    CREATE VIEW payload.courses_relationships AS
    SELECT 
      c.id AS courses_id,
      'courses' AS parent_collection,
      c.id AS parent_id
    FROM 
      payload.courses c;
  `)

  // Step 3: Update the add_relationship_columns function to include courses_id
  await db.execute(sql`
    -- Update the function to add courses_id column
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
      
      -- Add surveys_id column if it doesn't exist
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = table_name
        AND column_name = 'surveys_id'
      ) THEN
        EXECUTE format('ALTER TABLE payload.%I ADD COLUMN surveys_id uuid', table_name);
      END IF;
      
      -- Add survey_questions_id column if it doesn't exist
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = table_name
        AND column_name = 'survey_questions_id'
      ) THEN
        EXECUTE format('ALTER TABLE payload.%I ADD COLUMN survey_questions_id uuid', table_name);
      END IF;
      
      -- Add courses_id column if it doesn't exist
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = table_name
        AND column_name = 'courses_id'
      ) THEN
        EXECUTE format('ALTER TABLE payload.%I ADD COLUMN courses_id uuid', table_name);
      END IF;
    END;
    $$ LANGUAGE plpgsql;
  `)

  // Step 4: Update the handle_all_relationship_columns function to include courses_id
  await db.execute(sql`
    -- Create a function to handle all relationship columns
    CREATE OR REPLACE FUNCTION payload.handle_all_relationship_columns(uuid_table text)
    RETURNS void AS $$
    BEGIN
      -- Create the table if it doesn't exist
      EXECUTE format('
        CREATE TABLE IF NOT EXISTS payload.%I (
          id uuid PRIMARY KEY
        )', uuid_table);
      
      -- Add all relationship columns
      PERFORM payload.add_relationship_columns(uuid_table);
      
      -- Populate from all relationship views if they exist
      BEGIN
        EXECUTE format('
          INSERT INTO payload.%I (id, media_id)
          SELECT parent_id, media_id FROM payload.media_relationships
          ON CONFLICT (id) DO UPDATE SET media_id = EXCLUDED.media_id
        ', uuid_table);
      EXCEPTION WHEN undefined_table THEN
        -- View doesn't exist, skip
      END;
      
      BEGIN
        EXECUTE format('
          INSERT INTO payload.%I (id, documentation_id)
          SELECT parent_id, documentation_id FROM payload.documentation_relationships
          ON CONFLICT (id) DO UPDATE SET documentation_id = EXCLUDED.documentation_id
        ', uuid_table);
      EXCEPTION WHEN undefined_table THEN
        -- View doesn't exist, skip
      END;
      
      BEGIN
        EXECUTE format('
          INSERT INTO payload.%I (id, posts_id)
          SELECT parent_id, posts_id FROM payload.posts_relationships
          ON CONFLICT (id) DO UPDATE SET posts_id = EXCLUDED.posts_id
        ', uuid_table);
      EXCEPTION WHEN undefined_table THEN
        -- View doesn't exist, skip
      END;
      
      BEGIN
        EXECUTE format('
          INSERT INTO payload.%I (id, surveys_id)
          SELECT parent_id, surveys_id FROM payload.surveys_relationships
          ON CONFLICT (id) DO UPDATE SET surveys_id = EXCLUDED.surveys_id
        ', uuid_table);
      EXCEPTION WHEN undefined_table THEN
        -- View doesn't exist, skip
      END;
      
      BEGIN
        EXECUTE format('
          INSERT INTO payload.%I (id, survey_questions_id)
          SELECT parent_id, survey_questions_id FROM payload.survey_questions_relationships
          ON CONFLICT (id) DO UPDATE SET survey_questions_id = EXCLUDED.survey_questions_id
        ', uuid_table);
      EXCEPTION WHEN undefined_table THEN
        -- View doesn't exist, skip
      END;
      
      BEGIN
        EXECUTE format('
          INSERT INTO payload.%I (id, courses_id)
          SELECT parent_id, courses_id FROM payload.courses_relationships
          ON CONFLICT (id) DO UPDATE SET courses_id = EXCLUDED.courses_id
        ', uuid_table);
      EXCEPTION WHEN undefined_table THEN
        -- View doesn't exist, skip
      END;
    END;
    $$ LANGUAGE plpgsql;
  `)

  // Step 5: Create a function to handle all dynamic UUID tables
  await db.execute(sql`
    -- Create a function to handle all dynamic UUID tables
    CREATE OR REPLACE FUNCTION payload.handle_all_dynamic_tables()
    RETURNS void AS $$
    DECLARE
      uuid_table record;
    BEGIN
      -- Get all tables with UUID pattern names
      FOR uuid_table IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'payload' 
        AND table_name ~ '[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}'
      LOOP
        -- Add all relationship columns to the table
        PERFORM payload.handle_all_relationship_columns(uuid_table.table_name);
      END LOOP;
    END;
    $$ LANGUAGE plpgsql;
  `)

  // Step 6: Run the function to handle all dynamic UUID tables
  await db.execute(sql`
    -- Run the function to handle all dynamic UUID tables
    SELECT payload.handle_all_dynamic_tables();
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove courses_id column from all relationship tables
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
        -- Check if courses_id column exists
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = rel_table.table_name
          AND column_name = 'courses_id'
        ) THEN
          -- Remove courses_id column
          EXECUTE format('ALTER TABLE payload.%I DROP COLUMN courses_id', rel_table.table_name);
        END IF;
      END LOOP;
    END $$;
    
    -- Drop the view
    DROP VIEW IF EXISTS payload.courses_relationships;
  `)
}
