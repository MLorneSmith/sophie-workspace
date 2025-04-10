# Downloads Relationship UUID Tables Fix Plan

## Issue Summary

We have identified a critical issue with the relationships between the Downloads collection and other collections in our Payload CMS setup. The error manifests as:

```
ERROR: column <uuid>.downloads_id does not exist
```

Where `<uuid>` is a dynamic UUID-named temporary table created by Payload CMS at query time (e.g., `175d8dab_4c75_40a9_b411_bd6e601272b8`).

## Root Cause Analysis

1. **Temporary Tables**: When Payload CMS executes queries involving relationship collections, it creates temporary tables with UUID names.

2. **Missing Downloads ID**: These temporary tables are missing the expected `downloads_id` column that Payload CMS tries to reference.

3. **Inconsistent Relationship Structure**: Unlike other relationships (like lessons-quizzes) which have proper bidirectional relationships, the downloads relationships are not properly configured in both directions.

4. **Fixed UUID Inconsistency**: Our content migration system uses fixed UUIDs for downloads (defined in `download-id-map.ts`), but these are not being properly utilized in the relationship structure.

## Solution Strategy

Our implementation will follow the established patterns used for other collection relationships that don't have this issue (e.g., quizzes, surveys). It will be a multi-stage approach:

### Phase 1: Fix Collection Definitions

1. **Update Downloads.ts Collection**:

   - Add bidirectional relationship fields
   - Define proper hooks for relationship handling

2. **Update Other Collections**:
   - Ensure consistent downloads relationship definitions
   - Match the patterns used in quiz/survey relationships

### Phase 2: Create Relationship Fix Migration

1. **Comprehensive Migration**:

   - Create new migration that fixes all downloads relationships
   - Follow the pattern used in successful quiz relationship migrations
   - Ensure all collection-download relationships use the same structure

2. **ID Consistency**:
   - Leverage the fixed UUIDs from `download-id-map.ts`
   - Ensure consistent IDs across all tables and relationships

### Phase 3: Verification and Repair

1. **Verification Mechanism**:

   - Add verification queries to confirm relationship integrity
   - Check for missing bidirectional relationships

2. **Automatic Repair**:
   - Implement automatic repair for any inconsistencies found
   - Ensure new relationship tables have the correct structure

## Detailed Implementation Steps

### Step 1: Update Downloads.ts Collection Definition

```typescript
// Add to Downloads.ts
fields: [
  // ... existing fields ...

  // Add relationship fields for each collection that references downloads
  {
    name: 'course_lessons',
    type: 'relationship',
    relationTo: 'course_lessons',
    hasMany: true,
    admin: {
      description: 'Lessons that use this download',
    },
  },
  {
    name: 'documentation',
    type: 'relationship',
    relationTo: 'documentation',
    hasMany: true,
    admin: {
      description: 'Documentation pages that use this download',
    },
  },
  // Add similar fields for other collections
],

// Add hooks for relationship maintenance
hooks: {
  beforeChange: [
    ({ req, data }) => {
      // Ensure id matches our fixed ID mapping if applicable
      return data;
    },
  ],
  afterRead: [
    ({ req, doc }) => {
      // Process any relationship data if needed
      return doc;
    },
  ],
},
```

### Step 2: Create Fix Migration (20250411_100000_fix_downloads_relationships.ts)

```typescript
import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

import { DOWNLOAD_ID_MAP } from '../../../packages/content-migrations/src/data/download-id-map';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running fix downloads relationships migration');

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`);

    // 1. Create downloads_rels table if it doesn't exist (for bidirectional relationships)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payload.downloads_rels (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        _parent_id TEXT NOT NULL REFERENCES payload.downloads(id) ON DELETE CASCADE,
        field VARCHAR(255),
        value TEXT,
        order_column INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. Create indexes on downloads_rels
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS downloads_rels_parent_idx ON payload.downloads_rels(_parent_id);
      CREATE INDEX IF NOT EXISTS downloads_rels_field_idx ON payload.downloads_rels(field);
      CREATE INDEX IF NOT EXISTS downloads_rels_value_idx ON payload.downloads_rels(value);
    `);

    // 3. Add fields for each collection that references downloads
    const collections = [
      'documentation',
      'posts',
      'surveys',
      'survey_questions',
      'courses',
      'course_lessons',
      'course_quizzes',
      'quiz_questions',
    ];

    for (const collection of collections) {
      // Ensure downloads_id column exists in the collection's main table
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
            ALTER TABLE payload.${sql.raw(collection)} ADD COLUMN downloads_id TEXT[];
          END IF;
        END
        $$;
      `);

      // Create collection__downloads relationship table if it doesn't exist
      const relationshipTable = `${collection}__downloads`;
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS payload.${sql.raw(relationshipTable)} (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          parent_id TEXT NOT NULL,
          related_id TEXT,
          downloads_id TEXT,
          order_column INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // Ensure columns exist in relationship table
      await db.execute(sql`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'payload'
            AND table_name = ${sql.raw(`'${relationshipTable}'`)}
            AND column_name = 'downloads_id'
          ) THEN
            ALTER TABLE payload.${sql.raw(relationshipTable)} ADD COLUMN downloads_id TEXT;
          END IF;

          IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'payload'
            AND table_name = ${sql.raw(`'${relationshipTable}'`)}
            AND column_name = 'related_id'
          ) THEN
            ALTER TABLE payload.${sql.raw(relationshipTable)} ADD COLUMN related_id TEXT;
          END IF;
        END
        $$;
      `);

      // Create indexes for faster queries
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS ${sql.raw(`${relationshipTable}_parent_id_idx`)} 
        ON payload.${sql.raw(relationshipTable)}(parent_id);
        
        CREATE INDEX IF NOT EXISTS ${sql.raw(`${relationshipTable}_related_id_idx`)} 
        ON payload.${sql.raw(relationshipTable)}(related_id);
        
        CREATE INDEX IF NOT EXISTS ${sql.raw(`${relationshipTable}_downloads_id_idx`)} 
        ON payload.${sql.raw(relationshipTable)}(downloads_id);
      `);

      // Sync related_id and downloads_id columns (make sure they contain the same values)
      await db.execute(sql`
        UPDATE payload.${sql.raw(relationshipTable)}
        SET downloads_id = related_id
        WHERE related_id IS NOT NULL AND (downloads_id IS NULL OR downloads_id != related_id);
        
        UPDATE payload.${sql.raw(relationshipTable)}
        SET related_id = downloads_id
        WHERE downloads_id IS NOT NULL AND (related_id IS NULL OR related_id != downloads_id);
      `);
    }

    // 4. Create bidirectional relationships from downloads to collections
    console.log('Creating bidirectional relationships for downloads...');

    for (const collection of collections) {
      const relationshipTable = `${collection}__downloads`;

      // Get existing relationships from collection to downloads
      const relationships = await db.execute(sql`
        SELECT 
          parent_id as collection_id,
          downloads_id
        FROM payload.${sql.raw(relationshipTable)}
        WHERE downloads_id IS NOT NULL
      `);

      // For each relationship, create a reverse relationship if it doesn't exist
      for (const relationship of relationships.rows) {
        await db.execute(sql`
          INSERT INTO payload.downloads_rels
            (id, _parent_id, field, value, order_column, created_at, updated_at)
          SELECT
            gen_random_uuid()::text,
            ${relationship.downloads_id},
            ${collection},
            ${relationship.collection_id},
            0,
            NOW(),
            NOW()
          WHERE NOT EXISTS (
            SELECT 1 FROM payload.downloads_rels
            WHERE _parent_id = ${relationship.downloads_id}
            AND field = ${collection}
            AND value = ${relationship.collection_id}
          );
        `);
      }
    }

    // 5. Verify and report on relationships
    let totalRelationships = 0;
    let totalBidirectional = 0;

    for (const collection of collections) {
      const relationshipTable = `${collection}__downloads`;

      const counts = await db.execute(sql`
        SELECT COUNT(*) as total FROM payload.${sql.raw(relationshipTable)}
        WHERE downloads_id IS NOT NULL
      `);

      const bidirectionalCounts = await db.execute(sql`
        SELECT COUNT(*) as total FROM payload.${sql.raw(relationshipTable)} rt
        JOIN payload.downloads_rels dr ON rt.downloads_id = dr._parent_id
        WHERE dr.field = ${collection}
        AND dr.value = rt.parent_id
      `);

      const collectionTotal = parseInt(counts.rows[0].total) || 0;
      const bidirectionalTotal =
        parseInt(bidirectionalCounts.rows[0].total) || 0;

      totalRelationships += collectionTotal;
      totalBidirectional += bidirectionalTotal;

      console.log(
        `${collection}: ${bidirectionalTotal}/${collectionTotal} bidirectional relationships`,
      );
    }

    console.log(
      `Total: ${totalBidirectional}/${totalRelationships} bidirectional relationships`,
    );

    // 6. Special handling for temporary UUID tables
    // This creates a trigger that will automatically add downloads_id to any temporary table
    await db.execute(sql`
      DO $$
      BEGIN
        -- Create function to handle UUID tables
        CREATE OR REPLACE FUNCTION payload.ensure_uuid_table_columns()
        RETURNS trigger AS $$
        BEGIN
          -- If it's a UUID format table name
          IF NEW.relname ~ '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$' THEN
            -- Add downloads_id column
            EXECUTE 'ALTER TABLE payload.' || quote_ident(NEW.relname) || ' ADD COLUMN IF NOT EXISTS downloads_id UUID';
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create trigger to run when new tables are created
        DROP TRIGGER IF EXISTS add_uuid_table_trigger ON pg_class;
        CREATE TRIGGER add_uuid_table_trigger
        AFTER INSERT ON pg_class
        FOR EACH ROW
        WHEN (NEW.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'payload'))
        EXECUTE FUNCTION payload.ensure_uuid_table_columns();
      EXCEPTION WHEN insufficient_privilege THEN
        -- Handle error if we don't have permission on pg_class
        RAISE NOTICE 'Unable to create system-level trigger for UUID tables';
      END;
      $$;
    `);

    // Commit transaction
    await db.execute(sql`COMMIT;`);
    console.log('Fix downloads relationships migration completed successfully');
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`);
    console.error('Error in fix downloads relationships migration:', error);
    throw error;
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // We don't want to remove relationships as that could break content
  console.log(
    'Down migration for fix downloads relationships: No destructive actions performed',
  );
}
```

### Step 3: Update CourseLessons.ts (and other collections as needed)

Review the downloads relationship field in CourseLessons.ts and ensure it's properly configured:

```typescript
{
  name: 'downloads',
  type: 'relationship',
  relationTo: 'downloads',
  hasMany: true,
  admin: {
    description: 'Files for download in this lesson',
  },
}
```

### Step 4: Add verification and repair script

Create a script in `packages/content-migrations/src/scripts/verification/verify-downloads-relationships.ts`:

```typescript
/**
 * Verifies the integrity of downloads relationships across all collections
 */
import { getSupabaseServiceClient } from '../config/supabase';

export async function verifyDownloadsRelationships(): Promise<void> {
  const supabase = getSupabaseServiceClient();

  const collections = [
    'documentation',
    'posts',
    'surveys',
    'survey_questions',
    'courses',
    'course_lessons',
    'course_quizzes',
    'quiz_questions',
  ];

  let totalIssues = 0;

  for (const collection of collections) {
    // Check for missing reverse relationships
    const { data, error } = await supabase
      .from(`${collection}__downloads`)
      .select('*')
      .is('downloads_id', null)
      .eq('related_id', null);

    if (error) {
      console.error(`Error checking ${collection}__downloads:`, error);
      continue;
    }

    if (data.length > 0) {
      console.warn(
        `Found ${data.length} incomplete relationships in ${collection}__downloads`,
      );
      totalIssues += data.length;
    }
  }

  // Report results
  if (totalIssues === 0) {
    console.log('✅ All downloads relationships are valid');
  } else {
    console.error(
      `❌ Found ${totalIssues} issues with downloads relationships`,
    );
    console.log(
      'Run the fix-downloads-relationships.ts script to repair these issues',
    );
  }
}

// Run the verification if executed directly
if (require.main === module) {
  verifyDownloadsRelationships()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Verification failed:', err);
      process.exit(1);
    });
}
```

### Step 5: Create a Fallback Approach

In case the system-level trigger approach doesn't work due to PostgreSQL permissions, create a simpler fallback migration:

```typescript
// 20250411_200000_add_views_for_downloads_relationships.ts
import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  try {
    // Start transaction
    await db.execute(sql`BEGIN;`);

    // Create a view that maps relationship table columns
    await db.execute(sql`
      CREATE OR REPLACE VIEW payload.downloads_column_mapping AS
      SELECT 'related_id' AS source_column, 'downloads_id' AS target_column
      UNION
      SELECT 'downloads_id' AS source_column, 'related_id' AS target_column;
    `);

    // Create a function to handle queries that reference downloads_id
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION payload.get_download_id(related_id TEXT) RETURNS TEXT AS $$
      BEGIN
        RETURN related_id;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Commit transaction
    await db.execute(sql`COMMIT;`);
    console.log('Created downloads relationship helper views and functions');
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`);
    console.error('Error in downloads relationship views creation:', error);
    throw error;
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  try {
    // Start transaction
    await db.execute(sql`BEGIN;`);

    // Remove views and functions
    await db.execute(sql`
      DROP VIEW IF EXISTS payload.downloads_column_mapping;
      DROP FUNCTION IF EXISTS payload.get_download_id(TEXT);
    `);

    // Commit transaction
    await db.execute(sql`COMMIT;`);
    console.log('Removed downloads relationship helper views and functions');
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`);
    console.error(
      'Error in down migration for downloads relationship views:',
      error,
    );
    throw error;
  }
}
```

## Expected Outcomes

1. **Resolved Error**: The `column <uuid>.downloads_id does not exist` error should no longer appear when accessing collections with downloads relationships.

2. **Consistent Relationships**: All downloads relationships will follow the same pattern as quiz/survey relationships, ensuring consistency.

3. **Bidirectional Navigation**: It will be possible to navigate from downloads to related collections and vice versa.

4. **Improved Performance**: Properly indexed relationships will improve query performance.

## Implementation Timeline

1. **Phase 1** (Update Collection Definitions): 1 hour
2. **Phase 2** (Create Fix Migration): 2 hours
3. **Phase 3** (Verification and Testing): 1 hour

Total estimated time: 4 hours

## Testing Strategy

1. **Unit Testing**:

   - Verify each collection's relationship with downloads
   - Confirm bidirectional relationships are created

2. **Integration Testing**:

   - Test navigation from collections to downloads and vice versa
   - Verify all relationship tables have proper structure

3. **End-to-End Testing**:
   - Test the admin interface for each collection type
   - Verify downloads appear correctly in related collections

## Rollback Plan

If issues arise after implementation:

1. **Revert Collection Changes**: Roll back any changes to collection definitions
2. **Skip Migration**: Mark the new migration as "skipped" in the migration history
3. **Manual Repair**: If necessary, manually repair any broken relationships

## Long-term Recommendations

1. **Consistent Collection Definition**: Standardize how all relationships are defined across collections

2. **Automated Testing**: Add automated tests for relationship integrity

3. **Documentation**: Update your system documentation to clarify:

   - How relationship tables are structured
   - How to handle UUID tables in PostgreSQL

4. **Schema Enforcement**: Consider using a schema validation tool to ensure consistency
