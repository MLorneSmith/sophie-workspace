# Plan for Stage 4: Verification (Payload CMS Refactor)

**Date:** May 9, 2025

## 1. Overall Objective

Implement a comprehensive suite of verification scripts as outlined in the project's design requirements document (`z.plan/payload-refactor/payload-refactor-design-requirements.md`). These scripts will run after content seeding (Stage 2) and relationship population (Stage 3) to ensure data integrity and consistency by comparing the database state against the Single Sources of Truth (SSOTs). They are designed to **report errors and discrepancies**, not to perform data fixes within this stage.

## 2. Methodology

New TypeScript (`.ts`) scripts will be created within the `packages/payload-local-init/stage-4-verification/` directory. These scripts will:

1.  Initialize the Payload Local API using a pattern similar to `getPayloadClient(true)` (from `packages/payload-local-init/payload-client.ts`).
2.  Connect to the Supabase database directly for SQL queries where appropriate. This may involve using a Node.js `pg` client or a similar, established utility within the project for executing read-only SQL.
3.  Import data from the relevant SSOT files (primarily from `packages/payload-local-init/data/`).
4.  Query the database (via Payload API or direct SQL).
5.  Compare the database state against SSOTs and report discrepancies via `console.log` / `console.error`.
6.  The main `Initialize-PayloadData.ps1` script (or a dedicated Stage 4 orchestrator like `scripts/orchestration/run-stage-4-verification.ps1`) will be updated to execute these new scripts using a command like `pnpm --filter @slideheroes/payload-local-init exec tsx ./stage-4-verification/your-script-name.ts`.

## 3. Detailed Script Breakdown for Stage 4

### 3.1. `verify-document-counts.ts`
    *   **Status:** Currently exists as `verify-document-counts.mjs`. It needs to be refactored into a `.ts` file, adopting the common TypeScript script structure observed in other project scripts (e.g., async main function, Payload client usage, final execution call with `.catch`).
    *   **Purpose:** Verifies that the count of documents in each core Payload collection matches the expected count derived from SSOT files or predefined numbers.
    *   **Action:** Review and refactor to `.ts`, ensuring it aligns with established project scripting patterns.

### 3.2. New Script: `verify-ssot-content-presence.ts`
    *   **Purpose:** Ensure all individual content items defined in SSOT files exist in the database and that their key non-relationship fields are correctly populated.
    *   **SSOT Files to Use (Examples):**
        *   `packages/payload-local-init/data/definitions/lessons_structured_content.yaml`
        *   `packages/payload-local-init/data/raw/lesson-metadata.yaml`
        *   `packages/payload-local-init/data/definitions/quizzes.ts`
        *   `packages/payload-local-init/data/quizzes-quiz-questions-truth.ts` (for question text, types, options, `correct_answer`)
        *   `packages/payload-local-init/data/download-id-map.ts`
        *   Frontmatter from `.mdoc` files in `packages/payload-local-init/data/raw/posts/` and `data/raw/documentation/`
        *   YAML files in `packages/payload-local-init/data/raw/surveys/`
    *   **Process:**
        1.  Define an `async function verifySsotContentPresence() { ... }`.
        2.  Initialize `payloadClient = await getPayloadClient(true);`.
        3.  For each collection (Courses, CourseLessons, CourseQuizzes, QuizQuestions, Downloads, Posts, Documentation, Surveys, SurveyQuestions):
            *   Parse the relevant SSOT file(s) to get a list of expected items and their key attributes (ID, slug, title, `pass_threshold` for quizzes, `correct_answer` for questions, question `type`, question `options` structure, etc.).
            *   For each item in the SSOT:
                *   Query the database (using `payloadClient.findByID({ collection: 'COLLECTION_SLUG', id: ssotItem.id, depth: 0 })` or direct SQL by ID) to fetch the corresponding document.
                *   Log an error if the document is not found.
                *   If found, compare key fields (title, slug, description, `pass_threshold`, `correct_answer`, etc.) against the SSOT data. Log discrepancies.
                *   Perform basic checks on Lexical JSON content fields (e.g., for lessons, posts) to ensure they are not unexpectedly empty or malformed.
        4.  Call `verifySsotContentPresence().catch(err => { console.error('Script failed:', err); process.exit(1); })` at the end of the script.
    *   **Output:** Console logs detailing any missing documents or documents with mismatched key field data.

### 3.3. New Script: `verify-relationships.ts`
    *   **Purpose:** Verify that relationships defined in SSOTs are correctly reflected in both the parent document's JSONB relationship field and the corresponding `_rels` tables. This script will also verify the `path` column in `_rels` tables and check for orphaned relationship records.
    *   **SSOT Files to Use (Examples):**
        *   `packages/payload-local-init/data/quizzes-quiz-questions-truth.ts` (Quiz -> Questions)
        *   `packages/payload-local-init/data/definitions/lesson-quiz-relations.ts` (Lesson -> Quiz)
        *   `packages/payload-local-init/data/mappings/lesson-downloads-mappings.ts` (Lesson -> Downloads)
        *   `packages/payload-local-init/data/definitions/lessons_structured_content.yaml` (Course -> Lessons)
        *   `packages/payload-local-init/data/raw/surveys/` (Survey -> SurveyQuestions)
    *   **Process:**
        1.  Define an `async function verifyRelationships() { ... }`.
        2.  Initialize `payloadClient = await getPayloadClient(true);`.
        3.  For each defined relationship type (e.g., Quiz-Question, Lesson-Quiz):
            *   Import and parse the relevant relationship SSOT.
            *   For each parent document defined in the SSOT:
                *   Fetch the parent document via `payloadClient.findByID({ collection: 'PARENT_SLUG', id: parentId, depth: 1 })` to access its populated JSONB relationship field. Compare the child IDs and their order against the SSOT. Log discrepancies.
                *   Query the corresponding `_rels` table (e.g., `payload.course_quizzes_rels`) using direct SQL for the `_parent_id`. Compare the child IDs (e.g., `quiz_questions_id`) and `_order` against the SSOT. Log discrepancies.
                *   Verify that the `path` column in all fetched `_rels` rows is correct (e.g., 'questions'). Log incorrect or `NULL` `path` values.
        4.  **Orphan Checks:**
            *   For each `_rels` table:
                *   Execute SQL to find rows where `_parent_id` does not exist in the parent collection's main table. Report these as "Orphaned relationship: Parent missing".
                *   Execute SQL to find rows where the child ID column (e.g., `quiz_questions_id`) does not exist in the child collection's main table. Report these as "Orphaned relationship: Child missing".
        5.  Call `verifyRelationships().catch(...)` at the end.
    *   **Output:** Console logs detailing relationship discrepancies, incorrect `path` values, and orphaned records.

### 3.4. New Script: `verify-related-item-counts.ts`
    *   **Purpose:** Ensure that the actual count of related items for parent documents matches the counts defined or implied by the SSOTs.
    *   **SSOT Files to Use:** Same as `verify-relationships.ts`.
    *   **Process:**
        1.  Define an `async function verifyRelatedItemCounts() { ... }`.
        2.  Initialize `payloadClient = await getPayloadClient(true);`.
        3.  For each parent item in an SSOT that has defined relationships:
            *   Determine the expected number of child items from the SSOT.
            *   Fetch the parent document using `payloadClient.findByID({ collection: 'PARENT_SLUG', id: parentId, depth: 1 })`. Count the items in its JSONB relationship field.
            *   Query the relevant `_rels` table using direct SQL for that `_parent_id` and count the related child rows.
            *   Log an error if the count from the JSONB field does not match the SSOT-defined count.
            *   Log an error if the count from the `_rels` table does not match the SSOT-defined count.
        4.  Call `verifyRelatedItemCounts().catch(...)` at the end.
    *   **Output:** Console logs listing parent documents with incorrect counts of related children.

## 4. Implementation and Integration Steps

1.  **Directory & File Setup:**
    *   Ensure `packages/payload-local-init/stage-4-verification/` directory exists.
    *   Create the new `.ts` files: `verify-ssot-content-presence.ts`, `verify-relationships.ts`, `verify-related-item-counts.ts`.
    *   Refactor the existing `packages/payload-local-init/stage-4-verification/verify-document-counts.mjs` to `verify-document-counts.ts`, ensuring it aligns with the common TypeScript script pattern.

2.  **Script Development:**
    *   Implement each TypeScript verification script as detailed above.
    *   Follow observed patterns from existing scripts (e.g., `populate-quiz-question-relationships.ts`) for Payload client initialization, SSOT imports, main async function structure, and console logging.
    *   For direct database queries, establish or use a consistent utility for executing read-only SQL from Node.js.

3.  **Update Orchestration Script (`Initialize-PayloadData.ps1`):**
    *   Modify the Stage 4 execution block within `Initialize-PayloadData.ps1` (or its dedicated Stage 4 sub-script if one exists, like `scripts/orchestration/run-stage-4-verification.ps1`).
    *   Add commands to execute the new `.ts` verification scripts in sequence using `pnpm --filter @slideheroes/payload-local-init exec tsx ./stage-4-verification/your-script-name.ts`.
    *   Ensure robust error checking (e.g., `If ($LASTEXITCODE -ne 0) { ... }`) after each script call in the PowerShell orchestrator.

4.  **Testing and Iteration:**
    *   Run the full `Initialize-PayloadData.ps1` process after implementing each new verification script.
    *   Systematically test each verification script by intentionally introducing data inconsistencies relevant to its checks (e.g., delete a document, alter a relationship, set a `path` to `NULL`, change counts).
    *   Confirm that the scripts correctly identify and report these introduced issues.
    *   Refine script logic and console logging for clarity, accuracy, and actionable error messages based on test results.

## 5. Key Considerations

*   **Read-Only Verification:** Emphasize that these Stage 4 scripts are for verification (read-only operations) and should not attempt to modify data.
*   **SQL Execution:** Determine the best approach for executing direct SQL queries from Node.js (e.g., using the `pg` library, or a pre-existing database utility within the project).
*   **Performance:** While these are verification scripts, be mindful of performance if querying large datasets repeatedly. Optimize queries where possible.
*   **Clarity of Output:** Ensure console logs are clear, specific, and provide enough context for a developer to understand the discrepancy and locate the problematic data or SSOT entry.
