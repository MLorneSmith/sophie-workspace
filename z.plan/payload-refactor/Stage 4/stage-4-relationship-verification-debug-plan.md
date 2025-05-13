# Stage 4: Relationship Verification Debugging Plan

**Date:** May 9, 2025

## 1. Current Issue Summary

After successfully running Stages 0-2 of the `Initialize-PayloadData.ps1` script, and Stage 3 (`run-stage-3.ts`) reporting completion without errors, Stage 4 (`verify-relationships.ts`) is failing with numerous errors. These errors indicate that relationships between collections are not being correctly established or recognized by the Payload API.

Key error patterns observed in `verify-relationships.ts`:

- **Quiz -> QuizQuestions:** All `CourseQuiz` documents fail to be fetched with `depth: 1` (to populate their related questions). The error is typically "Not Found" for the `CourseQuiz` itself, suggesting Payload cannot resolve its `questions` relationship.
  - Example: `ERROR: [CourseQuizzes ID: 5a8d6b7c-9e2f-4d3a-8b1c-0f9a2e4d5c6b] Failed to verify relationships: Not Found`
- **Lesson -> Quiz:** Many `CourseLesson` documents show a "JSONB 'quiz' field mismatch." The `quiz` field (which should hold the ID of the related `CourseQuiz`) is `undefined` in the database, while the SSOT expects a specific quiz ID. Some lessons are also reported as "Document not found" by their slug.
  - Example: `ERROR: [CourseLessons ID: ..., Slug: basic-graphs] JSONB 'quiz' field mismatch. Expected Quiz ID ... Actual Quiz ID in lesson: undefined`
- **Lesson -> Downloads:** Many `CourseLesson` documents show a "JSONB 'downloads' field mismatch." The `downloads` field (an array of Download IDs) is an empty array `[]` in the database, while the SSOT expects specific Download IDs.
  - Example: `ERROR: [CourseLessons ID: ..., Slug: our-process] JSONB 'downloads' field mismatch. Expected: ["..."], Actual: []`

These issues point to a systemic failure in Stage 3 (`run-stage-3.ts` and its sub-scripts like `populateQuizQuestionRelationships.ts`, `populateLessonQuizRelationships.ts`, `populateLessonDownloadRelationships.ts`) to correctly populate the relationship fields in parent documents using `payload.update()`.

## 2. Root Cause Analysis

The most likely root cause stems from changes made during Stage 2 seeding to address database `id` column types:

1.  **ID Generation Change:** Scripts like `seed-survey-questions.ts` (and presumably `seed-course-quizzes.ts` for its `quiz_questions`) were modified to **stop** providing custom, deterministic SHA1-based string `id`s. Instead, Payload is now allowed to auto-generate standard `UUID`s for these documents, as the `id` columns in the database are of type `uuid`. This fixed database errors during seeding.

2.  **Stale IDs in SSOT Files:** The Single Source of Truth (SSOT) files (e.g., `quizzes-quiz-questions-truth.ts`, `lesson-quiz-relations.ts`) used by Stage 3 relationship population scripts still contain the **old SHA1 hash IDs** for child documents (like individual questions).

3.  **Incorrect IDs Used for Linking in Stage 3:**

    - The Stage 3 relationship population scripts (e.g., `populateQuizQuestionRelationships.ts`) read these SHA1 IDs from the SSOTs.
    - They then attempt to use these SHA1 IDs when calling `payloadClient.update()` on parent documents to link to children (e.g., setting the `questions` array on a `CourseQuiz` document with an array of these SHA1 IDs).
    - However, the actual child documents in the database (`quiz_questions`, `course_quizzes` for lessons, `downloads`) no longer have these SHA1 IDs. They have the new, auto-generated UUIDs.
    - Consequently, Stage 3 is creating relationships that point to non-existent document IDs (from Payload's perspective).

4.  **Verification Failures in Stage 4:**
    - When `verify-relationships.ts` attempts to fetch parent documents with `depth: 1` (e.g., a `CourseQuiz` with its `questions`), Payload tries to resolve the relationships using the incorrect SHA1 IDs stored in the parent's relationship field. Since no child documents match these SHA1 IDs, the relationship population fails, leading to the "Not Found" errors for the parent or empty/mismatched relationship fields.

## 3. Plan to Fix Relationship Population and Verification

The primary goal is to ensure Stage 3 scripts use the correct, current database UUIDs of child documents when establishing relationships.

1.  **Ensure Queryability of Stable Keys for Child Documents:**

    - For all child collections involved in these relationships (`quiz_questions`, `course_quizzes` (as children of lessons), `downloads`), we need a reliable way to fetch them using a stable, human-readable key (like a slug) since their auto-generated UUIDs are not known in the SSOT files.
    - **Action:** For each relevant child collection (e.g., `QuizQuestions`, `CourseQuizzes`, `Downloads`):
      - Verify/ensure a `slug` field (e.g., `questionSlug`, `quizSlug`, `downloadSlug/filename`) exists in its Payload collection definition.
      - Ensure this slug field has `index: true` in its collection definition to make it queryable via the Payload API's `where` clause.
      - Run `cd apps/payload; pnpm payload generate:types`.
      - Run `pnpm --filter payload payload migrate` (from monorepo root) to apply any necessary database index changes.
      - **Crucially, resolve the "The following path cannot be queried: [slug_field_name]" error.** This is currently blocking queries by `question_slug` in `survey_questions` and will likely affect `quiz_questions` too. This might involve:
        - Further investigation into Payload's caching or schema initialization.
        - Ensuring any persistent Payload dev server is restarted after config changes.
        - If necessary, using direct SQL via `psql` to create indexes if Payload's migrations don't, and thoroughly testing if Payload API respects these.

2.  **Modify Stage 3 Relationship Population Scripts:**

    - For each relevant script (e.g., `populateQuizQuestionRelationships.ts`, `populateLessonQuizRelationships.ts`, `populateLessonDownloadRelationships.ts`):
      - When processing a parent document and its list of child relationships from an SSOT:
        - For each child defined in the SSOT, do **not** use its SSOT `id` (which is the old SHA1 hash).
        - Instead, use other information from the SSOT for that child (e.g., its title or text, which can be converted to a slug using the same `generateSlug` logic as the seeder) to construct the `expectedSlug`.
        - Query the child collection using `payloadClient.find({ collection: 'child_collection_slug', where: { child_slug_field: { equals: expectedSlug } }, limit: 1 })`.
        - From the returned document(s), extract the actual auto-generated UUID (`id`).
        - Use these fetched, correct UUIDs when constructing the array for the `data: { relationship_field: arrayOfCorrectUuidsOrObjects }` part of the `payloadClient.update()` call on the parent document.
    - Add robust logging within these scripts to trace which parent is being processed, what child slugs are being looked up, and what actual UUIDs are found and used for linking.

3.  **Temporarily Skip `verify-ssot-content-presence.ts`:**

    - Keep the execution of `verify-ssot-content-presence.ts` commented out in `Initialize-PayloadData.ps1` to allow focus on fixing Stage 3 and `verify-relationships.ts`.

4.  **Iterative Testing and Verification:**
    - After modifying each Stage 3 relationship script, run the full `Initialize-PayloadData.ps1` (with the problematic verification script still skipped).
    - Carefully examine the logs from the modified Stage 3 script to ensure it's finding child documents by slug and using their UUIDs.
    - Examine the output of `verify-relationships.ts`. The goal is to see the "Not Found" and "JSONB field mismatch" errors for the targeted relationship type disappear.
    - Use direct database queries (via the `postgres` MCP tool) to inspect the relevant `_rels` tables (e.g., `payload.course_quizzes_rels`) and the JSONB relationship fields in parent documents (e.g., `payload.course_quizzes.questions`) to confirm they now contain the correct UUIDs and `path` values.

By ensuring Stage 3 uses the correct database UUIDs for linking, the relationships should be correctly formed, allowing `verify-relationships.ts` (and the frontend application) to successfully retrieve and populate related data.
