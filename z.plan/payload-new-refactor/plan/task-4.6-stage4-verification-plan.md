# Implementation Plan: Task 4.6 - Develop Stage 4 (Verification) Modules

**Version:** 1.0
**Date:** May 13, 2025
**Parent Task (Master Plan):** 4.6. Develop Stage 4 (Verification) Modules
**Related Design Document:** `z.plan/payload-new-refactor/design/payload-refactor-design-requirements-v2.md`
**Depends On:**
*   Task 4.5: Stage 3 (Relationship Population) Modules are functional.
*   `AggregatedIdMaps` from Stage 2 are accurate and available.
*   SSOT files are finalized and accessible.
*   The main Node.js orchestrator can invoke the Stage 4 orchestrator and pass necessary data (Payload client, logger, ID maps, CLI args).

## 1. Introduction

**Objective:** To implement the TypeScript modules for Stage 4: Data Verification. These scripts will perform read-only checks against the populated Payload CMS database, comparing its state (documents, fields, relationships) with the Single Sources of Truth (SSOTs) and general data integrity rules. The primary output will be logs detailing any discrepancies found; these scripts will **not** attempt to modify data.

**Location of Modules:** `apps/payload/src/init-scripts/verifiers/` for individual verifiers, and `apps/payload/src/init-scripts/stages/stage4-verify-data.ts` for the Stage 4 orchestrator.

## 2. Prerequisites

*   Stages 0 through 3 of the data initialization process have been successfully executed.
*   The main orchestrator provides an initialized Payload client, a logger instance, parsed CLI arguments, and the `AggregatedIdMaps` to the Stage 4 orchestrator.
*   A mechanism for executing direct, read-only SQL queries against the database is available (e.g., a shared `pg.Client` instance or a utility function wrapping it).

## 3. Stage 4 Orchestrator Module

**File:** `apps/payload/src/init-scripts/stages/stage4-verify-data.ts`

### 3.1. Function Definition
```typescript
// apps/payload/src/init-scripts/stages/stage4-verify-data.ts
import type { Payload } from 'payload';
import type { Logger } from 'pino';
import type { AggregatedIdMaps } from './stage2-seed-core-content';
// Import individual verifier functions
// e.g., import { verifyDocumentCounts } from '../verifiers/verify-document-counts';

interface Stage4Args {
  skipVerification?: boolean;
  // Potentially other args
}

export async function runStage4_VerifyData(
  payload: Payload,
  logger: Logger,
  cliArgs: Stage4Args,
  idMaps: AggregatedIdMaps,
  // dbClient: pg.Client // Optional: if direct DB access is centralized here
): Promise<{ errorsFound: number }> { // Return a summary
  logger.info('Starting Stage 4: Data Verification...');
  let totalErrorsFound = 0;

  if (cliArgs.skipVerification) {
    logger.info('Stage 4: Skipped due to --skip-verification flag.');
    return { errorsFound: 0 };
  }

  try {
    // Initialize direct DB client if needed and not passed
    // const directDbClient = new Client({ connectionString: process.env.DATABASE_URI });
    // await directDbClient.connect();
    // logger.info('Direct DB client connected for verification.');

    // Execute verifiers sequentially
    // totalErrorsFound += await verifyDocumentCounts(payload, logger, idMaps, directDbClient);
    // totalErrorsFound += await verifySsotContentPresence(payload, logger, idMaps, directDbClient);
    // totalErrorsFound += await verifyRelationshipsIntegrity(payload, logger, idMaps, directDbClient);
    // totalErrorsFound += await verifyUniqueSlugs(payload, logger, directDbClient); // Might only need DB client
    // totalErrorsFound += await verifyRelatedItemCounts(payload, logger, idMaps, directDbClient);

    if (totalErrorsFound > 0) {
      logger.error(`Stage 4: Data Verification completed with ${totalErrorsFound} error(s).`);
    } else {
      logger.info('Stage 4: Data Verification completed successfully with no errors found.');
    }
    
    // await directDbClient.end();
    // logger.info('Direct DB client for verification closed.');

    return { errorsFound: totalErrorsFound };
  } catch (error) {
    logger.error({ err: error }, 'Critical error during Stage 4: Data Verification process.');
    // if (directDbClient) await directDbClient.end(); // Ensure closure on error
    throw error; // Propagate to main orchestrator
  }
}
```

## 4. Individual Verifier Functions

**Location:** `apps/payload/src/init-scripts/verifiers/`

**General Principles for Verifiers:**
*   Each verifier function should be `async` and accept `payload: Payload`, `logger: Logger`, `idMaps: AggregatedIdMaps`, and potentially a direct DB client (`dbClient: pg.Client`) and `cliArgs`.
*   Return `Promise<number>` representing the count of errors found by that specific verifier.
*   Log detailed messages for each discrepancy found using `logger.error()` or `logger.warn()`.
*   All database operations must be read-only.

### 4.1. `verify-document-counts.ts`
*   **Action:** Refactor existing `.mjs` script or create new.
*   **Logic:**
    *   For each core collection (Courses, Lessons, Quizzes, etc.):
        *   Determine the expected count of documents from the corresponding SSOT definition file (e.g., `ALL_COURSES.length`).
        *   Fetch the actual count from Payload: `const result = await payload.count({ collection: 'collection-slug' }); const actualCount = result.totalDocs;`.
        *   Compare `expectedCount` with `actualCount`. If different, log an error and increment local error counter.
*   **Return:** Number of collections with mismatched counts.

### 4.2. `verify-ssot-content-presence.ts`
*   **Logic:**
    *   Iterate through each SSOT definition file (e.g., `course-definitions.yaml`, `quiz-definitions.ts`).
    *   For each item defined in an SSOT:
        *   Use the `idMaps` to get the `liveDocumentId` corresponding to the item's SSOT identifier. If not in map, log error (should have been created in Stage 2).
        *   Fetch the document: `await payload.findByID({ collection: 'slug', id: liveDocumentId, depth: 0 })`.
        *   If document not found by `liveDocumentId`, log error.
        *   If found, compare key non-relationship fields (title, slug, description, custom attributes like `pass_threshold`, `question_type`, `correct_answer`, etc.) from the fetched document against the SSOT data. Log discrepancies.
        *   For Lexical JSON fields, verify they are not unexpectedly null or empty if content is expected. A deep comparison of Lexical JSON is complex; focus on presence and basic structure.
*   **Return:** Total number of content discrepancies found.

### 4.3. `verify-relationships-integrity.ts`
*   **Logic:**
    *   For each defined parent-child relationship (e.g., Lesson-Quiz, Quiz-Questions):
        *   Load the SSOT file that defines these relationship intents.
        *   Iterate through each parent SSOT item:
            *   Get `liveParentId` from `idMaps`.
            *   Fetch the parent document: `const parentDoc = await payload.findByID({ collection: 'parent-slug', id: liveParentId, depth: 1 });` (`depth: 1` to populate relationship fields).
            *   From SSOT, determine the expected `liveChildId(s)` using `idMaps`.
            *   **JSONB Field Check:** Compare the IDs in `parentDoc.relationshipFieldName` (e.g., `parentDoc.relatedQuiz.id` or `parentDoc.questions.map(q => q.id)`) with the `expectedLiveChildId(s)`. Log mismatches (missing children, extra children, incorrect children).
            *   **`_rels` Table Check (using `dbClient` for direct SQL):**
                *   Query the appropriate `_rels` table (e.g., `SELECT child_collection_id_column, _order FROM payload.parent_collection_rels_relationship_field_name WHERE _parent_id = $1 ORDER BY _order;`, binding `liveParentId`).
                *   Compare the returned child IDs and their order with `expectedLiveChildId(s)`. Log discrepancies.
                *   Verify the `path` column in the fetched `_rels` rows matches the `relationshipFieldName`. Log incorrect/null paths.
    *   **Orphan Checks (Direct SQL via `dbClient`):**
        *   For each `_rels` table (e.g., `payload.course_lessons_rels_related_quiz`):
            *   `SELECT * FROM payload.rels_table r LEFT JOIN payload.parent_table p ON r._parent_id = p.id WHERE p.id IS NULL;` Log any results as "Orphaned relationship: Parent missing".
            *   `SELECT * FROM payload.rels_table r LEFT JOIN payload.child_table c ON r.child_id_column = c.id WHERE c.id IS NULL;` Log any results as "Orphaned relationship: Child missing".
*   **Return:** Total number of relationship integrity issues found.

### 4.4. `verify-unique-slugs.ts`
*   **Logic (Direct SQL via `dbClient`):**
    *   For each collection that is supposed to have unique slugs (e.g., Courses, Lessons, Posts, Quizzes):
        *   Execute query: `SELECT slug, COUNT(*) FROM payload.collection_table_name GROUP BY slug HAVING COUNT(*) > 1;`.
        *   Log any slugs that appear more than once.
*   **Return:** Total number of non-unique slugs found across all checked collections.

### 4.5. `verify-related-item-counts.ts`
*   **Logic:** (This might overlap with `verify-relationships-integrity.ts` but focuses purely on counts)
    *   For each parent SSOT item that defines related children:
        *   Determine `expectedChildCount` from the SSOT.
        *   Get `liveParentId` from `idMaps`.
        *   Fetch parent: `const parentDoc = await payload.findByID({ ..., depth: 1 });`.
        *   `actualCountJsonb = parentDoc.relationshipFieldName?.length || 0` (handle null/undefined).
        *   Query `_rels` table: `SELECT COUNT(*) FROM payload.rels_table WHERE _parent_id = $1;`. Get `actualCountRels`.
        *   Compare `expectedChildCount` with `actualCountJsonb` and `actualCountRels`. Log discrepancies.
*   **Return:** Total number of parent documents with mismatched related item counts.

## 5. Direct Database Connection Utility

*   **Action:** If not already created for Stage 0, implement a simple utility in `apps/payload/src/init-scripts/utils/db-client.ts` to get and manage a `pg.Client` instance for read-only queries.
*   The Stage 4 orchestrator can create an instance of this client and pass it to verifiers that need direct SQL access. Ensure it's closed in the orchestrator's `finally` block.

## 6. Integration with Main Orchestrator

*   In `apps/payload/src/init-scripts/initialize-payload-data.ts`:
    *   Import `runStage4_VerifyData` from `../stages/stage4-verify-data`.
    *   Call it after Stage 3: `if (!cliArgs.skipVerification) { const verificationResult = await runStage4_VerifyData(payloadClient, logger, cliArgs, idMaps); if (verificationResult.errorsFound > 0) { /* logger.error, potentially set overall script to fail */ } }`.
    *   The main orchestrator should consider `errorsFound > 0` from Stage 4 as a failure of the overall process and exit with a non-zero code.

## 7. Testing Strategy

*   **Individual Verifier Tests:**
    1.  Run the full initialization process (Stages 0-3) to get a baseline dataset.
    2.  Manually introduce specific data inconsistencies into the database that a particular verifier is designed to catch (e.g., delete a child document to create an orphan, duplicate a slug, alter a field value to mismatch SSOT).
    3.  Modify `initialize-payload-data.ts` to run *only* the target verifier function (or the Stage 4 orchestrator calling only that verifier).
    4.  Run `pnpm --filter payload run init:data`.
    5.  **Verify:** The specific verifier correctly logs the introduced discrepancy.
*   **Full Stage 4 Test:**
    *   Run the entire `pnpm --filter payload run init:data` process on a clean database.
    *   **Verify:** Review all logs from Stage 4. Ideally, no errors should be reported. If errors are reported, it indicates issues in Stages 2 or 3 that need addressing.

## 8. Deliverables for Task 4.6

*   The Stage 4 orchestrator module: `apps/payload/src/init-scripts/stages/stage4-verify-data.ts`.
*   All individual verifier modules (e.g., `verify-document-counts.ts`, `verify-ssot-content-presence.ts`, `verify-relationships-integrity.ts`, `verify-unique-slugs.ts`, `verify-related-item-counts.ts`) in `apps/payload/src/init-scripts/verifiers/`.
*   If created, the direct database connection utility.
*   Updated main orchestrator (`initialize-payload-data.ts`) to correctly invoke the Stage 4 orchestrator and handle its error summary.
*   Successful test runs demonstrating that verifiers can accurately detect various data inconsistencies.
*   Documentation on interpreting the output of the verification stage.

This completes the detailed planning for all stages of the new Node.js-based data initialization system.
