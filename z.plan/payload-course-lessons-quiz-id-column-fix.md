# Payload CMS Course Lessons Quiz ID Column Fix

## Issue Summary

We encountered an error in the Payload CMS admin interface when viewing the course_lessons collection:

```
error: column "quiz_id_id" does not exist
```

This error occurred because Payload CMS was trying to access a column named `quiz_id_id` in the `course_lessons` table, but this column didn't exist in the database schema.

## Root Cause Analysis

After investigating the database schema and reviewing the documentation files, we identified the root cause:

1. **Payload CMS Relationship Pattern**: Payload CMS follows a specific pattern for handling relationships:

   - Direct Field: A field in the main table (e.g., `quiz_id` in `course_lessons`)
   - Relationship Field: A field with `_id` suffix (e.g., `quiz_id_id`) that links to the relationship table
   - Relationship Table: A separate table (e.g., `course_lessons_rels`) that stores the relationships

2. **Inconsistent Implementation**: While the `quiz_questions` table correctly had both `quiz_id` and `quiz_id_id` columns, the `course_lessons` table only had the `quiz_id` column.

3. **Missing Column**: The migration file that created the `course_lessons` table didn't include the `quiz_id_id` column, which Payload CMS expected to be present.

## Solution Implemented

We implemented a comprehensive solution to fix this issue:

### 1. Updated Base Schema Migration

We updated the base schema migration file (`apps/payload/src/migrations/20250402_300000_base_schema.ts`) to add the `quiz_id_id` column to the `course_lessons` table:

```typescript
// Now create course_lessons table with references to both courses and course_quizzes
await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "payload"."course_lessons" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" TEXT,
    "slug" TEXT UNIQUE,
    "description" TEXT,
    "content" TEXT,
    "lesson_number" INTEGER,
    "estimated_duration" INTEGER,
    "published_at" TIMESTAMP WITH TIME ZONE,
    "quiz_id" uuid REFERENCES "payload"."course_quizzes"("id") ON DELETE SET NULL,
    "quiz_id_id" uuid REFERENCES "payload"."course_quizzes"("id") ON DELETE SET NULL,  // Added this line
    "course_id" uuid REFERENCES "payload"."courses"("id") ON DELETE CASCADE,
    "course_id_id" uuid REFERENCES "payload"."courses"("id") ON DELETE CASCADE,
    "featured_image_id" uuid REFERENCES "payload"."media"("id") ON DELETE SET NULL,
    "featured_image_id_id" uuid REFERENCES "payload"."media"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`);
```

### 2. Created Verification Script

We created a verification script (`packages/content-migrations/src/scripts/verification/verify-course-lessons-quiz-id-column.ts`) to ensure that the `quiz_id_id` column exists and is properly populated:

```typescript
// Key verification checks:
// 1. Check if quiz_id_id column exists in course_lessons table
// 2. Check if values in quiz_id_id match quiz_id
// 3. Check if relationship entries exist in course_lessons_rels
```

### 3. Updated Package.json

We added a new script to the package.json file in the content-migrations package to run the verification script:

```json
"verify:course-lessons-quiz-id-column": "tsx src/scripts/verification/verify-course-lessons-quiz-id-column.ts",
```

### 4. Updated Reset-and-Migrate Script

We updated the reset-and-migrate.ps1 script to include the verification of the course_lessons quiz_id_id column:

```powershell
# Verify course_lessons quiz_id_id column
Log-Message "  Verifying course_lessons quiz_id_id column..." "Yellow"
$courseLessonsVerification = Exec-Command -command "pnpm run verify:course-lessons-quiz-id-column" -description "Verifying course_lessons quiz_id_id column" -captureOutput

if ($courseLessonsVerification -match "Error" -or $LASTEXITCODE -ne 0) {
    Log-Message "ERROR: Course lessons quiz_id_id column verification failed" "Red"
    $overallSuccess = $false
    throw "Course lessons quiz_id_id column verification failed"
} else {
    Log-Message "  Course lessons quiz_id_id column verification passed" "Green"
}
```

## Implementation Details

### Database Schema Changes

The fix adds the `quiz_id_id` column to the `course_lessons` table with the same foreign key reference to the `course_quizzes` table as the existing `quiz_id` column.

### Verification Process

The verification script checks:

1. If the `quiz_id_id` column exists in the `course_lessons` table
2. If the values in the `quiz_id_id` column match the values in the `quiz_id` column
3. If relationship entries exist in the `course_lessons_rels` table

## Testing

To test this fix:

1. Run the reset-and-migrate.ps1 script to apply the updated migration:

   ```powershell
   ./reset-and-migrate.ps1
   ```

2. The script will automatically run the verification script to ensure the fix was applied correctly.

3. Alternatively, you can run the verification script manually:
   ```powershell
   pnpm --filter @kit/content-migrations run verify:course-lessons-quiz-id-column
   ```

## Expected Outcome

After implementing this fix:

1. The `quiz_id_id` column will be added to the `course_lessons` table
2. The values in the `quiz_id_id` column will match the values in the `quiz_id` column
3. The error "column 'quiz_id_id' does not exist" will be resolved
4. The course_lessons collection will display correctly in the Payload CMS admin interface

## Lessons Learned

1. **Payload CMS Relationship Pattern**: Payload CMS requires both a direct field (e.g., `quiz_id`) and a relationship field (e.g., `quiz_id_id`) for relationships to work correctly.

2. **Consistent Implementation**: It's important to ensure that all tables follow the same pattern for relationships.

3. **Verification**: Adding verification scripts helps ensure that the fix is applied correctly and that the database schema is in the expected state.

4. **Documentation**: Documenting the issue, root cause, and solution helps the team understand what changes were made and why.
