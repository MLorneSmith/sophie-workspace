import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Step 1: Add all possible relationship columns to all relationship tables
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
        -- Add course_lessons_id if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = rel_table.table_name
          AND column_name = 'course_lessons_id'
        ) THEN
          EXECUTE format('ALTER TABLE payload.%I ADD COLUMN course_lessons_id uuid', rel_table.table_name);
        END IF;

        -- Add course_quizzes_id if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = rel_table.table_name
          AND column_name = 'course_quizzes_id'
        ) THEN
          EXECUTE format('ALTER TABLE payload.%I ADD COLUMN course_quizzes_id uuid', rel_table.table_name);
        END IF;

        -- Add courses_id if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = rel_table.table_name
          AND column_name = 'courses_id'
        ) THEN
          EXECUTE format('ALTER TABLE payload.%I ADD COLUMN courses_id uuid', rel_table.table_name);
        END IF;

        -- Add documentation_id if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = rel_table.table_name
          AND column_name = 'documentation_id'
        ) THEN
          EXECUTE format('ALTER TABLE payload.%I ADD COLUMN documentation_id uuid', rel_table.table_name);
        END IF;

        -- Add media_id if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = rel_table.table_name
          AND column_name = 'media_id'
        ) THEN
          EXECUTE format('ALTER TABLE payload.%I ADD COLUMN media_id uuid', rel_table.table_name);
        END IF;

        -- Add posts_id if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = rel_table.table_name
          AND column_name = 'posts_id'
        ) THEN
          EXECUTE format('ALTER TABLE payload.%I ADD COLUMN posts_id uuid', rel_table.table_name);
        END IF;

        -- Add quiz_questions_id if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = rel_table.table_name
          AND column_name = 'quiz_questions_id'
        ) THEN
          EXECUTE format('ALTER TABLE payload.%I ADD COLUMN quiz_questions_id uuid', rel_table.table_name);
        END IF;

        -- Add survey_questions_id if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = rel_table.table_name
          AND column_name = 'survey_questions_id'
        ) THEN
          EXECUTE format('ALTER TABLE payload.%I ADD COLUMN survey_questions_id uuid', rel_table.table_name);
        END IF;

        -- Add surveys_id if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = rel_table.table_name
          AND column_name = 'surveys_id'
        ) THEN
          EXECUTE format('ALTER TABLE payload.%I ADD COLUMN surveys_id uuid', rel_table.table_name);
        END IF;

        -- Add users_id if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = rel_table.table_name
          AND column_name = 'users_id'
        ) THEN
          EXECUTE format('ALTER TABLE payload.%I ADD COLUMN users_id uuid', rel_table.table_name);
        END IF;

        -- Add payload_preferences_id if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = rel_table.table_name
          AND column_name = 'payload_preferences_id'
        ) THEN
          EXECUTE format('ALTER TABLE payload.%I ADD COLUMN payload_preferences_id uuid', rel_table.table_name);
        END IF;

        -- Add payload_locked_documents_id if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = rel_table.table_name
          AND column_name = 'payload_locked_documents_id'
        ) THEN
          EXECUTE format('ALTER TABLE payload.%I ADD COLUMN payload_locked_documents_id uuid', rel_table.table_name);
        END IF;
      END LOOP;
    END $$;
  `)

  // Step 2: Create views for all collections that don't have them yet

  // Create view for course_quizzes relationships if it doesn't exist
  await db.execute(sql`
    -- Drop the view if it already exists
    DROP VIEW IF EXISTS payload.course_quizzes_relationships;
    
    -- Create the view
    CREATE VIEW payload.course_quizzes_relationships AS
    SELECT 
      cq.id AS course_quizzes_id,
      'course_quizzes' AS parent_collection,
      cq.id AS parent_id
    FROM 
      payload.course_quizzes cq;
  `)

  // Create view for payload_preferences relationships if it doesn't exist
  await db.execute(sql`
    -- Drop the view if it already exists
    DROP VIEW IF EXISTS payload.payload_preferences_relationships;
    
    -- Create the view
    CREATE VIEW payload.payload_preferences_relationships AS
    SELECT 
      pp.id AS payload_preferences_id,
      'payload_preferences' AS parent_collection,
      pp.id AS parent_id
    FROM 
      payload.payload_preferences pp;
  `)

  // Create view for payload_locked_documents relationships if it doesn't exist
  await db.execute(sql`
    -- Drop the view if it already exists
    DROP VIEW IF EXISTS payload.payload_locked_documents_relationships;
    
    -- Create the view
    CREATE VIEW payload.payload_locked_documents_relationships AS
    SELECT 
      pld.id AS payload_locked_documents_id,
      'payload_locked_documents' AS parent_collection,
      pld.id AS parent_id
    FROM 
      payload.payload_locked_documents pld;
  `)

  // Step 3: Update the add_relationship_columns function to include all possible relationship columns
  await db.execute(sql`
    -- Update the function to add all relationship columns
    CREATE OR REPLACE FUNCTION payload.add_relationship_columns(table_name text) 
    RETURNS void AS $$
    BEGIN
      -- Add course_lessons_id column if it doesn't exist
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = table_name
        AND column_name = 'course_lessons_id'
      ) THEN
        EXECUTE format('ALTER TABLE payload.%I ADD COLUMN course_lessons_id uuid', table_name);
      END IF;
      
      -- Add course_quizzes_id column if it doesn't exist
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = table_name
        AND column_name = 'course_quizzes_id'
      ) THEN
        EXECUTE format('ALTER TABLE payload.%I ADD COLUMN course_quizzes_id uuid', table_name);
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
      
      -- Add documentation_id column if it doesn't exist
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = table_name
        AND column_name = 'documentation_id'
      ) THEN
        EXECUTE format('ALTER TABLE payload.%I ADD COLUMN documentation_id uuid', table_name);
      END IF;
      
      -- Add media_id column if it doesn't exist
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = table_name
        AND column_name = 'media_id'
      ) THEN
        EXECUTE format('ALTER TABLE payload.%I ADD COLUMN media_id uuid', table_name);
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
      
      -- Add quiz_questions_id column if it doesn't exist
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = table_name
        AND column_name = 'quiz_questions_id'
      ) THEN
        EXECUTE format('ALTER TABLE payload.%I ADD COLUMN quiz_questions_id uuid', table_name);
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
      
      -- Add surveys_id column if it doesn't exist
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = table_name
        AND column_name = 'surveys_id'
      ) THEN
        EXECUTE format('ALTER TABLE payload.%I ADD COLUMN surveys_id uuid', table_name);
      END IF;
      
      -- Add users_id column if it doesn't exist
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = table_name
        AND column_name = 'users_id'
      ) THEN
        EXECUTE format('ALTER TABLE payload.%I ADD COLUMN users_id uuid', table_name);
      END IF;
      
      -- Add payload_preferences_id column if it doesn't exist
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = table_name
        AND column_name = 'payload_preferences_id'
      ) THEN
        EXECUTE format('ALTER TABLE payload.%I ADD COLUMN payload_preferences_id uuid', table_name);
      END IF;
      
      -- Add payload_locked_documents_id column if it doesn't exist
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = table_name
        AND column_name = 'payload_locked_documents_id'
      ) THEN
        EXECUTE format('ALTER TABLE payload.%I ADD COLUMN payload_locked_documents_id uuid', table_name);
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
      
      -- Add all relationship columns
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
      
      BEGIN
        EXECUTE format('
          INSERT INTO payload.%I (id, course_lessons_id)
          SELECT parent_id, course_lessons_id FROM payload.course_lessons_relationships
          ON CONFLICT (id) DO UPDATE SET course_lessons_id = EXCLUDED.course_lessons_id
        ', uuid_table);
      EXCEPTION WHEN undefined_table THEN
        -- View doesn't exist, skip
      END;
      
      BEGIN
        EXECUTE format('
          INSERT INTO payload.%I (id, course_quizzes_id)
          SELECT parent_id, course_quizzes_id FROM payload.course_quizzes_relationships
          ON CONFLICT (id) DO UPDATE SET course_quizzes_id = EXCLUDED.course_quizzes_id
        ', uuid_table);
      EXCEPTION WHEN undefined_table THEN
        -- View doesn't exist, skip
      END;
      
      BEGIN
        EXECUTE format('
          INSERT INTO payload.%I (id, quiz_questions_id)
          SELECT parent_id, quiz_questions_id FROM payload.quiz_questions_relationships
          ON CONFLICT (id) DO UPDATE SET quiz_questions_id = EXCLUDED.quiz_questions_id
        ', uuid_table);
      EXCEPTION WHEN undefined_table THEN
        -- View doesn't exist, skip
      END;
      
      BEGIN
        EXECUTE format('
          INSERT INTO payload.%I (id, users_id)
          SELECT parent_id, users_id FROM payload.users_relationships
          ON CONFLICT (id) DO UPDATE SET users_id = EXCLUDED.users_id
        ', uuid_table);
      EXCEPTION WHEN undefined_table THEN
        -- View doesn't exist, skip
      END;
      
      BEGIN
        EXECUTE format('
          INSERT INTO payload.%I (id, payload_preferences_id)
          SELECT parent_id, payload_preferences_id FROM payload.payload_preferences_relationships
          ON CONFLICT (id) DO UPDATE SET payload_preferences_id = EXCLUDED.payload_preferences_id
        ', uuid_table);
      EXCEPTION WHEN undefined_table THEN
        -- View doesn't exist, skip
      END;
      
      BEGIN
        EXECUTE format('
          INSERT INTO payload.%I (id, payload_locked_documents_id)
          SELECT parent_id, payload_locked_documents_id FROM payload.payload_locked_documents_relationships
          ON CONFLICT (id) DO UPDATE SET payload_locked_documents_id = EXCLUDED.payload_locked_documents_id
        ', uuid_table);
      EXCEPTION WHEN undefined_table THEN
        -- View doesn't exist, skip
      END;
    END;
    $$ LANGUAGE plpgsql;
  `)

  // Step 7: Create a function to handle all dynamic UUID tables
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

  // Step 8: Run the function to handle all dynamic UUID tables
  await db.execute(sql`
    -- Run the function to handle all dynamic UUID tables
    SELECT payload.handle_all_dynamic_tables();
  `)

  // Note: We're not creating an event trigger because it requires superuser privileges
  // If you have superuser privileges, you can uncomment the following code:
  /*
  await db.execute(sql`
    -- Create a trigger to automatically handle dynamic UUID tables
    DROP EVENT TRIGGER IF EXISTS handle_dynamic_uuid_tables;
    
    CREATE EVENT TRIGGER handle_dynamic_uuid_tables
    ON ddl_command_end
    WHEN tag IN ('CREATE TABLE')
    EXECUTE FUNCTION payload.create_dynamic_uuid_table();
  `)
  */
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Drop the trigger
  await db.execute(sql`
    DROP EVENT TRIGGER IF EXISTS handle_dynamic_uuid_tables;
  `)

  // Drop the functions
  await db.execute(sql`
    DROP FUNCTION IF EXISTS payload.handle_all_dynamic_tables();
    DROP FUNCTION IF EXISTS payload.handle_all_relationship_columns(text);
    DROP FUNCTION IF EXISTS payload.create_dynamic_uuid_table();
    DROP FUNCTION IF EXISTS payload.handle_dynamic_uuid_table(text);
  `)

  // Drop the views
  await db.execute(sql`
    DROP VIEW IF EXISTS payload.course_quizzes_relationships;
    DROP VIEW IF EXISTS payload.payload_preferences_relationships;
    DROP VIEW IF EXISTS payload.payload_locked_documents_relationships;
  `)
}
