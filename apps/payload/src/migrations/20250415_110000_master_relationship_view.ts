import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'
import { DOWNLOAD_ID_MAP } from '../../../../packages/content-migrations/src/data/download-id-map'

/**
 * Master Relationship View Migration
 *
 * This migration implements a view-based approach to solve relationship issues
 * between collections and downloads. Instead of relying on dynamic UUID tables,
 * it creates a unified view that aggregates all relationships.
 *
 * Key fixes:
 * 1. Creates a 'downloads_relationships' view to avoid direct lookups in UUID tables
 * 2. Ensures all required tables and columns exist with correct types
 * 3. Creates helper functions to reliably fetch relationships
 * 4. Sets up tracking for dynamic UUID tables to monitor future issues
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running master relationship view migration')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    /*** PHASE 1: Table Creation & Verification ***/
    console.log('PHASE 1: Creating and verifying tables...')

    // 1.1: Define collection tables that need relationship management
    const collections = [
      'documentation',
      'posts',
      'surveys',
      'courses',
      'course_lessons',
      'course_quizzes',
    ]

    // 1.2: Ensure downloads table exists with proper structure
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payload.downloads (
        id UUID PRIMARY KEY,
        title TEXT,
        description TEXT,
        type TEXT,
        key TEXT,
        filename TEXT,
        filesize INTEGER,
        mimeType TEXT,
        url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Ensure id column is UUID type
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'payload'
          AND table_name = 'downloads'
          AND column_name = 'id'
          AND data_type <> 'uuid'
        ) THEN
          ALTER TABLE payload.downloads ALTER COLUMN id TYPE uuid USING id::uuid;
        END IF;
      END $$;
    `)

    // 1.3: Ensure relationship tables exist for all collections
    for (const collection of collections) {
      const relationshipTable = `${collection}__downloads`

      // Create relationship table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS payload.${sql.identifier(relationshipTable)} (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          parent_id TEXT NOT NULL,
          downloads_id UUID,
          order_column INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS ${sql.identifier(`idx_${relationshipTable}_parent`)} 
          ON payload.${sql.identifier(relationshipTable)}(parent_id);
        CREATE INDEX IF NOT EXISTS ${sql.identifier(`idx_${relationshipTable}_downloads`)} 
          ON payload.${sql.identifier(relationshipTable)}(downloads_id);
      `)

      // Directly check if downloads_id column exists and its type
      const columnCheck = await db.execute(sql`
        SELECT data_type 
        FROM information_schema.columns
        WHERE table_schema = 'payload'
        AND table_name = ${relationshipTable}
        AND column_name = 'downloads_id';
      `)

      if (columnCheck.rows.length > 0 && columnCheck.rows[0].data_type !== 'uuid') {
        console.log(`Converting downloads_id column in ${relationshipTable} to UUID type`)

        // Using a simpler approach with explicit column operations
        await db.execute(sql`
          -- Create temporary column with correct type
          ALTER TABLE payload.${sql.identifier(relationshipTable)}
          ADD COLUMN downloads_id_uuid UUID;

          -- Copy data with safe casting
          UPDATE payload.${sql.identifier(relationshipTable)}
          SET downloads_id_uuid = CASE
            WHEN downloads_id IS NOT NULL THEN downloads_id::uuid
            ELSE NULL
          END;

          -- Drop old column
          ALTER TABLE payload.${sql.identifier(relationshipTable)}
          DROP COLUMN downloads_id;

          -- Rename UUID column
          ALTER TABLE payload.${sql.identifier(relationshipTable)}
          RENAME COLUMN downloads_id_uuid TO downloads_id;
        `)
      }
    }

    // 1.4: Create tracking table for dynamic UUID tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payload.dynamic_uuid_tables (
        table_name TEXT PRIMARY KEY,
        last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        has_path_column BOOLEAN DEFAULT FALSE
      );
    `)

    /*** PHASE 2: View Creation ***/
    console.log('PHASE 2: Creating relationship view...')

    // 2.1: Create the downloads_relationships view - handle collections individually
    // We'll first check if the tables exist before trying to add them to the view
    const validCollections = []

    // Check which tables actually exist before creating the view
    for (const collection of collections) {
      const relationshipTable = `${collection}__downloads`

      // Check if both the collection and relationship tables exist
      const tableCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload'
          AND table_name = ${collection}
        ) AS collection_exists,
        EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload'
          AND table_name = ${relationshipTable}
        ) AS relationship_exists;
      `)

      const tableExists = tableCheck.rows[0]

      if (tableExists.collection_exists && tableExists.relationship_exists) {
        validCollections.push(collection)
      } else {
        console.log(`Skipping ${collection} relationship in view - tables don't exist yet`)
      }
    }

    // Only create view if we have at least one valid collection
    if (validCollections.length > 0) {
      let viewSql = `
        CREATE OR REPLACE VIEW payload.downloads_relationships AS
      `

      // Add each collection's relationship query to the view
      for (let i = 0; i < validCollections.length; i++) {
        const collection = validCollections[i]
        const relationshipTable = `${collection}__downloads`

        viewSql += `
          -- ${collection} downloads
          SELECT 
            coll.id::text as collection_id, 
            dl.id::text as download_id,
            '${collection}' as collection_type
          FROM payload.${collection} coll
          JOIN payload.${relationshipTable} rel ON coll.id::text = rel.parent_id
          JOIN payload.downloads dl ON dl.id::uuid = rel.downloads_id::uuid
        `

        // Add UNION ALL for all but the last query
        if (i < validCollections.length - 1) {
          viewSql += `
          UNION ALL
          `
        }
      }

      // Execute the view creation
      await db.execute(sql`${sql.raw(viewSql)}`)
    } else {
      console.log('No valid collections found for relationship view - skipping view creation')
    }

    /*** PHASE 3: Function Creation ***/
    console.log('PHASE 3: Creating helper functions...')

    // 3.1: Function to check and fix a dynamic UUID table's structure with improved error handling
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION payload.fix_dynamic_table(table_name TEXT)
      RETURNS BOOLEAN AS $$
      DECLARE
        schema_name TEXT := 'payload';
        path_exists BOOLEAN;
        col_exists BOOLEAN;
      BEGIN
        -- Add the table to tracking if not already present
        INSERT INTO payload.dynamic_uuid_tables (table_name, last_checked, has_path_column)
        VALUES (table_name, NOW(), FALSE)
        ON CONFLICT (table_name) DO UPDATE SET last_checked = NOW();

        -- Check if the table itself still exists
        EXECUTE format('
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = %L
            AND table_name = %L
          )', schema_name, table_name) INTO col_exists;
        
        -- Skip if table doesn't exist
        IF NOT col_exists THEN
          RETURN FALSE;
        END IF;

        -- Check if path column exists using safer dynamic SQL
        EXECUTE format('
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = %L
            AND table_name = %L
            AND column_name = %L
          )', schema_name, table_name, 'path') INTO path_exists;
        
        -- If path column doesn't exist, add it
        IF NOT path_exists THEN
          BEGIN
            EXECUTE format('ALTER TABLE %I.%I ADD COLUMN path TEXT', schema_name, table_name);
            
            -- Update tracking
            UPDATE payload.dynamic_uuid_tables 
            SET has_path_column = TRUE 
            WHERE table_name = $1;
            
            RETURN TRUE;
          EXCEPTION WHEN OTHERS THEN
            -- Log error but continue
            RAISE NOTICE 'Error adding path column to %: %', table_name, SQLERRM;
            RETURN FALSE;
          END;
        END IF;
        
        RETURN FALSE;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // 3.2: Function to get downloads for a collection
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION payload.get_downloads_for_collection(
        collection_id TEXT,
        collection_type TEXT
      ) RETURNS TABLE (download_id TEXT) AS $$
      BEGIN
        RETURN QUERY 
        SELECT dr.download_id 
        FROM payload.downloads_relationships dr
        WHERE dr.collection_id = collection_id
        AND dr.collection_type = collection_type;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // 3.3: Function to check if a download belongs to a collection
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION payload.collection_has_download(
        collection_id TEXT, 
        collection_type TEXT,
        download_id TEXT
      ) RETURNS BOOLEAN AS $$
      DECLARE
        found BOOLEAN;
      BEGIN
        SELECT EXISTS (
          SELECT 1 
          FROM payload.downloads_relationships dr
          WHERE dr.collection_id = collection_id
          AND dr.collection_type = collection_type
          AND dr.download_id = download_id
        ) INTO found;
        
        RETURN found;
      END;
      $$ LANGUAGE plpgsql;
    `)

    /*** PHASE 4: Data Initialization ***/
    console.log('PHASE 4: Initializing download data...')

    // 4.1: Insert predefined downloads if they don't exist
    for (const [key, id] of Object.entries(DOWNLOAD_ID_MAP)) {
      await db.execute(sql`
        INSERT INTO payload.downloads (
          id, title, key, type, filename, url, created_at, updated_at
        ) 
        VALUES (
          ${id}::uuid,
          ${`Download: ${key}`},
          ${key},
          'other',
          ${`${key}.placeholder`},
          ${`https://downloads.example.com/${key}`},
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET key = ${key},
            updated_at = NOW()
        WHERE payload.downloads.key <> ${key} OR payload.downloads.key IS NULL;
      `)
    }

    // 4.2: Check and fix all existing UUID pattern tables
    await db.execute(sql`
      DO $$
      DECLARE
        uuid_table RECORD;
      BEGIN
        -- Find all tables matching UUID pattern
        FOR uuid_table IN
          SELECT table_name 
          FROM information_schema.tables
          WHERE table_schema = 'payload'
          AND table_name ~ '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$'
        LOOP
          -- Apply fix function to each table
          PERFORM payload.fix_dynamic_table(uuid_table.table_name);
        END LOOP;
      END $$;
    `)

    // Commit transaction if all steps successful
    await db.execute(sql`COMMIT;`)
    console.log('Master relationship view migration completed successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in master relationship migration:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('Rolling back master relationship view migration (partial rollback only)')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // Drop functions
    await db.execute(sql`
      DROP FUNCTION IF EXISTS payload.fix_dynamic_table(TEXT);
      DROP FUNCTION IF EXISTS payload.get_downloads_for_collection(TEXT, TEXT);
      DROP FUNCTION IF EXISTS payload.collection_has_download(TEXT, TEXT, TEXT);
    `)

    // Drop views
    await db.execute(sql`
      DROP VIEW IF EXISTS payload.downloads_relationships;
    `)

    // Drop tracking table
    await db.execute(sql`
      DROP TABLE IF EXISTS payload.dynamic_uuid_tables;
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Master relationship view migration rolled back successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in down migration:', error)
    throw error
  }
}
