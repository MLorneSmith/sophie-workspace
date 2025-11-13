# Quiz References Fix Implementation Plan

## 1. Issue Analysis

### Current Problem

Several lesson pages in our course are experiencing issues with quiz references:

- The "Take Quiz" button is not appearing on these lesson pages
- The system is generating 404 errors when trying to fetch quiz data
- The affected lessons have quiz_id values that point to non-existent quizzes
- The logs show specific errors like: `Error: Failed to call Payload API (course_quizzes/d5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0): 404 Not Found`

Affected lessons include:

- 202 The Who
- 204: The Why: Next Steps
- 302: What is Structure?
- 401: Using Stories
- 402: Storyboards in Film
- 403: Storyboards in Presentations
- And others...

### Root Cause

The root cause is a **referential integrity failure** between the course_lessons and course_quizzes tables. Specifically:

1. The `quiz_id` column in the `course_lessons` table contains UUIDs that don't exist in the `course_quizzes` table
2. These invalid references are preserved during content migrations rather than being cleaned up
3. No database-level constraints enforce referential integrity
4. The error handling in the UI doesn't gracefully handle missing quizzes

This issue likely arose during content migrations, where quiz records were either never created, created with different IDs than what the lessons reference, or deleted after the lessons were linked to them.

## 2. Solution Approach

We'll implement a solution with these key components:

### A. Direct Fix Using Explicit Mappings

Rather than using fuzzy logic, we'll use a predefined mapping of lesson slugs to quiz slugs to ensure the right connections:

```typescript
const LESSON_QUIZ_MAPPINGS = [
  { lessonSlug: 'the-who', quizSlug: 'the-who-quiz' },
  { lessonSlug: 'the-why-next-steps', quizSlug: 'why-next-steps-quiz' },
  // other mappings...
];
```

This explicit mapping approach:

- Eliminates guesswork
- Makes changes transparent
- Ensures only correct connections are made

### B. Database Constraint for Future Integrity

We'll add a foreign key constraint to prevent this issue from recurring:

```sql
ALTER TABLE payload.course_lessons
ADD CONSTRAINT fk_quiz_id
FOREIGN KEY (quiz_id)
REFERENCES payload.course_quizzes(id)
ON DELETE SET NULL;
```

This ensures:

- No lesson can reference a non-existent quiz
- If a quiz is deleted, the reference becomes NULL rather than dangling
- The database enforces this rule automatically

### C. Enhanced Error Handling

We'll improve the error handling in the UI component to better handle missing quizzes:

```typescript
try {
  quiz = await getQuiz(quizId);
  console.log(`Successfully loaded quiz: ${quiz.title}`);
} catch (error) {
  console.error(`Error fetching quiz with ID ${quizId}: ${error.message}`);
  // quiz remains null, which is handled by the view component
}
```

## 3. Implementation Plan

### Step 1: Create Quiz Reference Fix Script

Create a new script at `packages/content-migrations/src/scripts/repair/fix-quiz-references.ts`:

```typescript
// packages/content-migrations/src/scripts/repair/fix-quiz-references.ts
import { Client } from 'pg';

// Explicit mapping of lesson slugs to quiz slugs
const LESSON_QUIZ_MAPPINGS = [
  { lessonSlug: 'the-who', quizSlug: 'the-who-quiz' },
  { lessonSlug: 'our-process', quizSlug: 'our-process-quiz' },
  { lessonSlug: 'the-why-next-steps', quizSlug: 'why-next-steps-quiz' },
  { lessonSlug: 'what-is-structure', quizSlug: 'structure-quiz' },
  { lessonSlug: 'using-stories', quizSlug: 'using-stories-quiz' },
  { lessonSlug: 'storyboards-in-film', quizSlug: 'storyboards-in-film-quiz' },
  {
    lessonSlug: 'storyboards-in-presentations',
    quizSlug: 'storyboards-in-presentations-quiz',
  },
  {
    lessonSlug: 'visual-perception-and-communication',
    quizSlug: 'visual-perception-quiz',
  },
  {
    lessonSlug: 'overview-of-the-fundamental-elements-of-design',
    quizSlug: 'overview-elements-of-design-quiz',
  },
  { lessonSlug: 'slide-composition', quizSlug: 'slide-composition-quiz' },
  { lessonSlug: 'tables-vs-graphs', quizSlug: 'tables-vs-graphs-quiz' },
  { lessonSlug: 'specialist-graphs', quizSlug: 'specialist-graphs-quiz' },
  {
    lessonSlug: 'preparation-and-practice',
    quizSlug: 'preparation-practice-quiz',
  },
  { lessonSlug: 'performance', quizSlug: 'performance-quiz' },
  // Add all mappings here based on actual data
];

export async function fixQuizReferences(): Promise<void> {
  console.log('Fixing quiz references using explicit mappings...');

  const client = new Client({
    connectionString:
      process.env.DATABASE_URI ||
      'postgresql://postgres:postgres@localhost:54322/postgres',
  });

  try {
    await client.connect();
    await client.query('BEGIN');

    console.log('Processing mappings...');

    // Count of fixed and already correct references
    let fixedCount = 0;
    let alreadyCorrectCount = 0;
    let skippedCount = 0;

    // Process each mapping
    for (const mapping of LESSON_QUIZ_MAPPINGS) {
      // 1. Get the lesson by slug
      const { rows: lessons } = await client.query(
        `
        SELECT id, title, quiz_id FROM payload.course_lessons 
        WHERE slug = $1
      `,
        [mapping.lessonSlug],
      );

      if (lessons.length === 0) {
        console.log(
          `⚠️ Lesson with slug "${mapping.lessonSlug}" not found, skipping`,
        );
        skippedCount++;
        continue;
      }

      const lesson = lessons[0];

      // 2. Get the quiz by slug
      const { rows: quizzes } = await client.query(
        `
        SELECT id, title FROM payload.course_quizzes 
        WHERE slug = $1
      `,
        [mapping.quizSlug],
      );

      if (quizzes.length === 0) {
        console.log(
          `⚠️ Quiz with slug "${mapping.quizSlug}" not found for lesson "${lesson.title}"`,
        );
        console.log(
          `   Clearing invalid quiz reference for lesson "${lesson.title}"`,
        );

        // Clear the invalid reference
        await client.query(
          `
          UPDATE payload.course_lessons
          SET quiz_id = NULL
          WHERE id = $1
        `,
          [lesson.id],
        );

        fixedCount++;
        continue;
      }

      const quiz = quizzes[0];

      // 3. Check if the lesson already has the correct quiz reference
      if (lesson.quiz_id === quiz.id) {
        console.log(
          `✓ Lesson "${lesson.title}" already correctly references quiz "${quiz.title}"`,
        );
        alreadyCorrectCount++;
        continue;
      }

      // 4. Update the lesson's quiz reference
      await client.query(
        `
        UPDATE payload.course_lessons
        SET quiz_id = $1
        WHERE id = $2
      `,
        [quiz.id, lesson.id],
      );

      console.log(
        `✓ Updated lesson "${lesson.title}" to reference quiz "${quiz.title}"`,
      );
      fixedCount++;
    }

    console.log('');
    console.log('Summary:');
    console.log(`- Fixed: ${fixedCount} references`);
    console.log(`- Already correct: ${alreadyCorrectCount} references`);
    console.log(`- Skipped: ${skippedCount} mappings (lesson not found)`);

    await client.query('COMMIT');
    console.log('Successfully fixed quiz references');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fixing quiz references:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  fixQuizReferences()
    .then(() => console.log('Complete'))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
```

### Step 2: Add Database Constraint Migration

Create a new migration script at `packages/content-migrations/src/scripts/repair/add-quiz-reference-constraint.ts`:

```typescript
import { Client } from 'pg';

export async function addQuizReferenceConstraint(): Promise<void> {
  console.log('Adding foreign key constraint for lesson quiz references...');

  const client = new Client({
    connectionString:
      process.env.DATABASE_URI ||
      'postgresql://postgres:postgres@localhost:54322/postgres',
  });

  try {
    await client.connect();
    await client.query('BEGIN');

    // First, ensure all quiz references are valid
    const { rows: invalidReferences } = await client.query(`
      SELECT l.id, l.title, l.quiz_id
      FROM payload.course_lessons l
      LEFT JOIN payload.course_quizzes q ON l.quiz_id = q.id
      WHERE l.quiz_id IS NOT NULL AND q.id IS NULL
    `);

    if (invalidReferences.length > 0) {
      console.log(
        `Found ${invalidReferences.length} invalid quiz references, nullifying them before adding constraint:`,
      );

      for (const lesson of invalidReferences) {
        console.log(
          `- Nullifying quiz_id for lesson "${lesson.title}" (${lesson.id})`,
        );

        await client.query(
          `
          UPDATE payload.course_lessons
          SET quiz_id = NULL
          WHERE id = $1
        `,
          [lesson.id],
        );
      }
    } else {
      console.log(
        'No invalid quiz references found, proceeding with constraint',
      );
    }

    // Add the foreign key constraint
    await client.query(`
      ALTER TABLE payload.course_lessons
      DROP CONSTRAINT IF EXISTS fk_quiz_id;
      
      ALTER TABLE payload.course_lessons
      ADD CONSTRAINT fk_quiz_id
      FOREIGN KEY (quiz_id)
      REFERENCES payload.course_quizzes(id)
      ON DELETE SET NULL;
    `);

    console.log('Successfully added foreign key constraint on quiz_id');

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding quiz reference constraint:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  addQuizReferenceConstraint()
    .then(() => console.log('Complete'))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
```

### Step 3: Enhance LessonDataProvider Error Handling

Update `apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonDataProvider.tsx`:

```typescript
// Improved error handling for quiz retrieval
if (quizId) {
  try {
    // Get quiz data
    const { getQuiz } = await import('@kit/cms/payload');

    try {
      // Extract the actual quiz ID to avoid [object Object] issues in error messages
      const quizIdStr =
        typeof quizId === 'object'
          ? quizId?.id || quizId?.value || JSON.stringify(quizId)
          : String(quizId || '');

      // Skip empty or clearly invalid quiz IDs
      if (
        !quizIdStr ||
        quizIdStr === '{}' ||
        quizIdStr === 'null' ||
        quizIdStr === 'undefined'
      ) {
        console.log(`Skipping invalid quiz ID format: ${quizIdStr}`);
        // Continue without the quiz data
      } else {
        try {
          // Add debug logging
          console.log(`Attempting to fetch quiz: ${quizIdStr}`);
          quiz = await getQuiz(quizId);
          console.log(`getQuiz: Successfully fetched quiz: ${quiz.title}`);
        } catch (error) {
          // Log the error with context but continue without the quiz data
          console.error(
            `getQuiz: Error fetching quiz ${quizIdStr}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          // Continue without the quiz data - no placeholder quizzes
        }
      }

      // Get user's quiz attempts for this quiz (even if quiz fetch failed)
      // Existing code unchanged...
    } catch (error) {
      // Continue without quiz data
    }
  } catch (error) {
    // Continue without quiz data
  }
}
```

### Step 4: Integrate with Content Migration System

Update the PowerShell orchestration scripts to include the new repair scripts:

1. Add the scripts to package.json:

```json
{
  "scripts": {
    "repair:quiz-references": "tsx src/scripts/repair/fix-quiz-references.ts",
    "repair:add-quiz-constraint": "tsx src/scripts/repair/add-quiz-reference-constraint.ts"
  }
}
```

2. Add to the orchestration script (in `scripts/orchestration/phases/loading.ps1`):

```powershell
function Fix-Relationships {
  param (
    [bool]$continueOnError = $true
  )

  Log-Message "Fixing quiz references..." "Yellow"
  Exec-Command -command "pnpm --filter @kit/content-migrations run repair:quiz-references" -description "Fixing quiz references" -continueOnError $continueOnError

  Log-Message "Adding quiz reference constraint..." "Yellow"
  Exec-Command -command "pnpm --filter @kit/content-migrations run repair:add-quiz-constraint" -description "Adding quiz reference constraint" -continueOnError $continueOnError

  # ... other relationship fixes
}
```

## 4. Testing and Verification

After implementing the solutions, perform these verification steps:

### A. Database Verification

1. Verify all quiz references are valid:

```sql
SELECT COUNT(*)
FROM payload.course_lessons l
LEFT JOIN payload.course_quizzes q ON l.quiz_id = q.id
WHERE l.quiz_id IS NOT NULL AND q.id IS NULL;
```

This should return 0 rows after the fix.

2. Verify the foreign key constraint exists:

```sql
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'course_lessons'
  AND kcu.column_name = 'quiz_id';
```

### B. UI Verification

1. Verify the affected lesson pages now correctly show or hide the "Take Quiz" button:

   - Visit each previously problematic lesson
   - Confirm the quiz button appears for lessons that should have a quiz
   - Verify no errors appear in the console logs

2. Test quiz functionality:
   - Take a quiz that was previously broken
   - Complete the quiz and verify the lesson marks as completed

## 5. Long-Term Improvements

To further simplify the system and prevent similar issues:

### A. Switch to Slug-Based Content Management

For future migrations, consider using slugs as the primary identifier for content relationships:

```typescript
// Example of slug-based migration
async function migrateContentBySlug(client: Client) {
  // Create quizzes
  await client.query(`
    INSERT INTO payload.course_quizzes (title, slug, description)
    VALUES 
      ('Our Process Quiz', 'our-process-quiz', 'Quiz for Our Process'),
      ('The Who Quiz', 'the-who-quiz', 'Quiz for The Who')
    ON CONFLICT (slug) DO UPDATE 
    SET title = EXCLUDED.title, description = EXCLUDED.description
  `);

  // Create lessons with quiz references by slug
  await client.query(`
    UPDATE payload.course_lessons AS l
    SET quiz_id = q.id
    FROM payload.course_quizzes AS q
    WHERE 
      (l.slug = 'our-process' AND q.slug = 'our-process-quiz') OR
      (l.slug = 'the-who' AND q.slug = 'the-who-quiz')
  `);
}
```

### B. Add Data Validation to Migration Process

Create a validation step that runs before and after migrations:

```typescript
async function validateContentRelationships() {
  // Verify all relationships are valid
  // Log any issues
  // Optionally halt migration if issues are found
}
```

### C. Document Content Relationships

Create a clear mapping document that shows all content relationships:

```yaml
# content-relationships.yaml
lessons:
  - slug: our-process
    quiz: our-process-quiz
    downloads:
      - slide-templates
      - our-process-slides

  - slug: the-who
    quiz: the-who-quiz
    downloads:
      - the-who-slides
```

This provides a single source of truth for content relationships.

## 6. Implementation Considerations

- **Minimal Changes**: This approach fixes the issues with minimal changes to the existing system
- **Database Safety**: All updates run within transactions to prevent partial updates
- **Idempotence**: Scripts can be run multiple times safely
- **Explicit Control**: Explicit mappings prevent unintended changes
- **Long-term Solution**: The foreign key constraint prevents future issues

By implementing this plan, we'll resolve the current issues while adding safeguards to prevent similar problems in the future. The enhanced error handling will also provide a better user experience if any issues do occur.
