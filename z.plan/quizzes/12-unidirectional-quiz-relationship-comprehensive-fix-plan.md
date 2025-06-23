# Unidirectional Quiz Relationship Comprehensive Fix Plan

## Table of Contents

1. [Root Cause Analysis](#1-root-cause-analysis)
2. [Current System State](#2-current-system-state)
3. [Recommended Solution Approach](#3-recommended-solution-approach)
4. [Implementation Details](#4-implementation-details)
5. [Integration Strategy](#5-integration-strategy)
6. [Expected Outcomes](#6-expected-outcomes)

## 1. Root Cause Analysis

After extensive investigation into the ongoing quiz content and quiz question relationship issues, we've identified several interconnected root causes:

### 1.1 Relationship Architecture Mismatch

There's a fundamental architectural mismatch in how quiz relationships are modeled:

- **Current Implementation**: The code has transitioned to a unidirectional relationship model where quizzes reference questions via the `questions` field
- **Database Schema**: The `quiz_id` field was removed from `QuizQuestions` (explicitly noted in the comments: `// 'quiz_id' field removed - using unidirectional relationship model`)
- **Loading Code**: The quiz loading function still attempts to query questions using the removed `quiz_id` field

This architectural inconsistency creates a situation where:

1. Data is stored correctly in one direction (quizzes → questions)
2. But the loading code attempts to query in the opposite direction (questions → quizzes)

### 1.2 Dual-Storage Pattern Issues

Payload CMS uses a dual-storage approach for relationships that isn't being maintained consistently:

- **Direct Field Storage**: Values in main table columns (e.g., `questions` array in `course_quizzes`)
- **Relationship Tables**: Separate join tables (e.g., entries in `course_quizzes_rels` with `field = 'questions'`)

When one storage mechanism is updated without the other, Payload's internal hooks can reject or revert changes due to validation inconsistencies.

### 1.3 Database Query Issues and Type Handling

- **Missing Column Query**: The loader attempts to query `quiz_questions?where[quiz_id][equals]=${actualQuizId}` but `quiz_id` column does not exist
- **PostgreSQL UUID Type Handling**: Some code treats UUIDs as text strings without proper type casting:

  ```sql
  -- Problematic approach in existing code
  UPDATE payload.course_quizzes
  SET course_id_id = '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'
  -- Should be:
  SET course_id_id = '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'::uuid
  ```

### 1.4 Migration Sequence Dependencies

The migration scripts run in a specific order that sometimes allows later migrations to overwrite earlier fixes. Specifically:

1. Quiz ID consistency fixes run first
2. Direct quiz fixes run next
3. But then more specific relationship fixes run after these

This sequence can lead to inconsistent states if each script doesn't completely handle all aspects of relationship integrity.

## 2. Current System State

### 2.1 Database Findings

- All quiz records exist in the database with appropriate `course_id_id` values
- All lessons correctly reference quizzes through `quiz_id_id` fields
- The `course_quizzes_rels` table contains entries for quiz-question relationships
- The `quiz_id` column has been intentionally removed from the `quiz_questions` table
- Multiple quizzes have questions associated via the relationship table but aren't loading properly

### 2.2 Loading Code Analysis

The critical issue in the loading code is in the `getQuiz()` function:

```typescript
// In packages/cms/payload/src/api/course.ts
export async function getQuiz(
  quizId: string | { value: string; relationTo?: string } | any,
  options = {},
  supabaseClient?: any,
) {
  // ...extraction of actualQuizId...

  try {
    // Get the quiz metadata
    const quiz = await callPayloadAPI(
      `course_quizzes/${actualQuizId}`,
      {},
      supabaseClient,
    );

    // ...

    try {
      // THIS QUERY FAILS - quiz_id column doesn't exist
      const questionsResponse = await callPayloadAPI(
        `quiz_questions?where[quiz_id][equals]=${actualQuizId}&sort=order&depth=0`,
        {},
        supabaseClient,
      );

      // ...
    } catch (error) {
      // Returns quiz without questions if error occurs
      return {
        ...quiz,
        questions: [],
      };
    }
  } catch (error) {
    // ...
  }
}
```

The query is looking for a `quiz_id` column that has been intentionally removed, causing all question queries to fail.

### 2.3 Affected Quizzes

Multiple quizzes are missing content, as evidenced by the log:

```
The Who Quiz
The Why (Next Steps) Quiz
What is Structure? Quiz
Using Stories Quiz
Storyboards in Film Quiz
Storyboards in Presentations Quiz
Visual Perception and Communication Quiz
Overview of the Fundamental Elements of Design Quiz
Slide Composition Quiz
Tables vs Graphs Quiz
Standard Graphs Quiz
Specialist Graphs Quiz
Preparation and Practice Quiz
Performance Quiz
```

All of these quizzes exist in the database with valid IDs, but their questions aren't being loaded.

## 3. Recommended Solution Approach

After evaluating the situation, we recommend **fully committing to a unidirectional relationship model**. This approach:

1. Aligns with the current database schema design (removal of `quiz_id` column)
2. Provides clearer relationship management
3. Simplifies query patterns and data integrity checks

### 3.1 Two Key Components of the Solution

#### 3.1.1 Fix the Loading Code

Update the `getQuiz` function to use the correct relationship direction:

```typescript
// Instead of querying questions by quiz_id (which doesn't exist)
const questionsResponse = await callPayloadAPI(
  `quiz_questions?where[quiz_id][equals]=${actualQuizId}&sort=order&depth=0`,
  {},
  supabaseClient,
);

// Retrieve the quiz with its questions directly
const quizWithQuestions = await callPayloadAPI(
  `course_quizzes/${actualQuizId}?depth=1`,
  {},
  supabaseClient,
);

// Load the full question details if needed
if (quizWithQuestions.questions && quizWithQuestions.questions.length > 0) {
  const questionIds = quizWithQuestions.questions.map((q) => q.id || q);
  // Build a query for all question IDs
  const questionIdsQuery = questionIds.map((id) => `id=${id}`).join('&');
  const questionsResponse = await callPayloadAPI(
    `quiz_questions?where[${questionIdsQuery}]&sort=order`,
    {},
    supabaseClient,
  );
}
```

#### 3.1.2 Create a Comprehensive Migration Script

Develop a single, comprehensive script that:

1. Loads all quizzes and their existing question relationships
2. For each quiz, retrieves its questions from the `course_quizzes_rels` table
3. Ensures the questions array in the `course_quizzes` table is populated
4. Updates both the direct field and relationship table entries
5. Verifies the integrity of the fixes

## 4. Implementation Details

### 4.1 Comprehensive Migration Script

The script will be placed in:

```
packages/content-migrations/src/scripts/repair/quiz-management/core/fix-unidirectional-quiz-questions.ts
```

The core logic of the script:

```typescript
// fix-unidirectional-quiz-questions.ts
import { Client } from 'pg';

/**
 * Comprehensive fix for quiz-question relationships in a unidirectional model
 *
 * This script ensures:
 * 1. All quizzes have their questions properly referenced in the questions array
 * 2. All quiz-question relationships are properly recorded in course_quizzes_rels
 * 3. All quiz objects in course_quizzes have consistent data
 */
export async function fixUnidirectionalQuizQuestions(): Promise<void> {
  console.log(
    'Starting comprehensive unidirectional quiz-question relationship fix...',
  );

  const client = new Client({
    connectionString:
      process.env.DATABASE_URI ||
      'postgresql://postgres:postgres@localhost:54322/postgres',
  });

  try {
    await client.connect();
    await client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');

    // 1. Get all quizzes
    const quizzes = await client.query(`
      SELECT id, title, slug, questions 
      FROM payload.course_quizzes 
      ORDER BY title
    `);

    console.log(`Found ${quizzes.rowCount} quizzes to process`);

    for (const quiz of quizzes.rows) {
      console.log(`Processing quiz: ${quiz.title} (${quiz.id})`);

      // 2. Get existing question relationships from course_quizzes_rels table
      const relationshipRecords = await client.query(
        `
        SELECT value as question_id, quiz_questions_id 
        FROM payload.course_quizzes_rels 
        WHERE _parent_id = $1 AND field = 'questions'
      `,
        [quiz.id],
      );

      const questionIds = relationshipRecords.rows.map(
        (row) => row.question_id,
      );
      console.log(
        `  Found ${questionIds.length} question relationships in relationship table`,
      );

      if (questionIds.length === 0) {
        console.log(`  No questions found for quiz ${quiz.title}, skipping...`);
        continue;
      }

      // 3. Update the questions array in the course_quizzes table
      await client.query(
        `
        UPDATE payload.course_quizzes
        SET questions = $1::uuid[]
        WHERE id = $2
      `,
        [questionIds, quiz.id],
      );

      console.log(
        `  Updated questions array in course_quizzes table for ${quiz.title}`,
      );

      // 4. Ensure all questions have relationship entries in course_quizzes_rels
      for (const questionId of questionIds) {
        // Check if relationship already exists
        const existingRel = await client.query(
          `
          SELECT id FROM payload.course_quizzes_rels
          WHERE _parent_id = $1 AND field = 'questions' AND value = $2
        `,
          [quiz.id, questionId],
        );

        if (existingRel.rowCount === 0) {
          // Create the relationship
          await client.query(
            `
            INSERT INTO payload.course_quizzes_rels
            (id, _parent_id, field, value, quiz_questions_id, created_at, updated_at)
            VALUES (gen_random_uuid()::uuid, $1::uuid, 'questions', $2::uuid, $2::uuid, NOW(), NOW())
          `,
            [quiz.id, questionId],
          );

          console.log(
            `  Created missing relationship for question ${questionId}`,
          );
        }
      }

      // 5. Ensure quiz questions are properly sorted by order field
      await client.query(
        `
        UPDATE payload.quiz_questions
        SET "order" = subquery.row_number
        FROM (
          SELECT id, ROW_NUMBER() OVER (ORDER BY "order", created_at) as row_number
          FROM payload.quiz_questions
          WHERE id = ANY($1::uuid[])
        ) as subquery
        WHERE payload.quiz_questions.id = subquery.id
      `,
        [questionIds],
      );

      console.log(
        `  Updated order field for all questions in quiz ${quiz.title}`,
      );
    }

    // 6. Verify the fix was successful
    const verificationResult = await client.query(`
      SELECT 
        cq.id as quiz_id, 
        cq.title as quiz_title,
        COALESCE(ARRAY_LENGTH(cq.questions, 1), 0) as questions_array_length,
        (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE _parent_id = cq.id AND field = 'questions') as rel_count
      FROM payload.course_quizzes cq
      ORDER BY cq.title
    `);

    console.log('\nVerification results:');
    verificationResult.rows.forEach((row) => {
      console.log(
        `Quiz "${row.quiz_title}": ${row.questions_array_length} in array, ${row.rel_count} in relationships`,
      );

      if (row.questions_array_length !== row.rel_count) {
        console.warn(`  ⚠️ Mismatch detected for quiz "${row.quiz_title}"`);
      }
    });

    // 7. Commit all changes in a single transaction
    await client.query('COMMIT');
    console.log(
      'Successfully fixed unidirectional quiz-question relationships',
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(
      'Error fixing unidirectional quiz-question relationships:',
      error,
    );
    throw error;
  } finally {
    await client.end();
  }
}

// Run the function if called directly
if (require.main === module) {
  fixUnidirectionalQuizQuestions()
    .then(() => console.log('Complete'))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
```

### 4.2 Loading Code Fix

Create a fix for the `getQuiz` function in `packages/cms/payload/src/api/course.ts`:

```typescript
export async function getQuiz(
  quizId: string | { value: string; relationTo?: string } | any,
  options = {},
  supabaseClient?: any,
) {
  if (!quizId) {
    console.error('getQuiz called with empty quizId');
    throw new Error('Quiz ID is required');
  }

  // Extract actualQuizId logic remains the same...

  try {
    // Get the quiz WITH its questions using depth parameter
    // This utilizes the unidirectional relationship
    const quiz = await callPayloadAPI(
      `course_quizzes/${actualQuizId}?depth=1`,
      {},
      supabaseClient,
    );

    if (!quiz || !quiz.id) {
      console.error(`getQuiz: Quiz not found for ID: ${actualQuizId}`);
      throw new Error(`Quiz not found for ID: ${actualQuizId}`);
    }

    console.log(`getQuiz: Successfully fetched quiz: ${quiz.title}`);

    // Check if we have the questions from the depth=1 query
    if (
      !quiz.questions ||
      !Array.isArray(quiz.questions) ||
      quiz.questions.length === 0
    ) {
      console.log(`Quiz has no questions: ${quiz.title}`);
      return {
        ...quiz,
        questions: [],
      };
    }

    // If we have question IDs but need the full details, fetch them
    // This handles the case where questions are just IDs and not full objects
    if (typeof quiz.questions[0] === 'string' || !quiz.questions[0].options) {
      try {
        // Get the question IDs
        const questionIds = quiz.questions.map((q) =>
          typeof q === 'string' ? q : q.id || q.value || q,
        );

        // Get full question details using their IDs
        const idQueryParams = questionIds.map((id) => `id[]=${id}`).join('&');
        const questionsResponse = await callPayloadAPI(
          `quiz_questions?${idQueryParams}&sort=order`,
          {},
          supabaseClient,
        );

        console.log(
          `getQuiz: Fetched ${questionsResponse.docs?.length || 0} detailed questions for quiz`,
        );

        // Replace the questions array with the full details
        return {
          ...quiz,
          questions: questionsResponse.docs || [],
        };
      } catch (error) {
        console.error(
          `getQuiz: Error fetching detailed questions for quiz ${actualQuizId}:`,
          error,
        );
        // Return what we have even if we couldn't get full details
        return quiz;
      }
    }

    // If we already have the full question objects, return as is
    return quiz;
  } catch (error) {
    console.error(`getQuiz: Error fetching quiz ${actualQuizId}:`, error);
    throw error;
  }
}
```

## 5. Integration Strategy

### 5.1 Scripts to Replace

This comprehensive script would replace:

1. **`fix-quiz-question-relationships.ts`**

   - Primary script being replaced, as our new script handles all quiz-question relationship functionality

2. **`fix-questions-quiz-references.ts`**

   - Current script attempts bidirectional references, which conflicts with unidirectional model

3. **`fix-quizzes-without-questions.ts`**
   - New script handles this as part of its comprehensive relationship management

### 5.2 Scripts to Complement (Not Replace)

1. **`fix-quiz-course-ids.ts`**

   - Handles relationship between quizzes and courses (separate concern)

2. **`fix-lesson-quiz-references.ts`**

   - Handles relationship between lessons and quizzes (different relationship type)

3. **`fix-quiz-id-consistency.ts`**
   - Ensures IDs are consistent across tables (still valuable)

### 5.3 Integration with Reset and Migrate Process

Update `package.json`:

```json
{
  "scripts": {
    "fix:unidirectional-quiz-questions": "tsx src/scripts/repair/quiz-management/core/fix-unidirectional-quiz-questions.ts",
    "fix:quiz-question-relationships": "echo 'DEPRECATED: Use fix:unidirectional-quiz-questions instead' && exit 0",
    "fix:questions-quiz-references": "echo 'DEPRECATED: Use fix:unidirectional-quiz-questions instead' && exit 0",
    "fix:quizzes-without-questions": "echo 'DEPRECATED: Use fix:unidirectional-quiz-questions instead' && exit 0"
  }
}
```

Update PowerShell script execution in `loading.ps1`:

```powershell
# Current execution in loading.ps1:
Exec-Command -command "pnpm run fix:quiz-id-consistency" -description "Fixing quiz ID consistency"
Exec-Command -command "pnpm run fix:direct-quiz-fix" -description "Fixing all quiz relationships"
Exec-Command -command "pnpm run fix:invalid-quiz-references" -description "Fixing invalid quiz references"
Exec-Command -command "pnpm run fix:quiz-question-relationships" -description "Fixing all question-quiz relationships"

# Proposed new execution:
Exec-Command -command "pnpm run fix:quiz-course-ids" -description "Fixing quiz course IDs"
Exec-Command -command "pnpm run fix:unidirectional-quiz-questions" -description "Ensuring unidirectional quiz-question relationships"
# (Skip redundant scripts)
Exec-Command -command "pnpm run fix:lesson-quiz-relationships-comprehensive" -description "Fixing all lesson-quiz relationships"
```

### 5.4 Documentation Updates

Update the README.md in the quiz-management directory:

````markdown
# Quiz Management Scripts

## Relationship Architecture

The quiz system now uses a **unidirectional relationship model**:

- Quizzes reference questions (parent → children)
- Questions do not reference quizzes (no back-reference)
- Relationships stored in both:
  - Quiz's `questions` array field
  - `course_quizzes_rels` table entries

## Core Scripts

- **`fix-unidirectional-quiz-questions.ts`**: Comprehensive fix ensuring all quiz-question relationships follow the unidirectional model
- **`fix-quiz-course-ids.ts`**: Ensures all quizzes have proper course IDs

## Deprecated Scripts (Replaced by fix-unidirectional-quiz-questions.ts)

- ~~`fix-quiz-question-relationships.ts`~~
- ~~`fix-questions-quiz-references.ts`~~
- ~~`fix-quizzes-without-questions.ts`~~

## Usage

```bash
# Run the comprehensive unidirectional relationship fix
pnpm run fix:unidirectional-quiz-questions
```
````

```

## 6. Expected Outcomes

After implementing this solution:

1. **All quizzes will be properly populated** with their questions
2. **Loading code will correctly retrieve** quiz questions
3. **Database relationship integrity** will be maintained
4. **Simplification of codebase** by removing redundant/conflicting scripts
5. **Clear architectural direction** toward unidirectional relationship model

This comprehensive approach fixes the immediate issues while also providing a clear path forward for maintaining these relationships.
```
