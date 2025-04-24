# Content Migration System Error Analysis and Solution Plan

## 1. Overview

This document outlines the analysis of errors identified in the content migration system and provides a comprehensive solution plan. The errors were observed during execution of the `reset-and-migrate.ps1` script, specifically in the log file `migration-detailed-log-20250424-095403-954.txt`.

## 2. Identified Errors

### 2.1. View Modification Error

```
❌ Error fixing table downloads_diagnostic: ALTER action ADD COLUMN cannot be performed on relation "downloads_diagnostic"
```

### 2.2. Missing Relationship Columns

```
❌ Missing column courses_id in table payload.downloads_rels
❌ Missing column course_lessons_id in table payload.downloads_rels
❌ Missing column course_quizzes_id in table payload.downloads_rels
```

### 2.3. General Relationship Table Issue

```
❌ Some required columns are missing in relationship tables!
```

## 3. Root Cause Analysis

### 3.1. downloads_diagnostic View Modification Error

**Root Cause**: `downloads_diagnostic` is a VIEW, not a table. According to PostgreSQL rules, views cannot be directly modified with ALTER TABLE commands, which explains why we cannot add a column to it.

Database query confirms it's a view:

```sql
SELECT table_name, table_type FROM information_schema.tables
WHERE table_schema = 'payload' AND table_name = 'downloads_diagnostic'
```

View definition:

```sql
SELECT d.id,
    d.title,
    d.filename,
    d.url,
    d.mimetype,
    d.filesize,
    d.width,
    d.height,
    d.sizes_thumbnail_url,
    (SELECT count(*) AS count
           FROM payload.course_lessons_downloads
          WHERE (course_lessons_downloads.download_id = d.id)) AS lesson_count,
    (SELECT array_agg(cl.title) AS array_agg
           FROM (payload.course_lessons_downloads cld
             JOIN payload.course_lessons cl ON ((cld.lesson_id = cl.id)))
          WHERE (cld.download_id = d.id)) AS related_lessons
   FROM payload.downloads d;
```

The error occurs because the system is treating the view as a table and attempting to add a `path` column to it.

### 3.2. Missing Relationship Columns in downloads_rels

**Root Cause**: Query verification shows that `downloads_rels` table actually has these columns defined, but the error persists. This suggests one of two issues:

1. The verification script is using an approach that's failing to detect these existing columns correctly
2. There's a type mismatch issue where the columns exist but aren't of the expected data type

Database query for columns in downloads_rels:

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'payload' AND table_name = 'downloads_rels'
ORDER BY ordinal_position
```

The query results confirm that the columns `courses_id`, `course_lessons_id`, and `course_quizzes_id` all exist in the table and have the UUID data type:

| column_name       | data_type |
| ----------------- | --------- |
| courses_id        | uuid      |
| course_lessons_id | uuid      |
| course_quizzes_id | uuid      |

This suggests that the verification script may have issues with how it checks for these columns.

### 3.3. UUID Table Handling System Issues

The content migration system uses a special mechanism for handling UUID tables, including a tracking table (`dynamic_uuid_tables`) and functions to add required columns to dynamically created tables. These components are:

1. **UUID Table Tracking Table**:

   ```sql
   SELECT * FROM payload.dynamic_uuid_tables
   ```

2. **scan_and_fix_uuid_tables Function**: A PL/pgSQL function that scans for tables matching UUID patterns and adds required columns.

The issue appears to be in how these mechanisms handle errors and edge cases like views or tables with unusual structures.

## 4. Solution Plan

### 4.1. Fix for downloads_diagnostic VIEW

Since `downloads_diagnostic` is a VIEW and not a table, we need to:

1. **Recreate the view with the required column**: Modify the view definition to include the `path` column.

```sql
DROP VIEW IF EXISTS payload.downloads_diagnostic;
CREATE VIEW payload.downloads_diagnostic AS
SELECT d.id,
  d.title,
  d.filename,
  d.url,
  d.mimetype,
  d.filesize,
  d.width,
  d.height,
  d.sizes_thumbnail_url,
  d.path, -- Added column
  (SELECT count(*) AS count
    FROM payload.course_lessons_downloads
    WHERE (course_lessons_downloads.download_id = d.id)) AS lesson_count,
  (SELECT array_agg(cl.title) AS array_agg
    FROM (payload.course_lessons_downloads cld
      JOIN payload.course_lessons cl ON ((cld.lesson_id = cl.id)))
    WHERE (cld.download_id = d.id)) AS related_lessons
FROM payload.downloads d;
```

2. **Implement this in a new migration file** that will recreate the view with the correct columns.

### 4.2. Fix for Relationship Columns Verification

The relationship columns appear to exist in the database schema, but the verification is still failing. We need to:

1. **Enhance the Relationship Verification Script**:

   - Add more detailed logging to identify the exact nature of the failure
   - Add type checking to ensure columns are of the expected type (UUID)
   - Update the repair logic to handle potential type mismatches

2. **Create a Database Function for Column Management**:

```sql
CREATE OR REPLACE FUNCTION payload.ensure_relationship_columns()
RETURNS void AS $$
DECLARE
  rel_table TEXT;
BEGIN
  -- Loop through all relationship tables
  FOR rel_table IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'payload'
    AND table_name LIKE '%_rels'
  LOOP
    -- Try to convert columns if they exist but with wrong type
    BEGIN
      EXECUTE format('
        ALTER TABLE payload.%I
        ALTER COLUMN courses_id TYPE UUID USING courses_id::uuid,
        ALTER COLUMN course_lessons_id TYPE UUID USING course_lessons_id::uuid,
        ALTER COLUMN course_quizzes_id TYPE UUID USING course_quizzes_id::uuid
      ', rel_table);
    EXCEPTION WHEN OTHERS THEN
      -- If conversion fails, try adding the columns
      BEGIN
        EXECUTE format('
          ALTER TABLE payload.%I
          ADD COLUMN IF NOT EXISTS courses_id UUID,
          ADD COLUMN IF NOT EXISTS course_lessons_id UUID,
          ADD COLUMN IF NOT EXISTS course_quizzes_id UUID
        ', rel_table);
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error ensuring columns for table %: %', rel_table, SQLERRM;
      END;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### 4.3. Improve UUID Table Management

The current UUID table tracking system needs improvements:

1. **Create a New Utility Script**:

   - Create a script to verify and repair dynamically generated UUID tables
   - Enhance the tracking mechanism to handle edge cases better

2. **Update the scan_and_fix_uuid_tables Function**:

```sql
CREATE OR REPLACE FUNCTION payload.scan_and_fix_uuid_tables()
RETURNS SETOF record AS $$
DECLARE
  uuid_table TEXT;
  added_columns TEXT[] := '{}'::TEXT[];
  table_name TEXT;
  columns_added TEXT[];
BEGIN
  -- Log start of function
  RAISE NOTICE 'Starting UUID table scan with enhanced error handling...';

  -- Loop through all tables in the payload schema that match pattern
  FOR uuid_table IN
    SELECT tables.table_name
    FROM information_schema.tables AS tables
    WHERE tables.table_schema = 'payload'
    AND tables.table_type = 'BASE TABLE'
    AND (
      tables.table_name ~ '^[0-9a-f]{8}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{12}$'
      OR tables.table_name ~ '^[0-9a-f]{8}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{12}$'
      OR tables.table_name LIKE '%\_rels'
    )
  LOOP
    -- Reset added columns for this table
    added_columns := '{}'::TEXT[];

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
$$ LANGUAGE plpgsql;
```

3. **Update Verification Script to Handle Views**:
   - Modify the `verify-relationship-columns.ts` script to first check if an object is a table or view before attempting to add columns
   - Add better tracking of object types in the `dynamic_uuid_tables` table

## 5. Implementation Plan

### 5.1. New Migration Files

1. **Fix for downloads_diagnostic View** - `apps/payload/src/migrations/20250425_100000_fix_downloads_diagnostic_view.ts`:

```typescript
import { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/migrate-postgres';

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(`
    -- Drop and recreate the view with the path column
    DROP VIEW IF EXISTS payload.downloads_diagnostic;
    
    CREATE VIEW payload.downloads_diagnostic AS
    SELECT 
      d.id,
      d.title,
      d.filename,
      d.url,
      d.mimetype,
      d.filesize,
      d.width,
      d.height,
      d.sizes_thumbnail_url,
      d.path, -- Added path column
      (SELECT count(*) AS count
        FROM payload.course_lessons_downloads
        WHERE (course_lessons_downloads.download_id = d.id)) AS lesson_count,
      (SELECT array_agg(cl.title) AS array_agg
        FROM (payload.course_lessons_downloads cld
          JOIN payload.course_lessons cl ON ((cld.lesson_id = cl.id)))
        WHERE (cld.download_id = d.id)) AS related_lessons
    FROM payload.downloads d;
  `);

  console.log('Fixed downloads_diagnostic view with path column');
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(`
    -- Restore original view
    DROP VIEW IF EXISTS payload.downloads_diagnostic;
    
    CREATE VIEW payload.downloads_diagnostic AS
    SELECT 
      d.id,
      d.title,
      d.filename,
      d.url,
      d.mimetype,
      d.filesize,
      d.width,
      d.height,
      d.sizes_thumbnail_url,
      (SELECT count(*) AS count
        FROM payload.course_lessons_downloads
        WHERE (course_lessons_downloads.download_id = d.id)) AS lesson_count,
      (SELECT array_agg(cl.title) AS array_agg
        FROM (payload.course_lessons_downloads cld
          JOIN payload.course_lessons cl ON ((cld.lesson_id = cl.id)))
        WHERE (cld.download_id = d.id)) AS related_lessons
    FROM payload.downloads d;
  `);

  console.log('Restored original downloads_diagnostic view');
}
```

2. **Enhanced Relationship Column Management** - `apps/payload/src/migrations/20250425_110000_enhance_relationship_columns.ts`:

```typescript
import { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/migrate-postgres';

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(`
    CREATE OR REPLACE FUNCTION payload.ensure_relationship_columns()
    RETURNS void AS $$
    DECLARE
      rel_table TEXT;
    BEGIN
      -- Loop through all relationship tables
      FOR rel_table IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'payload' 
        AND table_name LIKE '%_rels'
        AND table_type = 'BASE TABLE'
      LOOP
        -- Try to convert columns if they exist but with wrong type
        BEGIN
          EXECUTE format('
            ALTER TABLE payload.%I 
            ALTER COLUMN courses_id TYPE UUID USING courses_id::uuid,
            ALTER COLUMN course_lessons_id TYPE UUID USING course_lessons_id::uuid,
            ALTER COLUMN course_quizzes_id TYPE UUID USING course_quizzes_id::uuid
          ', rel_table);
        EXCEPTION WHEN OTHERS THEN
          -- If conversion fails, try adding the columns
          BEGIN
            EXECUTE format('
              ALTER TABLE payload.%I 
              ADD COLUMN IF NOT EXISTS courses_id UUID,
              ADD COLUMN IF NOT EXISTS course_lessons_id UUID,
              ADD COLUMN IF NOT EXISTS course_quizzes_id UUID
            ', rel_table);
          EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error ensuring columns for table %: %', rel_table, SQLERRM;
          END;
        END;
      END LOOP;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Execute the function
    SELECT payload.ensure_relationship_columns();
  `);

  console.log('Enhanced relationship columns management');
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(`
    DROP FUNCTION IF EXISTS payload.ensure_relationship_columns();
  `);

  console.log('Removed relationship columns management function');
}
```

3. **Improved UUID Table Handling** - `apps/payload/src/migrations/20250425_120000_improved_uuid_monitoring.ts`:

```typescript
import { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/migrate-postgres';

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(`
    -- Create a backup of the current function
    CREATE OR REPLACE FUNCTION payload.scan_and_fix_uuid_tables_backup()
    RETURNS SETOF record AS
    $BODY$
    ${(await payload.db.drizzle.execute(`SELECT prosrc FROM pg_proc WHERE proname = 'scan_and_fix_uuid_tables'`)).rows[0].prosrc}
    $BODY$
    LANGUAGE plpgsql;
    
    -- Create enhanced function
    CREATE OR REPLACE FUNCTION payload.scan_and_fix_uuid_tables()
    RETURNS TABLE(table_name TEXT, columns_added TEXT[]) AS $$
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
    $$ LANGUAGE plpgsql;
  `);

  console.log('Improved UUID table monitoring function');
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(`
    -- Restore the original function
    CREATE OR REPLACE FUNCTION payload.scan_and_fix_uuid_tables()
    RETURNS SETOF record AS
    $BODY$
    ${(await payload.db.drizzle.execute(`SELECT prosrc FROM pg_proc WHERE proname = 'scan_and_fix_uuid_tables_backup'`)).rows[0].prosrc}
    $BODY$
    LANGUAGE plpgsql;
    
    -- Drop the backup function
    DROP FUNCTION IF EXISTS payload.scan_and_fix_uuid_tables_backup();
  `);

  console.log('Restored original UUID table monitoring function');
}
```

### 5.2. Updates to Verification Scripts

1. **Enhance verify-relationship-columns.ts script**:

The script in `packages/content-migrations/src/scripts/verification/verify-relationship-columns.ts` should be enhanced to handle views correctly and provide more detailed error reporting:

```typescript
// Add to the existing verification function:

// Check if the table is actually a view
const isView = await pool.query(`
  SELECT EXISTS (
    SELECT FROM information_schema.views
    WHERE table_schema = 'payload'
    AND table_name = $1
  ) as is_view
`, [table]);

if (isView.rows[0].is_view) {
  console.log(`⚠️ ${table} is a VIEW, not a table. Skipping column verification.`);
  continue; // Skip this table/view
}

// Add type checking for each column
for (const column of criticalColumns) {
  const columnInfo = await pool.query(`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_schema = 'payload'
      AND table_name = $1
      AND column_name = $2
  `, [table, column]);

  if (columnInfo.rows.length === 0) {
    console.error(`❌ Missing column ${column} in table payload.${table}`);
    missingColumns = true;
  } else {
    const dataType = columnInfo.rows[0].data_type;
    const expectedType = column.endsWith('_id') ? 'uuid' : 'text';

    if (dataType.toLowerCase() !== expectedType) {
      console.error(`❌ Column ${column} in table payload.${table} has wrong type: ${dataType} (expected ${expectedType})`);
      missingColumns = true;
    } else {
      console.log(`✅ Column ${column} exists in table payload.${table} with correct type (${dataType})`);
    }
  }
}
```

2. **Create a new verify-downloads-diagnostic.ts script**:

```typescript
/**
 * Verify Downloads Diagnostic View
 *
 * This script verifies that the downloads_diagnostic view exists and has all required columns.
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });

// Database connection string
const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URI;

if (!connectionString) {
  console.error('No database connection string found in environment variables');
  process.exit(1);
}

// Configure the pool
const pool = new Pool({
  connectionString,
});

/**
 * Main verification function
 */
async function verifyDownloadsDiagnosticView() {
  console.log('\nVerifying downloads_diagnostic view...');

  try {
    // Check if the view exists
    const viewCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'payload' 
        AND table_name = 'downloads_diagnostic'
      ) as view_exists
    `);

    if (!viewCheck.rows[0].view_exists) {
      console.error('❌ downloads_diagnostic view does not exist!');
      return false;
    }

    console.log('✅ downloads_diagnostic view exists.');

    // Get the columns of the view
    const viewColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'payload'
        AND table_name = 'downloads_diagnostic'
      ORDER BY ordinal_position
    `);

    const columns = viewColumns.rows.map((row: any) => row.column_name);
    console.log('Columns in the view:', columns.join(', '));

    // Check for required columns
    const requiredColumns = [
      'id',
      'title',
      'filename',
      'url',
      'mimetype',
      'filesize',
      'width',
      'height',
      'sizes_thumbnail_url',
      'path',
      'lesson_count',
      'related_lessons',
    ];

    let missingColumns = false;
    for (const column of requiredColumns) {
      if (!columns.includes(column)) {
        console.error(
          `❌ Missing required column '${column}' in downloads_diagnostic view`,
        );
        missingColumns = true;
      } else {
        console.log(
          `✅ Required column '${column}' exists in downloads_diagnostic view`,
        );
      }
    }

    if (missingColumns) {
      console.error(
        '\n❌ downloads_diagnostic view is missing some required columns!',
      );
      return false;
    }

    console.log('\n✅ downloads_diagnostic view has all required columns.');
    return true;
  } catch (error) {
    console.error('\n❌ Error verifying downloads_diagnostic view:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Run the verification
verifyDownloadsDiagnosticView()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
```

## 6. Testing Strategy

### 6.1. Pre-implementation Testing

1. Create a backup of the database schema before applying any changes
2. Run the verification scripts on the current schema to establish a baseline

### 6.2. Component Testing

1. Test each migration file individually:

   - Test the downloads_diagnostic view recreation
   - Test the enhanced relationship column management
   - Test the improved UUID table handling

2. Test each verification script:
   - Test the enhanced verify-relationship-columns.ts script
   - Test the new verify-downloads-diagnostic.ts script

### 6.3. Integration Testing

1. Run the full reset-and-migrate.ps1 script with the new migrations
2. Verify all error messages are resolved
3. Check the detailed log file for any new errors

### 6.4. Regression Testing

1. Run a complete test of the application to ensure no functionality is broken
2. Test specific functionality related to downloads and their relationships
3. Test any edge cases that were previously identified

## 7. Conclusion

This comprehensive plan addresses the critical errors in the content migration system by:

1. Properly handling the downloads_diagnostic view
2. Ensuring relationship columns exist with the correct types
3. Improving the UUID table monitoring system to handle views and edge cases

The implementation is designed to be minimally invasive while providing a robust solution to the current issues. Each change includes proper error handling and transaction management to ensure data integrity during the migration process.

After implementing these changes, the reset-and-migrate.ps1 script should run without the specified errors, providing a more reliable content migration experience.
