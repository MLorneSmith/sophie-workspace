# Technical Implementation Plan for Downloads Relationship UUID Type Mismatch Fix

## Detailed Code Changes

### 1. Fix the Migration File `20250411_100000_fix_downloads_relationships.ts`

#### a. Update the `getRelationshipCounts` function:

```typescript
async function getRelationshipCounts(
  collection: string,
): Promise<{ total: number; bidirectional: number }> {
  const relationshipTable = `${collection}__downloads`;

  // Get total relationships
  const counts = await db.execute(sql`
    SELECT COUNT(*) as total FROM payload.${sql.raw(relationshipTable)}
    WHERE downloads_id IS NOT NULL
  `);

  // Get bidirectional relationships with proper SQL escaping AND TYPE CASTING
  const bidirectionalCounts = await db.execute(sql`
    SELECT COUNT(*) as total 
    FROM payload.${sql.raw(relationshipTable)} rt
    JOIN payload.downloads_rels dr ON rt.downloads_id::uuid = dr._parent_id
    WHERE dr.field = ${sql.raw(`'${collection}'`)}
    AND dr.value = rt.parent_id
  `);

  // Parse counts safely
  const total = parseInt(counts.rows[0]?.total as string) || 0;
  const bidirectional =
    parseInt(bidirectionalCounts.rows[0]?.total as string) || 0;

  return { total, bidirectional };
}
```

#### b. Update table definition for `downloads_rels`:

```typescript
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
```

#### c. Update the bidirectional relationship creation logic:

```typescript
for (const relationship of relationships.rows) {
  const downloadsId = relationship.downloads_id as string;
  const collectionId = relationship.collection_id as string;

  await db.execute(sql`
    INSERT INTO payload.downloads_rels
      (id, _parent_id, field, value, order_column, created_at, updated_at)
    SELECT
      gen_random_uuid()::text,
      ${downloadsId}::text,
      ${collection},
      ${collectionId}::text,
      0,
      NOW(),
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM payload.downloads_rels
      WHERE _parent_id = ${downloadsId}::text
      AND field = ${collection}
      AND value = ${collectionId}::text
    );
  `);
}
```

### 2. Create New Migration File `20250412_100000_fix_downloads_uuid_type_mismatch.ts`

```typescript
import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * Fix Downloads Relationship UUID Type Mismatch
 *
 * This migration addresses the type mismatch issues between TEXT and UUID columns
 * in downloads relationship tables by:
 * 1. Converting _parent_id in downloads_rels to TEXT type
 * 2. Adding a helper function for safe UUID/TEXT comparisons
 * 3. Ensuring all downloads_id values are consistently typed
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running fix downloads UUID type mismatch migration');

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`);

    // 1. Check if _parent_id column in downloads_rels is UUID type, if so convert to TEXT
    const columnCheck = await db.execute(sql`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'payload' 
      AND table_name = 'downloads_rels' 
      AND column_name = '_parent_id'
    `);

    if (
      columnCheck.rows.length > 0 &&
      columnCheck.rows[0].data_type === 'uuid'
    ) {
      console.log('Converting _parent_id column from UUID to TEXT type');

      // Create temporary column
      await db.execute(sql`
        ALTER TABLE payload.downloads_rels 
        ADD COLUMN _parent_id_text TEXT
      `);

      // Copy data with proper casting
      await db.execute(sql`
        UPDATE payload.downloads_rels 
        SET _parent_id_text = _parent_id::text
      `);

      // Drop the old column
      await db.execute(sql`
        ALTER TABLE payload.downloads_rels 
        DROP COLUMN _parent_id
      `);

      // Rename the new column
      await db.execute(sql`
        ALTER TABLE payload.downloads_rels 
        RENAME COLUMN _parent_id_text TO _parent_id
      `);

      // Re-create the primary key relationship
      await db.execute(sql`
        ALTER TABLE payload.downloads_rels 
        ADD CONSTRAINT downloads_rels_parent_fk 
        FOREIGN KEY (_parent_id) 
        REFERENCES payload.downloads(id) 
        ON DELETE CASCADE
      `);
    }

    // 2. Create helper function for safe UUID/TEXT comparisons
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
    `);

    // 3. Ensure table columns have consistent types
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
      const relationshipTable = `${collection}__downloads`;

      // Check if the table exists
      const tableCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload'
          AND table_name = ${sql.raw(`'${relationshipTable}'`)}
        ) as exists
      `);

      if (tableCheck.rows[0]?.exists) {
        console.log(`Adding TEXT type constraint to ${relationshipTable}`);

        // Ensure both downloads_id and related_id are TEXT type
        await db.execute(sql`
          DO $$
          BEGIN
            IF EXISTS (
              SELECT FROM information_schema.columns
              WHERE table_schema = 'payload'
              AND table_name = ${sql.raw(`'${relationshipTable}'`)}
              AND column_name = 'downloads_id'
              AND data_type <> 'text'
            ) THEN
              ALTER TABLE payload.${sql.raw(relationshipTable)}
              ALTER COLUMN downloads_id TYPE TEXT USING downloads_id::TEXT;
            END IF;
            
            IF EXISTS (
              SELECT FROM information_schema.columns
              WHERE table_schema = 'payload'
              AND table_name = ${sql.raw(`'${relationshipTable}'`)}
              AND column_name = 'related_id'
              AND data_type <> 'text'
            ) THEN
              ALTER TABLE payload.${sql.raw(relationshipTable)}
              ALTER COLUMN related_id TYPE TEXT USING related_id::TEXT;
            END IF;
          END
          $$;
        `);
      }
    }

    // Commit transaction
    await db.execute(sql`COMMIT;`);
    console.log(
      'Fix downloads UUID type mismatch migration completed successfully',
    );
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`);
    console.error(
      'Error in fix downloads UUID type mismatch migration:',
      error,
    );
    throw error;
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('Running down migration for fix downloads UUID type mismatch');

  // We don't revert the column type changes as it would be destructive
  // Just remove the helper function
  await db.execute(sql`
    DROP FUNCTION IF EXISTS payload.safe_uuid_comparison(TEXT, TEXT);
  `);

  console.log('Removed helper functions');
}
```

### 3. Create a Schema Verification Script

Create a new file `packages/content-migrations/src/scripts/verification/verify-downloads-data-types.ts`:

```typescript
/**
 * Verifies consistency of data types for downloads-related tables
 */
import { getSupabaseServiceClient } from '../config/supabase';

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
}

export async function verifyDownloadsDataTypes(): Promise<void> {
  const supabase = getSupabaseServiceClient();

  console.log('Checking data type consistency for downloads-related tables...');

  // Get all downloads_id column types
  const { data: downloadIdColumns, error: downloadIdError } = await supabase
    .from('information_schema.columns')
    .select('table_name, column_name, data_type')
    .eq('table_schema', 'payload')
    .eq('column_name', 'downloads_id');

  if (downloadIdError) {
    console.error('Error fetching downloads_id columns:', downloadIdError);
    return;
  }

  // Get _parent_id column type from downloads_rels
  const { data: parentIdColumns, error: parentIdError } = await supabase
    .from('information_schema.columns')
    .select('table_name, column_name, data_type')
    .eq('table_schema', 'payload')
    .eq('table_name', 'downloads_rels')
    .eq('column_name', '_parent_id');

  if (parentIdError) {
    console.error('Error fetching _parent_id column:', parentIdError);
    return;
  }

  // Check for type inconsistencies
  const inconsistencies: { table: string; column: string; type: string }[] = [];

  // Expected type for all id columns
  const expectedType = 'text';

  // Check downloads_id columns
  for (const column of downloadIdColumns as ColumnInfo[]) {
    if (column.data_type.toLowerCase() !== expectedType) {
      inconsistencies.push({
        table: column.table_name,
        column: column.column_name,
        type: column.data_type,
      });
    }
  }

  // Check _parent_id column
  for (const column of parentIdColumns as ColumnInfo[]) {
    if (column.data_type.toLowerCase() !== expectedType) {
      inconsistencies.push({
        table: column.table_name,
        column: column.column_name,
        type: column.data_type,
      });
    }
  }

  // Report findings
  if (inconsistencies.length === 0) {
    console.log(
      '✅ All downloads-related column types are consistent (using TEXT type)',
    );
  } else {
    console.error(`❌ Found ${inconsistencies.length} type inconsistencies:`);
    for (const inc of inconsistencies) {
      console.error(
        `   Table: ${inc.table}, Column: ${inc.column}, Type: ${inc.type} (expected: ${expectedType})`,
      );
    }
    console.log(
      'Run the fix-downloads-uuid-type-mismatch migration to fix these issues',
    );
  }
}

// Run the verification if executed directly
if (require.main === module) {
  verifyDownloadsDataTypes()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Verification failed:', err);
      process.exit(1);
    });
}
```

### 4. Update Collection Definitions

Review and update any collection definitions that work with downloads relationships, ensuring they use consistent typing. Example:

```typescript
// In Downloads.ts collection definition
{
  slug: 'downloads',
  // ... other properties
  fields: [
    // ... other fields
    {
      name: 'course_lessons',
      type: 'relationship',
      relationTo: 'course_lessons',
      hasMany: true,
    },
  ],
}

// In CourseLessons.ts collection definition
{
  slug: 'course_lessons',
  // ... other properties
  fields: [
    // ... other fields
    {
      name: 'downloads',
      type: 'relationship',
      relationTo: 'downloads',
      hasMany: true,
    },
  ],
}
```

## Migration Execution Plan

1. **Add the New Migration File**

   - Create `20250412_100000_fix_downloads_uuid_type_mismatch.ts` in `apps/payload/src/migrations/`

2. **Fix the Existing Migration**

   - Update `20250411_100000_fix_downloads_relationships.ts` with type-safe changes

3. **Add the Verification Script**

   - Create `verify-downloads-data-types.ts` in `packages/content-migrations/src/scripts/verification/`
   - Update `package.json` in the content-migrations package to add a script:
     ```json
     "scripts": {
       // ... existing scripts
       "verify:downloads-types": "tsx src/scripts/verification/verify-downloads-data-types.ts"
     }
     ```

4. **Update Collection Definitions**

   - Verify and update Downloads.ts and related collection files

5. **Test the Solution**
   - Run the `reset-and-migrate.ps1` script to test the fix
   - Verify the downloads relationships work correctly

## Troubleshooting

If you encounter issues during the migration process:

1. **Schema Update Issues**: Check the database directly using SQL:

   ```sql
   SELECT table_name, column_name, data_type
   FROM information_schema.columns
   WHERE table_schema = 'payload' AND column_name LIKE '%download%';
   ```

2. **Relationship Creation Issues**: Manually test bidirectional relationships:

   ```sql
   SELECT * FROM payload.course_lessons__downloads;
   SELECT * FROM payload.downloads_rels WHERE field = 'course_lessons';
   ```

3. **Performance Issues with Type Casts**: Consider adding explicit indexes:
   ```sql
   CREATE INDEX downloads_id_uuid_idx ON payload.course_lessons__downloads (downloads_id::uuid);
   ```
