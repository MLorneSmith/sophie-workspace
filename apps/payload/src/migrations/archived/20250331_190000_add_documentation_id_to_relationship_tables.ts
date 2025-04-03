import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Step 1: Add documentation_id column to all relationship tables
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
        -- Check if documentation_id column already exists
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = rel_table.table_name
          AND column_name = 'documentation_id'
        ) THEN
          -- Add documentation_id column
          EXECUTE format('ALTER TABLE payload.%I ADD COLUMN documentation_id uuid', rel_table.table_name);
        END IF;
      END LOOP;
    END $$;
  `)

  // Step 2: Create a view for documentation relationships
  await db.execute(sql`
    -- Drop the view if it already exists
    DROP VIEW IF EXISTS payload.documentation_relationships;
    
    -- Create the view
    CREATE VIEW payload.documentation_relationships AS
    SELECT 
      d.id AS documentation_id,
      'documentation' AS parent_collection,
      d.id AS parent_id
    FROM 
      payload.documentation d;
  `)

  // Step 3: Create a simple function to add columns to dynamic tables
  await db.execute(sql`
    -- Create a function to add columns to dynamic tables
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
    END;
    $$ LANGUAGE plpgsql;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove documentation_id column from all relationship tables
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
        -- Check if documentation_id column exists
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = rel_table.table_name
          AND column_name = 'documentation_id'
        ) THEN
          -- Remove documentation_id column
          EXECUTE format('
            ALTER TABLE payload.%I 
            DROP COLUMN documentation_id
          ', rel_table.table_name);
        END IF;
      END LOOP;
    END $$;
    
    -- Drop the view
    DROP VIEW IF EXISTS payload.documentation_relationships;
    
    -- Drop the function and trigger
    DROP FUNCTION IF EXISTS payload.handle_dynamic_relationship_table;
    DROP EVENT TRIGGER IF EXISTS payload_dynamic_table_trigger;
    DROP FUNCTION IF EXISTS payload.handle_dynamic_table_trigger;
  `)
}
