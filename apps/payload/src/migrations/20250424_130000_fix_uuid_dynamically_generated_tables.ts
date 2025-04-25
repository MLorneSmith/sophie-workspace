import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running migration to fix dynamically generated UUID tables')

  try {
    // 1. Create relationship tables that are missing
    console.log('Creating missing relationship tables')

    // Create relationship tables in a separate transaction
    try {
      // Begin transaction
      await db.execute(sql`BEGIN`)

      // Create a helper function to create relationship tables if they don't exist
      await db.execute(sql`
        CREATE OR REPLACE FUNCTION payload.ensure_relationship_table(
          collection_name TEXT,
          related_collection TEXT
        ) RETURNS VOID AS $$
        DECLARE
          table_name TEXT;
          rels_table_name TEXT;
        BEGIN
          -- Construct table names
          table_name := collection_name || '_' || related_collection;
          rels_table_name := collection_name || '_' || related_collection || '_rels';
          
          -- Create the main relationship table if it doesn't exist
          EXECUTE format('
            CREATE TABLE IF NOT EXISTS payload.%I (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              %I_id UUID NOT NULL,
              %I_id UUID NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )', table_name, collection_name, related_collection);
            
          -- Create the relationship auxiliary table if it doesn't exist
          EXECUTE format('
            CREATE TABLE IF NOT EXISTS payload.%I (
              id TEXT PRIMARY KEY,
              _parent_id TEXT,
              field TEXT,
              value TEXT,
              parent_id TEXT,
              "order" INTEGER,
              _order INTEGER,
              path TEXT,
              %I_id TEXT,
              %I_id TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )', rels_table_name, collection_name, related_collection);
            
          -- Log the operation
          INSERT INTO payload.uuid_table_monitor(table_name, created_at, monitoring_status)
          VALUES (table_name, now(), 'relationship_table_created');
          
          INSERT INTO payload.uuid_table_monitor(table_name, created_at, monitoring_status)
          VALUES (rels_table_name, now(), 'relationship_rels_table_created');
        END;
        $$ LANGUAGE plpgsql;
      `)

      // Create missing relationship tables
      await db.execute(sql`
        SELECT 
          payload.ensure_relationship_table('posts', 'downloads'),
          payload.ensure_relationship_table('documentation', 'downloads'),
          payload.ensure_relationship_table('surveys', 'downloads'),
          payload.ensure_relationship_table('private', 'downloads')
      `)

      // Commit transaction
      await db.execute(sql`COMMIT`)
      console.log('Successfully created relationship tables')
    } catch (error) {
      // Rollback transaction on error
      await db.execute(sql`ROLLBACK`)
      console.error('Error creating relationship tables:', error)
      throw error
    }

    // 2. Create a more flexible UUID table detection and fixing function
    console.log('Creating advanced UUID table detection and fixing function')

    try {
      // Begin transaction
      await db.execute(sql`BEGIN`)

      // Enhanced function to detect and fix any table matching UUID pattern
      await db.execute(sql`
        CREATE OR REPLACE FUNCTION payload.fix_any_table_with_missing_columns() 
        RETURNS TRIGGER AS $$
        DECLARE
          required_columns TEXT[] := ARRAY['id', 'parent_id', 'path', 'private_id', 'order', 
                                'course_id', 'course_lessons_id', 'course_quizzes_id', 
                                'surveys_id', 'survey_questions_id', 'posts_id', 
                                'documentation_id', 'downloads_id'];
          col TEXT;
          col_exists BOOLEAN;
        BEGIN
          -- Check if this is a view and skip if so
          PERFORM 1 
          FROM pg_catalog.pg_class c
          JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
          WHERE c.relname = TG_TABLE_NAME
            AND n.nspname = TG_TABLE_SCHEMA
            AND c.relkind = 'v';
            
          IF FOUND THEN
            -- This is a view, skip processing
            RETURN NULL;
          END IF;
        
          -- For each required column
          FOREACH col IN ARRAY required_columns
          LOOP
            -- Check if column exists
            SELECT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_schema = TG_TABLE_SCHEMA
                AND table_name = TG_TABLE_NAME
                AND column_name = col
            ) INTO col_exists;
            
            -- Add column if it doesn't exist
            IF NOT col_exists THEN
              EXECUTE format(
                'ALTER TABLE %I.%I ADD COLUMN IF NOT EXISTS %I TEXT',
                TG_TABLE_SCHEMA, TG_TABLE_NAME, col
              );
            END IF;
          END LOOP;
          
          -- Log the operation
          INSERT INTO payload.uuid_table_monitor(table_name, created_at, monitoring_status)
          VALUES (TG_TABLE_NAME, now(), 'automatically_fixed_by_trigger');
          
          RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;
      `)

      // Commit transaction
      await db.execute(sql`COMMIT`)
      console.log('Successfully created UUID table detection function')
    } catch (error) {
      // Rollback transaction on error
      await db.execute(sql`ROLLBACK`)
      console.error('Error creating UUID table detection function:', error)
      throw error
    }

    // 3. Create a reactive event trigger to catch all table creations
    console.log('Creating event trigger for table creation events')

    try {
      // Begin transaction
      await db.execute(sql`BEGIN`)

      // Drop existing trigger if it exists
      await db.execute(sql`DROP EVENT TRIGGER IF EXISTS fix_any_uuid_table_on_creation`)

      // Try to create event trigger - this may fail if user doesn't have superuser privileges
      try {
        await db.execute(sql`
          CREATE EVENT TRIGGER fix_any_uuid_table_on_creation
          ON ddl_command_end
          WHEN tag IN ('CREATE TABLE')
          EXECUTE FUNCTION payload.fix_any_table_with_missing_columns()
        `)
        console.log('Event trigger created successfully')
      } catch (triggerError) {
        console.warn('Could not create event trigger - may require superuser privileges')
        console.warn('This is not critical as the fix functions will still work on demand')
      }

      // Commit transaction
      await db.execute(sql`COMMIT`)
    } catch (error) {
      // Rollback transaction on error
      await db.execute(sql`ROLLBACK`)
      console.error('Error creating event trigger:', error)
      throw error
    }

    // 4. Create a fallback function to scan and fix all tables in the database
    console.log('Creating table scanning function')

    try {
      // Begin transaction
      await db.execute(sql`BEGIN`)

      await db.execute(sql`
        CREATE OR REPLACE FUNCTION payload.scan_and_fix_all_tables() 
        RETURNS INTEGER AS $$
        DECLARE
          table_rec RECORD;
          fixed_count INTEGER := 0;
          required_columns TEXT[] := ARRAY['id', 'parent_id', 'path', 'private_id', 'order', 
                                'course_id', 'course_lessons_id', 'course_quizzes_id', 
                                'surveys_id', 'survey_questions_id', 'posts_id', 
                                'documentation_id', 'downloads_id'];
          col TEXT;
          col_exists BOOLEAN;
        BEGIN
          -- Get all tables in the payload schema that are not views
          FOR table_rec IN 
            SELECT tablename AS table_name
            FROM pg_tables
            WHERE schemaname = 'payload'
            AND tablename NOT LIKE 'pg_%'
            AND tablename NOT IN (
              SELECT viewname 
              FROM pg_views 
              WHERE schemaname = 'payload'
            )
          LOOP
            -- For each required column
            FOREACH col IN ARRAY required_columns
            LOOP
              -- Check if column exists
              SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'payload'
                  AND table_name = table_rec.table_name
                  AND column_name = col
              ) INTO col_exists;
              
              -- Add column if it doesn't exist
              IF NOT col_exists THEN
                BEGIN
                  EXECUTE format(
                    'ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS %I TEXT',
                    table_rec.table_name, col
                  );
                  
                  -- Only count table once even if multiple columns were added
                  IF fixed_count = 0 OR 
                    NOT EXISTS (
                      SELECT 1 FROM payload.uuid_table_monitor 
                      WHERE table_name = table_rec.table_name 
                        AND monitoring_status = 'fixed_by_scan_all'
                    ) THEN
                    fixed_count := fixed_count + 1;
                    
                    -- Log the operation
                    INSERT INTO payload.uuid_table_monitor(table_name, created_at, monitoring_status)
                    VALUES (table_rec.table_name, now(), 'fixed_by_scan_all');
                  END IF;
                EXCEPTION WHEN others THEN
                  -- Log errors but continue processing
                  RAISE NOTICE 'Error fixing table %: %', table_rec.table_name, SQLERRM;
                END;
              END IF;
            END LOOP;
          END LOOP;
          
          RETURN fixed_count;
        END;
        $$ LANGUAGE plpgsql;
      `)

      // Commit transaction
      await db.execute(sql`COMMIT`)
      console.log('Successfully created table scanning function')
    } catch (error) {
      // Rollback transaction on error
      await db.execute(sql`ROLLBACK`)
      console.error('Error creating table scanning function:', error)
      throw error
    }

    // 5. Run the scan to fix all existing tables
    console.log('Running table scan to fix existing tables')

    try {
      // Begin transaction
      await db.execute(sql`BEGIN`)

      // Run the scan function
      await db.execute(sql`SELECT payload.scan_and_fix_all_tables()`)

      // Commit transaction
      await db.execute(sql`COMMIT`)
      console.log('Successfully ran table scan')
    } catch (error) {
      // Rollback transaction on error
      await db.execute(sql`ROLLBACK`)
      console.error('Error running table scan:', error)
      throw error
    }

    // 6. Add columns to tables with UUID names
    console.log('Adding columns to tables with UUID pattern names')

    try {
      // Begin transaction
      await db.execute(sql`BEGIN`)

      await db.execute(sql`
        CREATE OR REPLACE FUNCTION payload.fix_uuid_named_tables() 
        RETURNS INTEGER AS $$
        DECLARE
          table_rec RECORD;
          fixed_count INTEGER := 0;
          required_columns TEXT[] := ARRAY['id', 'parent_id', 'path', 'private_id', 'order', 
                                'course_id', 'course_lessons_id', 'course_quizzes_id', 
                                'surveys_id', 'survey_questions_id', 'posts_id', 
                                'documentation_id', 'downloads_id'];
          col TEXT;
          col_exists BOOLEAN;
        BEGIN
          -- Get all tables with UUID-like names (temporary tables)
          FOR table_rec IN 
            SELECT tablename AS table_name
            FROM pg_tables
            WHERE schemaname = 'payload'
            AND (
              -- Traditional UUID pattern
              tablename ~ '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$'
              -- Or any table with underscores and mostly hexadecimal
              OR tablename ~ '^[0-9a-f]+_[0-9a-f_]+$'
            )
          LOOP
            -- For each required column
            FOREACH col IN ARRAY required_columns
            LOOP
              -- Check if column exists
              SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'payload'
                  AND table_name = table_rec.table_name
                  AND column_name = col
              ) INTO col_exists;
              
              -- Add column if it doesn't exist
              IF NOT col_exists THEN
                BEGIN
                  EXECUTE format(
                    'ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS %I TEXT',
                    table_rec.table_name, col
                  );
                  
                  -- Only count table once even if multiple columns were added
                  IF fixed_count = 0 OR 
                    NOT EXISTS (
                      SELECT 1 FROM payload.uuid_table_monitor 
                      WHERE table_name = table_rec.table_name 
                        AND monitoring_status = 'fixed_uuid_named'
                    ) THEN
                    fixed_count := fixed_count + 1;
                    
                    -- Log the operation
                    INSERT INTO payload.uuid_table_monitor(table_name, created_at, monitoring_status)
                    VALUES (table_rec.table_name, now(), 'fixed_uuid_named');
                  END IF;
                EXCEPTION WHEN others THEN
                  -- Log errors but continue processing
                  RAISE NOTICE 'Error fixing UUID-named table %: %', table_rec.table_name, SQLERRM;
                END;
              END IF;
            END LOOP;
          END LOOP;
          
          RETURN fixed_count;
        END;
        $$ LANGUAGE plpgsql;
      `)

      // Run the fix for UUID-named tables
      await db.execute(sql`SELECT payload.fix_uuid_named_tables()`)

      // Commit transaction
      await db.execute(sql`COMMIT`)
      console.log('Successfully fixed UUID-named tables')
    } catch (error) {
      // Rollback transaction on error
      await db.execute(sql`ROLLBACK`)
      console.error('Error fixing UUID-named tables:', error)
      throw error
    }

    console.log('Successfully fixed UUID dynamically generated tables')
  } catch (error) {
    console.error('Error in overall UUID tables fix process:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('Rolling back fixes for dynamically generated UUID tables')

  try {
    // Drop functions but keep tables for compatibility
    await db.execute(sql`
      DROP FUNCTION IF EXISTS payload.ensure_relationship_table(TEXT, TEXT);
      DROP FUNCTION IF EXISTS payload.fix_any_table_with_missing_columns() CASCADE;
      DROP FUNCTION IF EXISTS payload.scan_and_fix_all_tables();
      DROP FUNCTION IF EXISTS payload.fix_uuid_named_tables();
      DROP EVENT TRIGGER IF EXISTS fix_any_uuid_table_on_creation;
    `)

    console.log('Successfully rolled back fixes for dynamically generated UUID tables')
  } catch (error) {
    console.error('Error rolling back fixes for dynamically generated UUID tables:', error)
    throw error
  }
}
