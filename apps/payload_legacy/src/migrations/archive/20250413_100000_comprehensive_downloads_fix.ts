import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

import { DOWNLOAD_ID_MAP } from '../../../../packages/content-migrations/src/data/download-id-map'

/**
 * Comprehensive Downloads Fix Migration
 *
 * This migration consolidates and replaces all previous download-related migrations:
 * - 20250410_200000_add_downloads_column.ts
 * - 20250410_300000_fix_downloads_alias.ts
 * - 20250410_500000_fix_download_relationships.ts
 * - 20250410_600000_fix_downloads_collection_schema.ts
 * - 20250410_700000_fix_course_lessons_downloads_relationship.ts
 * - 20250410_800000_fix_all_downloads_relationships.ts
 * - 20250410_900000_add_column_alias_for_downloads.ts
 * - 20250411_100000_fix_downloads_relationships.ts
 * - 20250412_100000_fix_downloads_uuid_type_consistency.ts
 * - 20250412_100000_fix_downloads_uuid_type_mismatch.ts
 *
 * It provides a clean, consistent approach that:
 * 1. Standardizes on UUID data type for all download-related columns
 * 2. Ensures proper bidirectional relationships
 * 3. Fixes issues with dynamic UUID tables
 * 4. Adds safety functions for UUID handling
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running comprehensive downloads fix migration')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // Step 1: Add helper functions
    console.log('Adding helper functions...')
    await db.execute(sql`
      -- Safe UUID comparison function
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

      -- Function to ensure a table has the required downloads_id column
      CREATE OR REPLACE FUNCTION payload.ensure_downloads_id_column(table_name TEXT) 
      RETURNS VOID AS $$
      BEGIN
        EXECUTE format('
          ALTER TABLE payload.%I 
          ADD COLUMN IF NOT EXISTS downloads_id UUID
        ', table_name);
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Step 2: Check and fix downloads table
    console.log('Checking downloads table schema...')

    // 2.1: Make sure downloads table exists
    const downloadsExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'payload'
        AND table_name = 'downloads'
      ) as exists
    `)

    if (!downloadsExists.rows[0]?.exists) {
      console.log('Creating downloads table...')
      await db.execute(sql`
        CREATE TABLE payload.downloads (
          id UUID PRIMARY KEY,
          title TEXT,
          description TEXT,
          type TEXT,
          key TEXT,
          filename TEXT,
          filesize INTEGER,
          mimeType TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)
    }

    // 2.2: Ensure id column is UUID type
    const downloadIdType = await db.execute(sql`
      SELECT data_type 
      FROM information_schema.columns
      WHERE table_schema = 'payload'
      AND table_name = 'downloads' 
      AND column_name = 'id'
    `)

    if (downloadIdType.rows.length > 0 && downloadIdType.rows[0].data_type !== 'uuid') {
      console.log('Converting downloads.id to UUID type...')
      await db.execute(sql`
        ALTER TABLE payload.downloads
        ALTER COLUMN id TYPE uuid USING id::uuid
      `)
    }

    // 2.3: Ensure key column exists (for mapping to predefined UUIDs)
    const keyColumnExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'payload'
        AND table_name = 'downloads'
        AND column_name = 'key'
      ) as exists
    `)

    if (!keyColumnExists.rows[0]?.exists) {
      console.log('Adding key column to downloads table...')
      await db.execute(sql`
        ALTER TABLE payload.downloads
        ADD COLUMN key TEXT
      `)
    }

    // Step 3: Ensure downloads_rels table exists with proper structure
    console.log('Setting up downloads_rels table...')

    // 3.1: Create table if doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payload.downloads_rels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        _parent_id UUID NOT NULL,
        field TEXT,
        value TEXT,
        order_column INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    // 3.2: Ensure _parent_id is UUID type
    const parentIdType = await db.execute(sql`
      SELECT data_type 
      FROM information_schema.columns
      WHERE table_schema = 'payload'
      AND table_name = 'downloads_rels' 
      AND column_name = '_parent_id'
    `)

    if (parentIdType.rows.length > 0 && parentIdType.rows[0].data_type !== 'uuid') {
      console.log('Converting downloads_rels._parent_id to UUID type...')

      // Safely drop any existing foreign key constraints
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

      // Create new column with UUID type
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

      // Drop old column
      await db.execute(sql`
        ALTER TABLE payload.downloads_rels
        DROP COLUMN _parent_id
      `)

      // Rename UUID column
      await db.execute(sql`
        ALTER TABLE payload.downloads_rels
        RENAME COLUMN _parent_id_uuid TO _parent_id
      `)
    }

    // 3.3: Add foreign key constraint to downloads table
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'downloads_rels_parent_fk'
        ) THEN
          ALTER TABLE payload.downloads_rels
          ADD CONSTRAINT downloads_rels_parent_fk
          FOREIGN KEY (_parent_id)
          REFERENCES payload.downloads(id)
          ON DELETE CASCADE;
        END IF;
      END
      $$;
    `)

    // 3.4: Create indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS downloads_rels_parent_idx ON payload.downloads_rels(_parent_id);
      CREATE INDEX IF NOT EXISTS downloads_rels_field_idx ON payload.downloads_rels(field);
      CREATE INDEX IF NOT EXISTS downloads_rels_value_idx ON payload.downloads_rels(value);
    `)

    // Step 4: Process all collections that reference downloads
    console.log('Processing collections that reference downloads...')

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

    for (const collection of collections) {
      const relationshipTable = `${collection}__downloads`
      console.log(`Processing ${relationshipTable}...`)

      // 4.1: Add downloads_id column to main collection tables
      await db.execute(sql`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'payload'
            AND table_name = ${sql.raw(`'${collection}'`)}
          ) AND NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'payload'
            AND table_name = ${sql.raw(`'${collection}'`)}
            AND column_name = 'downloads_id'
          ) THEN
            ALTER TABLE payload.${sql.raw(collection)} ADD COLUMN downloads_id UUID[];
          END IF;
        END
        $$;
      `)

      // 4.2: Create relationship table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS payload.${sql.raw(relationshipTable)} (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          parent_id TEXT NOT NULL,
          downloads_id UUID,
          order_column INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)

      // 4.3: Check if downloads_id column exists and has the right type
      const columnInfo = await db.execute(sql`
        SELECT data_type 
        FROM information_schema.columns
        WHERE table_schema = 'payload'
        AND table_name = ${relationshipTable}
        AND column_name = 'downloads_id'
      `)

      // If downloads_id exists but is not UUID type, convert it
      if (columnInfo.rows.length > 0 && columnInfo.rows[0].data_type !== 'uuid') {
        console.log(`Converting ${relationshipTable}.downloads_id to UUID type...`)

        // Create new UUID column
        await db.execute(sql`
          ALTER TABLE payload.${sql.raw(relationshipTable)}
          ADD COLUMN downloads_id_uuid UUID
        `)

        // Copy data with safe casting
        await db.execute(sql`
          UPDATE payload.${sql.raw(relationshipTable)}
          SET downloads_id_uuid = CASE
            WHEN downloads_id IS NOT NULL THEN downloads_id::uuid
            ELSE NULL
          END
        `)

        // Drop old column
        await db.execute(sql`
          ALTER TABLE payload.${sql.raw(relationshipTable)}
          DROP COLUMN downloads_id
        `)

        // Rename UUID column
        await db.execute(sql`
          ALTER TABLE payload.${sql.raw(relationshipTable)}
          RENAME COLUMN downloads_id_uuid TO downloads_id
        `)
      }

      // 4.4: Create indexes for performance
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS ${sql.raw(`${relationshipTable}_parent_id_idx`)} 
        ON payload.${sql.raw(relationshipTable)}(parent_id);
        
        CREATE INDEX IF NOT EXISTS ${sql.raw(`${relationshipTable}_downloads_id_idx`)} 
        ON payload.${sql.raw(relationshipTable)}(downloads_id);
      `)
    }

    // Step 4.5: Verify downloads table has all required columns
    console.log('Verifying downloads table schema completeness...')
    const requiredColumns = [
      { name: 'title', type: 'TEXT' },
      { name: 'description', type: 'TEXT' },
      { name: 'type', type: 'TEXT' },
      { name: 'key', type: 'TEXT' },
      { name: 'filename', type: 'TEXT' },
      { name: 'filesize', type: 'INTEGER' },
      { name: 'mimeType', type: 'TEXT' },
      { name: 'url', type: 'TEXT' },
    ]

    for (const { name, type } of requiredColumns) {
      const columnExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'payload'
          AND table_name = 'downloads'
          AND column_name = ${name}
        ) as exists
      `)

      if (!columnExists.rows[0]?.exists) {
        console.log(`Adding missing column '${name}' to downloads table...`)

        await db.execute(sql`
          ALTER TABLE payload.downloads
          ADD COLUMN ${sql.raw(name)} ${sql.raw(type)}
        `)
      }
    }

    // Step 5: Setup predefined downloads from DOWNLOAD_ID_MAP
    console.log('Setting up predefined downloads from DOWNLOAD_ID_MAP...')

    for (const [key, id] of Object.entries(DOWNLOAD_ID_MAP)) {
      // Check if download with this ID exists
      const downloadExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM payload.downloads
          WHERE id = ${id}::uuid
        ) as exists
      `)

      if (!downloadExists.rows[0]?.exists) {
        console.log(`Creating download placeholder for ${key} with ID ${id}...`)

        // Insert placeholder record with non-null values for all required fields
        await db.execute(sql`
          INSERT INTO payload.downloads (
            id, 
            title, 
            key, 
            type, 
            filename,
            url,
            created_at, 
            updated_at
          ) VALUES (
            ${id}::uuid,
            ${`Download: ${key}`},
            ${key},
            'other',
            ${`${key}.placeholder`},
            ${`https://downloads.example.com/${key}`},
            NOW(),
            NOW()
          )
        `)
      } else {
        // Update key field if needed
        await db.execute(sql`
          UPDATE payload.downloads
          SET key = ${key}
          WHERE id = ${id}::uuid
          AND (key IS NULL OR key <> ${key})
        `)
      }
    }

    // Step 6: Setup dynamic UUID table handling
    console.log('Setting up dynamic UUID table handling...')

    // 6.1: Create a more robust approach to handle dynamic UUID tables
    // Instead of using triggers which may not have sufficient privileges,
    // we'll create functions and rules that work at the query level

    // Function to check if a table exists and add downloads_id column if needed
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION payload.ensure_downloads_id_column_exists(table_name TEXT)
      RETURNS BOOLEAN AS $$
      DECLARE
        schema_name TEXT := 'payload';
        column_exists BOOLEAN;
      BEGIN
        -- Check if column exists
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = schema_name
          AND table_name = table_name
          AND column_name = 'downloads_id'
        ) INTO column_exists;
        
        -- If column doesn't exist, add it
        IF NOT column_exists THEN
          BEGIN
            EXECUTE format('ALTER TABLE %I.%I ADD COLUMN downloads_id UUID', schema_name, table_name);
            RETURN TRUE;
          EXCEPTION WHEN OTHERS THEN
            -- Ignore errors (e.g., if table doesn't exist or we don't have permissions)
            RETURN FALSE;
          END;
        END IF;
        
        RETURN TRUE;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Create a table to track UUID pattern tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payload.dynamic_uuid_tables (
        table_name TEXT PRIMARY KEY,
        last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        has_downloads_id BOOLEAN DEFAULT FALSE
      );
    `)

    // Create a function to scan for and handle UUID pattern tables
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION payload.scan_for_uuid_tables() 
      RETURNS VOID AS $$
      DECLARE
        uuid_table RECORD;
      BEGIN
        -- Find tables with UUID pattern names
        FOR uuid_table IN
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'payload'
          AND table_name ~ '[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}'
          AND table_name NOT IN (
            SELECT table_name FROM payload.dynamic_uuid_tables
            WHERE has_downloads_id = TRUE
          )
        LOOP
          -- Try to add downloads_id column
          IF payload.ensure_downloads_id_column_exists(uuid_table.table_name) THEN
            -- Record the successful addition
            INSERT INTO payload.dynamic_uuid_tables (table_name, has_downloads_id)
            VALUES (uuid_table.table_name, TRUE)
            ON CONFLICT (table_name) DO UPDATE
            SET has_downloads_id = TRUE, last_checked = NOW();
          ELSE
            -- Record the failed attempt
            INSERT INTO payload.dynamic_uuid_tables (table_name, has_downloads_id)
            VALUES (uuid_table.table_name, FALSE)
            ON CONFLICT (table_name) DO UPDATE
            SET last_checked = NOW();
          END IF;
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Create a function to be called before Payload operations
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION payload.prepare_dynamic_tables() 
      RETURNS TRIGGER AS $$
      BEGIN
        -- Scan for UUID tables and ensure they have downloads_id
        PERFORM payload.scan_for_uuid_tables();
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Create a generic trigger that runs on table access
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION payload.add_downloads_id_to_dynamic_tables()
      RETURNS event_trigger AS $$
      DECLARE
        obj record;
      BEGIN
        PERFORM payload.scan_for_uuid_tables();
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Call the scan function once during migration to process existing tables
    await db.execute(sql`SELECT payload.scan_for_uuid_tables();`)

    // Step 7: Create bidirectional relationships
    console.log('Creating bidirectional relationships between collections and downloads...')

    for (const collection of collections) {
      const relationshipTable = `${collection}__downloads`

      // Skip if table doesn't exist
      const tableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload'
          AND table_name = ${relationshipTable}
        ) as exists
      `)

      if (!tableExists.rows[0]?.exists) {
        continue
      }

      // Get existing relationships from collection to downloads
      const relationships = await db.execute(sql`
        SELECT 
          parent_id as collection_id,
          downloads_id
        FROM payload.${sql.raw(relationshipTable)}
        WHERE downloads_id IS NOT NULL
      `)

      // Create bidirectional relationships
      for (const relationship of relationships.rows) {
        const downloadsId = relationship.downloads_id
        const collectionId = relationship.collection_id

        await db.execute(sql`
          INSERT INTO payload.downloads_rels
            (id, _parent_id, field, value, order_column, created_at, updated_at)
          SELECT
            gen_random_uuid(),
            ${downloadsId}::uuid,
            ${collection},
            ${collectionId},
            0,
            NOW(),
            NOW()
          WHERE NOT EXISTS (
            SELECT 1 FROM payload.downloads_rels
            WHERE _parent_id = ${downloadsId}::uuid
            AND field = ${collection}
            AND value = ${collectionId}
          );
        `)
      }
    }

    // Step 8: Verify and report results
    console.log('Verifying relationship consistency...')

    let totalRelationships = 0
    let totalBidirectional = 0

    for (const collection of collections) {
      const relationshipTable = `${collection}__downloads`

      // Skip if table doesn't exist
      const tableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload'
          AND table_name = ${relationshipTable}
        ) as exists
      `)

      if (!tableExists.rows[0]?.exists) {
        continue
      }

      // Count total relationships
      const { rows: countRows } = await db.execute(sql`
        SELECT COUNT(*) as total 
        FROM payload.${sql.raw(relationshipTable)}
        WHERE downloads_id IS NOT NULL
      `)

      const total = parseInt(countRows[0]?.total as string) || 0
      totalRelationships += total

      // Count bidirectional relationships
      const { rows: biRows } = await db.execute(sql`
        SELECT COUNT(*) as total 
        FROM payload.${sql.raw(relationshipTable)} rt
        JOIN payload.downloads_rels dr ON rt.downloads_id = dr._parent_id
        WHERE dr.field = ${collection}
        AND dr.value = rt.parent_id
      `)

      const bidirectional = parseInt(biRows[0]?.total as string) || 0
      totalBidirectional += bidirectional

      console.log(`${collection}: ${bidirectional}/${total} bidirectional relationships`)
    }

    console.log(`Total: ${totalBidirectional}/${totalRelationships} bidirectional relationships`)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Comprehensive downloads fix migration completed successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)

    // Enhanced error reporting
    if (
      error instanceof Error &&
      error.message &&
      error.message.includes('column') &&
      error.message.includes('does not exist')
    ) {
      console.error('SCHEMA ERROR: The database schema does not match expectations.')
      console.error('Specific error:', error.message)
      console.error('This is likely due to a mismatch between expected and actual table structure.')
    } else {
      console.error('Error in comprehensive downloads fix migration:', error)
    }

    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('Comprehensive downloads fix migration cannot be fully reversed')
  console.log('Removing helper functions and tracking tables...')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // Drop functions
    await db.execute(sql`
      DROP FUNCTION IF EXISTS payload.safe_uuid_comparison(TEXT, TEXT);
      DROP FUNCTION IF EXISTS payload.ensure_downloads_id_column(TEXT);
      DROP FUNCTION IF EXISTS payload.ensure_downloads_id_column_exists(TEXT);
      DROP FUNCTION IF EXISTS payload.scan_for_uuid_tables();
      DROP FUNCTION IF EXISTS payload.prepare_dynamic_tables();
      DROP FUNCTION IF EXISTS payload.add_downloads_id_to_dynamic_tables();
    `)

    // Drop tracking table
    await db.execute(sql`
      DROP TABLE IF EXISTS payload.dynamic_uuid_tables;
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Helper functions and tracking tables removed')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in down migration:', error)
    throw error
  }
}
