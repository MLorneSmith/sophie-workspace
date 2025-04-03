import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Step 1: Add survey_questions_id column to all relationship tables
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
        -- Check if survey_questions_id column already exists
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = rel_table.table_name
          AND column_name = 'survey_questions_id'
        ) THEN
          -- Add survey_questions_id column
          EXECUTE format('ALTER TABLE payload.%I ADD COLUMN survey_questions_id uuid', rel_table.table_name);
        END IF;
      END LOOP;
    END $$;
  `)

  // Step 2: Create a view for survey_questions relationships
  await db.execute(sql`
    -- Drop the view if it already exists
    DROP VIEW IF EXISTS payload.survey_questions_relationships;
    
    -- Create the view
    CREATE VIEW payload.survey_questions_relationships AS
    SELECT 
      sq.id AS survey_questions_id,
      'survey_questions' AS parent_collection,
      sq.id AS parent_id
    FROM 
      payload.survey_questions sq;
  `)

  // Step 3: Update the add_relationship_columns function to include survey_questions_id
  await db.execute(sql`
    -- Update the function to add survey_questions_id column
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

  // Step 5: Create a function to handle any dynamic UUID table that appears in a query
  await db.execute(sql`
    -- Create a function to automatically create and populate dynamic UUID tables
    CREATE OR REPLACE FUNCTION payload.create_dynamic_uuid_table()
    RETURNS event_trigger AS $$
    DECLARE
      query text;
      uuid_pattern text;
      matches text[];
    BEGIN
      -- Get the current query
      query := current_query();
      
      -- Define the UUID pattern
      uuid_pattern := '[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}';
      
      -- Extract UUID table names from the query
      SELECT regexp_matches(query, uuid_pattern) INTO matches;
      
      -- If a UUID table is found, create it
      IF matches IS NOT NULL THEN
        PERFORM payload.handle_dynamic_uuid_table(matches[1]);
      END IF;
    END;
    $$ LANGUAGE plpgsql;
  `)

  // Step 6: Create a comprehensive function to handle all relationship columns
  await db.execute(sql`
    -- Create a function to handle all relationship columns
    CREATE OR REPLACE FUNCTION payload.handle_all_relationship_columns()
    RETURNS void AS $$
    DECLARE
      rel_table record;
    BEGIN
      -- Get all tables with UUID pattern names
      FOR rel_table IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'payload' 
        AND table_name ~ '[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}'
      LOOP
        -- Add all relationship columns to the table
        PERFORM payload.add_relationship_columns(rel_table.table_name);
      END LOOP;
    END;
    $$ LANGUAGE plpgsql;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove survey_questions_id column from all relationship tables
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
        -- Check if survey_questions_id column exists
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = rel_table.table_name
          AND column_name = 'survey_questions_id'
        ) THEN
          -- Remove survey_questions_id column
          EXECUTE format('ALTER TABLE payload.%I DROP COLUMN survey_questions_id', rel_table.table_name);
        END IF;
      END LOOP;
    END $$;
    
    -- Drop the view
    DROP VIEW IF EXISTS payload.survey_questions_relationships;
    
    -- Drop the functions
    DROP FUNCTION IF EXISTS payload.create_dynamic_uuid_table;
    DROP FUNCTION IF EXISTS payload.handle_all_relationship_columns;
  `)
}
