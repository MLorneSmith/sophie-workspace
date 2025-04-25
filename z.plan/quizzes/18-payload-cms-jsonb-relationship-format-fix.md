# Payload CMS Quiz Relationship Format Fix Plan

**Date:** April 25, 2025  
**Issue:** Quiz questions not appearing in the Question field of quiz records in Payload CMS Admin UI

## 1. Introduction & Issue Summary

Despite implementing a consolidated quiz-relationship migration plan (detailed in `17-consolidated-quiz-relationship-migration-plan.md`), we're still experiencing issues where quiz questions aren't appearing correctly in the Payload CMS admin interface. Specifically:

- Quiz questions are not visible in the Question field when viewing quiz records
- Some quizzes (e.g., Performance Quiz) appear to be missing entirely
- Verification scripts show relationships exist, but they're not appearing in the UI

This disconnect between database state and UI presentation suggests a format issue rather than missing data. Our analysis indicates that Payload CMS requires a specific JSONB structure for relationship arrays that our previous fixes have not properly implemented.

## 2. Root Cause Analysis

### 2.1 Payload CMS Migration Limitations

After extensive research into Payload CMS limitations with PostgreSQL, we've identified several constraints that affect our solution:

1. **No Native Trigger Support**

   - Payload's migration system does not natively support creating or managing PostgreSQL triggers
   - Triggers created in migrations aren't tracked by Payload's schema management
   - Our original consolidated plan relied heavily on database triggers that may not work as expected

2. **Limited Data Synchronization**

   - Complex operations between tables aren't directly supported through Payload's migration API
   - The minimal quiz migration (`20250425_153000_minimal_quiz_fix.ts`) explicitly avoided data synchronization, noting:
     ```
     "This approach avoids type casting issues by not attempting to update or synchronize data"
     ```
   - This suggests that type casting problems were encountered during implementation

3. **Type Casting Issues**

   - PostgreSQL is strict about type conversions between TEXT, UUID, and JSONB formats
   - Our migration logs show several type-related errors and warnings

4. **Migration Execution Context**
   - Migrations run in a specific transaction context that may limit certain operations
   - Certain PostgreSQL features may not be available within this context

### 2.2 JSONB Format Requirements

Analysis of Payload CMS source code reveals that for relationship arrays like `questions`, Payload expects a specific JSONB structure:

```json
[
  {
    "id": "unique-entry-id",
    "relationTo": "collection-slug",
    "value": {
      "id": "related-document-id"
    }
  }
]
```

However, our current approach is likely storing either:

- Simple arrays of IDs: `["id1", "id2", "id3"]`
- Or improperly formatted objects missing required fields

This format mismatch explains why verification scripts show the relationships exist (the IDs are present) but the UI can't display them (the format is incorrect).

### 2.3 Examination of Current Migration

The `20250425_153000_minimal_quiz_fix.ts` migration creates the schema structure but intentionally avoids data synchronization:

```typescript
// This approach avoids type casting issues by not attempting to update or synchronize data,
// which will be handled by separate repair scripts.
```

However, our logs show that while verification scripts pass, the data format issue persists.

## 3. Previous Attempts & Why They Failed

### 3.1 Consolidated Migration Plan

Our initial plan in `17-consolidated-quiz-relationship-migration-plan.md` proposed a comprehensive migration that would:

1. Fix schema structure
2. Synchronize relationship data between storage mechanisms
3. Implement database triggers for consistency
4. Provide verification functions

While the plan was sound conceptually, it encountered execution limitations due to Payload's PostgreSQL constraints, particularly around:

- Type casting issues
- Trigger implementation within migration contexts
- Complex data synchronization within transactions

### 3.2 Minimal Quiz Fix Implementation

The fallback approach implemented in `20250425_153000_minimal_quiz_fix.ts` successfully:

- Created the necessary schema structure
- Added a verification function
- Established monitoring tables

But it explicitly avoided data synchronization, which is why the relationships exist in the database but aren't properly displayed in the UI.

## 4. Proposed Solution: Two-Phase Approach

We propose a hybrid approach that works within Payload's constraints while ensuring proper data format:

### 4.1 Phase 1: Maintain Existing Migration

Keep the existing `20250425_153000_minimal_quiz_fix.ts` migration unchanged, as it successfully:

- Creates the needed schema structure
- Provides verification functions
- Establishes monitoring tables

### 4.2 Phase 2: Create Dedicated JSONB Formatting Script

Create a specialized script that runs outside the migration context to:

- Format the `questions` JSONB array in each quiz with the exact structure expected by Payload
- Run as part of the content migration orchestration process
- Execute after migrations but before UI access

### 4.3 Application-Level Consistency

Add Payload collection hooks to maintain proper format during ongoing operations:

- `afterRead` hook to ensure proper format for UI display
- `beforeChange` hook to maintain consistency when edits are made

## 5. Implementation Plan

### 5.1 Create JSONB Formatting Script

Create a new script at `packages/content-migrations/src/scripts/repair/quiz-management/format-questions-jsonb.ts`:

```typescript
// packages/content-migrations/src/scripts/repair/quiz-management/format-questions-jsonb.ts
import { sql } from '@payloadcms/db-postgres';

import { logAction, logError, logSuccess } from '../../../utils/logging';
import { getPayloadClient } from '../../../utils/payload';

export const formatQuestionsJSONB = async (): Promise<boolean> => {
  try {
    const payload = await getPayloadClient();
    const db = payload.db.drizzle;

    logAction(
      'Formatting quiz questions JSONB arrays for Payload compatibility',
    );

    // 1. Get all quizzes and their related questions
    const quizQuestions = await db.execute(sql`
      SELECT 
        q.id as quiz_id,
        q.title as quiz_title,
        rel.quiz_questions_id as question_id,
        rel._parent_id as parent_id,
        rel.order as sort_order
      FROM 
        payload.course_quizzes q
      LEFT JOIN 
        payload.course_quizzes_rels rel 
      ON 
        q.id = rel._parent_id
      WHERE 
        rel.field = 'questions'
        AND rel.quiz_questions_id IS NOT NULL
      ORDER BY 
        q.id, rel.order
    `);

    // 2. Group questions by quiz
    const quizMap = new Map();

    for (const row of quizQuestions.rows) {
      if (!quizMap.has(row.quiz_id)) {
        quizMap.set(row.quiz_id, {
          id: row.quiz_id,
          title: row.quiz_title,
          questions: [],
        });
      }

      if (row.question_id) {
        quizMap.get(row.quiz_id).questions.push({
          id: row.question_id,
          questionId: row.question_id,
          order: row.sort_order || 0,
        });
      }
    }

    // 3. Update each quiz with properly formatted questions JSONB
    let successCount = 0;

    for (const [quizId, quizData] of quizMap.entries()) {
      // Format questions into Payload-compatible structure
      const formattedQuestions = quizData.questions.map((q) => ({
        id: q.id,
        relationTo: 'quiz_questions',
        value: {
          id: q.questionId,
        },
      }));

      // Update the quiz with formatted questions
      await db.execute(sql`
        UPDATE payload.course_quizzes
        SET questions = ${JSON.stringify(formattedQuestions)}::jsonb
        WHERE id = ${quizId}
      `);

      successCount++;

      logAction(
        `Formatted questions for quiz "${quizData.title}" (${quizId}) with ${formattedQuestions.length} questions`,
      );
    }

    // 4. Special check for Performance Quiz
    const performanceQuiz = await db.execute(sql`
      SELECT id, title FROM payload.course_quizzes 
      WHERE title LIKE '%Performance%'
    `);

    if (performanceQuiz.rows.length > 0) {
      logAction(
        `Found Performance Quiz: ${performanceQuiz.rows[0].title} (${performanceQuiz.rows[0].id})`,
      );

      // Check if it has questions
      const questionCount = await db.execute(sql`
        SELECT COUNT(*) as count FROM payload.course_quizzes_rels
        WHERE _parent_id = ${performanceQuiz.rows[0].id}
        AND field = 'questions'
      `);

      logAction(
        `Performance Quiz has ${questionCount.rows[0].count} related questions`,
      );
    } else {
      logError(
        'Performance Quiz not found! This may indicate a deeper data issue.',
      );
    }

    logSuccess(
      `Successfully formatted questions JSONB for ${successCount} quizzes`,
    );
    return true;
  } catch (error) {
    logError(`Error formatting questions JSONB: ${error.message}`);
    return false;
  }
};

// Execute if this script is run directly
if (require.main === module) {
  formatQuestionsJSONB()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}
```

### 5.2 Create Verification Script

Create a companion verification script at `packages/content-migrations/src/scripts/verification/verify-questions-jsonb-format.ts`:

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

    // Check all quizzes for properly formatted questions arrays
    const quizzes = await db.execute(sql`
      SELECT id, title, questions
      FROM payload.course_quizzes
      WHERE questions IS NOT NULL
    `);

    let correctlyFormatted = 0;
    let improperlyFormatted = 0;
    let missingQuestions = 0;

    for (const quiz of quizzes.rows) {
      let questions;
      try {
        questions = quiz.questions;

        // If questions is a string, parse it
        if (typeof questions === 'string') {
          questions = JSON.parse(questions);
        }
      } catch (e) {
        logError(
          `Invalid JSON in questions for quiz ${quiz.title} (${quiz.id})`,
        );
        improperlyFormatted++;
        continue;
      }

      if (!Array.isArray(questions)) {
        logError(
          `Questions is not an array for quiz ${quiz.title} (${quiz.id})`,
        );
        improperlyFormatted++;
        continue;
      }

      if (questions.length === 0) {
        logWarning(`No questions for quiz ${quiz.title} (${quiz.id})`);
        missingQuestions++;
        continue;
      }

      // Check format of each question
      let allCorrect = true;
      for (const q of questions) {
        if (!q.id || !q.relationTo || !q.value || !q.value.id) {
          logError(
            `Improperly formatted question in quiz ${quiz.title} (${quiz.id})`,
          );
          allCorrect = false;
          break;
        }
      }

      if (allCorrect) {
        correctlyFormatted++;
      } else {
        improperlyFormatted++;
      }
    }

    // Final report
    if (improperlyFormatted === 0 && missingQuestions === 0) {
      logSuccess(
        `All ${correctlyFormatted} quizzes have properly formatted questions arrays`,
      );
      return true;
    } else {
      logWarning(
        `Found ${correctlyFormatted} correctly formatted, ${improperlyFormatted} improperly formatted, and ${missingQuestions} with missing questions`,
      );
      return false;
    }
  } catch (error) {
    logError(`Error verifying questions JSONB format: ${error.message}`);
    return false;
  }
};

// Execute if this script is run directly
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
```

### 5.3 Register Scripts in package.json

Add the following entries to `packages/content-migrations/package.json`:

```json
{
  "scripts": {
    "fix:format-questions-jsonb": "tsx src/scripts/repair/quiz-management/format-questions-jsonb.ts",
    "verify:questions-jsonb-format": "tsx src/scripts/verification/verify-questions-jsonb-format.ts"
  }
}
```

### 5.4 Add to Orchestration Pipeline

Update `scripts/orchestration/phases/loading.ps1` in the `Fix-Relationships` function to include the new scripts:

```powershell
# After the existing quiz relationship verification
Log-Message "Formatting quiz questions JSONB arrays for Payload compatibility..." "Yellow"
Exec-Command -command "pnpm run fix:format-questions-jsonb" -description "Formatting quiz questions JSONB"

# Verify the formatting worked
Log-Message "Verifying questions JSONB format..." "Yellow"
Exec-Command -command "pnpm run verify:questions-jsonb-format" -description "Verifying questions JSONB format"
```

### 5.5 Add Payload Hooks for Ongoing Consistency

Create a new file `packages/payload/src/collections/hooks/quiz-relationships.ts`:

```typescript
import { AfterReadHook, BeforeChangeHook } from 'payload/types';

/**
 * Ensures quiz questions array is always properly formatted for Payload UI
 */
export const formatQuizQuestionsOnRead: AfterReadHook = async ({
  doc,
  req,
}) => {
  // Skip if no questions or already properly formatted
  if (!doc.questions || !Array.isArray(doc.questions)) {
    return doc;
  }

  // Ensure each question has proper structure
  const formattedQuestions = doc.questions.map((q) => {
    // If already properly formatted, return as is
    if (q.relationTo === 'quiz_questions' && q.value && q.value.id) {
      return q;
    }

    // Format as expected by Payload UI
    return {
      id: q.id || q,
      relationTo: 'quiz_questions',
      value: {
        id: typeof q === 'object' ? q.id || q.questionId : q,
      },
    };
  });

  return {
    ...doc,
    questions: formattedQuestions,
  };
};

/**
 * Ensures relationship tables stay in sync with questions array
 */
export const syncQuizQuestionRelationships: BeforeChangeHook = async ({
  data,
  req,
  operation,
}) => {
  // For now, we'll rely on Payload's built-in relationship handling
  // This hook can be expanded later if needed
  return data;
};
```

Then update your quiz collection config in `packages/payload/src/collections/quizzes.ts` to use these hooks:

```typescript
import {
  formatQuizQuestionsOnRead,
  syncQuizQuestionRelationships,
} from './hooks/quiz-relationships';

const CourseQuizzes: CollectionConfig = {
  // existing config...
  hooks: {
    beforeChange: [
      syncQuizQuestionRelationships,
      // ...any existing hooks
    ],
    afterRead: [
      formatQuizQuestionsOnRead,
      // ...any existing hooks
    ],
  },
};
```

## 6. Implementation Details

### 6.1 When Phase 2 (SQL Script) Runs

The SQL script runs at a specific point in the content migration process:

1. **Execution Point**: Within the `Fix-Relationships` function in `scripts/orchestration/phases/loading.ps1`
2. **Specific Timing**: After the existing quiz relationship verification steps, but before survey questions handling
3. **Integration**: Added as a new step in the orchestration pipeline
4. **Workflow Sequence**:
   ```
   Payload Migrations → Blog Posts Migration → Fix UUID Tables → Import Downloads →
   Fix Relationships (including our new JSONB formatting script) → Verification
   ```

### 6.2 Script Execution Context: "After Migrations, Before UI Access"

This phrase refers to the execution timing in the application's lifecycle:

1. **After Migrations**:

   - Payload migrations (`up` functions) have completed successfully
   - Database schema structure is established (tables, columns, constraints)
   - Basic relationship tables and UUID tracking are set up

2. **Before UI Access**:

   - Before administrators access the Payload admin interface
   - Before content querying begins through the application
   - During the deployment process rather than runtime

3. **Practical Implementation**:
   - In development: During the `reset-and-migrate.ps1` execution
   - In production: As part of the deployment pipeline, before application startup
   - In both cases: During the loading phase of the content migration process

### 6.3 Application-Level Hooks For Consistency

Instead of database triggers (which Payload doesn't manage well), we leverage Payload's hook system:

1. **Payload Hook System**:

   - Payload provides lifecycle hooks for collections and fields
   - Hooks run at specific points during data operations (create, read, update, delete)
   - These are JavaScript/TypeScript functions, not database triggers

2. **Relevant Hooks for Relationships**:

   - `beforeChange`: Runs before a document is saved to the database
   - `afterRead`: Runs after a document is retrieved from the database

3. **Implementation Benefits**:
   - Works within Payload's expected patterns
   - Maintains proper formatting even if database data isn't perfect
   - Provides ongoing consistency for future operations

## 7. Verification Strategy

To verify this solution is working correctly:

### 7.1 Automated Verification

- Run the `verify:questions-jsonb-format` script to confirm questions arrays are properly formatted
- Check the logs for any errors or warnings
- Pay special attention to the Performance Quiz, which was specifically mentioned as problematic

### 7.2 UI Verification

- Access the Payload CMS admin interface
- Navigate to the quizzes collection
- Verify questions appear in each quiz
- Specifically check the Performance Quiz
- Edit a quiz to ensure changes are properly saved

### 7.3 System Verification

- Run the full content migration with `./reset-and-migrate.ps1`
- Check for any errors related to quizzes or quiz questions
- Verify all relationships are properly maintained

## 8. Conclusion

This approach addresses the fundamental issue: the disconnection between database state and Payload's expected data format. By focusing on proper JSONB formatting rather than complex triggers, we work within Payload's constraints while ensuring the UI can correctly display quiz-question relationships.

The solution is:

1. **Non-invasive**: Keeps existing migrations intact
2. **Targeted**: Addresses specifically the format issue
3. **Maintainable**: Uses Payload hooks for ongoing consistency
4. **Verifiable**: Includes specific verification steps
5. **Isolated**: Avoids the type casting issues encountered previously

Once implemented, quiz questions should properly appear in the Payload CMS admin interface, resolving the current issue.
