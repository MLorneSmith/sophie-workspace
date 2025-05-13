# Plan: Refactor Stage 2 Content Seeding with a Central Orchestrator

**Date:** May 12, 2025
**Objective:** To improve the reliability of the Stage 2 core content seeding process by introducing a central TypeScript orchestrator (`run-stage-2.ts`). This will manage a single Payload client instance and allow for graceful database connection closure, eliminating the need for `process.exit(0)` in individual seeder scripts and reducing the likelihood of data availability issues for subsequent stages.

## 1. Current Problem

Individual Stage 2 seeder scripts (e.g., `seed-courses.ts`, `seed-quiz-questions.ts`) are executed as separate processes by `Initialize-PayloadData.ps1`. Each script initializes its own Payload client and uses `process.exit(0)` to terminate, as attempts to close the database connection gracefully cause the scripts to hang. This abrupt termination is suspected to cause incomplete data commits, leading to failures in Stage 3 when trying to link relationships to data supposedly created in Stage 2.

## 2. Proposed Solution: Central Orchestrator for Stage 2

A new TypeScript script, `run-stage-2.ts`, will be created within `packages/payload-local-init/stage-2-seed-core/`. This script will:

1.  Initialize a single Payload client instance at its start.
2.  Import and execute the main logic of each existing Stage 2 seeder script sequentially, passing the shared Payload client instance to them.
3.  Collect any necessary outputs (like ID maps) from these seeder functions.
4.  Write consolidated map files if needed.
5.  Gracefully close the shared Payload client instance at its end.

## 3. Detailed Steps

### Step 3.1: Create `run-stage-2.ts` Orchestrator

- **File Location:** `packages/payload-local-init/stage-2-seed-core/run-stage-2.ts`
- **Functionality:**
  - Import `getPayload` and the Payload `config`.
  - Import the main seeding functions from each individual seeder script (these will need to be exported from those scripts - see Step 3.2).
  - Define the order of execution for the seeders.
  - **Main Function (`runAllStage2Seeders`):**
    - Initialize Payload: `const payload = await getPayload({ config });`
    - Initialize an empty object to hold all ID maps (e.g., `allIdMaps = {}`).
    - **Execute Seeders Sequentially:**
      - Call `await seedCourses(payload);` (and similar for other seeders).
      - If a seeder function needs to return an ID map (like `seedQuizQuestions`), it should do so, and `run-stage-2.ts` will merge it into `allIdMaps`. Example: `const questionMap = await seedQuizQuestions(payload); allIdMaps.quizQuestions = questionMap;`
    - **Write Consolidated Map Files:** After all seeders run, write any necessary map files from `allIdMaps`.
    - **Graceful Shutdown:**
      ```typescript
      try {
        // Attempt to close the database connection
        if (
          payload &&
          payload.db &&
          typeof (payload.db.drizzle as any)?.$client?.end === 'function'
        ) {
          await (payload.db.drizzle as any).$client.end();
          console.log(
            'Database connection closed successfully by run-stage-2.ts.',
          );
        } else if (
          payload &&
          payload.db &&
          typeof (payload.db.drizzle as any)?.end === 'function'
        ) {
          await (payload.db.drizzle as any).end({ timeout: 5 });
          console.log(
            'Drizzle instance (postgres.js) ended successfully by run-stage-2.ts.',
          );
        } else {
          console.warn(
            'Could not determine how to close DB connection in run-stage-2.ts.',
          );
        }
      } catch (e) {
        console.error(
          'Error closing database connection in run-stage-2.ts:',
          e,
        );
      }
      ```
    - Handle errors globally within this script. If any seeder function throws an error, catch it, log it, and exit `run-stage-2.ts` with a non-zero code.

### Step 3.2: Refactor Individual Stage 2 Seeder Scripts

For each existing seeder script in `packages/payload-local-init/stage-2-seed-core/` (e.g., `seed-courses.ts`, `seed-quiz-questions.ts`, `seed-course-lessons.ts`, etc.):

1.  **Modify the Main Function:**
    - Change the main function (e.g., `seedCourses`) to accept `payload: Payload` as a parameter.
    - Remove the local `await getPayload({ config });` call.
2.  **Export the Main Function:** Ensure the main seeding function is exported.
3.  **Return ID Maps (if applicable):**
    - For scripts that generate ID maps (like `seed-quiz-questions.ts`), modify the function to return the map object instead of writing it to a file directly. The file writing will be handled by `run-stage-2.ts`.
    - Example for `seed-quiz-questions.ts`:
      ```typescript
      // export async function seedQuizQuestions(payload: Payload): Promise<Record<string, string>> {
      //   ...
      //   // Remove fs.writeFileSync for the map
      //   ...
      //   return ssotQuestionIdToLiveQuestionIdMap;
      // }
      ```
4.  **Remove `process.exit(0)` and `process.exit(1)`:** These will no longer be needed as the script won't hang and errors will be propagated to `run-stage-2.ts`.
5.  **Remove `finally` Block for DB Closure:** The shared client's lifecycle is managed by `run-stage-2.ts`.

**Example Snippet for a refactored `seed-quiz-questions.ts`:**

```typescript
// packages/payload-local-init/stage-2-seed-core/seed-quiz-questions.ts
import type { Payload } from 'payload';
import { v4 as uuidv4 } from 'uuid';

// Ensure QuizQuestionDefinition and ALL_QUIZ_QUESTIONS are correctly imported if needed by the logic
// import { QuizQuestionDefinition } from '../data/definitions/quiz-types.js';
// import { ALL_QUIZ_QUESTIONS } from '../data/quizzes-quiz-questions-truth.js';

// Helper function generateSlug (keep as is or move to a shared util)

export async function seedQuizQuestions(
  payload: Payload,
): Promise<Record<string, string>> {
  console.log('Executing: Seed Unique Quiz Questions (via orchestrator)...');
  const ssotQuestionIdToLiveQuestionIdMap: Record<string, string> = {};
  // Assuming ALL_QUIZ_QUESTIONS is correctly imported and structured
  const uniqueQuestions = Object.values(ALL_QUIZ_QUESTIONS);

  try {
    // ... (rest of the looping and payload.create logic remains similar) ...
    // Ensure to use the passed-in 'payload' instance.
    // Do NOT call payload.init() or getPayload() here.
    // Do NOT call process.exit() here.

    for (const question of uniqueQuestions) {
      // ... existing logic to create/check question ...
      // On creation or finding existing:
      // const liveQuestionId = ...; // This would be the new or existing UUID
      // ssotQuestionIdToLiveQuestionIdMap[question.id] = liveQuestionId;
    }
    console.log(
      'Unique Quiz Questions seeding completed by seedQuizQuestions function.',
    );
    return ssotQuestionIdToLiveQuestionIdMap;
  } catch (error: any) {
    console.error(
      'Error during seedQuizQuestions function:',
      error.message,
      error.stack,
    );
    throw error; // Propagate error to the orchestrator
  }
}
```

### Step 3.3: Update `package.json` for `@slideheroes/payload-local-init`

- Add a new script to execute `run-stage-2.ts`:
  ```json
  "scripts": {
    // ... existing scripts ...
    "stage2:seed-all": "tsx ./stage-2-seed-core/run-stage-2.ts"
  }
  ```

### Step 3.4: Modify `Initialize-PayloadData.ps1`

- In the "Stage 2: Core Content Seeding" section, replace all individual `pnpm --filter @slideheroes/payload-local-init run seed:<collection_name>` calls with a single call to the new orchestrator script:

  ```powershell
  # Stage 2: Core Content Seeding
  if (-not $SkipSeedCore.IsPresent) {
      Write-Host "Executing Stage 2: Seed Core Content (Orchestrated)..."
      $env:DISABLE_NESTED_DOCS_PLUGIN = 'true' # Keep this if needed

      Write-Host "Running run-stage-2.ts (via pnpm run stage2:seed-all)..."
      pnpm --filter @slideheroes/payload-local-init run stage2:seed-all
      if ($LASTEXITCODE -ne 0) { $env:DISABLE_NESTED_DOCS_PLUGIN = $null; throw "Stage 2: Orchestrated core content seeding (run-stage-2.ts) failed." }

      $env:DISABLE_NESTED_DOCS_PLUGIN = $null
      Write-Host "Stage 2 completed."
  } else {
      Write-Host "Skipping Stage 2: Seed Core Content."
  }
  ```

## 4. Testing and Verification

1.  Implement the changes for `run-stage-2.ts` and a couple of key seeders first (e.g., `seed-quiz-questions.ts` and `seed-course-quizzes.ts`).
2.  Run `Initialize-PayloadData.ps1` (potentially skipping other stages initially to focus on Stage 2).
3.  Verify:
    - `run-stage-2.ts` completes without hanging.
    - Data is created correctly in the database.
    - ID map files are written correctly by `run-stage-2.ts`.
    - The subsequent Stage 3 (`populateQuizQuestionRelationships.ts`) now runs without the foreign key constraint errors.
4.  Incrementally refactor the remaining Stage 2 seeder scripts.
5.  Perform full E2E testing of `Initialize-PayloadData.ps1`.

## 5. Benefits

- Centralized management of Payload client and DB connection for Stage 2.
- Elimination of `process.exit(0)` in individual seeders.
- More reliable data commits and availability for subsequent stages.
- Improved error handling and logging for Stage 2 as a whole.
- Consistency in approach with the already refactored Stage 3.

## 6. Potential Challenges

- Ensuring all individual seeder scripts are correctly refactored to work as imported modules.
- Managing the order of execution and dependencies between seeders within `run-stage-2.ts` if any implicit dependencies exist.
- Consolidating ID map generation and writing logic.
