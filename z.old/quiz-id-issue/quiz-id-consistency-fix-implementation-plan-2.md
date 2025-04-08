# Quiz ID Consistency Fix Implementation Plan (Part 2)

## Problem Analysis

The content migration process is failing with the following error:

```
Error in content processing migration: error: insert or update on table "quiz_questions" violates foreign key constraint "quiz_questions_quiz_id_fkey"
Key (quiz_id)=(c11dbb26-7561-4d12-88c8-141c653a43fd) is not present in table "course_quizzes".
```

This error indicates that there's a quiz ID mismatch between the quiz questions and the quizzes themselves. Specifically, a quiz question is trying to reference a quiz with ID `c11dbb26-7561-4d12-88c8-141c653a43fd`, but this quiz doesn't exist in the `course_quizzes` table.

After investigating the issue further, we've found that:

1. The quiz ID `c11dbb26-7561-4d12-88c8-141c653a43fd` is correctly defined in `quiz-id-map.json` for the quiz with slug `basic-graphs-quiz`.
2. The same ID is also correctly defined in the `knownQuizIds` object in `generate-sql-seed-files-fixed.ts`.
3. However, when the `03-quizzes.sql` file is generated, it's using a different ID for the `basic-graphs-quiz` quiz.
4. The `04-questions.sql` file is correctly using the ID from `knownQuizIds`, but since the `03-quizzes.sql` file has a different ID, the foreign key constraint is violated.

## Root Cause Identification

The root cause of the issue is in the `generateQuizMap` function in `generate-sql-seed-files-fixed.ts`. This function is responsible for creating a map of quiz slugs to UUIDs, which is then used by both `generateQuizzesSql` and `generateQuestionsSql` functions.

The issue is that while the `knownQuizIds` object is correctly defined with the right IDs, the `generateQuizMap` function is not properly using these IDs when creating the map. It's creating a new map, but not ensuring that the IDs in the map match those in `knownQuizIds`.

Specifically, when examining the processed SQL files:

- In `quiz-id-map.json`: `"basic-graphs-quiz": "c11dbb26-7561-4d12-88c8-141c653a43fd"`
- In `03-quizzes.sql`, it should be using: `'c11dbb26-7561-4d12-88c8-141c653a43fd'`
- But it's actually using a different ID, which causes the foreign key constraint violation.

## Proposed Solution

We need to modify the `generateQuizMap` function to ensure it's correctly using the IDs from `knownQuizIds` for all known quiz slugs. Here's the specific code change needed:

```typescript
/**
 * Generates a map of quiz slugs to UUIDs
 * @param quizzesDir - Directory containing quiz .mdoc files
 * @returns Map of quiz slugs to UUIDs
 */
function generateQuizMap(quizzesDir: string): Map<string, string> {
  const quizMap = new Map<string, string>();

  // Get all .mdoc files in the quizzes directory
  const quizFiles = fs
    .readdirSync(quizzesDir)
    .filter((file) => file.endsWith('.mdoc'));

  // Generate a UUID for each quiz, using known IDs when available
  for (const file of quizFiles) {
    const slug = path.basename(file, '.mdoc');
    // Use known ID if available, otherwise generate a new UUID
    const quizId = knownQuizIds[slug] || uuidv4();
    quizMap.set(slug, quizId);
    console.log(`Using ID ${quizId} for quiz ${slug}`);
  }

  return quizMap;
}
```

The issue might be that the `knownQuizIds` object is not being properly accessed or that there's some other logic in the function that's causing it to use different IDs. We need to ensure that the function is correctly using the IDs from `knownQuizIds` for all known quiz slugs.

## Implementation Steps

1. **Modify the `generateQuizMap` function**:
   - Add additional logging to show which IDs are being used for each quiz
   - Ensure that the function is correctly using the IDs from `knownQuizIds`
   - Add validation to ensure that all quiz IDs in the map match those in `knownQuizIds`

```typescript
function generateQuizMap(quizzesDir: string): Map<string, string> {
  const quizMap = new Map<string, string>();

  // Get all .mdoc files in the quizzes directory
  const quizFiles = fs
    .readdirSync(quizzesDir)
    .filter((file) => file.endsWith('.mdoc'));

  console.log(`Found ${quizFiles.length} quiz files to process.`);

  // Generate a UUID for each quiz, using known IDs when available
  for (const file of quizFiles) {
    const slug = path.basename(file, '.mdoc');

    // Check if we have a known ID for this quiz
    if (knownQuizIds[slug]) {
      const quizId = knownQuizIds[slug];
      quizMap.set(slug, quizId);
      console.log(`Using known ID ${quizId} for quiz ${slug}`);
    } else {
      // Generate a new UUID if we don't have a known ID
      const quizId = uuidv4();
      quizMap.set(slug, quizId);
      console.log(
        `Generated new ID ${quizId} for quiz ${slug} (no known ID found)`,
      );
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
      console.log(`Fixed ID for quiz ${slug} to ${knownQuizIds[slug]}`);
    }
  }

  return quizMap;
}
```

2. **Update the `generateQuizzesSql` function**:
   - Add additional logging to show which IDs are being used for each quiz
   - Ensure that the function is correctly using the IDs from the quiz map

```typescript
function generateQuizzesSql(
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
    const quizId = quizMap.get(quizSlug) || uuidv4();

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

3. **Add a new verification step**:
   - Create a new function to verify that the quiz IDs in the generated SQL files match those in `knownQuizIds`
   - Add this verification step to the `generateSqlSeedFiles` function

```typescript
/**
 * Verifies that the quiz IDs in the generated SQL files match those in knownQuizIds
 * @param quizzesSql - The generated quizzes SQL
 * @returns True if all quiz IDs match, false otherwise
 */
function verifyQuizIds(quizzesSql: string): boolean {
  const quizIdRegex =
    /INSERT INTO payload\.course_quizzes[\s\S]*?id = '([^']+)'[\s\S]*?slug = '([^']+)'[\s\S]*?ON CONFLICT/g;
  let match;
  let allMatch = true;

  while ((match = quizIdRegex.exec(quizzesSql)) !== null) {
    const id = match[1];
    const slug = match[2];

    if (knownQuizIds[slug] && id !== knownQuizIds[slug]) {
      console.error(
        `Error: ID mismatch for quiz ${slug}. SQL has ${id}, knownQuizIds has ${knownQuizIds[slug]}`,
      );
      allMatch = false;
    }
  }

  return allMatch;
}
```

4. **Update the `generateSqlSeedFiles` function**:
   - Add the verification step after generating the quizzes SQL
   - If the verification fails, throw an error to stop the process

```typescript
async function generateSqlSeedFiles() {
  console.log('Starting SQL seed files generation...');

  try {
    // ... existing code ...

    // Generate quizzes SQL
    console.log('Generating quizzes SQL...');
    const quizzesSql = generateQuizzesSql(RAW_QUIZZES_DIR, quizMap);

    // Verify that the quiz IDs in the generated SQL match those in knownQuizIds
    console.log('Verifying quiz IDs...');
    if (!verifyQuizIds(quizzesSql)) {
      throw new Error(
        'Quiz ID verification failed. Please check the logs for details.',
      );
    }

    fs.writeFileSync(
      path.join(PAYLOAD_SQL_SEED_DIR, '03-quizzes.sql'),
      quizzesSql,
    );

    // ... rest of the function ...
  } catch (error) {
    console.error('Error generating SQL seed files:', error);
    throw error;
  }
}
```

## Verification Steps

After implementing the changes, we need to verify that the fix works:

1. Run the `generateSqlSeedFiles` function to generate the SQL files
2. Check that the quiz IDs in the generated `03-quizzes.sql` file match those in `knownQuizIds`
3. Run the `reset-and-migrate.ps1` script to reset the database and run all migrations
4. Verify that the migration process completes successfully without any quiz ID inconsistency errors

## Potential Risks and Mitigations

1. **Risk**: The `generateQuizMap` function might be called from other places in the code, and changing its behavior could affect those places.
   **Mitigation**: Review all usages of the `generateQuizMap` function to ensure that the changes don't break existing functionality.

2. **Risk**: The `knownQuizIds` object might not have entries for all quiz slugs, which could lead to new UUIDs being generated for some quizzes.
   **Mitigation**: Add a warning log when a quiz slug doesn't have a known ID, and consider adding entries for all quiz slugs to `knownQuizIds`.

3. **Risk**: The verification step might fail if there are legitimate reasons for quiz IDs to be different from those in `knownQuizIds`.
   **Mitigation**: Add an option to skip the verification step or to update `knownQuizIds` with the new IDs.

4. **Risk**: The changes might not fix all instances of quiz ID inconsistency, especially if there are other places in the code that generate quiz IDs.
   **Mitigation**: Add comprehensive logging throughout the code to track where quiz IDs are being generated and used, and ensure that all places use the same source of truth.
