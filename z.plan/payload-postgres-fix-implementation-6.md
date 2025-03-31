# Payload CMS PostgreSQL Fix Implementation: Part 6

This document details the implementation of fixes for the remaining Payload CMS PostgreSQL integration issues in our project, building on the previous fixes documented in `payload-postgres-fix-implementation.md` through `payload-postgres-fix-implementation-5.md`.

## Summary of Issues

We encountered several errors in our Payload CMS integration with PostgreSQL:

1. **Documentation Breadcrumbs Issue**:

   - Error: `error: column documentation_breadcrumbs._parent_id does not exist`
   - Payload expected `_parent_id` column for parent-child relationships in the documentation_breadcrumbs table

2. **Courses Estimated Duration Issue**:

   - Error: `error: column courses.estimated_duration does not exist`
   - Payload automatically converts camelCase field names to snake_case in the database, but the column was missing

3. **Course Lessons Estimated Duration Issue**:
   - Error: `error: column courses.estimated_duration does not exist` (in course_lessons context)
   - Similar to the courses issue, the `course_lessons` table was missing the snake_case version of the column

## Root Causes

1. **Column Naming Pattern**: Payload CMS has specific patterns for column names:

   - For parent-child relationships, it expects `_parent_id` column
   - For camelCase fields in the collection definition, it expects snake_case in the database

2. **Case Conversion**: Payload CMS automatically converts camelCase field names to snake_case in the database:
   - `estimatedDuration` → `estimated_duration`

## Solution Implemented

We created a new migration file to address these specific issues:

### 1. Created a New Migration File

File: `20250331_140000_fix_remaining_column_issues.ts`

This migration:

1. Adds `_parent_id` column to the `documentation_breadcrumbs` table and copies data from `parent`
2. Adds `estimated_duration` column to the `courses` table and copies data from `estimatedDuration`
3. Adds `estimated_duration` column to the `course_lessons` table and copies data from `estimatedDuration`

Key code:

```typescript
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Fix documentation_breadcrumbs._parent_id
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'documentation_breadcrumbs' 
        AND column_name = '_parent_id'
      ) THEN
        ALTER TABLE "payload"."documentation_breadcrumbs"
        ADD COLUMN "_parent_id" uuid;
        
        -- Copy data from parent to _parent_id
        UPDATE "payload"."documentation_breadcrumbs"
        SET "_parent_id" = "parent"
        WHERE "parent" IS NOT NULL;
      END IF;
    END $$;

    -- Fix courses.estimated_duration
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'courses' 
        AND column_name = 'estimated_duration'
      ) THEN
        ALTER TABLE "payload"."courses"
        ADD COLUMN "estimated_duration" numeric;
        
        -- Copy data from estimatedDuration to estimated_duration
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'courses' 
          AND column_name = 'estimatedDuration'
        ) THEN
          UPDATE "payload"."courses"
          SET "estimated_duration" = "estimatedDuration"
          WHERE "estimatedDuration" IS NOT NULL;
        END IF;
      END IF;
    END $$;

    -- Fix course_lessons.estimated_duration
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons' 
        AND column_name = 'estimated_duration'
      ) THEN
        ALTER TABLE "payload"."course_lessons"
        ADD COLUMN "estimated_duration" numeric;
        
        -- Copy data from estimatedDuration to estimated_duration
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_lessons' 
          AND column_name = 'estimatedDuration'
        ) THEN
          UPDATE "payload"."course_lessons"
          SET "estimated_duration" = "estimatedDuration"
          WHERE "estimatedDuration" IS NOT NULL;
        END IF;
      END IF;
    END $$;
  `);
}
```

### 2. Updated Migration Index

Updated the `index.ts` file to include the new migration:

```typescript
// Import the new migration
import * as migration_20250331_140000_fix_remaining_column_issues from './20250331_140000_fix_remaining_column_issues'

// Add to migrations array
{
  up: migration_20250331_140000_fix_remaining_column_issues.up,
  down: migration_20250331_140000_fix_remaining_column_issues.down,
  name: '20250331_140000_fix_remaining_column_issues',
},
```

### 3. Applied the Migration

Ran the `reset-and-migrate.ps1` script to apply all migrations:

```powershell
.\reset-and-migrate.ps1
```

The migration ran successfully, with the following output for our new migration:

```
[13:41:32] INFO: Migrating: 20250331_140000_fix_remaining_column_issues
[13:41:32] INFO: Migrated:  20250331_140000_fix_remaining_column_issues (9ms)
```

## Implementation Details

To ensure robustness, we added several safety checks in our migration:

1. **Check if Column Exists Before Adding**: We only add a column if it doesn't already exist
2. **Check if Source Column Exists Before Copying Data**: We only try to copy data if the source column exists
3. **Data Preservation**: We copy data from the old columns to the new ones to preserve existing data

## Results

After implementing these fixes and running the migration, we successfully:

1. Added all the missing columns with the correct names
2. Copied data from the old columns to the new ones where possible

We verified that all the required columns now exist in the database:

```sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'payload'
AND ((table_name = 'documentation_breadcrumbs' AND column_name = '_parent_id')
  OR (table_name = 'courses' AND column_name = 'estimated_duration')
  OR (table_name = 'course_lessons' AND column_name = 'estimated_duration'))
```

Results:

```
table_name                 | column_name
---------------------------|------------------
course_lessons             | estimated_duration
courses                    | estimated_duration
documentation_breadcrumbs  | _parent_id
```

## Lessons Learned

1. **Column Naming Patterns**: Payload CMS has specific patterns for column names that must be followed:

   - `_parent_id` for parent-child relationships
   - snake_case for all column names

2. **Case Conversion**: Payload CMS automatically converts camelCase field names to snake_case in the database, so we need to ensure both versions exist or use snake_case consistently.

3. **Migration Safety**: It's important to add safety checks in migrations to handle cases where columns might already exist or might not exist.

4. **Data Preservation**: When renaming or adding columns, it's important to copy data from the old columns to the new ones to preserve existing data.

## Recommendations for Future Development

1. **Consistent Field Naming**: Consider updating collection definitions to use snake_case consistently to avoid these issues in the future.

2. **Automated Testing**: Implement automated tests to verify the database schema matches Payload's expectations.

3. **Column Cleanup**: Once everything is working correctly, consider removing the old columns to clean up the database schema.

4. **Documentation**: Update project documentation to reflect the changes made to the database schema and migration process.

## Conclusion

The fixes implemented in this phase address all the remaining issues with the Payload CMS PostgreSQL integration. By adding the missing columns, fixing case conversion issues, and ensuring proper parent-child relationships, we have created a robust database schema that properly supports Payload CMS's expectations.

The migration-based approach provides a maintainable solution that follows Payload's recommended workflow and ensures data integrity. The safety checks added to the migrations make them robust and reusable, allowing for easy application to different environments.
