# Master Implementation Plan: Payload CMS & Migration System Refactor V2

**Version:** 1.0
**Date:** May 13, 2025
**Related Design Document:** `z.plan/payload-new-refactor/design/payload-refactor-design-requirements-v2.md`

## 1. Introduction

This document provides a high-level master implementation plan for refactoring the Payload CMS integration and its associated content migration and seeding system, based on the objectives and strategies outlined in the "Payload CMS & Migration System Refactor: Design Requirements v2.0". It serves as a roadmap for the subsequent creation of detailed, phase-specific implementation plans.

## 2. Overall Approach

The refactor will be executed in distinct phases, emphasizing:
-   **Stability First:** Ensuring the core Payload application and its basic CLI tools are stable before building complex seeding logic.
-   **Node.js Orchestration:** Transitioning from PowerShell to a unified Node.js/TypeScript-based system for data initialization.
-   **Pre-compilation:** Compiling TypeScript initialization scripts to plain JavaScript for execution with `node` to mitigate runtime environment issues.
-   **Modular Design:** Breaking down the initialization process into clearly defined, manageable stages and scripts.
-   **Iterative Development & Testing:** Each phase and major task will involve development, unit/integration testing, and E2E validation.

## 3. Phase 1: Payload CMS Application Setup & Stabilization

**Objective:** Ensure a stable and correctly configured Payload CMS application (`apps/payload`) that can reliably undergo schema migrations and type generation. This phase addresses foundational stability before complex data operations.

**Key Tasks:**

1.  **3.1. Verify & Finalize Core `apps/payload` Setup:**
    *   Confirm `payload.config.ts` is correctly configured for database connection (Supabase), admin users, and essential plugins (e.g., S3/R2).
    *   Ensure environment variables (`DATABASE_URI`, `PAYLOAD_SECRET`, etc.) are correctly loaded and accessible by Payload.

2.  **3.2. Systematically Stabilize Collection Definitions:**
    *   Iteratively review each collection definition in `apps/payload/src/collections/`.
    *   Start with simplified versions of collections known to cause issues (e.g., `CourseLessons`, `QuizQuestions`, `Surveys`) by commenting out complex fields (richText, arrays, relationships, fields with hooks).
    *   **For each collection (or small group):**
        *   Test `pnpm --filter payload payload generate:types`. If it hangs, further simplify the active collection(s) to isolate the problematic field/configuration.
        *   Test `pnpm --filter payload payload migrate`. Ensure schema changes apply correctly.
        *   Test basic Payload server startup (e.g., `pnpm --filter payload dev`).
    *   Goal: Achieve a state where all collections are active (even if some fields are temporarily simplified) and `generate:types` / `migrate` run without hangs or errors. Document any fields that require simplification to remain stable.

3.  **3.3. Ensure Reliable `payload migrate` Execution:**
    *   Confirm that `pnpm --filter payload payload migrate` (run from monorepo root) consistently applies schema changes based on the active collection definitions.

4.  **3.4. Ensure Reliable `payload generate:types` Execution:**
    *   Confirm that `pnpm --filter payload payload generate:types` (run from monorepo root) consistently generates `payload-types.ts` without hanging, using the stabilized set of collection definitions.

## 4. Phase 2: Content Initialization System Refactor (Node.js Orchestrator)

**Objective:** Implement the new Node.js/TypeScript-based data initialization system as specified in the V2 Design Requirements. This involves creating a main orchestrator script and modular scripts for each stage of the process, all intended to be compiled to JS and run with `node`.

**Key Tasks (each will likely have its own detailed sub-plan):**

1.  **4.1. Develop Main Node.js Orchestrator (`apps/payload/src/init-scripts/initialize-payload-data.ts`):**
    *   Implement CLI argument parsing (e.g., using `yargs` or `commander`) for skipping stages, specifying environments, etc.
    *   Set up environment variable loading (e.g., using `dotenv` to load from `.env` at project root).
    *   Implement central Payload client initialization (`await getPayload(...)`) using the main `apps/payload/src/payload.config.ts`.
    *   Design and implement logic for graceful shutdown of the Payload client in a `finally` block.
    *   Set up a structured logging system (e.g., `pino` or a custom utility) to be used by the orchestrator and passed to stage modules.
    *   Develop the main execution flow for calling stage-specific modules sequentially.
    *   Implement mechanisms for passing data (e.g., aggregated ID maps) between stages in memory.

2.  **4.2. Implement Build Process for Initialization Scripts:**
    *   Configure `tsc` (via a dedicated `tsconfig.init-scripts.json` or similar) to compile all TypeScript files in `apps/payload/src/init-scripts/` to a distributable JavaScript format (e.g., ESModules or CommonJS, ensuring compatibility with `node`) in `apps/payload/dist/init-scripts/`.
    *   Create `package.json` scripts in `apps/payload`:
        *   `"build:init-scripts": "tsc -p tsconfig.init-scripts.json"` (or similar).
        *   `"init:data": "node ./dist/init-scripts/initialize-payload-data.js"` (plus any default arguments).
        *   Ensure `preinit:data` script runs `build:init-scripts`.

3.  **4.3. Develop Stage 0 (DB Reset) & Stage 1 (Schema Apply) Modules:**
    *   Location: `apps/payload/src/init-scripts/stages/`
    *   `stage0-reset-schema.ts`: Module to execute SQL for dropping/recreating the `payload` schema. Will require a direct DB connection method (e.g., `node-postgres`).
    *   `stage1-apply-migrations.ts`: Module to programmatically execute `pnpm --filter payload payload migrate`. This might involve using `child_process.exec` or similar, ensuring environment variables are correctly inherited/passed.

4.  **4.4. Develop Stage 2 (Core Content Seeding) Modules:**
    *   Orchestrator: `apps/payload/src/init-scripts/stages/stage2-seed-core-content.ts`.
    *   Individual Seeders: In `apps/payload/src/init-scripts/seeders/` (e.g., `seed-courses.ts`, `seed-lessons.ts`).
        *   Each seeder accepts the Payload client and logger.
        *   Reads from SSOT files located in `apps/payload/src/init-scripts/data/`.
        *   Implements Zod schema validation for its SSOT input.
        *   Includes data transformation utilities (e.g., Markdown to Lexical JSON) in `apps/payload/src/init-scripts/utils/`.
        *   Uses `payload.create()` for insertions.
        *   Returns ID maps (`ssotIdentifier -> liveUUID`).
    *   The stage orchestrator aggregates ID maps.

5.  **4.5. Develop Stage 3 (Relationship Population) Modules:**
    *   Orchestrator: `apps/payload/src/init-scripts/stages/stage3-populate-relationships.ts`.
    *   Individual Linkers: In `apps/payload/src/init-scripts/linkers/` (e.g., `link-quiz-questions.ts`).
        *   Each linker accepts Payload client, aggregated ID maps, and logger.
        *   Reads relationship definitions from SSOTs.
        *   Looks up live UUIDs of parent/child documents using ID maps or by querying with stable keys (slugs).
        *   Uses `payload.update()` to establish relationships.

6.  **4.6. Develop Stage 4 (Verification) Modules:**
    *   Orchestrator: `apps/payload/src/init-scripts/stages/stage4-verify-data.ts`.
    *   Individual Verifiers: In `apps/payload/src/init-scripts/verifiers/` (e.g., `verify-doc-counts.ts`, `verify-rels.ts`).
        *   Each verifier accepts Payload client, ID maps, and logger.
        *   Performs checks as defined in Design V2 (doc counts, content presence, relationship integrity, `_rels` paths, orphans, unique slugs).
        *   Reports errors via logger; does not modify data.

## 5. Testing Strategy (Integrated Across Phases)

-   **Unit Tests:** For all utility functions (slug generation, Lexical conversion, SSOT validators, direct DB helpers).
-   **Integration Tests:** For individual seeder, linker, and verifier modules. These might involve setting up a test database, running the module, and asserting DB state or module output.
-   **End-to-End (E2E) Testing:** Running the full compiled `node apps/payload/dist/init-scripts/initialize-payload-data.js` script against a local or CI Supabase instance.
    *   Verify script completes without error.
    *   Check Payload Admin UI for data presence and correctness.
    *   Check key frontend application pages that consume CMS data.
-   **Staging Environment Validation:** Regularly deploy the `apps/payload` (including compiled `init-scripts`) to a staging environment and run the data initialization process there.

## 6. Documentation

-   Create/Update `README.md` within `apps/payload/src/init-scripts/` explaining the new system, script organization, SSOT data structure, and how to run the initialization.
-   Ensure JSDoc/TSDoc comments for key functions and modules.

## 7. Next Steps

Following the approval or refinement of this master plan, detailed implementation plans will be developed for each major task outlined in Phase 2 (Tasks 4.1 through 4.6).
