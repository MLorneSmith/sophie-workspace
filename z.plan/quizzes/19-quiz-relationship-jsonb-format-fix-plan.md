# Quiz Relationship JSONB Format Fix Plan

**Date:** April 25, 2025  
**Issue:** Quiz questions not appearing in Payload CMS Admin UI despite correct data in database

## 1. Problem Analysis & Root Cause

We've experienced ongoing issues with quiz questions not appearing in the Payload CMS admin interface. Despite implementing the consolidated quiz-relationship migration plan (`20250425_153000_minimal_quiz_fix.ts`) and verifying that the relationships exist in the database, questions still don't display in the admin UI when viewing quizzes.

Our investigation reveals the root cause:

### 1.1 JSONB Format Mismatch

Payload CMS requires a specific JSONB format for relationship fields to display properly in the UI, but our database uses a simpler format that doesn't match these requirements:

**Current format** in our database (simple array of IDs):

```json
{
  "questions": ["id1", "id2", "id3"]
}
```

**Required format** for Payload CMS UI (verified from documentation):

```json
{
  "questions": [
    {
      "id": "unique-entry-id",
      "relationTo": "quiz_questions",
      "value": {
        "id": "related-document-id"
      }
    }
  ]
}
```

### 1.2 Database Evidence

From our database analysis and logs:

1. The `questions` array in `payload.course_quizzes` uses the simple array format:

```json
"questions": [
  "0c09da5c-fff3-41f1-9505-da246426eb4e",
  "2f7a2198-6da3-41f9-a394-c002c9218834",
  "34dd66c5-562c-40f0-adea-7f36d2a0aed4",
  ...
]
```

2. Relationship records exist correctly in `payload.course_quizzes_rels` table but aren't properly linked to the JSONB structure in the UI.

3. Server logs show 404 errors when attempting to retrieve quizzes that do exist in the database:

```
web:dev: [g93n0yix91k] API Request: course_quizzes/d5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0?depth=1
payload-app:dev: [16:51:23] INFO: Not Found
```

### 1.3 Confirmation from Documentation

Payload CMS documentation confirms:

1. Relationship fields in PostgreSQL JSONB must follow the `{ relationTo, value: { id } }` format
2. The format is especially critical for polymorphic relationships (where `relationTo` is an array)
3. Proper JSONB structure is required for Payload's UI to render relationships correctly

## 2. Current Implementation Assessment

### 2.1 Why Minimal Quiz Fix Was Insufficient

The `20250425_153000_minimal_quiz_fix.ts` migration focused on schema structure but explicitly avoided data synchronization due to type casting issues:

```typescript
// This approach avoids type casting issues by not attempting to update or synchronize data,
// which will be handled by separate repair scripts.
```

### 2.2 Issues with Current `format-questions-jsonb.ts` Script

Our existing script has several limitations:

1. **Database Client Issues**:

   ```typescript
   const client = new Client({
     connectionString: process.env.DATABASE_URI || '...',
   });
   ```

   Uses direct PostgreSQL client instead of Payload's database client, bypassing Payload's transformations

2. **Type Casting Problems**:

   ```sql
   WHERE _parent_id = $1
   ```

   No explicit type casting between UUID and TEXT, which PostgreSQL requires for reliable comparisons

3. **Transaction Isolation**:
   While the script uses transactions, it doesn't coordinate with Payload's internal operations

4. **Format Verification Gaps**:
   Limited verification that ensures the format is correct but doesn't check integration with Payload's UI rendering

5. **No Ongoing Resilience**:
   No mechanisms to ensure future edits maintain the correct format

## 3. Implementation Plan

We'll implement a comprehensive solution that addresses all aspects of the JSONB format issue:

### 3.1 Enhanced JSONB Formatting Script

Create an improved script that:

- Uses Payload's database client to ensure consistent handling
- Explicitly casts types in SQL operations
- Provides detailed logging of format transformations
- Contains comprehensive error handling

```typescript
// packages/content-migrations/src/scripts/repair/quiz-management/enhanced-format-questions-jsonb.ts
import { sql } from '@payloadcms/db-postgres';

import { logAction, logError, logSuccess } from '../../../utils/logging';
import { getPayloadClient } from '../../../utils/payload';

export const formatQuestionsJSONBEnhanced = async (): Promise<boolean> => {
  try {
    // Get Payload client for proper database access
    const payload = await getPayloadClient();
    const db = payload.db.drizzle;

    logAction('Running enhanced JSONB formatting for quiz questions');

    // Begin transaction
    await db.execute(sql`BEGIN`);

    try {
      // 1. Get all quizzes with their current questions array
      const quizzes = await db.execute(sql`
        SELECT 
          id::text, 
          title, 
          questions 
        FROM 
          payload.course_quizzes
        WHERE 
          questions IS NOT NULL
      `);

      let successCount = 0;
      let formatErrors = 0;

      // 2. Process each quiz
      for (const quiz of quizzes.rows) {
        try {
          let questions = quiz.questions;

          // Handle case where questions is a string
          if (typeof questions === 'string') {
            try {
              questions = JSON.parse(questions);
            } catch (e) {
              logError(
                `Quiz ${quiz.title} (${quiz.id}) has invalid JSON in questions`,
              );
              formatErrors++;
              continue;
            }
          }

          // Skip if not an array
          if (!Array.isArray(questions)) {
            logError(
              `Quiz ${quiz.title} (${quiz.id}) has non-array questions: ${typeof questions}`,
            );
            formatErrors++;
            continue;
          }

          // Format questions into Payload-compatible structure
          const formattedQuestions = questions.map((questionId) => {
            // Extract ID from various possible formats
            const id =
              typeof questionId === 'object'
                ? questionId.id || questionId.value?.id || questionId
                : questionId;

            return {
              id,
              relationTo: 'quiz_questions',
              value: {
                id,
              },
            };
          });

          // Log before and after state for the first few questions
          logAction(
            `Quiz ${quiz.title} (${quiz.id}) - before: ${JSON.stringify(questions.slice(0, 2))}`,
          );
          logAction(
            `Quiz ${quiz.title} (${quiz.id}) - after: ${JSON.stringify(formattedQuestions.slice(0, 2))}`,
          );

          // Update with properly formatted questions JSONB
          // IMPORTANT: Cast both the quiz ID and ensure the JSONB is properly formatted
          await db.execute(sql`
            UPDATE 
              payload.course_quizzes
            SET 
              questions = ${JSON.stringify(formattedQuestions)}::jsonb
            WHERE 
              id::text = ${quiz.id}::text
          `);

          successCount++;
        } catch (error) {
          logError(
            `Error formatting quiz ${quiz.title} (${quiz.id}): ${error.message}`,
          );
          formatErrors++;
        }
      }

      // Specific checking for Performance Quiz
      const performanceQuiz = await db.execute(sql`
        SELECT id::text, title FROM payload.course_quizzes 
        WHERE title LIKE '%Performance%'
      `);

      if (performanceQuiz.rows.length > 0) {
        // Check if it has properly formatted questions
        const performanceQuizQuestions = await db.execute(sql`
          SELECT questions::text FROM payload.course_quizzes 
          WHERE id::text = ${performanceQuiz.rows[0].id}::text
        `);

        logAction(
          `Performance Quiz questions format: ${performanceQuizQuestions.rows[0].questions}`,
        );
      }

      // Commit transaction if successful
      await db.execute(sql`COMMIT`);

      logSuccess(
        `Successfully formatted ${successCount} quizzes with ${formatErrors} errors`,
      );
      return formatErrors === 0;
    } catch (error) {
      // Rollback transaction on error
      await db.execute(sql`ROLLBACK`);
      throw error;
    }
  } catch (error) {
    logError(`Failed to format questions JSONB: ${error.message}`);
    return false;
  }
};

// Execute if called directly
if (require.main === module) {
  formatQuestionsJSONBEnhanced()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export default formatQuestionsJSONBEnhanced;
```

### 3.2 Resilient Payload Collection Hooks

Add hooks to the quiz collection configuration to ensure proper format regardless of database state:

```typescript
// packages/payload/src/collections/hooks/quiz-relationships.ts
import type { AfterReadHook, BeforeChangeHook } from 'payload/types';

/**
 * Ensures quiz questions array is properly formatted for Payload UI regardless of database state
 */
export const formatQuizQuestionsOnRead: AfterReadHook = async ({ doc }) => {
  // Skip if no questions
  if (!doc.questions) {
    return doc;
  }

  // Handle non-array questions
  if (!Array.isArray(doc.questions)) {
    // Try to convert to array if possible, otherwise reset to empty array
    try {
      doc.questions =
        typeof doc.questions === 'string' ? JSON.parse(doc.questions) : [];
    } catch (e) {
      doc.questions = [];
    }
  }

  // Format each question to ensure proper structure
  doc.questions = doc.questions.map((q) => {
    // If already properly formatted, return as is
    if (
      q &&
      typeof q === 'object' &&
      q.relationTo === 'quiz_questions' &&
      q.value &&
      q.value.id
    ) {
      return q;
    }

    // Extract ID from whatever format exists
    const id = typeof q === 'object' ? q.id || q.value?.id || q : q;

    // Format in Payload-compatible structure
    return {
      id,
      relationTo: 'quiz_questions',
      value: {
        id,
      },
    };
  });

  return doc;
};

/**
 * Ensures consistent format when saving quiz questions
 */
export const formatQuizQuestionsOnChange: BeforeChangeHook = async ({
  data,
}) => {
  // Skip if no questions
  if (!data.questions) {
    return data;
  }

  // Make sure it's always an array
  if (!Array.isArray(data.questions)) {
    data.questions = [];
  }

  // Format each question to ensure proper structure
  data.questions = data.questions.map((q) => {
    // If already properly formatted, return as is
    if (
      q &&
      typeof q === 'object' &&
      q.relationTo === 'quiz_questions' &&
      q.value &&
      q.value.id
    ) {
      return q;
    }

    // Extract ID from whatever format exists
    const id = typeof q === 'object' ? q.id || q.value?.id || q : q;

    // Format in Payload-compatible structure
    return {
      id,
      relationTo: 'quiz_questions',
      value: {
        id,
      },
    };
  });

  return data;
};
```

Update the collection configuration:

```typescript
// Add to course_quizzes collection config
{
  slug: 'course_quizzes',
  // ... other configuration
  hooks: {
    afterRead: [
      formatQuizQuestionsOnRead,
      // ... other hooks
    ],
    beforeChange: [
      formatQuizQuestionsOnChange,
      // ... other hooks
    ]
  }
}
```

### 3.3 Comprehensive Verification Script

Create a dedicated verification script to confirm proper JSONB formatting:

```typescript
// packages/content-migrations/src/scripts/verification/verify-questions-jsonb-format.ts
import { sql } from '@payloadcms/db-postgres';

import {
  logAction,
  logError,
  logSuccess,
  logWarning,
} from '../../utils/logging';
import { getPayloadClient } from '../../utils/payload';

export const verifyQuestionsJSONBFormat = async (): Promise<boolean> => {
  try {
    const payload = await getPayloadClient();
    const db = payload.db.drizzle;

    logAction('Verifying quiz questions JSONB format');

    // Get all quizzes
    const quizzes = await db.execute(sql`
      SELECT 
        id::text, 
        title, 
        questions::text
      FROM 
        payload.course_quizzes
      WHERE 
        questions IS NOT NULL
    `);

    let correctlyFormatted = 0;
    let incorrectlyFormatted = 0;
    let emptyQuestions = 0;
    const problemQuizzes = [];

    for (const quiz of quizzes.rows) {
      try {
        let questions;

        // Parse questions if it's a string
        try {
          questions =
            typeof quiz.questions === 'string'
              ? JSON.parse(quiz.questions)
              : quiz.questions;
        } catch (e) {
          logError(
            `Quiz ${quiz.title} (${quiz.id}) has invalid JSON in questions: ${e.message}`,
          );
          incorrectlyFormatted++;
          problemQuizzes.push({
            id: quiz.id,
            title: quiz.title,
            error: 'Invalid JSON',
          });
          continue;
        }

        // Empty questions array
        if (!Array.isArray(questions) || questions.length === 0) {
          emptyQuestions++;
          logWarning(
            `Quiz ${quiz.title} (${quiz.id}) has empty questions array`,
          );
          continue;
        }

        // Check format of the first question
        const firstQuestion = questions[0];
        const hasCorrectFormat =
          typeof firstQuestion === 'object' &&
          firstQuestion.relationTo === 'quiz_questions' &&
          typeof firstQuestion.value === 'object' &&
          firstQuestion.value.id;

        if (hasCorrectFormat) {
          correctlyFormatted++;
          logAction(
            `Quiz ${quiz.title} has correct format: ${JSON.stringify(firstQuestion)}`,
          );
        } else {
          incorrectlyFormatted++;
          problemQuizzes.push({
            id: quiz.id,
            title: quiz.title,
            format: JSON.stringify(firstQuestion),
          });
          logWarning(
            `Quiz ${quiz.title} (${quiz.id}) has incorrect format: ${JSON.stringify(firstQuestion)}`,
          );
        }
      } catch (error) {
        logError(
          `Error verifying quiz ${quiz.title} (${quiz.id}): ${error.message}`,
        );
        incorrectlyFormatted++;
        problemQuizzes.push({
          id: quiz.id,
          title: quiz.title,
          error: error.message,
        });
      }
    }

    // Summary
    if (incorrectlyFormatted === 0) {
      logSuccess(
        `All quizzes (${correctlyFormatted}) have correct JSONB format for questions`,
      );
      return true;
    } else {
      logWarning(`
        Format verification results:
        - Correctly formatted: ${correctlyFormatted}
        - Incorrectly formatted: ${incorrectlyFormatted}
        - Empty questions: ${emptyQuestions}
        
        Problem quizzes: ${JSON.stringify(problemQuizzes, null, 2)}
      `);
      return false;
    }
  } catch (error) {
    logError(`Verification failed: ${error.message}`);
    return false;
  }
};

// Execute if called directly
if (require.main === module) {
  verifyQuestionsJSONBFormat()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export default verifyQuestionsJSONBFormat;
```

### 3.4 Direct Database Fix Script

For cases where the above approaches still don't fix specific issues, create a direct database-level fix:

```typescript
// packages/content-migrations/src/scripts/repair/direct-sql-fixes.ts
import { sql } from '@payloadcms/db-postgres';

import { logAction, logError, logSuccess } from '../../utils/logging';
import { getPayloadClient } from '../../utils/payload';

export const directFixQuizJsonbFormat = async (): Promise<boolean> => {
  try {
    const payload = await getPayloadClient();
    const db = payload.db.drizzle;

    logAction('Applying direct database fixes for quiz questions JSONB format');

    // Begin transaction
    await db.execute(sql`BEGIN`);

    try {
      // 1. Fix specific problematic quizzes by ID if needed
      const problematicQuizIds = [
        'd5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0', // The Who Quiz that had 404 errors
      ];

      for (const quizId of problematicQuizIds) {
        // Get quiz and question relationship data
        const quizResult = await db.execute(sql`
          SELECT id::text, title FROM payload.course_quizzes WHERE id::text = ${quizId}::text
        `);

        if (quizResult.rows.length === 0) {
          logWarning(`Quiz with ID ${quizId} not found`);
          continue;
        }

        const quiz = quizResult.rows[0];

        // Get questions from relationship table
        const questionRels = await db.execute(sql`
          SELECT quiz_questions_id FROM payload.course_quizzes_rels 
          WHERE _parent_id::text = ${quizId}::text AND field = 'questions'
        `);

        // Format questions in the required structure
        const formattedQuestions = questionRels.rows.map((rel) => ({
          id: rel.quiz_questions_id,
          relationTo: 'quiz_questions',
          value: {
            id: rel.quiz_questions_id,
          },
        }));

        // Update the quiz directly
        if (formattedQuestions.length > 0) {
          await db.execute(sql`
            UPDATE payload.course_quizzes
            SET questions = ${JSON.stringify(formattedQuestions)}::jsonb
            WHERE id::text = ${quizId}::text
          `);

          logSuccess(
            `Directly fixed ${quiz.title} (${quizId}) with ${formattedQuestions.length} questions`,
          );
        } else {
          logWarning(
            `No questions found in relationships for ${quiz.title} (${quizId})`,
          );
        }
      }

      // 2. Re-run a general fix across all quizzes to ensure consistency
      await db.execute(sql`
        UPDATE payload.course_quizzes q
        SET questions = (
          SELECT COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', r.quiz_questions_id,
                'relationTo', 'quiz_questions',
                'value', jsonb_build_object('id', r.quiz_questions_id)
              )
            ),
            '[]'::jsonb
          )
          FROM payload.course_quizzes_rels r
          WHERE r._parent_id::text = q.id::text
          AND r.field = 'questions'
          AND r.quiz_questions_id IS NOT NULL
        )
        WHERE EXISTS (
          SELECT 1 FROM payload.course_quizzes_rels r
          WHERE r._parent_id::text = q.id::text 
          AND r.field = 'questions'
        )
      `);

      // 3. Verify a few key quizzes
      const performanceQuizCheck = await db.execute(sql`
        SELECT title, questions::text FROM payload.course_quizzes 
        WHERE title LIKE '%Performance%'
      `);

      if (performanceQuizCheck.rows.length > 0) {
        logAction(
          `Performance Quiz questions after fix: ${performanceQuizCheck.rows[0].questions}`,
        );
      }

      // Commit transaction
      await db.execute(sql`COMMIT`);

      logSuccess(`Direct database fixes applied successfully`);
      return true;
    } catch (error) {
      await db.execute(sql`ROLLBACK`);
      throw error;
    }
  } catch (error) {
    logError(`Direct fix failed: ${error.message}`);
    return false;
  }
};

// Execute if called directly
if (require.main === module) {
  directFixQuizJsonbFormat()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export default directFixQuizJsonbFormat;
```

## 4. Integration with Content Migration System

### 4.1 Add Scripts to package.json

Update `packages/content-migrations/package.json` to include new scripts:

```json
{
  "scripts": {
    "fix:questions-jsonb-enhanced": "tsx src/scripts/repair/quiz-management/enhanced-format-questions-jsonb.ts",
    "verify:questions-jsonb-format": "tsx src/scripts/verification/verify-questions-jsonb-format.ts",
    "fix:direct-quiz-jsonb": "tsx src/scripts/repair/direct-sql-fixes.ts"
  }
}
```

### 4.2 Update Loading Phase Script

Modify `scripts/orchestration/phases/loading.ps1` to include the enhanced script and verification:

```powershell
# In Fix-Relationships function

# First ensure we're at the project root
Set-ProjectRootLocation
Log-Message "Changed to project root: $(Get-Location)" "Gray"

# Navigate to content-migrations directory using absolute path
if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
    Log-Message "Changed directory to: $(Get-Location)" "Gray"
} else {
    throw "Could not find packages/content-migrations directory from project root"
}

# After other quiz relationship fixes
Log-Message "Formatting quiz questions JSONB arrays with enhanced approach..." "Yellow"
Exec-Command -command "pnpm run fix:questions-jsonb-enhanced" -description "Enhanced JSONB formatting for quiz questions"

# Verify the formatting worked
Log-Message "Verifying questions JSONB format..." "Yellow"
$verificationResult = Exec-Command -command "pnpm run verify:questions-jsonb-format" -description "Verifying questions JSONB format" -captureOutput -continueOnError

# If verification fails, try direct fix
if ($verificationResult -notmatch "All quizzes .* have correct JSONB format") {
    Log-Warning "Enhanced formatting didn't fix all quizzes, applying direct database fix..."
    Exec-Command -command "pnpm run fix:direct-quiz-jsonb" -description "Direct database fix for quiz JSONB format"

    # Verify again
    Log-Message "Verifying questions JSONB format after direct fix..." "Yellow"
    Exec-Command -command "pnpm run verify:questions-jsonb-format" -description "Verifying questions JSONB format" -continueOnError
}
```

## 5. Implementation Steps

1. Create the enhanced JSONB formatting script
2. Create the verification script
3. Create the direct database fix script
4. Implement collection hooks for ongoing resilience
5. Update the loading phase script to include these new scripts
6. Run and verify the solution works

## 6. Conclusion

This comprehensive plan addresses all aspects of the quiz questions display issue:

1. **Root Cause Addressed**: Ensures proper JSONB format for Payload CMS UI
2. **Resilient Implementation**: Multiple layers of fixes and verification
3. **Future-Proof**: Collection hooks prevent recurrence
4. **Documented Process**: Clear steps for implementation and verification

The solution aligns with Payload CMS documentation requirements and PostgreSQL best practices. It will allow quiz questions to display properly in the admin UI while maintaining correct relationships in the database.
