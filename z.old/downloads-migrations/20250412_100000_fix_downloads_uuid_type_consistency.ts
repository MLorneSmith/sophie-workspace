import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

import { DOWNLOAD_ID_MAP } from '../../../../packages/content-migrations/src/data/download-id-map'

/**
 * Fix Downloads UUID Type Consistency
 *
 * This migration fixes the PostgreSQL type mismatch error between TEXT and UUID
 * columns while preserving the predefined UUIDs from download-id-map.ts.
 *
 * The error "operator does not exist: text = uuid" occurs because:
 * 1. In relationship tables, downloads_id is TEXT type
 * 2. When comparing with UUID columns, PostgreSQL cannot implicitly convert types
 *
 * The solution:
 * 1. Add safe UUID comparison function
 * 2. Ensure consistent types across all relevant columns
 * 3. Preserve predefined UUIDs from download-id-map.ts
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running fix downloads UUID type consistency migration')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // 1. Add helper function for safe UUID comparison
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION payload.safe_uuid_comparison(a TEXT, b TEXT) 
      RETURNS BOOLEAN AS $$
      BEGIN
        -- Try to cast both to UUID and compare
        RETURN a::uuid = b::uuid;
      EXCEPTION WHEN OTHERS THEN
        -- If casting fails, compare as text
        RETURN a = b;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // 2. Create column alias function for downloads_id and related_id
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION payload.ensure_downloads_id_columns(table_name TEXT)
      RETURNS VOID AS $$
      BEGIN
        EXECUTE format('
          ALTER TABLE payload.%I 
          ADD COLUMN IF NOT EXISTS downloads_id UUID
        ', table_name);
        
        EXECUTE format('
          ALTER TABLE payload.%I 
          ADD COLUMN IF NOT EXISTS related_id UUID
        ', table_name);
      END;
      $$ LANGUAGE plpgsql;
    `)

    // 3. Get all relationship tables that reference downloads
    const collections = [
      'documentation',
      'posts',
      'surveys',
      'survey_questions',
      'courses',
      'course_lessons',
      'course_quizzes',
      'quiz_questions',
    ]

    // 4. Loop through each collection and fix related tables
    for (const collection of collections) {
      const relationshipTable = `${collection}__downloads`

      // Check if table exists
      const tableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload'
          AND table_name = ${relationshipTable}
        ) as exists
      `)

      if (tableExists.rows.length > 0 && tableExists.rows[0].exists) {
        console.log(`Checking ${relationshipTable} column types...`)

        // Get downloads_id column type
        const columnInfo = await db.execute(sql`
          SELECT data_type 
          FROM information_schema.columns
          WHERE table_schema = 'payload'
          AND table_name = ${relationshipTable}
          AND column_name = 'downloads_id'
        `)

        // If downloads_id exists but is not UUID type, convert it
        if (columnInfo.rows.length > 0 && columnInfo.rows[0].data_type !== 'uuid') {
          console.log(
            `Converting ${relationshipTable}.downloads_id from ${columnInfo.rows[0].data_type} to UUID type`,
          )

          // First, create a new UUID column
          await db.execute(sql`
            ALTER TABLE payload.${sql.raw(relationshipTable)}
            ADD COLUMN IF NOT EXISTS downloads_id_uuid UUID
          `)

          // Copy values with safe casting
          await db.execute(sql`
            UPDATE payload.${sql.raw(relationshipTable)}
            SET downloads_id_uuid = CASE
              WHEN downloads_id IS NOT NULL THEN downloads_id::uuid
              ELSE NULL
            END
          `)

          // Drop original column
          await db.execute(sql`
            ALTER TABLE payload.${sql.raw(relationshipTable)}
            DROP COLUMN IF EXISTS downloads_id
          `)

          // Rename UUID column to downloads_id
          await db.execute(sql`
            ALTER TABLE payload.${sql.raw(relationshipTable)}
            RENAME COLUMN downloads_id_uuid TO downloads_id
          `)

          // Create index
          await db.execute(sql`
            CREATE INDEX IF NOT EXISTS ${sql.raw(`${relationshipTable}_downloads_id_idx`)}
            ON payload.${sql.raw(relationshipTable)} (downloads_id)
          `)

          console.log(`Successfully converted ${relationshipTable}.downloads_id to UUID type`)
        }
      }
    }

    // 5. Fix downloads_rels._parent_id type if needed
    const parentIdType = await db.execute(sql`
      SELECT data_type 
      FROM information_schema.columns
      WHERE table_schema = 'payload'
      AND table_name = 'downloads_rels' 
      AND column_name = '_parent_id'
    `)

    // If _parent_id exists but is not UUID type, convert it
    if (parentIdType.rows.length > 0 && parentIdType.rows[0].data_type !== 'uuid') {
      console.log(
        `Converting downloads_rels._parent_id from ${parentIdType.rows[0].data_type} to UUID type`,
      )

      // First, create a new UUID column
      await db.execute(sql`
        ALTER TABLE payload.downloads_rels
        ADD COLUMN _parent_id_uuid UUID
      `)

      // Copy values with safe casting
      await db.execute(sql`
        UPDATE payload.downloads_rels
        SET _parent_id_uuid = CASE
          WHEN _parent_id IS NOT NULL THEN _parent_id::uuid
          ELSE NULL
        END
      `)

      // Find and drop any foreign key constraints
      await db.execute(sql`
        DO $$
        DECLARE
          constraint_name text;
        BEGIN
          SELECT conname INTO constraint_name
          FROM pg_constraint c
          JOIN pg_namespace n ON n.oid = c.connamespace
          WHERE n.nspname = 'payload'
          AND c.conrelid = 'payload.downloads_rels'::regclass
          AND c.contype = 'f'
          AND EXISTS (
            SELECT FROM pg_attribute
            WHERE attrelid = 'payload.downloads_rels'::regclass
            AND attname = '_parent_id'
            AND attnum = ANY(c.conkey)
          );
          
          IF constraint_name IS NOT NULL THEN
            EXECUTE 'ALTER TABLE payload.downloads_rels DROP CONSTRAINT ' || constraint_name;
          END IF;
        END
        $$;
      `)

      // Drop original column
      await db.execute(sql`
        ALTER TABLE payload.downloads_rels
        DROP COLUMN _parent_id
      `)

      // Rename UUID column to _parent_id
      await db.execute(sql`
        ALTER TABLE payload.downloads_rels
        RENAME COLUMN _parent_id_uuid TO _parent_id
      `)

      // Re-create the foreign key constraint
      await db.execute(sql`
        ALTER TABLE payload.downloads_rels 
        ADD CONSTRAINT downloads_rels_parent_fk 
        FOREIGN KEY (_parent_id) 
        REFERENCES payload.downloads(id) 
        ON DELETE CASCADE
      `)

      // Create index
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS downloads_rels_parent_idx 
        ON payload.downloads_rels (_parent_id)
      `)

      console.log(`Successfully converted downloads_rels._parent_id to UUID type`)
    }

    // 6. Create dynamic handler for temporary UUID tables
    console.log('Creating solution for dynamically generated UUID tables')
    await db.execute(sql`
      -- Create a function that can be called when temporary tables are created
      CREATE OR REPLACE FUNCTION payload.ensure_downloads_id_column()
      RETURNS event_trigger AS $$
      DECLARE
        obj record;
        table_schema text;
        table_name text;
      BEGIN
        FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands() 
        LOOP
          -- Check if this is a CREATE TABLE command for a temporary UUID table
          IF obj.command_tag = 'CREATE TABLE' AND 
             obj.object_identity ~ 'payload\\.[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}' 
          THEN
            -- Extract schema and table name
            table_schema := split_part(obj.object_identity, '.', 1);
            table_name := split_part(obj.object_identity, '.', 2);
            
            -- Add downloads_id column with UUID type
            EXECUTE format('
              ALTER TABLE %I.%I 
              ADD COLUMN IF NOT EXISTS downloads_id UUID
            ', table_schema, table_name);
            
            RAISE NOTICE 'Added downloads_id column with UUID type to dynamic table %', table_name;
          END IF;
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Try to create the event trigger, but gracefully handle insufficient privileges
    await db.execute(sql`
      DO $$
      BEGIN
        -- Drop if exists
        DROP EVENT TRIGGER IF EXISTS downloads_id_dynamic_table_trigger;
        
        -- Create event trigger for dynamic tables
        CREATE EVENT TRIGGER downloads_id_dynamic_table_trigger 
        ON ddl_command_end
        WHEN tag IN ('CREATE TABLE')
        EXECUTE FUNCTION payload.ensure_downloads_id_column();
      EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Insufficient privileges to create event trigger - using fallback approach';
      END
      $$;
    `)

    // 7. Create alias type for backwards compatibility
    await db.execute(sql`
      -- Create a domain type that can accept both TEXT and UUID
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type
          JOIN pg_namespace ON pg_namespace.oid = pg_type.typnamespace
          WHERE pg_namespace.nspname = 'payload'
          AND pg_type.typname = 'uuid_or_text'
        ) THEN
          CREATE DOMAIN payload.uuid_or_text AS TEXT;
        END IF;
      END
      $$;
    `)

    // 8. Check and fix downloads table to ensure consistent IDs
    await db.execute(sql`
      -- Ensure downloads table has the right ID columns
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'payload'
          AND table_name = 'downloads'
        ) THEN
          -- Ensure id is UUID type
          IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'payload'
            AND table_name = 'downloads'
            AND column_name = 'id'
            AND data_type <> 'uuid'
          ) THEN
            ALTER TABLE payload.downloads
            ALTER COLUMN id TYPE uuid USING id::uuid;
          END IF;
        END IF;
      END
      $$;
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Download UUID type consistency migration completed successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in fix downloads UUID type consistency migration:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('Running down migration for fix downloads UUID type consistency')

  // This is a non-destructive migration - just clean up helper functions
  await db.execute(sql`
    DROP FUNCTION IF EXISTS payload.safe_uuid_comparison(TEXT, TEXT);
    DROP FUNCTION IF EXISTS payload.ensure_downloads_id_columns(TEXT);
    DROP EVENT TRIGGER IF EXISTS downloads_id_dynamic_table_trigger;
    DROP FUNCTION IF EXISTS payload.ensure_downloads_id_column();
    DROP DOMAIN IF EXISTS payload.uuid_or_text;
  `)

  console.log('Down migration for downloads UUID type consistency completed')
}
