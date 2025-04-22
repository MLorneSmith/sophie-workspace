# Quiz Relationship Fix Implementation Plan

## 1. Issue Analysis

### Current Problems

Our investigation has identified several issues affecting quiz functionality:

1. **Empty Quizzes Without Content**:

   - Multiple quizzes are not displaying content on lesson pages
   - The following quizzes are empty in the Payload admin interface:
     - The Who Quiz
     - The Why (Next Steps) Quiz
     - What is Structure? Quiz
     - Using Stories Quiz
     - Storyboards in Film Quiz
     - Storyboards in Presentations Quiz
     - Visual Perception and Communication Quiz
     - Overview of the Fundamental Elements of Design Quiz
     - Slide Composition Quiz
     - Tables vs Graphs Quiz
     - Specialist Graphs Quiz
     - Preparation and Practice Quiz
     - Performance Quiz

2. **Missing Course IDs**:

   - All quizzes have `course_id_id = null` in the database
   - This breaks proper course navigation and relationship mapping
   - The schema defines `course_id` as required, but this isn't enforced

3. **Relationship Structure Problems**:
   - Quiz questions are correctly associated with quizzes via `quiz_id`
   - However, quizzes do not properly link back to their questions
   - The bidirectional relationship between quizzes and questions is broken
   - This prevents proper population of questions when rendering quizzes

### Root Causes

After analyzing the database schema and existing repair scripts, we've determined:

1. **Bidirectional Relationship Issue**:

   - While quiz questions have `quiz_id` columns that reference their parent quizzes, the reverse relationship isn't properly established
   - The `questions` field array in the `course_quizzes` collection is not populated
   - Relationship tables are not properly maintained

2. **Missing Database Constraints**:

   - No foreign key constraints enforce the relationships between quizzes, questions, and courses
   - This allows invalid or orphaned references to persist

3. **Content Migration System Issues**:
   - The current content migration process doesn't properly establish bidirectional quiz-question relationships

## 2. Existing Scripts Analysis

We already have several scripts that partially address these issues:

1. `fix-invalid-quiz-references.ts`:

   - Identifies lessons that reference non-existent quizzes
   - Nullifies these references to prevent 404 errors

2. `fix-lesson-quiz-field-name.ts`:

   - Fixes field names for quiz relationships in course_lessons_rels
   - Creates missing relationships between lessons and quizzes

3. `fix-quizzes-without-questions.ts`:
   - Identifies quizzes that don't have any questions
   - Nullifies lesson references to these quizzes

However, none of these scripts address the core issue of populating the `questions` field in quizzes with their corresponding quiz questions.

## 3. Solution Strategy

Rather than creating entirely new processes, we'll extend the existing content migration system with targeted enhancements:

### A. Create a New Quiz-Question Relationship Fix Script

We'll create a script to establish proper bidirectional relationships between quizzes and questions:

```mermaid
flowchart TD
    A[Find Quiz Questions] --> B[Group by Quiz ID]
    B --> C[Update Quizzes with Questions Array]
    C --> D[Create Relationship Entries]
    D --> E[Verify Bidirectional Relationships]
```

### B. Enhance the Quiz References Fix Script

We'll update an existing script to add course IDs to all quizzes:

```mermaid
flowchart TD
    A[Find Main Course ID] --> B[Update All Quizzes]
    B --> C[Verify Course References]
```

### C. Integrate with Content Migration Process

We'll add these scripts to the existing migration orchestration:

```mermaid
flowchart TD
    A[Content Migration] --> B[Fix Invalid Quiz References]
    B --> C[Fix Course IDs]
    C --> D[Fix Quiz-Question Relationships]
    D --> E[Verify All Fixed]
```

## 4. Implementation Plan

### 1. Create a New Script for Quiz-Question Relationships

We'll create `fix-quiz-question-relationships.ts` in `packages/content-migrations/src/scripts/repair/`:

```typescript
import { Client } from 'pg';

/**
 * Fix bidirectional relationships between quizzes and quiz questions
 *
 * This script ensures that quizzes properly reference their questions
 * and that the relationship tables are correctly populated.
 */
export async function fixQuizQuestionRelationships(): Promise<void> {
  console.log('Fixing quiz-question bidirectional relationships...');

  const client = new Client({
    connectionString:
      process.env.DATABASE_URI ||
      'postgresql://postgres:postgres@localhost:54322/postgres',
  });

  try {
    await client.connect();
    await client.query('BEGIN');

    // 1. Find all quiz questions and their associated quizzes
    const questions = await client.query(`
      SELECT id, question, quiz_id FROM payload.quiz_questions
      WHERE quiz_id IS NOT NULL
    `);

    console.log(`Found ${questions.rowCount} quiz questions with quiz_id set`);

    // 2. Group questions by quiz_id
    const quizMap = new Map();
    questions.rows.forEach((q) => {
      if (!quizMap.has(q.quiz_id)) {
        quizMap.set(q.quiz_id, []);
      }
      quizMap.get(q.quiz_id).push(q.id);
    });

    console.log(`Found ${quizMap.size} quizzes with questions`);

    // 3. Update quizzes with their questions array
    for (const [quizId, questionIds] of quizMap.entries()) {
      // Update the quiz entry
      await client.query(
        `
        UPDATE payload.course_quizzes
        SET questions = ARRAY[${questionIds.map((id) => `'${id}'`).join(',')}]::uuid[]
        WHERE id = $1
      `,
        [quizId],
      );

      // Ensure relationship entries exist in course_quizzes_rels
      for (const questionId of questionIds) {
        // Check if relationship already exists
        const existingRel = await client.query(
          `
          SELECT id FROM payload.course_quizzes_rels
          WHERE _parent_id = $1 AND field = 'questions' AND value = $2
        `,
          [quizId, questionId],
        );

        if (existingRel.rowCount === 0) {
          // Create the relationship
          await client.query(
            `
            INSERT INTO payload.course_quizzes_rels
            (id, _parent_id, field, value, created_at, updated_at, quiz_questions_id)
            VALUES (gen_random_uuid(), $1, 'questions', $2, NOW(), NOW(), $2)
          `,
            [quizId, questionId],
          );
        }
      }
    }

    // 4. Verify that relationships are established
    const verificationResult = await client.query(`
      SELECT 
        cq.id as quiz_id, 
        cq.title as quiz_title,
        COUNT(qq.id) as question_count,
        COALESCE(ARRAY_LENGTH(cq.questions, 1), 0) as questions_array_length,
        (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE _parent_id = cq.id AND field = 'questions') as rel_count
      FROM payload.course_quizzes cq
      LEFT JOIN payload.quiz_questions qq ON qq.quiz_id = cq.id
      GROUP BY cq.id, cq.title, cq.questions
      ORDER BY question_count DESC
    `);

    console.log('\nVerification results:');
    verificationResult.rows.forEach((row) => {
      console.log(
        `Quiz "${row.quiz_title}": ${row.question_count} questions, ${row.questions_array_length} in array, ${row.rel_count} in relationships`,
      );

      if (
        row.question_count !== row.questions_array_length ||
        row.question_count !== row.rel_count
      ) {
        console.warn(`  ⚠️ Mismatch detected for quiz "${row.quiz_title}"`);
      }
    });

    await client.query('COMMIT');
    console.log('Successfully fixed quiz-question relationships');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fixing quiz-question relationships:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the function if called directly
if (require.main === module) {
  fixQuizQuestionRelationships()
    .then(() => console.log('Complete'))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
```

### 2. Enhance an Existing Script to Add Course IDs

Add the following code to `fix-invalid-quiz-references.ts` after handling invalid references:

```typescript
// Add course ID to all quizzes
console.log('Adding course ID to quizzes...');

// Get main course ID - needs to be a real ID from your database
const courseResult = await client.query(`
  SELECT id FROM payload.courses
  WHERE slug = 'decks-for-decision-makers'
  LIMIT 1
`);

if (courseResult.rowCount > 0) {
  const courseId = courseResult.rows[0].id;

  // Update all quizzes to have this course ID
  const updateResult = await client.query(
    `
    UPDATE payload.course_quizzes
    SET course_id_id = $1
    WHERE course_id_id IS NULL
    RETURNING id, title
  `,
    [courseId],
  );

  console.log(
    `Updated ${updateResult.rowCount} quizzes to have course ID ${courseId}:`,
  );
  updateResult.rows.forEach((row) => {
    console.log(`- Quiz ID: ${row.id}, Title: ${row.title}`);
  });
} else {
  console.warn(
    'Could not find main course ID. Please update quiz course IDs manually.',
  );
}
```

### 3. Update PowerShell Orchestration Script

Update `scripts/orchestration/phases/loading.ps1` to include our new scripts in the `Fix-Relationships` function:

```powershell
# After the existing "fix invalid quiz references" line:

# Fix quiz-question bidirectional relationships
Log-Message "Fixing quiz-question bidirectional relationships..." "Yellow"
Exec-Command -command "pnpm exec tsx src/scripts/repair/fix-quiz-question-relationships.ts" -description "Fixing quiz-question relationships" -continueOnError
```

## 5. Testing and Verification

After implementation, we'll verify the solution through:

1. **Database Checks**:

   - Verify quizzes have correct `questions` arrays
   - Verify all quizzes have valid `course_id_id` values
   - Check relationship tables for proper entries

2. **UI Verification**:

   - Check that the "Take Quiz" button appears on lesson pages
   - Verify quiz questions appear correctly when taking a quiz
   - Complete quizzes to ensure results are properly recorded

3. **Code Integration**:
   - Confirm the scripts integrate properly with the content migration system
   - Verify no errors occur during migration

## 6. Implementation Considerations

1. **Backward Compatibility**:

   - This solution maintains existing database structure
   - No schema changes are required

2. **Performance**:

   - Transaction handling ensures database consistency
   - The scripts are idempotent and can be run multiple times safely

3. **Maintainability**:

   - Follows existing patterns in the codebase
   - Well-documented for future maintenance

4. **Error Handling**:
   - Comprehensive error logging
   - Transaction rollback on failure
   - Detailed verification steps

## 7. Future Improvements

For longer-term stability:

1. **Add Database Constraints**:

   - Add foreign key constraints between quizzes and questions
   - Add constraints for quiz_id in course_lessons

2. **Enhance Data Validation**:

   - Add validation to the migration process
   - Verify relationship integrity during migrations

3. **Documentation**:
   - Create a clear mapping document of content relationships
   - Document the bidirectional relationship structure
