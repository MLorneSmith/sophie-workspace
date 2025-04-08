# Quiz ID Consistency Fix Implementation Plan

## Problem Statement

We are experiencing a foreign key constraint violation during the Payload migrations step, specifically when executing SQL seed file `04-questions.sql`. The error occurs because:

```
Error in content processing migration: error: insert or update on table "quiz_questions" violates foreign key constraint "quiz_questions_quiz_id_fkey"
Key (quiz_id)=(c11dbb26-7561-4d12-88c8-141c653a43fd) is not present in table "course_quizzes".
```

This indicates that the quiz ID referenced in the questions SQL file (`c11dbb26-7561-4d12-88c8-141c653a43fd`) does not exist in the `course_quizzes` table. The root issue is an inconsistency between the quiz IDs used in different parts of the system:

- In `quiz-id-map.json` and `knownQuizIds`, the ID for "basic-graphs-quiz" is `c11dbb26-7561-4d12-88c8-141c653a43fd`
- In `04-questions.sql`, questions are referencing this same ID: `quiz_id = 'c11dbb26-7561-4d12-88c8-141c653a43fd'`
- However, in `03-quizzes.sql`, the ID for "basic-graphs-quiz" is completely different: `'b48a3ab3-25a8-457f-a510-39ef3311ddb4'`

## Root Cause Analysis

After examining the code, the root cause of this inconsistency has been identified:

1. **Quiz Map Generation**:

   - In `quiz-map-generator.ts`, the `generateQuizMap()` function correctly creates a map using the predefined IDs from `knownQuizIds` (which match the IDs in `quiz-id-map.json`).
   - This function has validation that should ensure all quiz IDs in the map match those in `knownQuizIds`.

2. **SQL Generation Process**:

   - `generate-sql-seed-files.ts` calls `generateQuizMap()` to create a map of quiz slugs to UUIDs.
   - It then passes this map to both `generateQuizzesSql()` and `generateQuestionsSql()`.

3. **The Problem in `generateQuizzesSql()`**:

   - The `generateQuizzesSql()` function receives the quiz map and uses it to get the quiz ID for each quiz.
   - However, it doesn't validate that the ID it's using matches the one in `knownQuizIds`.
   - The function simply uses whatever ID is in the map, which might be different from what's in `knownQuizIds`.
   - This leads to a situation where the quiz IDs in `03-quizzes.sql` don't match those in `knownQuizIds`.

4. **Correct Usage in `generateQuestionsSql()`**:

   - Meanwhile, `generateQuestionsSql()` is correctly using the IDs from the map, which should match those in `knownQuizIds`.
   - This creates the inconsistency where questions reference quiz IDs that don't exist in the quizzes table.

5. **Verification Gap**:
   - The verification functions (`verifyQuizIds()` and `verifyCrossFileQuizIds()`) are supposed to catch this inconsistency.
   - However, they're failing to prevent the issue, possibly because they're only checking if the quiz IDs referenced in the questions exist in the quizzes table, not whether they match the predefined IDs in `knownQuizIds`.

## Code Review

### 1. `quiz-map-generator.ts`

This file defines `knownQuizIds` and the `generateQuizMap()` function:

```typescript
// Define fixed UUIDs for known quizzes for consistency
export const knownQuizIds: Record<string, string> = {
  'basic-graphs-quiz': 'c11dbb26-7561-4d12-88c8-141c653a43fd',
  // ... other quiz IDs
};

export function generateQuizMap(quizzesDir: string): Map<string, string> {
  const quizMap = new Map<string, string>();

  // Get all .mdoc files in the quizzes directory
  const quizFiles = fs
    .readdirSync(quizzesDir)
    .filter((file) => file.endsWith('.mdoc'));

  // Generate a UUID for each quiz, using known IDs when available
  for (const file of quizFiles) {
    const slug = path.basename(file, '.mdoc');

    // Check if we have a known ID for this quiz
    if (knownQuizIds[slug]) {
      const quizId = knownQuizIds[slug];
      quizMap.set(slug, quizId);
    } else {
      // Generate a new UUID if we don't have a known ID
      const quizId = uuidv4();
      quizMap.set(slug, quizId);
    }
  }

  // Validate that all quiz IDs in the map match those in knownQuizIds
  for (const [slug, id] of quizMap.entries()) {
    if (knownQuizIds[slug] && id !== knownQuizIds[slug]) {
      console.error(
        `Error: ID mismatch for quiz ${slug}. Map has ${id}, knownQuizIds has ${knownQuizIds[slug]}`,
      );
      // Fix the mismatch by using the known ID
      quizMap.set(slug, knownQuizIds[slug]);
    }
  }

  return quizMap;
}
```

This function should correctly create a map with the IDs from `knownQuizIds`.

### 2. `generate-quizzes-sql.ts`

This file defines the `generateQuizzesSql()` function:

```typescript
export function generateQuizzesSql(
  quizzesDir: string,
  quizMap: Map<string, string>,
): string {
  // Get all .mdoc files in the quizzes directory
  const quizFiles = fs
    .readdirSync(quizzesDir)
    .filter((file) => file.endsWith('.mdoc'));

  // Start building the SQL
  let sql = `-- Seed data for the course quizzes table
-- This file should be run after the courses seed file to ensure the course exists

-- Start a transaction
BEGIN;

`;

  // Process each quiz file
  for (const file of quizFiles) {
    const filePath = path.join(quizzesDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContent);

    // Get the quiz slug and UUID
    const quizSlug = path.basename(file, '.mdoc');
    const quizId = quizMap.get(quizSlug);

    if (!quizId) {
      console.error(`Error: No ID found for quiz ${quizSlug}`);
      continue;
    }

    console.log(`Generating SQL for quiz ${quizSlug} with ID ${quizId}`);

    // Add the quiz to the SQL
    sql += `-- Insert quiz: ${data.title}
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  '${quizId}', -- UUID for the quiz
  '${data.title.replace(/'/g, "''")}',
  '${quizSlug}',
  '${(data.description || `Quiz for ${data.title}`).replace(/'/g, "''")}',
  ${data.passingScore || 70}, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

`;
  }

  // End the transaction
  sql += `-- Commit the transaction
COMMIT;
`;

  return sql;
}
```

This function simply uses the ID from the map without validating it against `knownQuizIds`.

### 3. `generate-questions-sql.ts`

This file defines the `generateQuestionsSql()` function:

```typescript
export function generateQuestionsSql(
  quizzesDir: string,
  quizMap: Map<string, string>,
): string {
  // ... (code omitted for brevity)

  // Process each quiz file
  for (const file of quizFiles) {
    // ... (code omitted for brevity)

    // Get the quiz slug and UUID
    const quizSlug = path.basename(file, '.mdoc');
    let quizId = quizMap.get(quizSlug);

    // If the quiz ID is not found in the map, generate a new one
    if (!quizId) {
      quizId = uuidv4();
      console.log(
        `Generated new ID ${quizId} for quiz ${quizSlug} in questions SQL`,
      );
    }

    // ... (code omitted for brevity)
  }

  // ... (code omitted for brevity)
}
```

This function uses the ID from the map, which should match those in `knownQuizIds`.

## Implementation Plan

To fix the issue, we need to modify `generateQuizzesSql()` to ensure it uses the exact same IDs from `knownQuizIds` that are used in `quiz-id-map.json`. Here's the implementation plan:

### 1. Modify `generate-quizzes-sql.ts`

```typescript
// Import knownQuizIds
import { knownQuizIds } from '../utils/quiz-map-generator.js';

export function generateQuizzesSql(
  quizzesDir: string,
  quizMap: Map<string, string>,
): string {
  // ... (existing code)

  // Process each quiz file
  for (const file of quizFiles) {
    // ... (existing code)

    // Get the quiz slug
    const quizSlug = path.basename(file, '.mdoc');

    // First check if we have a known ID for this quiz
    let quizId;
    if (knownQuizIds[quizSlug]) {
      quizId = knownQuizIds[quizSlug];
      // Check if the map has a different ID
      if (quizMap.get(quizSlug) !== quizId) {
        console.warn(
          `Warning: ID mismatch for quiz ${quizSlug}. Using known ID ${quizId} instead of map ID ${quizMap.get(quizSlug)}`,
        );
      }
    } else {
      // Fall back to the map if no known ID exists
      quizId = quizMap.get(quizSlug);
    }

    if (!quizId) {
      console.error(`Error: No ID found for quiz ${quizSlug}`);
      continue;
    }

    console.log(`Generating SQL for quiz ${quizSlug} with ID ${quizId}`);

    // ... (existing code)
  }

  // ... (existing code)
}
```

This change ensures that `generateQuizzesSql()` always uses the IDs from `knownQuizIds` when available, which will match those used in `generateQuestionsSql()`.

### 2. Enhance Verification in `verify-cross-file-quiz-ids.ts`

```typescript
import { knownQuizIds } from '../utils/quiz-map-generator.js';

export function verifyCrossFileQuizIds(
  quizzesSql: string,
  questionsSql: string,
): boolean {
  // ... (existing code)

  // Check if all question quiz IDs exist in quizzes
  let allExist = true;
  for (const id of questionQuizIds) {
    if (!quizIds.has(id)) {
      console.error(
        `Error: Quiz ID ${id} referenced in questions does not exist in quizzes`,
      );
      allExist = false;
    }
  }

  // NEW: Check if quiz IDs match those in knownQuizIds
  const quizSlugIdRegex =
    /-- Insert quiz: .*?\n.*?slug = '([^']+)'.*?id = '([^']+)'/gs;
  let match;
  while ((match = quizSlugIdRegex.exec(quizzesSql)) !== null) {
    const slug = match[1];
    const id = match[2];

    if (knownQuizIds[slug] && id !== knownQuizIds[slug]) {
      console.error(
        `Error: ID mismatch for quiz ${slug}. SQL has ${id}, knownQuizIds has ${knownQuizIds[slug]}`,
      );
      allExist = false;
    }
  }

  return allExist;
}
```

This enhancement checks that the quiz IDs in the generated SQL match those in `knownQuizIds`.

## Testing Strategy

1. **Run the Content Migration Process**:

   - Execute `reset-and-migrate.ps1` to run the full migration process.
   - Verify that no foreign key constraint violations occur.

2. **Verify SQL Files**:

   - Check that the IDs in `03-quizzes.sql` match those in `knownQuizIds`.
   - Check that the IDs in `04-questions.sql` match those in `knownQuizIds`.

3. **Verify Database State**:
   - Query the database to ensure that quiz IDs in the `course_quizzes` table match those in `knownQuizIds`.
   - Query the database to ensure that quiz IDs referenced in the `quiz_questions` table match those in the `course_quizzes` table.

## Conclusion

The root cause of the quiz ID inconsistency is that `generateQuizzesSql()` is not correctly using the IDs from `knownQuizIds`. By modifying this function to prioritize the IDs from `knownQuizIds` and enhancing the verification process, we can ensure that the quiz IDs are consistent across all parts of the system.
