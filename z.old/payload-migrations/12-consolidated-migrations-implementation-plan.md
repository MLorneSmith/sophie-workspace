# Consolidated Database Migrations Implementation Plan

## Problem Statement

Our codebase currently has multiple overlapping database migrations related to relationship management, resulting in:

1. **Execution Order Issues**: Migration A references tables that should be created by Migration B, but runs before B
2. **Redundant Operations**: Multiple migrations attempt to fix the same problems
3. **Type Inconsistencies**: Inconsistent handling of UUID vs TEXT types across migrations
4. **Error Handling Gaps**: Insufficient transaction and error management
5. **Missing Tables**: Tables referenced in views and relationships don't exist yet

Specific errors include:

- `relation "payload.documentation__rels" does not exist`
- `column documentation__rels.parent_id does not exist`
- `operator does not exist: text = uuid`
- `column course_quizzes.course_id_id does not exist`
- `function payload.safe_uuid_conversion(uuid) does not exist`
- `relation "payload.course_lessons__downloads" does not exist`

## Solution Overview

Create a single, comprehensive migration that:

1. Follows a clear execution sequence
2. Creates all tables before referencing them
3. Handles type conversions properly
4. Uses transactions properly
5. Consolidates redundant operations
6. Removes dependency on dynamic detection of tables
7. Focuses on clarity and predictability

## Implementation Plan

### 1. Migration Architecture

#### 1.1 New File Structure

Create a new consolidated migration file:

- **Name**: `20250420_100000_master_relationship_migration.ts`
- **Purpose**: Single source of truth for all relationship fixes
- **Location**: `apps/payload/src/migrations/`

#### 1.2 Archive Existing Migrations

Create a backup folder and move redundant migrations:

- `apps/payload/src/migrations/archive/` - For storing old migrations
- Move or rename these problematic migrations:
  - `20250410_500000_fix_all_relationship_columns.ts`
  - `20250410_510000_fix_type_mismatches_and_columns.ts`
  - `20250410_520000_direct_relationship_fix.ts`
  - `20250413_100000_comprehensive_downloads_fix.ts`
  - `20250415_100000_dynamic_uuid_tables_fix.ts`

### 2. Migration Implementation Steps

The migration will follow a strict sequence of operations:

#### Phase 1: Table Creation & Structure Definition (Foundational Layer)

```typescript
// 1.1: Ensure downloads table exists with proper schema
await createDownloadsTable(db);

// 1.2: Create relationship tables for all collections
const collections = [
  'documentation',
  'posts',
  'surveys',
  'courses',
  'course_lessons',
  'course_quizzes',
];

for (const collection of collections) {
  await createCollectionRelationshipTable(db, collection);
}

// 1.3: Add downloads_id columns to collection tables
await addDownloadsIdColumns(db, collections);

// 1.4: Create utility tracking tables
await createUtilityTables(db);
```

#### Phase 2: Helper Functions & Utilities (Service Layer)

```typescript
// 2.1: Create UUID handling functions
await createUUIDHelperFunctions(db);

// 2.2: Create relationship management functions
await createRelationshipFunctions(db);
```

#### Phase 3: Relationship View Creation (Access Layer)

```typescript
// 3.1: Create the downloads_relationships view
await createDownloadsRelationshipsView(db, collections);

// 3.2: Implement bidirectional relationship logic
await setupBidirectionalRelationships(db, collections);
```

#### Phase 4: Data Initialization & Verification

```typescript
// 4.1: Setup predefined downloads
await setupPredefinedDownloads(db);

// 4.2: Verify relationship consistency
await verifyRelationshipConsistency(db, collections);
```

### 3. Implementation Details

#### 3.1 Table Creation Functions

```typescript
async function createDownloadsTable(db) {
  // Check if downloads table exists
  const downloadsExists = await db.execute(sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'payload'
      AND table_name = 'downloads'
    ) as exists
  `);

  if (!downloadsExists.rows[0]?.exists) {
    console.log('Creating downloads table...');
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
    `);
  }
}

async function createCollectionRelationshipTable(db, collection) {
  const relationshipTable = `${collection}__downloads`;

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
  `);
}

async function addDownloadsIdColumns(db, collections) {
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
    `);
  }
}
```

#### 3.2 Helper Functions Creation

```typescript
async function createUUIDHelperFunctions(db) {
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
  `);
}

async function createRelationshipFunctions(db) {
  await db.execute(sql`
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
  `);
}
```

#### 3.3 View Creation

```typescript
async function createDownloadsRelationshipsView(db, collections) {
  // Build the view SQL dynamically
  let viewSql = `
    CREATE OR REPLACE VIEW payload.downloads_relationships AS
  `;

  // Add each collection's query
  for (let i = 0; i < collections.length; i++) {
    const collection = collections[i];
    const relationshipTable = `${collection}__downloads`;

    viewSql += `
      -- ${collection} downloads
      SELECT 
        ${collection}.id::text as collection_id, 
        downloads.id::text as download_id,
        '${collection}' as collection_type
      FROM payload.${collection}
      JOIN payload.${relationshipTable} ON ${collection}.id::text = ${relationshipTable}.parent_id
      JOIN payload.downloads ON downloads.id::uuid = ${relationshipTable}.downloads_id::uuid
    `;

    // Add UNION ALL for all but the last query
    if (i < collections.length - 1) {
      viewSql += `
      UNION ALL
      `;
    }
  }

  // Execute the view creation SQL
  await db.execute(sql`${sql.raw(viewSql)}`);
}
```

#### 3.4 Bidirectional Relationships Setup

```typescript
async function setupBidirectionalRelationships(db, collections) {
  for (const collection of collections) {
    const relationshipTable = `${collection}__downloads`;

    // Skip if table doesn't exist
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'payload'
        AND table_name = ${relationshipTable}
      ) as exists
    `);

    if (!tableExists.rows[0]?.exists) {
      continue;
    }

    // Get existing relationships from collection to downloads
    const relationships = await db.execute(sql`
      SELECT 
        parent_id as collection_id,
        downloads_id
      FROM payload.${sql.raw(relationshipTable)}
      WHERE downloads_id IS NOT NULL
    `);

    // Create bidirectional relationships
    for (const relationship of relationships.rows) {
      const downloadsId = relationship.downloads_id;
      const collectionId = relationship.collection_id;

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
      `);
    }
  }
}
```

### 4. Testing & Validation Plan

#### 4.1 Testing Approach

1. **Iterative Development**:

   - Develop and test the migration in small batches
   - Add thorough console.log statements to track progress
   - Include explicit error handling with detailed error messages

2. **Incremental Testing**:
   - Run migration on a fresh database to ensure clean execution
   - Test handling of pre-existing tables and data
   - Verify error handling and transaction rollback

#### 4.2 Validation Methods

1. **Schema Verification**:

   - Check all required tables exist after migration
   - Verify column types and constraints
   - Ensure views are properly created

2. **Data Integrity**:

   - Verify bidirectional relationships are correctly established
   - Confirm predefined UUIDs are properly initialized
   - Test access patterns through helper functions

3. **Console Output**:
   - Implement detailed logging of each step
   - Report counts of objects created/modified
   - Verify no errors or warnings in output

### 5. Implementation Process

1. **Preparation**:

   - Create `apps/payload/src/migrations/archive/` directory
   - Backup existing migrations to archive

2. **Development**:

   - Create the new master migration file
   - Implement phases in order, with testing between each phase
   - Add detailed inline documentation

3. **Testing**:

   - Run the migration on a clean database
   - Verify correct execution through logs and database inspection
   - Test error scenarios with intentional failures

4. **Deployment**:
   - Update `reset-and-migrate.ps1` if needed
   - Run the full migration process
   - Verify end-to-end functionality

### 6. Risk Mitigation

1. **Transaction Safety**:

   - Use BEGIN/COMMIT/ROLLBACK for atomicity
   - Handle errors properly with detailed logging

2. **Idempotent Operations**:

   - Use IF NOT EXISTS for all table/column creation
   - Check and verify each step to support retries

3. **Backup Strategy**:
   - Archive existing migrations instead of deleting
   - Document the process for rollback if needed

## Expected Outcome

After implementing this plan, we should have:

1. A single, comprehensive migration that handles all relationship management
2. Properly linked tables with bidirectional relationships
3. Consistent type handling throughout the database
4. A more maintainable migration system
5. Clear error messages that correctly identify issues when they occur

The consolidated approach resolves the complexity and dependency issues that have led to the current errors, providing a stable foundation for future development.
