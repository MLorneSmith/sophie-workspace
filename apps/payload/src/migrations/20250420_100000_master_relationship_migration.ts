import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'
import { DOWNLOAD_ID_MAP } from '../../../../packages/content-migrations/src/data/download-id-map'

/**
 * Master Relationship Migration
 *
 * This migration consolidates and replaces multiple overlapping database migrations:
 * - 20250410_500000_fix_all_relationship_columns.ts
 * - 20250410_510000_fix_type_mismatches_and_columns.ts
 * - 20250410_520000_direct_relationship_fix.ts
 * - 20250413_100000_comprehensive_downloads_fix.ts
 * - 20250415_100000_dynamic_uuid_tables_fix.ts
 *
 * It implements a systematic approach to ensure:
 * 1. Tables are created before they are referenced
 * 2. Type conversions are handled consistently
 * 3. Bidirectional relationships are properly established
 * 4. Proper error handling and transaction management
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running master relationship migration')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    /*** PHASE 1: Table Creation & Structure Definition ***/
    console.log('PHASE 1: Creating tables and defining structure...')

    // 1.1: Define collections that need relationship management
    const collections = [
      'documentation',
      'posts',
      'surveys',
      'courses',
      'course_lessons',
      'course_quizzes',
    ]

    // 1.2: Ensure downloads table exists with proper schema
    await createDownloadsTable(db)

    // 1.3: Create relationship tables for all collections
    for (const collection of collections) {
      await createCollectionRelationshipTable(db, collection)
    }

    // 1.4: Ensure downloads_rels table exists with proper structure
    await createDownloadsRelsTable(db)

    // 1.5: Add downloads_id columns to collection tables
    await addDownloadsIdColumns(db, collections)

    // 1.6: Create utility tracking tables
    await createUtilityTables(db)

    /*** PHASE 2: Helper Functions & Utilities ***/
    console.log('PHASE 2: Creating helper functions...')

    // 2.1: Create UUID handling functions
    await createUUIDHelperFunctions(db)

    // 2.2: Create relationship management functions
    await createRelationshipFunctions(db)

    /*** PHASE 3: Relationship View Creation ***/
    console.log('PHASE 3: Creating relationship views...')

    // 3.1: Create the downloads_relationships view
    await createDownloadsRelationshipsView(db, collections)

    // 3.2: Implement bidirectional relationship logic
    await setupBidirectionalRelationships(db, collections)

    /*** PHASE 4: Data Initialization & Verification ***/
    console.log('PHASE 4: Initializing data and verifying relationships...')

    // 4.1: Setup predefined downloads
    await setupPredefinedDownloads(db)

    // 4.2: Verify relationship consistency
    await verifyRelationshipConsistency(db, collections)

    // Commit transaction if all steps successful
    await db.execute(sql`COMMIT;`)
    console.log('Master relationship migration completed successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in master relationship migration:', error)
    throw error
  }
}

/**
 * Creates or ensures the downloads table exists with the correct schema
 */
async function createDownloadsTable(db: any) {
  console.log('Ensuring downloads table exists...')

  // Check if downloads table exists
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
        url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
  } else {
    console.log('Downloads table already exists, ensuring all required columns are present...')

    // Ensure all required columns exist
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

    // Ensure id column is UUID type
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
  }
}

/**
 * Creates collection__downloads relationship tables for each collection
 */
async function createCollectionRelationshipTable(db: any, collection: string) {
  const relationshipTable = `${collection}__downloads`
  console.log(`Ensuring ${relationshipTable} table exists...`)

  // Create relationship table if doesn't exist
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS payload.${sql.raw(relationshipTable)} (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id TEXT NOT NULL,
      downloads_id UUID,
      order_column INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS ${sql.raw(`idx_${relationshipTable}_parent`)} 
      ON payload.${sql.raw(relationshipTable)}(parent_id);
    CREATE INDEX IF NOT EXISTS ${sql.raw(`idx_${relationshipTable}_downloads`)} 
      ON payload.${sql.raw(relationshipTable)}(downloads_id);
  `)

  // Check if downloads_id column exists and has the right type
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
}

/**
 * Creates or ensures the downloads_rels table exists with proper structure
 */
async function createDownloadsRelsTable(db: any) {
  console.log('Ensuring downloads_rels table exists...')

  // Create table if doesn't exist
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

  // Ensure _parent_id is UUID type
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

  // Create indexes for better performance
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS downloads_rels_parent_idx ON payload.downloads_rels(_parent_id);
    CREATE INDEX IF NOT EXISTS downloads_rels_field_idx ON payload.downloads_rels(field);
    CREATE INDEX IF NOT EXISTS downloads_rels_value_idx ON payload.downloads_rels(value);
  `)

  // Add foreign key constraint if it doesn't exist
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
}

/**
 * Adds downloads_id column to main collection tables
 */
async function addDownloadsIdColumns(db: any, collections: string[]) {
  console.log('Adding downloads_id columns to collection tables...')
  for (const collection of collections) {
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
  }
}

/**
 * Creates utility tables for tracking dynamic UUID tables
 */
async function createUtilityTables(db: any) {
  console.log('Creating utility tables...')

  // Create a table to track UUID pattern tables
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS payload.dynamic_uuid_tables (
      table_name TEXT PRIMARY KEY,
      last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      has_downloads_id BOOLEAN DEFAULT FALSE
    );
  `)
}

/**
 * Creates helper functions for UUID handling
 */
async function createUUIDHelperFunctions(db: any) {
  console.log('Creating UUID helper functions...')

  await db.execute(sql`
    -- Safe UUID conversion function
    CREATE OR REPLACE FUNCTION payload.safe_uuid_conversion(text_value TEXT)
    RETURNS UUID AS $$
    BEGIN
      BEGIN
        RETURN text_value::uuid;
      EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
      END;
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
}

/**
 * Creates relationship management functions
 */
async function createRelationshipFunctions(db: any) {
  console.log('Creating relationship management functions...')

  await db.execute(sql`
    -- Function to check if a table exists and add downloads_id column if needed
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
    
    -- Create a database function to get downloads for a collection
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
    
    -- Create a function to check if a download belongs to a collection
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
}

/**
 * Creates the downloads_relationships view
 */
async function createDownloadsRelationshipsView(db: any, collections: string[]) {
  console.log('Creating downloads_relationships view...')

  // Build the view SQL dynamically
  let viewSql = `
    CREATE OR REPLACE VIEW payload.downloads_relationships AS
  `

  // Add each collection's query
  for (let i = 0; i < collections.length; i++) {
    const collection = collections[i]
    const relationshipTable = `${collection}__downloads`

    viewSql += `
      -- ${collection} downloads
      SELECT 
        ${collection}.id::text as collection_id, 
        downloads.id::text as download_id,
        '${collection}' as collection_type
      FROM payload.${collection}
      JOIN payload.${relationshipTable} ON ${collection}.id::text = ${relationshipTable}.parent_id
      JOIN payload.downloads ON downloads.id::uuid = ${relationshipTable}.downloads_id::uuid
    `

    // Add UNION ALL for all but the last query
    if (i < collections.length - 1) {
      viewSql += `
      UNION ALL
      `
    }
  }

  // Execute the view creation SQL
  await db.execute(sql`${sql.raw(viewSql)}`)
}

/**
 * Sets up bidirectional relationships between collections and downloads
 */
async function setupBidirectionalRelationships(db: any, collections: string[]) {
  console.log('Setting up bidirectional relationships...')

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
      console.log(`Skipping ${relationshipTable} - table does not exist`)
      continue
    }

    console.log(`Processing bidirectional relationships for ${collection}...`)

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
}

/**
 * Sets up predefined downloads from DOWNLOAD_ID_MAP
 */
async function setupPredefinedDownloads(db: any) {
  console.log('Setting up predefined downloads...')

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
}

/**
 * Verifies relationship consistency and reports results
 */
async function verifyRelationshipConsistency(db: any, collections: string[]) {
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
      JOIN payload.downloads_rels dr ON rt.downloads_id::text = dr._parent_id::text
      WHERE dr.field = ${collection}
      AND dr.value = rt.parent_id
    `)

    const bidirectional = parseInt(biRows[0]?.total as string) || 0
    totalBidirectional += bidirectional

    console.log(`${collection}: ${bidirectional}/${total} bidirectional relationships`)
  }

  console.log(`Total: ${totalBidirectional}/${totalRelationships} bidirectional relationships`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('This migration cannot be fully reversed as it ensures data integrity')
  console.log('Removing helper functions and tracking tables...')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // Drop functions
    await db.execute(sql`
      DROP FUNCTION IF EXISTS payload.safe_uuid_conversion(TEXT);
      DROP FUNCTION IF EXISTS payload.ensure_downloads_id_column(TEXT);
      DROP FUNCTION IF EXISTS payload.ensure_downloads_id_column_exists(TEXT);
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
    console.log('Helper functions, views, and tracking tables removed')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in down migration:', error)
    throw error
  }
}
