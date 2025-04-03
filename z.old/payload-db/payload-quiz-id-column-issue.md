# Payload CMS Quiz Relationship Column Issue

## Issue Description

The course route in our Makerkit-based Next.js 15 app with Payload CMS integration is experiencing two main issues:

1. There is a delay before any content is displayed
2. Lessons are not being displayed

The server logs show a specific error:

```
ERROR: column "quiz_id_id" does not exist
HINT: Perhaps you meant to reference the column "course_lessons.quiz_id".
```

This error occurs when trying to fetch course lessons from the Payload CMS API, causing the lessons not to display in the course interface.

## Technical Analysis

### Database Schema Investigation

After examining the database schema, I found that:

1. The `course_lessons` table in the `payload` schema has a `quiz_id` column (UUID type) but is missing the expected `quiz_id_id` column.
2. Other relationship fields in the same table follow a pattern of having both a base column and an "\_id" suffixed column:
   - `course_id` and `course_id_id`
   - `featured_image_id` and `featured_image_id_id`
3. The `quiz_questions` table correctly has both `quiz_id` and `quiz_id_id` columns.

### Payload CMS Relationship Field Naming Convention

Payload CMS follows a specific naming convention for relationship fields in the database:

1. When a relationship field is defined in a collection (e.g., `name: 'quiz_id'`), Payload CMS expects a corresponding database column with an additional "\_id" suffix (e.g., `quiz_id_id`).
2. This pattern is consistent across other tables and collections in our application.

### Migration History

The issue originated from a migration file (`20250401_150000_add_quiz_id_column.ts`) that added a column named `quiz_id` to the `course_lessons` table, but did not add the expected `quiz_id_id` column that Payload CMS is trying to access.

### API and Query Flow

1. The `getCourseLessons` function in `packages/cms/payload/src/api/course.ts` makes an API call to fetch lessons for a specific course.
2. When Payload CMS processes this query internally, it tries to access the `quiz_id_id` column in the `course_lessons` table.
3. Since this column doesn't exist, the query fails with the error message shown above.

## Root Cause

The root cause is a mismatch between Payload CMS's expected database schema and the actual schema:

1. Payload CMS expects relationship fields to have a column named with the field name plus an additional "\_id" suffix.
2. The migration that added the quiz relationship field created a column named `quiz_id` instead of the expected `quiz_id_id`.
3. This naming inconsistency causes Payload CMS to fail when trying to query the relationship data.

## Solution

The solution is to create a new migration that adds the missing `quiz_id_id` column while maintaining the existing `quiz_id` column for backward compatibility:

### New Migration File

Create a new migration file (`20250402_100000_add_quiz_id_id_column.ts`) with the following content:

```typescript
import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  console.log('Adding quiz_id_id column to course_lessons table...');
  await db.execute(sql`
    -- Add quiz_id_id column to course_lessons table
    DO $$
    BEGIN
      -- Ensure quiz_id_id column exists
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons' 
        AND column_name = 'quiz_id_id'
      ) THEN
        -- If quiz_id_id doesn't exist, create it
        ALTER TABLE "payload"."course_lessons"
        ADD COLUMN "quiz_id_id" uuid;
        
        -- Copy values from quiz_id to quiz_id_id
        UPDATE "payload"."course_lessons"
        SET "quiz_id_id" = "quiz_id";
        
        -- Update foreign key constraint if needed
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'course_lessons_quiz_id_id_fkey'
          AND table_schema = 'payload'
          AND table_name = 'course_lessons'
        ) THEN
          -- Add foreign key constraint
          ALTER TABLE "payload"."course_lessons"
          ADD CONSTRAINT "course_lessons_quiz_id_id_fkey"
          FOREIGN KEY ("quiz_id_id") REFERENCES "payload"."course_quizzes"("id") ON DELETE SET NULL;
        END IF;
      END IF;
    END $$;
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove foreign key constraint if it exists
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'course_lessons_quiz_id_id_fkey'
        AND table_schema = 'payload'
        AND table_name = 'course_lessons'
      ) THEN
        ALTER TABLE "payload"."course_lessons"
        DROP CONSTRAINT "course_lessons_quiz_id_id_fkey";
      END IF;
    END $$;
    
    -- Remove quiz_id_id column if it exists
    ALTER TABLE IF EXISTS "payload"."course_lessons" 
    DROP COLUMN IF EXISTS "quiz_id_id";
  `);
}
```

### Implementation Steps

1. Create the new migration file in the `apps/payload/src/migrations` directory.
2. Run the `reset-and-migrate.ps1` script to apply the new migration.
3. Verify that the course lessons are now displayed correctly.

### Benefits of This Solution

1. **Maintains Compatibility**: By keeping the existing `quiz_id` column and adding the new `quiz_id_id` column, we ensure backward compatibility with any code that might be using the original column.
2. **Follows Payload Conventions**: The solution aligns with Payload CMS's naming conventions for relationship fields, as evidenced by other tables in the database.
3. **Preserves Data**: The migration copies existing relationship data to the new column, ensuring no data is lost.
4. **Minimal Changes**: This approach requires only a single migration file and doesn't need changes to the collection definitions or application code.

## Future Recommendations

1. **Consistent Naming Conventions**: Ensure that all future migrations follow Payload CMS's naming conventions for relationship fields.
2. **Migration Testing**: Test migrations in a development environment before applying them to production.
3. **Schema Validation**: Implement a schema validation step in the CI/CD pipeline to catch schema inconsistencies early.
