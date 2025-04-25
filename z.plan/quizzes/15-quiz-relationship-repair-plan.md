# Quiz Relationship Repair Plan

## Problem Statement

We're encountering errors in the frontend web app related to quiz questions not being loaded properly:

```
Error: Failed to call Payload API (course_quizzes/d5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0?depth=1): 404 Not Found
```

The symptoms include:

- The quiz exists in the database (`payload.course_quizzes` table)
- When accessing the quiz via the Payload API, we get a 404 error
- In the Payload CMS admin UI, quizzes appear to have no questions

## Root Cause Analysis

After investigating the codebase and database, we've identified the root cause:

1. **Split Quiz Data Sources**:

   - The system has two separate sources of quiz data:
     - `QUIZZES` constant in `packages\content-migrations\src\data\definitions\quizzes.ts` (source of truth)
     - `CORRECT_QUIZ_IDS` mapping in `packages\content-migrations\src\scripts\repair\quiz-management\utilities\fix-quiz-id-consistency.ts`

2. **Data Inconsistency**:

   - Some quizzes (like "The Who Quiz" with ID `d5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0`) are defined in `CORRECT_QUIZ_IDS` but missing in the source-of-truth `QUIZZES` object

3. **Broken Relationship Chain**:

   - Normal migration workflow:

     1. Read quiz definitions from `QUIZZES` constant
     2. Generate SQL seed files for quizzes
     3. Generate SQL for quiz-question relationships
     4. Execute both to populate the database

   - For quizzes added via `CORRECT_QUIZ_IDS`:
     1. The `fix-quiz-id-consistency.ts` script adds them to the database
     2. But relationship entries in `course_quizzes_rels` are never created
     3. No connections are established between quizzes and questions

4. **Technical Details**:

   - The system uses a unidirectional relationship model where:
     - Quizzes reference questions (not the other way around)
     - These references must exist in two places:
       1. The `questions` array field in `course_quizzes` table
       2. Relationship entries in `course_quizzes_rels` table (with `path = 'questions'`)
   - For quizzes like "The Who Quiz", only the quiz itself exists, but neither of these relationship data points are present

## Understanding the Content Migration System

To understand how quiz data flows through the system:

1. **Source Definition**:

   - `quizzes.ts` defines the `QUIZZES` constant with quiz metadata and questions
   - This is intended to be the "single source of truth" for quiz content

2. **Generation Process**:

   - `processing.ps1` runs `pnpm run generate:updated-sql` to create SQL seed files
   - It then runs `pnpm run fix:quiz-id-consistency` to ensure consistent IDs
   - This second step actually overwrites the quizzes SQL with entries from `CORRECT_QUIZ_IDS`

3. **Relationship Handling**:

   - Only quizzes defined in the source-of-truth `QUIZZES` constant get proper relationship processing
   - Quizzes added via the repair script get created in the database but have no relationships established

4. **Missing Links**:
   - `fix-quiz-id-consistency.ts` includes "The Who Quiz" in its hardcoded list
   - But it doesn't establish any relationships to questions
   - The `CORRECT_QUIZ_IDS` mapping only stores quiz slugs and IDs, not question information

## Solution Plan

To resolve this issue and prevent future occurrences, we'll implement a comprehensive solution:

### 1. Data Reconciliation

Ensure both data sources are complete and consistent:

- Update `packages\content-migrations\src\data\definitions\quizzes.ts` to include ALL quizzes from `CORRECT_QUIZ_IDS`
- Specifically add "The Who Quiz" and other missing quizzes to the source of truth
- Ensure IDs are consistent between both sources

### 2. Database Extraction & Analysis

Create a script to extract existing quiz data from the database:

- Query all quizzes from `payload.course_quizzes`
- For each quiz, identify any existing relationships and questions
- For quizzes with no relationships, identify potential questions that could be related

### 3. Relationship Repair

Implement a comprehensive repair process:

- Create a script to establish missing relationships for all quizzes
- Add appropriate entries to `course_quizzes_rels` table
- Update the `questions` array field in the quiz records
- Include specific handling for "The Who Quiz"

### 4. Migration Process Enhancement

Modify the content migration system:

- Update the `fix-quiz-id-consistency.ts` script to check for quizzes missing from the source of truth
- Add warning logs when inconsistencies are detected
- Create a verification step to ensure all quizzes have proper relationships after migration

### 5. Testing and Verification

Implement thorough testing:

- Create a verification script to validate all quiz-question relationships
- Test the frontend to ensure quizzes and questions load properly
- Add regression tests to prevent future issues

## Implementation Details

### 1. Extract Quiz Data Script

```typescript
// extract-quiz-data.ts
import fs from 'fs';
import path from 'path';

import { executeSQL } from '../../utils/db/execute-sql.js';

async function extractQuizData() {
  try {
    // Start a transaction
    await executeSQL('BEGIN');

    // Get all quizzes
    const quizzes = await executeSQL(`
      SELECT id, title, slug, description, passing_score FROM payload.course_quizzes
      ORDER BY title
    `);

    const quizDefinitions = {};

    // For each quiz, get related questions
    for (const quiz of quizzes.rows) {
      // Get questions related to this quiz
      const questionsRel = await executeSQL(
        `
        SELECT qq.id, qq.question as text, qq.type, qq."order", cqr."order" as rel_order 
        FROM payload.quiz_questions qq
        JOIN payload.course_quizzes_rels cqr ON qq.id = cqr.id 
          AND cqr.parent_id = $1
          AND cqr.path = 'questions'
        ORDER BY cqr."order", qq."order"
      `,
        [quiz.id],
      );

      // Format as QuizDefinition
      const questions = questionsRel.rows.map((q) => ({
        id: q.id,
        text: q.text,
        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'], // Placeholder options
        correctOptionIndex: 0, // Placeholder correct answer
        explanation: 'Placeholder explanation',
      }));

      quizDefinitions[quiz.slug] = {
        id: quiz.id,
        slug: quiz.slug,
        title: quiz.title,
        description: quiz.description || `Quiz for ${quiz.title}`,
        passingScore: quiz.passing_score || 70,
        questions: questions,
      };
    }

    // Write to a JSON file for reference
    const outputDir = 'z.plan/quizzes';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(outputDir, 'extracted-quiz-data.json'),
      JSON.stringify(quizDefinitions, null, 2),
    );

    // Commit the transaction
    await executeSQL('COMMIT');

    console.log(
      `Extracted data for ${Object.keys(quizDefinitions).length} quizzes`,
    );
    return quizDefinitions;
  } catch (error) {
    // Rollback on error
    await executeSQL('ROLLBACK');
    console.error('Error extracting quiz data:', error);
    throw error;
  }
}
```

### 2. Update Quiz Definitions Script

```typescript
// update-quiz-definitions.ts
import fs from 'fs';
import path from 'path';

function updateQuizDefinitions(extractedData) {
  try {
    // Read the existing quizzes.ts file
    const quizzesFilePath =
      'packages/content-migrations/src/data/definitions/quizzes.ts';
    let quizzesFileContent = fs.readFileSync(quizzesFilePath, 'utf8');

    // Extract the existing QUIZZES constant
    const quizzesMatch = quizzesFileContent.match(
      /export const QUIZZES: Record<string, QuizDefinition> = {([^]+?)};/,
    );
    if (!quizzesMatch) {
      throw new Error('Could not find QUIZZES constant in the file');
    }

    // Parse the existing quizzes
    const existingQuizzesContent = quizzesMatch[1];
    const existingQuizSlugs = Object.keys(extractedData).filter((slug) =>
      existingQuizzesContent.includes(`'${slug}': {`),
    );

    // Build the new QUIZZES constant content
    let newQuizzesContent = `export const QUIZZES: Record<string, QuizDefinition> = {`;

    // First add all existing quizzes
    existingQuizSlugs.forEach((slug) => {
      // Keep existing quizzes as they are
      // This preserves their format, questions, etc.
      const startIdx = existingQuizzesContent.indexOf(`'${slug}': {`);
      if (startIdx === -1) return;

      // Find the closing bracket for this quiz definition
      let depth = 0;
      let endIdx = startIdx;
      for (let i = startIdx; i < existingQuizzesContent.length; i++) {
        if (existingQuizzesContent[i] === '{') depth++;
        if (existingQuizzesContent[i] === '}') depth--;
        if (depth === 0) {
          endIdx = i + 1;
          break;
        }
      }

      const quizContent = existingQuizzesContent.substring(startIdx, endIdx);
      newQuizzesContent += `\n  ${quizContent},`;
    });

    // Add new quizzes (extracted from the database but not in the source file)
    Object.entries(extractedData).forEach(([slug, quiz]) => {
      if (!existingQuizSlugs.includes(slug)) {
        newQuizzesContent += `
  '${slug}': {
    id: '${quiz.id}',
    slug: '${slug}',
    title: '${quiz.title.replace(/'/g, "\\'")}',
    description: '${(quiz.description || '').replace(/'/g, "\\'")}',
    passingScore: ${quiz.passingScore || 70},
    questions: [
${quiz.questions
  .map(
    (q) => `      {
        id: '${q.id}',
        text: '${q.text.replace(/'/g, "\\'")}',
        options: ${JSON.stringify(q.options || ['Option 1', 'Option 2', 'Option 3', 'Option 4'])},
        correctOptionIndex: ${q.correctOptionIndex || 0},
        explanation: '${(q.explanation || '').replace(/'/g, "\\'")}',
      }`,
  )
  .join(',\n')}
    ],
  },`;
      }
    });

    newQuizzesContent += `\n};`;

    // Replace the QUIZZES constant in the file
    const updatedFileContent = quizzesFileContent.replace(
      /export const QUIZZES: Record<string, QuizDefinition> = {([^]+?)};/,
      newQuizzesContent,
    );

    // Write the updated file
    fs.writeFileSync(
      path.join('z.plan/quizzes', 'updated-quizzes.ts'),
      updatedFileContent,
    );

    console.log('Updated quiz definitions file created');
  } catch (error) {
    console.error('Error updating quiz definitions:', error);
    throw error;
  }
}
```

### 3. Comprehensive Relationship Repair Script

```typescript
// fix-quiz-relationships.ts
import { executeSQL } from '../../utils/db/execute-sql.js';

async function fixQuizRelationships() {
  try {
    // Start a transaction
    await executeSQL('BEGIN');

    // Get all quizzes
    const quizzes = await executeSQL(`
      SELECT id, title, questions FROM payload.course_quizzes
      ORDER BY title
    `);

    console.log(
      `Processing ${quizzes.rows.length} quizzes for relationship repair`,
    );

    // For each quiz, ensure relationship entries exist
    for (const quiz of quizzes.rows) {
      const quizId = quiz.id;

      // Get question IDs from the questions array field
      let questionIds = [];
      if (quiz.questions && Array.isArray(quiz.questions)) {
        questionIds = quiz.questions;
      }

      // Get existing relationship entries
      const relEntries = await executeSQL(
        `
        SELECT id, "order" FROM payload.course_quizzes_rels
        WHERE parent_id = $1 AND path = 'questions'
      `,
        [quizId],
      );

      const existingIds = relEntries.rows.map((r) => r.id);

      // Find missing relationships
      const missingIds = questionIds.filter((id) => !existingIds.includes(id));

      // Create missing relationship entries
      if (missingIds.length > 0) {
        console.log(
          `Adding ${missingIds.length} missing relationships for quiz "${quiz.title}"`,
        );

        for (let i = 0; i < missingIds.length; i++) {
          const questionId = missingIds[i];
          const order = existingIds.length + i;

          await executeSQL(
            `
            INSERT INTO payload.course_quizzes_rels (id, parent_id, path, field, "order")
            VALUES ($1, $2, 'questions', 'questions', $3)
            ON CONFLICT (id, parent_id) DO NOTHING
          `,
            [questionId, quizId, order],
          );
        }
      }

      // Special case for "The Who Quiz"
      if (
        quiz.title === 'The Who Quiz' &&
        existingIds.length === 0 &&
        questionIds.length === 0
      ) {
        console.log('Special handling for "The Who Quiz"');

        // Find suitable questions
        const suitableQuestions = await executeSQL(`
          SELECT id FROM payload.quiz_questions
          WHERE question LIKE '%who%' OR question LIKE '%audience%'
          LIMIT 5
        `);

        if (suitableQuestions.rows.length > 0) {
          const suitableIds = suitableQuestions.rows.map((q) => q.id);

          // Add to questions array
          await executeSQL(
            `
            UPDATE payload.course_quizzes
            SET questions = $1::jsonb
            WHERE id = $2
          `,
            [JSON.stringify(suitableIds), quizId],
          );

          // Create relationship entries
          for (let i = 0; i < suitableIds.length; i++) {
            await executeSQL(
              `
              INSERT INTO payload.course_quizzes_rels (id, parent_id, path, field, "order")
              VALUES ($1, $2, 'questions', 'questions', $3)
              ON CONFLICT (id, parent_id) DO NOTHING
            `,
              [suitableIds[i], quizId, i],
            );
          }

          console.log(
            `Added ${suitableIds.length} questions to "The Who Quiz"`,
          );
        }
      }
    }

    // Verify all quizzes have questions
    const emptyQuizzes = await executeSQL(`
      SELECT id, title FROM payload.course_quizzes
      WHERE questions IS NULL OR questions = '[]'::jsonb OR questions = 'null'::jsonb
    `);

    if (emptyQuizzes.rows.length > 0) {
      console.log(
        `${emptyQuizzes.rows.length} quizzes still have no questions:`,
      );
      for (const quiz of emptyQuizzes.rows) {
        console.log(`- ${quiz.title} (${quiz.id})`);
      }
    } else {
      console.log('All quizzes now have questions assigned');
    }

    // Commit the transaction
    await executeSQL('COMMIT');

    console.log('Quiz relationship repair completed successfully');
    return true;
  } catch (error) {
    // Rollback on error
    await executeSQL('ROLLBACK');
    console.error('Error fixing quiz relationships:', error);
    return false;
  }
}
```

## Next Steps and Timeline

1. **Immediate Fix (Today)**:

   - Run a direct SQL query to establish relationships for "The Who Quiz"
   - Manual verification that the quiz works properly in the frontend

2. **Short-term (This Week)**:

   - Implement and run the data extraction script
   - Update `quizzes.ts` with the complete set of quiz definitions
   - Run the comprehensive relationship repair script
   - Verify all quizzes work correctly

3. **Long-term (Next Sprint)**:
   - Enhance the migration process to automatically synchronize quizzes
   - Add warning logs for inconsistencies
   - Create automated verification as part of the migration pipeline

## Conclusion

The root cause of our quiz relationship issues is a disconnect between two sources of quiz data in the system. By reconciling these sources and ensuring proper relationship handling for all quizzes, we'll resolve the current errors and prevent similar issues in the future.

This approach is scalable and robust, as it ensures:

1. A single source of truth for quiz definitions
2. Complete relationship data for all quizzes
3. Improved error detection and handling
4. A more maintainable content migration system
