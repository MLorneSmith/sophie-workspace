# Download Column Name and Quiz Reference Fix Plan

## 1. Issue Analysis

Our investigation has identified two main issues that need to be addressed:

### Issue 1: Downloads Collection Column Name Mismatch

In the server logs, we observed consistent errors related to the downloads collection:

```
Error fetching actual download documents: error: column "mimeType" does not exist
hint: Perhaps you meant to reference the column "downloads.mimetype".
position: '41'
```

This error occurs in the `findDownloadsForCollection` function in `apps/payload/src/db/relationship-helpers.ts` where an SQL query is attempting to select a column named `"mimeType"` (with capital "T"), but the actual column in the PostgreSQL database is named `"mimetype"` (lowercase "t").

**Root Cause**: PostgreSQL stores identifiers in lowercase unless specifically quoted with double quotes. The query is using camelCase for the column name, but the database schema uses lowercase. This case-sensitivity mismatch is causing the query to fail.

### Issue 2: Missing Quiz References (404 Not Found)

The application is attempting to retrieve quiz data for lessons when a quiz ID is present:

```
Error: Failed to call Payload API (course_quizzes/d5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0): 404 Not Found
```

This error occurs when a lesson has a `quiz_id` reference to a quiz that doesn't exist in the database. The error happens in the `LessonDataProvider` component when it tries to fetch the quiz data using the `getQuiz` function.

**Root Cause**: There are invalid quiz references in the lesson data, possibly due to:

1. Content migrations that didn't maintain referential integrity
2. Test or placeholder data that was never properly updated
3. Deleted quizzes that left dangling references

## 2. Solution Approach

### For Issue 1: Downloads Column Name Fix

1. **Column Name Correction**:

   - Modify the SQL query in `findDownloadsForCollection` function to use the correct column name `"mimetype"` (lowercase) instead of `"mimeType"` (camelCase).
   - This simple fix will align the query with the actual database schema.

2. **Future-Proofing**:
   - Consider adding a column existence check before running queries
   - Implement more robust error handling to gracefully handle schema mismatches

### For Issue 2: Quiz Reference Fix

1. **Enhanced Error Handling**:

   - Modify the `LessonDataProvider` component to better handle missing quiz references
   - Ensure the application continues to function even when a referenced quiz cannot be found
   - Provide appropriate logging for debugging purposes

2. **Data Cleanup**:
   - Add a step to the database migration process to remove invalid quiz references
   - Update lesson records to set `quiz_id = NULL` where the referenced quiz doesn't exist
   - Note: We will NOT create placeholder quizzes, as specified

## 3. Implementation Plan

### Step 1: Fix Column Name in Relationship Helpers

Update the SQL query in `apps/payload/src/db/relationship-helpers.ts`:

```javascript
// Current problematic query (around line 286)
const query = `
  SELECT id, filename, filesize, "mimeType", url, title, description
  FROM payload.downloads
  WHERE id IN (${idList})
`

// Updated query with correct column name
const query = `
  SELECT id, filename, filesize, "mimetype", url, title, description
  FROM payload.downloads
  WHERE id IN (${idList})
`
```

### Step 2: Enhance Error Handling in LessonDataProvider

Update `apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonDataProvider.tsx`:

```javascript
// Current implementation
if (quizId) {
  try {
    // Get quiz data
    const { getQuiz } = await import('@kit/cms/payload');

    try {
      // Pass the quiz ID as is - the getQuiz function now handles both string and object IDs
      quiz = await getQuiz(quizId);
    } catch (error) {
      // Continue without the quiz data
    }

    // Get user's quiz attempts for this quiz (even if quiz fetch failed)
    // ...
  } catch (error) {
    // Continue without quiz data
  }
}

// Enhanced implementation
if (quizId) {
  try {
    // Get quiz data
    const { getQuiz } = await import('@kit/cms/payload');

    try {
      // Pass the quiz ID as is - the getQuiz function now handles both string and object IDs
      quiz = await getQuiz(quizId);
    } catch (error) {
      // Log the error with context but continue without the quiz data
      console.error(`Error fetching quiz with ID ${quizId}: ${error.message}`);
      // Continue without the quiz data - no placeholder quizzes
    }

    // Rest of the code remains unchanged
    // ...
  } catch (error) {
    // Continue without quiz data
  }
}
```

### Step 3: Add Data Cleanup Script

Create a new script to clean up invalid quiz references:

```typescript
// packages/content-migrations/src/scripts/repair/fix-invalid-quiz-references.ts
import { Client } from 'pg';

export async function fixInvalidQuizReferences(): Promise<void> {
  console.log('Fixing invalid quiz references...');

  const client = new Client({
    connectionString:
      process.env.DATABASE_URI ||
      'postgresql://postgres:postgres@localhost:54322/postgres',
  });

  try {
    await client.connect();
    await client.query('BEGIN');

    // Find and count invalid references
    const checkResult = await client.query(`
      SELECT COUNT(*) as invalid_count
      FROM payload.course_lessons
      WHERE quiz_id IS NOT NULL 
        AND NOT EXISTS (
          SELECT 1 FROM payload.course_quizzes WHERE id = course_lessons.quiz_id::uuid
        )
    `);

    const invalidCount = parseInt(
      checkResult.rows[0]?.invalid_count || '0',
      10,
    );

    if (invalidCount > 0) {
      console.log(`Found ${invalidCount} invalid quiz references`);

      // Update lessons to remove invalid quiz references
      const updateResult = await client.query(`
        UPDATE payload.course_lessons
        SET quiz_id = NULL
        WHERE quiz_id IS NOT NULL 
          AND NOT EXISTS (
            SELECT 1 FROM payload.course_quizzes WHERE id = course_lessons.quiz_id::uuid
          )
        RETURNING id, title
      `);

      console.log(
        `Updated ${updateResult.rowCount} lessons to remove invalid quiz references:`,
      );
      updateResult.rows.forEach((row) => {
        console.log(`- Lesson ID: ${row.id}, Title: ${row.title}`);
      });
    } else {
      console.log('No invalid quiz references found');
    }

    await client.query('COMMIT');
    console.log('Successfully fixed invalid quiz references');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fixing invalid quiz references:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the function if called directly
if (require.main === module) {
  fixInvalidQuizReferences()
    .then(() => console.log('Complete'))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
```

### Step 4: Integrate Data Cleanup into Migration Process

Update the PowerShell script to include the new fix:

```powershell
# Add this line in the Fix-Relationships function in scripts/orchestration/phases/loading.ps1
Log-Message "Fixing invalid quiz references..." "Yellow"
Exec-Command -command "pnpm exec tsx src/scripts/repair/fix-invalid-quiz-references.ts" -description "Fixing invalid quiz references" -continueOnError
```

## 4. Testing and Verification

1. **Column Name Fix**:

   - After implementing the fix, run the reset-and-migrate process
   - Verify that the error `column "mimeType" does not exist` no longer appears in the logs
   - Check that downloads are correctly associated with lessons

2. **Quiz Reference Fix**:

   - Verify that lessons with invalid quiz references no longer cause 404 errors
   - Check that the data cleanup script correctly identifies and nullifies invalid quiz references
   - Test the affected lesson pages to ensure they load without errors
   - Confirm that lessons with valid quizzes still function correctly

3. **General Testing**:
   - Ensure the content migration process completes successfully
   - Verify that all lesson pages load without errors
   - Test the download functionality in lesson pages
   - Check the Payload admin panel to verify the data integrity

## 5. Impact and Benefits

1. **Immediate Error Resolution**:

   - Fixes the immediate errors in server logs and user-facing 404s
   - Improves the reliability of the application

2. **Enhanced Robustness**:

   - Better error handling for missing relationships
   - Improved data integrity through cleanup of invalid references

3. **Future-Proofing**:
   - Prevents similar issues from occurring in the future
   - Provides a template for handling other potential schema mismatch issues

## 6. Implementation Considerations

- **Database Schema Stability**: These changes don't modify the database schema, only how we interact with it
- **Data Loss Prevention**: The approach nullifies invalid references rather than deleting records
- **Backward Compatibility**: All changes maintain compatibility with existing code and data
- **Performance**: The fixes have minimal performance impact and are focused on error resolution
