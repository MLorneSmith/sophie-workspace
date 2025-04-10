# Quiz ID Consistency Fix Implementation Plan

## Problem Diagnosis

After reviewing the code, I've identified the root cause of the quiz ID mismatch issue:

### The Issue

There's an inconsistency between quiz IDs in different parts of the system:

- In `quiz-id-map.json` and `04-questions.sql`, the ID for "basic-graphs-quiz" is: `c11dbb26-7561-4d12-88c8-141c653a43fd`
- In `03-quizzes.sql`, the ID for the same quiz is: `b48a3ab3-25a8-457f-a510-39ef3311ddb4`

This causes a foreign key constraint violation when trying to insert questions that reference a quiz ID that doesn't exist in the course_quizzes table.

### Root Cause

The inconsistency stems from how quiz IDs are generated and used in two different generator functions:

1. **In `generateQuizzesSql`**:

   - It first checks if there's a known ID in `knownQuizIds`
   - If found, it uses that ID
   - If not, it falls back to the ID from the quiz map
   - It logs a warning if there's a mismatch but doesn't fix it in the SQL output

2. **In `generateQuestionsSql`**:

   - It only gets the quiz ID from the quiz map
   - If the quiz ID is not found in the map, it generates a new one
   - It doesn't check against `knownQuizIds` at all

3. **Verification Issues**:
   - The `verifyCrossFileQuizIds` function is supposed to catch this inconsistency
   - However, it uses regex to extract IDs and assumes slugs and IDs appear in the same order
   - This approach is error-prone and may miss inconsistencies

## Solution Plan

### 1. Fix the Quiz Map Generator

Ensure the quiz map is always consistent with `knownQuizIds`:

```typescript
export function generateQuizMap(quizzesDir: string): Map<string, string> {
  const quizMap = new Map<string, string>();

  // Get all .mdoc files in the quizzes directory
  const quizFiles = fs
    .readdirSync(quizzesDir)
    .filter((file) => file.endsWith('.mdoc'));

  console.log(`Found ${quizFiles.length} quiz files to process.`);

  // First, add all known IDs to the map
  for (const [slug, id] of Object.entries(knownQuizIds)) {
    quizMap.set(slug, id);
    console.log(`Using known ID ${id} for quiz ${slug}`);
  }

  // Then process any remaining quizzes without known IDs
  for (const file of quizFiles) {
    const slug = path.basename(file, '.mdoc');

    // Skip if we already have a known ID for this quiz
    if (quizMap.has(slug)) {
      continue;
    }

    // Generate a new UUID if we don't have a known ID
    const quizId = uuidv4();
    quizMap.set(slug, quizId);
    console.log(
      `Generated new ID ${quizId} for quiz ${slug} (no known ID found)`,
    );
  }

  return quizMap;
}
```

### 2. Fix the Quizzes SQL Generator

Ensure it always uses IDs from the quiz map (which now prioritizes `knownQuizIds`):

```typescript
export function generateQuizzesSql(
  quizzesDir: string,
  quizMap: Map<string, string>,
): string {
  // ... existing code ...

  // Process each quiz file
  for (const file of quizFiles) {
    // ... existing code ...

    // Get the quiz slug
    const quizSlug = path.basename(file, '.mdoc');

    // Get the quiz ID from the map
    const quizId = quizMap.get(quizSlug);

    if (!quizId) {
      console.error(`Error: No ID found for quiz ${quizSlug}`);
      continue;
    }

    // Verify this matches knownQuizIds if it exists there
    if (knownQuizIds[quizSlug] && knownQuizIds[quizSlug] !== quizId) {
      console.error(
        `Critical Error: ID mismatch for quiz ${quizSlug}. Using ${quizId} but knownQuizIds has ${knownQuizIds[quizSlug]}`,
      );
      // This should never happen with our fixed generateQuizMap
    }

    console.log(`Generating SQL for quiz ${quizSlug} with ID ${quizId}`);

    // ... rest of the function ...
  }
}
```

### 3. Fix the Questions SQL Generator

Make it use the same approach as the quizzes generator:

```typescript
export function generateQuestionsSql(
  quizzesDir: string,
  quizMap: Map<string, string>,
): string {
  // ... existing code ...

  // Process each quiz file
  for (const file of quizFiles) {
    // ... existing code ...

    // Get the quiz slug and UUID
    const quizSlug = path.basename(file, '.mdoc');
    const quizId = quizMap.get(quizSlug);

    // If the quiz ID is not found in the map, log an error and skip
    if (!quizId) {
      console.error(
        `Error: No ID found for quiz ${quizSlug} in questions SQL. Skipping.`,
      );
      continue;
    }

    // Verify this matches knownQuizIds if it exists there
    if (knownQuizIds[quizSlug] && knownQuizIds[quizSlug] !== quizId) {
      console.error(
        `Critical Error: ID mismatch for quiz ${quizSlug}. Using ${quizId} but knownQuizIds has ${knownQuizIds[quizSlug]}`,
      );
      // This should never happen with our fixed generateQuizMap
    }

    // ... rest of the function ...
  }
}
```

### 4. Improve the Cross-File Verification

Enhance the verification to more accurately detect inconsistencies:

```typescript
export function verifyCrossFileQuizIds(
  quizzesSql: string,
  questionsSql: string,
): boolean {
  // ... existing code for extracting IDs ...

  // Extract slug-ID pairs from quizzes SQL
  const quizSlugToId = new Map<string, string>();
  const quizRegex =
    /INSERT INTO payload\.course_quizzes[\s\S]*?id = '([^']+)'[\s\S]*?slug = '([^']+)'[\s\S]*?ON CONFLICT/g;

  while ((match = quizRegex.exec(quizzesSql)) !== null) {
    const id = match[1];
    const slug = match[2];
    if (id && slug) {
      quizSlugToId.set(slug, id);
    }
  }

  // Check if all quiz IDs match those in knownQuizIds
  for (const [slug, id] of quizSlugToId.entries()) {
    if (knownQuizIds[slug] && id !== knownQuizIds[slug]) {
      console.error(
        `Error: ID mismatch for quiz ${slug}. SQL has ${id}, knownQuizIds has ${knownQuizIds[slug]}`,
      );
      allExist = false;
    }
  }

  // ... rest of the function ...
}
```

### 5. Add a Pre-Generation Verification Step

Add a verification step before generating SQL files to ensure consistency:

```typescript
function verifyQuizMapConsistency(quizMap: Map<string, string>): boolean {
  let isConsistent = true;

  // Check that all entries in knownQuizIds are in the map with the same ID
  for (const [slug, id] of Object.entries(knownQuizIds)) {
    if (!quizMap.has(slug)) {
      console.error(
        `Error: Quiz ${slug} is in knownQuizIds but not in the quiz map`,
      );
      isConsistent = false;
    } else if (quizMap.get(slug) !== id) {
      console.error(
        `Error: ID mismatch for quiz ${slug}. Map has ${quizMap.get(slug)}, knownQuizIds has ${id}`,
      );
      isConsistent = false;
    }
  }

  return isConsistent;
}

// Use in generateSqlSeedFiles
async function generateSqlSeedFiles() {
  // ... existing code ...

  // Generate a map of quiz slugs to UUIDs
  const quizMap = generateQuizMap(RAW_QUIZZES_DIR);

  // Verify quiz map consistency before proceeding
  if (!verifyQuizMapConsistency(quizMap)) {
    throw new Error('Quiz map consistency verification failed');
  }

  // ... rest of the function ...
}
```

## Implementation Steps

1. Update `quiz-map-generator.ts` to ensure the quiz map is always consistent with `knownQuizIds`
2. Modify `generate-quizzes-sql.ts` to use IDs from the quiz map consistently
3. Update `generate-questions-sql.ts` to use the same approach as the quizzes generator
4. Enhance `verify-cross-file-quiz-ids.ts` to more accurately detect inconsistencies
5. Add a pre-generation verification step to ensure consistency
6. Run the SQL generation process again to create consistent seed files
7. Test the migration process to ensure it completes successfully

## Expected Outcome

After implementing these changes:

1. The quiz map will be generated with consistent IDs from `knownQuizIds`
2. Both the quizzes SQL and questions SQL will use the same IDs
3. The verification functions will catch any inconsistencies before they cause issues
4. The migration process will complete successfully without foreign key constraint violations

This will ensure that the quiz IDs are consistent across all parts of the system, preventing foreign key constraint violations during the migration process.
