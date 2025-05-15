# Payload CMS & Migration System Refactor: Design Requirements v2.0

**Version:** 2.0
**Date:** May 13, 2025

## 1. Introduction & Goals

This document outlines the revised design requirements for refactoring the Payload CMS integration and the associated content migration and seeding system. This V2.0 document supersedes `payload-refactor-design-requirements.md` (Version 1.0) and incorporates learnings from extensive debugging and previous refactoring attempts.

The **primary goals** remain:
-   **Enhance Stability & Reliability:** Eliminate persistent errors, data inconsistencies, and unpredictable behavior.
-   **Improve Maintainability:** Simplify the overall architecture, making it easier to understand, debug, and extend.
-   **Ensure Data Integrity:** Establish robust processes that guarantee consistency, especially for relationships.
-   **Streamline Development:** Create a predictable and efficient workflow for managing content schema and data.

This refactor addresses:
1.  Setting up and maintaining a clean Payload CMS application instance.
2.  Re-architecting the content migration, seeding, and verification system for robustness and simplicity.

## 2. Core Problem Statement & Overarching Strategy

The previous system suffered from critical instability, primarily due to:
-   Node.js scripts (executed via `tsx`) hanging when attempting to close database connections, forcing `process.exit(0)` workarounds.
-   These abrupt terminations leading to incomplete data commits and inconsistencies across migration stages.
-   Difficulties in managing SSOT data, especially IDs, when linking relationships.
-   Complexities arising from PowerShell orchestration of Node.js scripts.

**Overarching Strategy:**
-   **Migrate Orchestration to Node.js/TypeScript:** Replace the PowerShell orchestrator with a single, unified Node.js script for better control, error handling, and data flow.
-   **Pre-compile Seeding Scripts:** Compile TypeScript seeder/orchestrator scripts to plain JavaScript to run in a standard Node.js environment, bypassing `tsx`-specific execution issues.
-   **Centralized Payload Client Management:** The main Node.js orchestrator will manage a single Payload client instance for each major operational phase (e.g., seeding, relationship population).
-   **Strict SSOT Adherence with Live ID Lookups:** Maintain SSOTs for content definition but implement robust lookup of live, database-generated UUIDs (via slugs or other stable keys) during relationship population.

## 3. Guiding Design Principles (Revised & Reinforced)

1.  **Unified Node.js Orchestration:** The entire initialization process will be managed by a main Node.js/TypeScript script.
2.  **Standard Node.js Execution for Stability:** Critical TypeScript scripts (orchestrator, stage managers) will be pre-compiled to JavaScript and run with `node` to avoid `tsx` execution environment issues and ensure proper script termination and resource cleanup.
3.  **Data Consistency by Design:** The system must ensure atomic and consistent population of data, including `_rels` tables and JSONB fields, from a single source of truth for definitions.
4.  **Simplified, Linear Staging:** Maintain a modular, linear process (Schema, Core Seed, Relationships, Verify) with clear separation of concerns.
5.  **Single Source of Truth (SSOT) for Definitions:** Content structure and initial relationship *intent* will be derived from SSOT files. Live IDs will be dynamically resolved.
6.  **Robust and Atomic Data Population:**
    *   Utilize Payload's Local API for creating/updating individual documents and managing relationships to leverage its internal logic (validation, hooks).
    *   Consider direct SQL (via `psql` or a Node.js library, executed by the orchestrator) for initial bulk data seeding of simple, non-relational data where performance is paramount and Payload hooks are not critical.
7.  **Centralized & Graceful Payload Client Management:** The main Node.js orchestrator will initialize and gracefully close the Payload client. Sub-modules/functions will receive the initialized client.
8.  **Decoupled and Comprehensive Verification:** Verification remains a distinct, final stage, reporting issues, not attempting fixes.
9.  **Granular Debugging & Structured Logging:** Implement detailed, contextual, and structured logging throughout the Node.js orchestrator and its sub-modules.
10. **Configuration Alignment & Simplification:** Payload collection configurations must be meticulously aligned with the database schema. Strive to use a single, consistent `payload.config.ts` for both the main app and seeding, minimizing discrepancies.
11. **Pre-Seeding SSOT Validation:** Implement schema validation (e.g., using Zod) for SSOT files before seeding begins.
12. **Idempotency (Where Practical):** Individual data seeding functions should aim for idempotency (e.g., "create if not exists by slug") to improve robustness for re-runs, though the primary flow assumes a reset.

## 4. Phase 1: New Payload CMS Application Setup (As per V1, with emphasis on stability)

This phase focuses on establishing a clean foundation for Payload CMS.

1.  **Archive Existing Payload App:** (If still relevant, e.g., `apps/payload_legacy`).
2.  **Initialize/Verify New Payload App:** Ensure `apps/payload` is correctly set up.
    -   Basic Payload configuration (`payload.config.ts`) including database connection, admin user, S3/R2 plugin.
3.  **Define/Review Collections:**
    -   Adapt working collection definitions.
    -   Address known problematic fields (richText, arrays, relationships with BlocksFeature) by simplifying them initially to achieve stability with `payload generate:types` and Payload initialization. Iteratively reintroduce complexity, testing thoroughly at each step.
    -   Ensure appropriate versioning configuration (`versions: { drafts: true }`) if `_status` is used.
4.  **Initial Schema Migration:**
    -   Use `pnpm --filter payload payload migrate` (executed from the monorepo root, ensuring it uses the correct `.env` for `PAYLOAD_SECRET` and `DATABASE_URI`) to generate and apply the schema.
5.  **Type Generation:**
    -   Use `pnpm --filter payload payload generate:types`. Troubleshoot any hangs by simplifying collection definitions as noted above.

## 5. Phase 2: Refactoring Content Initialization System (Node.js Orchestrator)

This phase focuses on a new Node.js/TypeScript-based system for resetting, migrating, seeding, and verifying data.

**5.1. Main Orchestrator Script (`apps/payload/src/init-scripts/initialize-payload-data.ts`)**

-   **Location:** Within `apps/payload` to be tightly coupled with the Payload app it serves.
-   **Execution:** Will be compiled to JS (e.g., in a `dist` folder) and run via `node dist/init-scripts/initialize-payload-data.js`.
-   **Responsibilities:**
    -   Parse command-line arguments (e.g., skip stages, specify environment).
    -   Load environment variables (e.g., using `dotenv`).
    -   Initialize a single Payload client instance (using the main `payload.config.ts`).
    -   Sequentially execute functions for each stage, passing the Payload client and aggregated ID maps.
    -   Manage global state like ID maps between stages.
    -   Implement robust, structured logging.
    -   Attempt graceful closure of the Payload client in a final `finally` block.
    -   Exit with appropriate codes (0 for success, 1 for failure).

**5.2. Staged Execution Logic (Modules within `apps/payload/src/init-scripts/stages/`)**

Each stage will be a module/function called by the main orchestrator.

1.  **Stage 0: Database Reset (Optional)**
    -   `reset-payload-schema.ts`: Drops and recreates the `payload` schema or relevant tables using direct SQL commands (e.g., via `node-postgres` or by shelling out to `psql`).
2.  **Stage 1: Schema Application (Payload Migrations)**
    -   `apply-payload-migrations.ts`: Programmatically invokes `pnpm --filter payload payload migrate` or uses Payload's programmatic API for migrations if available and stable. Ensures environment variables are correctly passed.
3.  **Stage 2: Core Content Seeding (Non-Relationship Data)**
    -   `seed-core-content.ts`: This module will orchestrate the seeding of individual collections.
    -   **Individual Seeder Functions (e.g., `seed-courses.ts`, `seed-lessons.ts`, `seed-quiz-questions.ts`):**
        -   Located in `apps/payload/src/init-scripts/seeders/`.
        -   Accept the initialized Payload client and any necessary global ID maps.
        -   Read data from validated SSOT files (from a dedicated `apps/payload/src/init-scripts/data/` directory).
        -   Perform data transformations (e.g., Markdown to Lexical JSON) via dedicated, testable utility functions.
        -   Use `payload.create()` for inserting documents.
        -   Implement "create if not exists by slug" logic to be idempotent where feasible.
        -   Return maps of `ssotIdentifier -> liveUUID` for all created documents.
        -   Log operations and errors granularly.
4.  **Stage 3: Relationship Population**
    -   `populate-relationships.ts`: Orchestrates linking of documents.
    -   **Individual Relationship Linker Functions (e.g., `link-quiz-questions.ts`, `link-lesson-quizzes.ts`):**
        -   Located in `apps/payload/src/init-scripts/linkers/`.
        -   Accept the Payload client and aggregated ID maps from Stage 2.
        -   Read relationship definitions from SSOT files.
        -   For each parent document, look up its live UUID using the ID maps or by slug.
        -   For each child document to be related, look up its live UUID using the ID maps or by its own slug/stable key (fetched via `payload.find()`).
        -   Use `payload.update()` on the parent document to set the relationship field with the array of correct live child UUIDs.
        -   Handle `hasOne` and `hasMany` relationship types correctly.
        -   Log operations and errors granularly.
5.  **Stage 4: Verification**
    -   `verify-data.ts`: Orchestrates verification checks.
    -   **Individual Verifier Functions (e.g., `verify-doc-counts.ts`, `verify-content-presence.ts`, `verify-rels.ts`):**
        -   Located in `apps/payload/src/init-scripts/verifiers/`.
        -   Accept the Payload client and ID maps.
        -   Perform checks as outlined in `z.plan/payload-refactor/Stage 4/stage-4-verification-plan.md` (document counts, SSOT content presence, relationship integrity, `_rels` paths, orphan checks, unique slug checks).
        -   Report errors to the console; do not attempt fixes.

**5.3. SSOT Data Location & Validation**
-   All SSOT files (YAML, TS, raw Markdown) will reside in `apps/payload/src/init-scripts/data/`.
-   Implement Zod schemas for structured SSOT files (YAML, TS objects) and validate them at the beginning of the relevant seeder/linker function.

**5.4. Utilities**
-   A `apps/payload/src/init-scripts/utils/` directory for shared functions (e.g., slug generation, Lexical conversion, logger setup, DB query helpers if direct SQL is used).

## 6. Addressing Key Persistent Issues

-   **DB Connection Hangs / `process.exit(0)`:**
    -   Solved by pre-compiling the main Node.js orchestrator and its critical modules to plain JS and running with `node`. This provides a standard execution environment where `payload.db.drizzle.$client.end()` is expected to work.
    -   Centralized client management ensures `end()` is called only once.
-   **`tsx` Execution Environment Issues:**
    -   Bypassed by pre-compilation.
-   **Complex Field Instability (`generate:types`, sanitization):**
    -   Address by starting with simplified collection definitions and incrementally re-adding complex fields, thoroughly testing `generate:types`, `migrate`, and Payload initialization at each step.
    -   If specific fields (e.g., a `richText` field with a problematic `BlocksFeature` config) consistently cause issues even after ensuring correct types and data, they may need to be temporarily simplified or reported to Payload support.
-   **Data Consistency Across Stages:**
    -   Reliable script termination (due to pre-compilation and proper client closure) should ensure data commits.
    -   The Node.js orchestrator passing data (ID maps) in memory between stages is more robust than file-based or stdout/stdin piping between separate processes.
-   **SSOT ID Management:**
    -   Stage 2 seeders generate live UUIDs and return maps.
    -   Stage 3 linkers use these maps or query by stable keys (slugs) to get current UUIDs, avoiding reliance on potentially stale IDs in SSOTs for direct linking.

## 7. Testing Strategy (Reiteration)

1.  **Unit Tests:** For utilities (Lexical conversion, slug generation, SSOT validators).
2.  **Integration Tests (Per Stage/Module):** Test individual seeder functions, linker functions, and verifier functions in isolation with a test database and mock Payload client where appropriate.
3.  **End-to-End (E2E) Tests:** Run the full compiled `initialize-payload-data.js` script against a local Supabase instance.
    -   Verify Payload Admin UI functionality.
    -   Verify frontend application content rendering.
    -   Test key Payload API endpoints.
4.  **Staging Environment Validation:** Regularly deploy and run the initialization process in a production-like staging environment.

## 8. Build/Execution Process for Initialization Script

1.  **Development:** Write scripts in TypeScript within `apps/payload/src/init-scripts/`.
2.  **Build Step:** Add a `pnpm --filter payload build:init-scripts` command that uses `tsc` to compile `apps/payload/src/init-scripts/**/*.ts` to a `apps/payload/dist/init-scripts/` directory. This build should handle module resolution correctly (e.g., using `tsconfig.json` settings for Node.js ESM or CJS output).
3.  **Execution:** The main script to run the entire process would be `node apps/payload/dist/init-scripts/initialize-payload-data.js`. This can be wrapped in a `package.json` script like `pnpm --filter payload init:data`.

This revised design aims to create a significantly more robust, maintainable, and understandable data initialization system for Payload CMS.
