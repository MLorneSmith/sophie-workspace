# Content Migration System Fix Implementation Plan

## Overview

This document outlines the implementation plan to fix the foreign key constraint violation error that occurs during the content migration process when running `reset-and-migrate.ps1`. The specific error is:

```
Error in content processing migration: error: insert or update on table "course_lessons" violates foreign key constraint "course_lessons_quiz_id_fkey"
Key (quiz_id)=(b48a3ab3-25a8-457f-a510-39ef3311ddb4) is not present in table "course_quizzes".
```

## Issue and Root Cause Analysis

### Issue:

- When running `reset-and-migrate.ps1`, the migration process fails with a foreign key constraint violation error.
- The error occurs during the execution of the `20250403_200000_process_content.ts` migration file, which is responsible for executing SQL seed files to populate content in the database.
- Specifically, the error happens when trying to insert data into the `course_lessons` table with a quiz_id that doesn't exist in the `course_quizzes` table.

### Root Cause:

- In `02-lessons.sql`, the "Standard Graphs" lesson (slug: "basic-graphs") is being created with a quiz_id of `b48a3ab3-25a8-457f-a510-39ef3311ddb4`.
- However, this quiz ID doesn't exist in the `03-quizzes.sql` file, causing the foreign key constraint violation.
- The SQL seed files are generated programmatically from raw data files (\*.mdoc) using the `generate-sql-seed-files-fixed.ts` script.
- The issue is that the UUID generation for quizzes is not consistent across regenerations, leading to mismatches between the quiz IDs referenced in lessons and the actual quiz IDs.
- The `03a-lesson-quiz-references.sql` file attempts to fix this by updating the quiz_id, but it's looking for a different ID (`0c8004e3-7591-453f-ac8a-97e1c1e327db`) than what's in the lessons file.

## Solution

The solution is to modify the SQL seed file generation process to ensure consistent UUIDs across regenerations. This will prevent the foreign key constraint violation error from occurring when running `reset-and-migrate.ps1`.

### Key Components of the Solution:

1. **Consistent UUID Generation**: Modify `generate-sql-seed-files-fixed.ts` to use a predefined mapping of quiz slugs to UUIDs, ensuring that the same UUID is used for a given quiz across regenerations.

2. **Verification Step**: Add a verification step to the migration process to check for quiz ID consistency before proceeding with the migration.

3. **Improved Error Handling**: Enhance error handling in the migration process to provide more informative error messages when issues occur.

## Implementation Steps

### Step 1: Modify the Quiz UUID Generation System

In `packages/content-migrations/src/scripts/sql/generate-sql-seed-files-fixed.ts`, add a `knownQuizIds` mapping and update the `generateQuizMap` function:

```typescript
// Define fixed UUIDs for known quizzes for consistency
const knownQuizIds: Record<string, string> = {
  'basic-graphs-quiz': 'b48a3ab3-25a8-457f-a510-39ef3311ddb4',
  'tables-vs-graphs-quiz': '475d945e-3339-49bd-8656-12f5b58447d0',
  'fact-persuasion-quiz': '9745028e-4973-4f74-9555-263befbb8a2d',
  'gestalt-principles-quiz': 'aad1ab9e-a591-40a6-bd41-6789cdcfeffb',
  'idea-generation-quiz': 'bced1ae3-db3e-41ac-b2f6-96e1cdea4abd',
  'introductions-quiz': 'c162a80e-bef5-4753-b58b-c22370f55c10',
  'our-process-quiz': '12381d77-63c2-49e1-8677-dc8aac806665',
  'overview-elements-of-design-quiz': '1ef6ab15-b344-4c0e-bea1-99b5df6f001e',
  'performance-quiz': '59ee15ce-707e-4a6b-9da3-c0c6dc09187e',
  'preparation-practice-quiz': 'd21b373b-2e76-4bfd-ba80-cc765d93f173',
  'slide-composition-quiz': '511130c3-981f-4666-aceb-bd9d18c46857',
  'specialist-graphs-quiz': 'ce0de613-77d2-4cb4-8a78-4c44a475aa5b',
  'storyboards-in-film-quiz': '930424d4-65cd-48e6-9f30-7bb3da41c82b',
  'storyboards-in-presentations-quiz': '45417960-af6b-440b-b233-783adf3b398a',
  'structure-quiz': 'ad0aac61-8c6c-4359-9c33-8ddd1f36ba04',
  'the-who-quiz': 'b544658d-e4e0-4d28-bc00-52e9348392f9',
  'using-stories-quiz': 'b976d4fe-e907-45fe-9beb-6a8c9a152c72',
  'visual-perception-quiz': '868717f4-e922-41fb-be0f-40f145095ec0',
  'why-next-steps-quiz': 'd5f4f1a6-c0fe-4c45-9baf-cdfdc88e37f9',
};

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

### Step 2: Create a Quiz ID Verification Script

Create a new script `verify-quiz-ids.ts` in `packages/content-migrations/src/scripts/verification/`:

```typescript
/**
 * Verify Quiz IDs
 *
 * This script verifies that all quiz IDs referenced in lessons exist in the quizzes table.
 * It's designed to be run as part of the migration process to catch inconsistencies early.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { PAYLOAD_SQL_SEED_DIR } from '../../config/paths.js';

/**
 * Verifies that all quiz IDs referenced in lessons exist in the quizzes table
 */
async function verifyQuizIds(): Promise<boolean> {
  console.log('Verifying quiz ID consistency...');

  try {
    // Read the lessons SQL file
    const lessonsSqlPath = path.join(PAYLOAD_SQL_SEED_DIR, '02-lessons.sql');
    const lessonsSql = fs.readFileSync(lessonsSqlPath, 'utf8');

    // Read the quizzes SQL file
    const quizzesSqlPath = path.join(PAYLOAD_SQL_SEED_DIR, '03-quizzes.sql');
    const quizzesSql = fs.readFileSync(quizzesSqlPath, 'utf8');

    // Extract quiz IDs from lessons SQL
    const lessonQuizIds = extractQuizIdsFromLessonsSql(lessonsSql);
    console.log(`Found ${lessonQuizIds.size} quiz IDs referenced in lessons`);

    // Extract quiz IDs from quizzes SQL
    const quizIds = extractQuizIdsFromQuizzesSql(quizzesSql);
    console.log(`Found ${quizIds.size} quiz IDs defined in quizzes`);

    // Check if all lesson quiz IDs exist in quizzes
    let allQuizIdsExist = true;
    for (const [lessonTitle, quizId] of lessonQuizIds.entries()) {
      if (!quizIds.has(quizId)) {
        console.error(
          `❌ Quiz ID ${quizId} referenced in lesson "${lessonTitle}" does not exist in quizzes`,
        );
        allQuizIdsExist = false;
      }
    }

    if (allQuizIdsExist) {
      console.log('✅ All quiz IDs referenced in lessons exist in quizzes');
      return true;
    } else {
      console.error(
        '❌ Some quiz IDs referenced in lessons do not exist in quizzes',
      );
      return false;
    }
  } catch (error) {
    console.error('Error verifying quiz IDs:', error);
    return false;
  }
}

/**
 * Extracts quiz IDs from lessons SQL
 * @param lessonsSql - Lessons SQL content
 * @returns Map of lesson titles to quiz IDs
 */
function extractQuizIdsFromLessonsSql(lessonsSql: string): Map<string, string> {
  const lessonQuizIds = new Map<string, string>();
  const lessonRegex =
    /-- Insert lesson: (.*?)[\r\n]+INSERT INTO payload\.course_lessons[\s\S]*?quiz_id = '([^']+)'[\s\S]*?ON CONFLICT/g;

  let match;
  while ((match = lessonRegex.exec(lessonsSql)) !== null) {
    const lessonTitle = match[1];
    const quizId = match[2];
    lessonQuizIds.set(lessonTitle, quizId);
  }

  return lessonQuizIds;
}

/**
 * Extracts quiz IDs from quizzes SQL
 * @param quizzesSql - Quizzes SQL content
 * @returns Set of quiz IDs
 */
function extractQuizIdsFromQuizzesSql(quizzesSql: string): Set<string> {
  const quizIds = new Set<string>();
  const quizRegex =
    /INSERT INTO payload\.course_quizzes[\s\S]*?id = '([^']+)'[\s\S]*?ON CONFLICT/g;

  let match;
  while ((match = quizRegex.exec(quizzesSql)) !== null) {
    const quizId = match[1];
    quizIds.add(quizId);
  }

  return quizIds;
}

// Run the verification if this script is executed directly
if (import.meta.url === import.meta.resolve('./verify-quiz-ids.ts')) {
  verifyQuizIds()
    .then((success) => {
      if (success) {
        console.log('Quiz ID verification completed successfully');
        process.exit(0);
      } else {
        console.error('Quiz ID verification failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Error during quiz ID verification:', error);
      process.exit(1);
    });
}

export { verifyQuizIds };
```

### Step 3: Update the Process Raw Data Script

Modify `packages/content-migrations/src/scripts/process/process-raw-data.ts` to include the quiz ID verification step:

```typescript
// Import the verifyQuizIds function
import { verifyQuizIds } from '../verification/verify-quiz-ids.js';

/**
 * Processes all raw data
 */
async function processRawData(): Promise<void> {
  console.log('Starting raw data processing...');

  try {
    // Ensure all directories exist
    ensureDirectoriesExist();

    // Generate SQL seed files
    console.log('Generating SQL seed files...');
    await generateSqlSeedFiles();

    // Verify quiz ID consistency
    console.log('Verifying quiz ID consistency...');
    const quizIdsConsistent = await verifyQuizIds();
    if (!quizIdsConsistent) {
      console.warn(
        'WARNING: Quiz ID inconsistencies detected. This may cause issues during migration.',
      );
    }

    // Copy SQL seed files to the processed directory
    await copySqlSeedFiles();

    // Create a metadata file with processing timestamp
    const metadata = {
      processedAt: new Date().toISOString(),
      rawDataDir: RAW_DATA_DIR,
      processedDataDir: PROCESSED_DATA_DIR,
      quizIdsConsistent,
    };

    fs.writeFileSync(
      path.join(PROCESSED_DATA_DIR, 'metadata.json'),
      JSON.stringify(metadata, null, 2),
    );

    console.log('Raw data processing completed successfully.');
  } catch (error) {
    console.error('Error processing raw data:', error);
    throw error;
  }
}
```

### Step 4: Update the Reset and Migrate Script

Modify `reset-and-migrate.ps1` to include a verification step for quiz ID consistency:

```powershell
# Add to the "STEP 4: Check and process raw data if needed" section
Log-Message "  Verifying quiz ID consistency..." "Yellow"
$quizIdVerification = Exec-Command -command "pnpm --filter @kit/content-migrations run verify:quiz-ids" -description "Verifying quiz ID consistency" -captureOutput

if ($quizIdVerification -match "Some quiz IDs referenced in lessons do not exist in quizzes") {
    Log-Message "WARNING: Quiz ID inconsistencies detected. This may cause issues during migration." "Yellow"

    # Ask if the user wants to continue
    $continue = $false
    if ($env:CI) {
        $continue = $true
    } elseif (-not $env:CI) {
        # Only ask in interactive mode
        $response = Read-Host "Quiz ID inconsistencies detected. Do you want to continue? (y/N)"
        if ($response -eq "y" -or $response -eq "Y") {
            $continue = $true
        }
    }

    if (-not $continue) {
        Log-Message "Migration aborted due to quiz ID inconsistencies." "Red"
        throw "Quiz ID inconsistencies detected"
    }
}
```

### Step 5: Update the Package.json Scripts

Add the new verification script to the `package.json` scripts in `packages/content-migrations/package.json`:

```json
{
  "scripts": {
    // ... existing scripts
    "verify:quiz-ids": "tsx src/scripts/verification/verify-quiz-ids.ts"
  }
}
```

## Testing Plan

After implementing the changes, we'll test the system by:

1. Running the `pnpm run process:raw-data` script to regenerate the SQL seed files with consistent quiz IDs.

2. Verifying that the quiz ID verification script correctly identifies any inconsistencies:

   - Run `pnpm --filter @kit/content-migrations run verify:quiz-ids` to check for quiz ID inconsistencies.
   - Verify that all quiz IDs referenced in lessons exist in quizzes.

3. Running the `reset-and-migrate.ps1` script to reset the database and run the migrations with the fixed files:
   - Verify that the migration completes successfully without any foreign key constraint violations.
   - Check that all lessons are correctly associated with their quizzes in the database.

## Conclusion

By implementing these changes, we will fix the foreign key constraint violation error that occurs during the content migration process. The solution ensures consistent UUIDs across regenerations, adds verification steps to catch inconsistencies early, and improves error handling in the migration process.

This will make the `reset-and-migrate.ps1` script more robust and reliable, ensuring that it works correctly every time it's run.
