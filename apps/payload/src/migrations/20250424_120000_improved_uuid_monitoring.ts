import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running migration to improve UUID table monitoring')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // First, check if the function already exists
    const functionExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'payload' 
        AND p.proname = 'scan_and_fix_uuid_tables'
      ) as exists;
    `)

    if (functionExists.rows[0].exists) {
      // Create a backup of the existing function for safety
      await db.execute(sql`
        CREATE OR REPLACE FUNCTION payload.scan_and_fix_uuid_tables_backup()
        RETURNS SETOF record AS
        $func$
          SELECT * FROM payload.scan_and_fix_uuid_tables();
        $func$
        LANGUAGE sql;
      `)

      console.log('Created backup of existing UUID table monitoring function')
    }

    // First explicitly drop the function before recreating it with a different return type
    await db.execute(sql`
      DROP FUNCTION IF EXISTS payload.scan_and_fix_uuid_tables();
    `)

    console.log('Dropped existing UUID table monitoring function')

    // Create enhanced function for UUID table monitoring
    await db.execute(sql`
      CREATE FUNCTION payload.scan_and_fix_uuid_tables()
      RETURNS TABLE(table_name TEXT, columns_added TEXT[]) AS
      $func$
      DECLARE
        uuid_table TEXT;
        added_columns TEXT[] := '{}'::TEXT[];
        is_view BOOLEAN;
      BEGIN
        -- Log start of function
        RAISE NOTICE 'Starting UUID table scan with enhanced error handling...';
        
        -- Loop through all tables in the payload schema that match pattern
        FOR uuid_table IN 
          SELECT tables.table_name
          FROM information_schema.tables AS tables
          WHERE tables.table_schema = 'payload'
          AND (
            tables.table_name ~ '^[0-9a-f]{8}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{12}$'
            OR tables.table_name ~ '^[0-9a-f]{8}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{12}$'
            OR tables.table_name LIKE '%\_rels'
          )
        LOOP
          -- Reset added columns for this table
          added_columns := '{}'::TEXT[];
          
          -- Check if it's a view
          SELECT tables.table_type = 'VIEW' INTO is_view
          FROM information_schema.tables AS tables
          WHERE tables.table_schema = 'payload' 
          AND tables.table_name = uuid_table;
          
          -- Skip views
          IF is_view THEN
            RAISE NOTICE 'Skipping view %', uuid_table;
            CONTINUE;
          END IF;
          
          -- Use transaction to handle errors gracefully
          BEGIN
            -- Add required columns with proper error handling
            BEGIN
              EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS path TEXT', uuid_table);
              added_columns := array_append(added_columns, 'path');
            EXCEPTION WHEN OTHERS THEN
              RAISE NOTICE 'Could not add path column to %: %', uuid_table, SQLERRM;
            END;
            
            BEGIN
              EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS parent_id TEXT', uuid_table);
              added_columns := array_append(added_columns, 'parent_id');
            EXCEPTION WHEN OTHERS THEN
              RAISE NOTICE 'Could not add parent_id column to %: %', uuid_table, SQLERRM;
            END;
            
            BEGIN
              EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS downloads_id UUID', uuid_table);
              added_columns := array_append(added_columns, 'downloads_id');
            EXCEPTION WHEN OTHERS THEN
              RAISE NOTICE 'Could not add downloads_id column to %: %', uuid_table, SQLERRM;
            END;
            
            BEGIN
              EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS courses_id UUID', uuid_table);
              added_columns := array_append(added_columns, 'courses_id');
            EXCEPTION WHEN OTHERS THEN
              RAISE NOTICE 'Could not add courses_id column to %: %', uuid_table, SQLERRM;
            END;
            
            BEGIN
              EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS course_lessons_id UUID', uuid_table);
              added_columns := array_append(added_columns, 'course_lessons_id');
            EXCEPTION WHEN OTHERS THEN
              RAISE NOTICE 'Could not add course_lessons_id column to %: %', uuid_table, SQLERRM;
            END;
            
            BEGIN
              EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS course_quizzes_id UUID', uuid_table);
              added_columns := array_append(added_columns, 'course_quizzes_id');
            EXCEPTION WHEN OTHERS THEN
              RAISE NOTICE 'Could not add course_quizzes_id column to %: %', uuid_table, SQLERRM;
            END;
            
            -- Update tracking table
            BEGIN
              INSERT INTO payload.dynamic_uuid_tables (table_name, primary_key, created_at, needs_path_column)
              VALUES (uuid_table, 'parent_id', NOW(), TRUE)
              ON CONFLICT (table_name) 
              DO UPDATE SET 
                created_at = NOW(),
                needs_path_column = TRUE;
            EXCEPTION WHEN OTHERS THEN
              RAISE NOTICE 'Could not update tracking table for %: %', uuid_table, SQLERRM;
            END;
            
          EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Transaction failed for table %: %', uuid_table, SQLERRM;
          END;
          
          -- Only return tables that had columns added
          IF array_length(added_columns, 1) > 0 THEN
            table_name := uuid_table;
            columns_added := added_columns;
            RETURN NEXT;
          END IF;
        END LOOP;
        
        RETURN;
      END;
      $func$
      LANGUAGE plpgsql;
    `)

    console.log('Created enhanced UUID table monitoring function')

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Successfully improved UUID table monitoring')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error improving UUID table monitoring:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('Rolling back UUID table monitoring improvements')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // Check if the backup function exists
    const backupExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'payload' 
        AND p.proname = 'scan_and_fix_uuid_tables_backup'
      ) as exists;
    `)

    if (backupExists.rows[0].exists) {
      // Restore from backup if it exists
      await db.execute(sql`
        CREATE OR REPLACE FUNCTION payload.scan_and_fix_uuid_tables()
        RETURNS SETOF record AS
        $func$
          SELECT * FROM payload.scan_and_fix_uuid_tables_backup();
        $func$
        LANGUAGE sql;
      `)

      // Drop the backup function
      await db.execute(sql`
        DROP FUNCTION IF EXISTS payload.scan_and_fix_uuid_tables_backup();
      `)

      console.log('Restored original UUID table monitoring function from backup')
    } else {
      // If no backup exists, drop the function entirely
      await db.execute(sql`
        DROP FUNCTION IF EXISTS payload.scan_and_fix_uuid_tables();
      `)

      console.log('Removed UUID table monitoring function (no backup found)')
    }

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Successfully rolled back UUID table monitoring improvements')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error rolling back UUID table monitoring improvements:', error)
    throw error
  }
}
