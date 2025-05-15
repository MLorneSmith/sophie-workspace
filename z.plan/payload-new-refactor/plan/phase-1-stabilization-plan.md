# Implementation Plan: Phase 1 - Payload CMS Application Setup & Stabilization

**Version:** 1.0
**Date:** May 13, 2025
**Related Master Plan:** `z.plan/payload-new-refactor/plan/master-implementation-plan.md`
**Related Design Document:** `z.plan/payload-new-refactor/design/payload-refactor-design-requirements-v2.md`

## 1. Introduction

**Objective:** To establish a stable and correctly configured Payload CMS application foundation within `apps/payload`. This phase is critical for ensuring that core Payload CLI tools (`payload generate:types`, `payload migrate`) operate reliably, which is a prerequisite for the subsequent data initialization and seeding phases. This may involve temporarily simplifying complex fields within collection definitions.

## 2. Prerequisites

*   A functional Supabase instance is available and connection details are known.
*   The `apps/payload` directory contains an initialized Payload CMS project.
*   Environment variables are correctly set up in a relevant `.env` file (e.g., at the monorepo root or `apps/payload/.env`) for `DATABASE_URI`, `PAYLOAD_SECRET`, and any other essential variables for Payload to connect to the database and start.
*   `pnpm` is installed and the project dependencies are installed.

## 3. Task 3.1: Verify & Finalize Core `apps/payload` Setup

**Objective:** Confirm that the basic Payload configuration is sound and the server can start.

*   **3.1.1. Review `apps/payload/src/payload.config.ts`:**
    *   **Action:** Open and inspect the main Payload configuration file.
    *   **Verification Points:**
        *   Ensure `db` adapter (e.g., `postgresAdapter`) is configured to use `process.env.DATABASE_URI`.
        *   Ensure `secret` is configured to use `process.env.PAYLOAD_SECRET`.
        *   Verify the `admin` user configuration is present and minimal.
        *   Verify essential plugin configurations (e.g., S3/R2 storage if used by `Media` collection) are present.
    *   **Initial Simplification:** For this initial verification, temporarily comment out:
        *   All non-essential plugins.
        *   Complex global configurations or hooks if any are present at the top level of `buildConfig`.
        *   All collections except `Users` and `Media` (or the simplest available collections). This is to isolate core app startup from collection-specific issues.

*   **3.1.2. Test Basic Payload Server Startup:**
    *   **Action:** From the monorepo root, run the command to start the Payload development server: `pnpm --filter payload dev`.
    *   **Expected Outcome:** The Payload server should start without critical errors. The admin panel should be accessible in a browser.
    *   **Troubleshooting:** If errors occur, they are likely related to the core `payload.config.ts` (e.g., DB connection, secret, fundamental plugin issues). Address these before proceeding.

## 4. Task 3.2: Systematically Stabilize Collection Definitions

**Objective:** Ensure all necessary collections can be loaded by Payload, and that `payload generate:types` and `payload migrate` can run successfully with all collections active, even if some complex fields within those collections are temporarily simplified.

*   **Methodology:** This is an iterative process. For each collection added or modified, a cycle of `generate:types` and `migrate` will be performed.

*   **4.2.1. Establish Baseline with Simplest Collections:**
    *   **Action:**
        1.  In `apps/payload/src/payload.config.ts`, ensure only the most basic and stable collections are active in the `collections` array (e.g., `Users`, `Media`). Comment out all others.
        2.  Ensure the corresponding collection definition files (e.g., `apps/payload/src/collections/Users.ts`, `apps/payload/src/collections/Media.ts`) are in their full, original state (or as intended for the refactor).
    *   **Test Cycle:**
        1.  Run `pnpm --filter payload payload generate:types` from the monorepo root.
            *   **Expected:** Success. If errors, debug the `Users` or `Media` collection definitions.
        2.  Run `pnpm --filter payload payload migrate` from the monorepo root.
            *   **Expected:** Success. If errors, debug schema issues in `Users` or `Media`.

*   **4.2.2. Incrementally Add and Stabilize Each Collection:**
    *   **Action:** One by one, add the remaining collections to the `collections` array in `apps/payload/src/payload.config.ts`. A suggested order (from potentially simpler to more complex, or based on known past issues):
        1.  `Downloads`
        2.  `Posts`
        3.  `Documentation`
        4.  `Private` (if distinct from Posts and simple)
        5.  `Courses`
        6.  `CourseLessons`
        7.  `CourseQuizzes`
        8.  `QuizQuestions`
        9.  `Surveys`
        10. `SurveyQuestions`
    *   **For EACH collection added:**
        1.  **Initial State:** Ensure the collection's `.ts` definition file (`apps/payload/src/collections/<CollectionName>.ts`) is included with its full, intended field definitions.
        2.  **Test `generate:types`:** Run `pnpm --filter payload payload generate:types`.
            *   **If it hangs or errors:** The newly added collection's definition (or its interaction with previously added ones) is problematic. Proceed to **Step 4.2.2.d (Simplify Collection)**.
            *   **If successful:** Proceed to the next test.
        3.  **Test `migrate`:** Run `pnpm --filter payload payload migrate`.
            *   **If it errors:** The schema defined by the collection (or its interaction with existing schema) is causing database issues. Proceed to **Step 4.2.2.d (Simplify Collection)**.
            *   **If successful:** This collection, in its current state, is stable for schema operations. Move to the next collection in the list.
        4.  **Simplify Collection (if `generate:types` or `migrate` fails):**
            *   **Isolate:** Focus on the collection definition file (`<CollectionName>.ts`) of the collection that caused the failure.
            *   **Identify Suspects:** Look for complex fields: `richText` (especially with `BlocksFeature`), `blocks`, `array`, `relationship`, fields with custom `hooks`, fields with complex `access` control, `validate` functions, or `defaultValue` functions that might perform async operations or have external dependencies.
            *   **Iteratively Comment Out:**
                *   Start by commenting out one suspect field or feature (e.g., the entire `BlocksFeature` array within a `richText` field, or a specific complex hook).
                *   Re-run `pnpm --filter payload payload generate:types`. If it now passes, this was likely the culprit for `generate:types`. Then, run `pnpm --filter payload payload migrate`.
                *   If `generate:types` still fails, or if `migrate` fails, revert the last change and try commenting out a different suspect field/feature.
                *   If commenting out a single field isn't enough, try commenting out multiple complex fields.
            *   **Goal for Simplification:** Achieve a state where *both* `generate:types` and `migrate` succeed for the current set of active collections.
            *   **Documentation:** Crucially, maintain a detailed log (e.g., in a temporary text file or a dedicated markdown document like `z.plan/payload-new-refactor/plan/phase-1-collection-simplifications.md`) of:
                *   Which collection file was modified.
                *   Which specific fields or parts of field configurations (e.g., `admin.components.views.Edit`, specific block definitions, relationship `filterOptions`) were commented out or altered.
                *   The reason (e.g., "Caused `generate:types` to hang", "Caused `migrate` error XYZ").
                This documentation is vital input for Phase 2, as seeders will need to be aware of missing fields, and these fields will need to be systematically restored and debugged later.

*   **4.2.3. Final State for Phase 1 Goal:**
    *   All required collections are active (uncommented) in `apps/payload/src/payload.config.ts`.
    *   `pnpm --filter payload payload generate:types` completes successfully.
    *   `pnpm --filter payload payload migrate` completes successfully.
    *   Some collection definition files (`*.ts`) may have specific complex fields or configurations temporarily commented out.

## 5. Task 3.3: Confirm Reliable `payload migrate` Execution

**Objective:** Ensure that `payload migrate` is consistently stable with the (potentially simplified) full set of collections.

*   **Action:** With all collections active in `payload.config.ts` (in their state from step 4.2.3):
    1.  Run `pnpm --filter payload payload migrate` from the monorepo root.
    2.  Make a trivial, non-schema-altering change to a comment in one of the collection files.
    3.  Run `pnpm --filter payload payload migrate` again.
*   **Expected Outcome:**
    *   The first run should succeed (potentially creating migrations if there were pending changes from the stabilization process).
    *   Subsequent runs (without actual schema changes) should report "No changes detected" or similar, and exit successfully without generating new migration files.
    *   The process should be consistently successful across multiple runs.

## 6. Task 3.4: Confirm Reliable `payload generate:types` Execution

**Objective:** Ensure that `payload generate:types` is consistently stable and correctly generates `payload-types.ts`.

*   **Action:** With all collections active in `payload.config.ts` (in their state from step 4.2.3):
    1.  Delete the existing `apps/payload/src/payload-types.ts` file (if it exists).
    2.  Run `pnpm --filter payload payload generate:types` from the monorepo root.
    3.  Inspect the newly generated `payload-types.ts`.
    4.  Run `pnpm --filter payload payload generate:types` again without any changes.
*   **Expected Outcome:**
    *   The command completes successfully each time without hanging.
    *   `payload-types.ts` is generated (or updated) and appears correct for the active (possibly simplified) collection fields.
    *   Subsequent runs without changes should still complete successfully.

## 7. Deliverables for Phase 1

*   A stable `apps/payload/src/payload.config.ts` with all necessary collections configured and active.
*   A set of collection definition files (`apps/payload/src/collections/*.ts`) where some complex fields might be temporarily commented out to ensure stability.
*   **Critical Document:** A detailed markdown file (e.g., `z.plan/payload-new-refactor/plan/phase-1-collection-simplifications.md`) listing:
    *   Each collection that required simplification.
    *   The specific fields or field properties within those collections that were commented out or altered.
    *   The reason for each simplification (e.g., "Caused `generate:types` hang," "Caused `migrate` SQL error," "Caused Payload init sanitization error during initial tests").
*   Confirmation (e.g., logs, successful command outputs) that `pnpm --filter payload payload generate:types` and `pnpm --filter payload payload migrate` execute reliably with the full suite of (potentially simplified) collections.

This phase sets a stable baseline for Payload's schema and types, which is essential before proceeding to build the Node.js-based data initialization system in Phase 2.
