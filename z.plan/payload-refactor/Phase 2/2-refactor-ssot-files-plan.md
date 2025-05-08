# Plan: Adapting Single Source of Truth (SSOT) Files

**Date:** May 6, 2025

## 1. Overall Goals for SSOT Adaptation

The primary goals for adapting the Single Source of Truth (SSOT) files are:

- **Improve Usability:** Make files easier for seeding scripts to consume directly.
- **Reduce On-the-Fly Processing:** Minimize complex transformations and lookups needed during the migration/seeding stages.
- **Enhance Consistency:** Standardize file formats, naming conventions, and identifier usage (slugs vs. UUIDs).
- **Increase Clarity:** Ensure each SSOT file has a clear, singular purpose and that its structure is intuitive.
- **Maintain Data Integrity:** Facilitate easier validation and reduce the chances of errors originating from SSOT interpretation.

This plan outlines specific actions for existing SSOT files located in `packages/payload-local-init/data/`.

## 2. Phase 1: Standardization and Cleanup

### 2.1. Resolve Quiz Data Redundancy

- **Files Involved:** `quizzes.ts` and `quizzes-quiz-questions-truth.ts`.
- **Issue:** These files currently have identical content, leading to redundancy.
- **Action:**
  1.  Designate `quizzes-quiz-questions-truth.ts` as the canonical SSOT for all quiz metadata, questions, options, and explanations.
  2.  Ensure this file is comprehensive.
  3.  Delete the redundant `quizzes.ts` file.
  4.  Update all import paths in other scripts/files that previously referenced `quizzes.ts` to now point to `quizzes-quiz-questions-truth.ts`.
- **Proposed Filename:** Rename `quizzes-quiz-questions-truth.ts` to `quiz-definitions.ts` for better clarity and consistency.
- **Reasoning:** Eliminates redundancy, clarifies the SSOT, and simplifies maintenance.

### 2.2. Standardize ID Mapping File Formats

- **Files Involved:** `download-id-map.ts` (TypeScript), `survey-id-map.json` (JSON).
- **Issue:** Inconsistent file formats for similar types of mapping data.
- **Action:**
  1.  Convert `survey-id-map.json` to a TypeScript file named `survey-id-map.ts`.
  2.  Ensure `survey-id-map.ts` uses the same `Record<string, string>` structure as `download-id-map.ts`.
- **Reasoning:** Promotes consistency, allows for type safety and comments within the mapping files, and enables direct TypeScript imports.

### 2.3. Correct Import Paths in TypeScript SSOT Files

- **Issue:** Some `.ts` SSOT files (e.g., `quizzes-quiz-questions-truth.ts`) import other modules using `.js` extensions (e.g., `import { QuizDefinition } from './definitions/quiz-types.js';`).
- **Action:**
  1.  Review all `.ts` files within `packages/payload-local-init/data/` and its subdirectories.
  2.  Change import paths to use the correct `.ts` extension or no extension if the project's TypeScript/Node.js module resolution configuration handles this (typically, no extension is preferred for `.ts` imports).
  3.  Ensure the file `quiz-types.ts` is correctly located. If it's intended to be in a `definitions` subfolder (e.g., `packages/payload-local-init/data/definitions/quiz-types.ts`), move it there and update imports accordingly. Based on current imports, it seems `quiz-types.ts` should be in `data/definitions/`.
- **Reasoning:** Ensures correct module resolution in a TypeScript environment and aligns with standard practices.

### 2.4. Standardize Filenames (Suggestions)

- **Goal:** Improve clarity and discoverability.
- **Suggestions:**
  - `lessons_structured_content.yaml` -> `lesson-definitions.yaml`
  - `quizzes-quiz-questions-truth.ts` (after consolidation) -> `quiz-definitions.ts`
  - `quiz-types.ts` -> `data/definitions/quiz-types.ts` (if moved)
  - `lesson-quiz-relations.ts` (current name is good)
  - `collection-table-mappings.ts` -> `collection-table-map.ts`
  - `download-id-map.ts` (current name is good)
  - `image-mappings.ts` (current name is good, but content may be merged, see Phase 2)
  - `lesson-downloads-mappings.d.ts` (and its source `.js` file) -> Consolidate into a single `lesson-download-relations.ts`.
  - `relationship-map.json` (current name is okay; evaluate content/necessity separately)
  - `survey-id-map.ts` (after format conversion)
- **Reasoning:** Creates a more predictable naming scheme.

## 3. Phase 2: Content Restructuring for Reduced On-the-Fly Processing

### 3.1. Pre-process Lexical Content in Quiz Definitions

- **File Involved:** `quiz-definitions.ts` (formerly `quizzes-quiz-questions-truth.ts`).
- **Issue:** The `explanation` field for quiz questions currently stores stringified Lexical JSON.
- **Action:**
  1.  Modify the `QuizQuestion` interface in `data/definitions/quiz-types.ts` (if it's moved there) or `data/quiz-types.ts` so the `explanation` field is typed as an actual object (e.g., `Record<string, any>` or a more specific Lexical RootNode type if available).
  2.  Update `quiz-definitions.ts` to store the `explanation` as a direct JavaScript object representing the Lexical structure, not a JSON string.
      ```typescript
      // Example within quiz-definitions.ts
      questions: [
        {
          // ... other question properties
          explanation: { // Store as actual object
            root: {
              type: "root",
              format: "",
              indent: 0,
              version: 1,
              children: [/* ... Lexical nodes ... */]
            }
          },
        },
      ],
      ```
  3.  A one-time utility script might be needed to parse the existing stringified JSON and update the `quiz-definitions.ts` file.
- **Reasoning:** Avoids repetitive JSON parsing in seeding scripts. The SSOT holds data closer to its final required structure.

### 3.2. Consolidate Download & Image Information

- **Files Involved:** `lessons_structured_content.yaml`, `download-id-map.ts`, `image-mappings.ts`, `collection-table-mappings.ts` (for `COLLECTION_DOWNLOAD_MAPPINGS`).
- **Issue:** Information about downloadable files (PDFs, ZIPs, images) is fragmented.
- **Action:**
  1.  **Create `download-definitions.ts`:** This new file will be the SSOT for all items intended for the Payload `downloads` collection. Each entry should include:
      - `id`: (string) Predefined UUID (sourced from `download-id-map.ts` for existing items, new UUIDs for images not yet mapped).
      - `key`: (string) A unique, human-readable key (e.g., `our-process-slides`, `lesson-the-who-featured-image`).
      - `title`: (string) Human-readable title for the download/image.
      - `filename`: (string) The actual filename as it exists in R2 storage (e.g., `201 Our Process.pdf`, `standard_graphs.png`).
      - `description`: (string, optional)
      - `url`: (string) The full R2 URL.
      - `type`: (string) Enum/string indicating type (e.g., 'pdf', 'zip', 'png', 'jpg', 'webp').
      - `altText`: (string, optional) Alt text, especially for images.
      - `width`: (number, optional) Image width.
      - `height`: (number, optional) Image height.
      - (Other relevant metadata for the `downloads` collection).
  2.  **Populate `download-definitions.ts`:**
      - Migrate entries from `download-id-map.ts`.
      - Incorporate image data: Use `image-mappings.ts` to get R2 filenames. Generate new UUIDs and keys for these images. Source URLs and other metadata as available.
      - Incorporate PDF download info from `lessons_structured_content.yaml` (URLs, descriptions, filenames), associating them with keys/UUIDs from `download-id-map.ts`.
  3.  **Create `[entity]-download-relations.ts` files:** For each collection that can have downloads (e.g., lessons, posts), create a specific mapping file. Example: `lesson-download-relations.ts`.
      - Structure: `Record<string, string[]>` where keys are parent entity UUIDs (e.g., lesson UUID) and values are arrays of download UUIDs (from `download-definitions.ts`).
      - Populate these based on `lessons_structured_content.yaml` (for lesson PDFs) and potentially by associating images from `image-mappings.ts` with their respective lessons/posts (this might require identifying images from raw content).
  4.  **Deprecate/Refactor:**
      - `download-id-map.ts`: Its content moves to `download-definitions.ts`. Can be removed.
      - `image-mappings.ts`: Its R2 filenames move to `download-definitions.ts`. The file might still be needed temporarily if raw content references images by "frontmatter paths" and these paths need to be resolved to the new `key` in `download-definitions.ts`.
      - `COLLECTION_DOWNLOAD_MAPPINGS` (within `collection-table-map.ts`): This specific mapping structure will be replaced by the new, more granular `*-download-relations.ts` files.
- **Reasoning:** Centralizes all downloadable/media item definitions. Uses consistent UUIDs for relationships. Simplifies how seeding scripts find and link downloads.

### 3.3. Standardize Entity Identifiers in Relation Mappings

- **Files Involved:** `lesson-quiz-relations.ts`, `COLLECTION_DOWNLOAD_MAPPINGS` (to be replaced by `lesson-download-relations.ts`, etc.).
- **Issue:** Current mappings use slugs (e.g., `lessonSlug`) as keys.
- **Action:**
  1.  Modify all relationship mapping files to use parent entity UUIDs as keys.
  2.  Example for `lesson-quiz-relations.ts`:
      ```typescript
      // packages/payload-local-init/data/relations/lesson-quiz-relations.ts
      // Key: Lesson UUID, Value: Quiz UUID
      export const LESSON_QUIZ_RELATIONS: Record<string, string | null> = {
        'b1e873c4-6ee3-423c-8ac0-23d5bd5ad4c1':
          '5a8d6b7c-9e2f-4d3a-8b1c-0f9a2e4d5c6b', // Our Process -> Our Process Quiz
        '82b4c8fb-49f9-4744-9abe-66bf2bbdbbfd':
          'd5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0', // The Who -> The Who Quiz
        // ... (populated with all lesson UUIDs and their corresponding quiz UUIDs, or null if no quiz)
      };
      ```
  3.  Ensure these files are fully populated.
- **Reasoning:** Seeding scripts will primarily work with UUIDs (e.g., from `lesson-definitions.yaml`). Using UUIDs in relation mappings avoids an extra slug-to-UUID lookup step during relationship population.

### 3.4. Raw Content Processing Strategy

- **Files Involved:** `.mdoc` files in `packages/payload-local-init/data/raw/`, `lessons_structured_content.yaml` (for `todo_items`).
- **Action (Responsibility of Stage 2 Seeding Scripts):**
  1.  **Markdown/Mdoc to Lexical:** The Node.js seeding scripts for lessons, posts, documentation, etc., will read the raw `.mdoc` files. They will use the `lexical-converter.ts` utility (or a similar robust library) to transform this Markdown content into the final Lexical JSON structure required by Payload. The script will then insert this Lexical JSON directly.
  2.  **`todo_items` in `lesson-definitions.yaml`:**
      - If `todo_items` (e.g., `watch_content`, `read_content`) are simple text descriptions, they can be seeded directly into corresponding text fields in Payload.
      - If these `todo_items` need to be stored as structured content (e.g., Lexical JSON for richer formatting, or a specific JSON array of objects for the `todo` field in `course_lessons`), then either:
        - The `lesson-definitions.yaml` file should be updated to store this richer structure directly.
        - Or, the seeding script for lessons will perform the necessary transformation from simple strings to the required structured format before insertion. (Prefer updating the YAML if the structure is fixed).
  3.  **Image References in Raw Content:** If raw content (e.g., `.mdoc` files) embeds images using "frontmatter paths" (like `/cms/images/...`), the seeding scripts will need to:
      - Extract these paths.
      - Use `image-mappings.ts` (or its successor logic) to find the corresponding `key` in the new `download-definitions.ts`.
      - Use the UUID of that download entry to create the appropriate relationship or embeddable ID in the Lexical content.
- **Reasoning:** Keeps SSOT files for raw content as "raw as possible" or as structured data. Transformations to final database formats (like Lexical JSON) are handled by the one-time seeding scripts, making the process clearer.

## 4. Phase 3: Documentation and Verification

### 4.1. Document SSOT Structure

- **Action:** Create/update a `README.md` file within `packages/payload-local-init/data/`.
- **Content:** This README should clearly explain:
  - The purpose of each SSOT file and subdirectory (`mappings`, `raw`, `definitions`).
  - The expected structure/schema of each data file.
  - How the files relate to each other (e.g., how UUIDs from `*-id-map.ts` are used in `*-definitions.ts` and `*-relations.ts`).
  - The naming conventions used.
- **Reasoning:** Essential for future maintenance and understanding of the data landscape.

### 4.2. Enhance Verification Scripts (Stage 4)

- **Action:** The Stage 4 verification scripts (e.g., `verify-relationships-integrity.js`) should be updated or new ones created to:
  - Validate that all UUIDs referenced in relationship files (e.g., `lesson-quiz-relations.ts`, `lesson-download-relations.ts`) exist in their respective definition SSOTs (e.g., `quiz-definitions.ts`, `download-definitions.ts`, `lesson-definitions.yaml`).
  - Check for orphaned IDs or broken links.
  - If slugs are still used as intermediate identifiers in any SSOT processing, verify they resolve to known entities.
- **Reasoning:** Catches data integrity issues within the SSOT files themselves before seeding even begins.

## 5. Summary of Key File Changes/Creations

- **Consolidated/Renamed:**
  - `quizzes.ts` is merged into `quizzes-quiz-questions-truth.ts`, which is then renamed to `quiz-definitions.ts`.
  - `lessons_structured_content.yaml` is renamed to `lesson-definitions.yaml`.
- **Converted Format:**
  - `survey-id-map.json` becomes `survey-id-map.ts`.
- **New Files to Create:**
  - `packages/payload-local-init/data/download-definitions.ts` (central SSOT for all downloads/media).
  - `packages/payload-local-init/data/relations/lesson-download-relations.ts` (maps lesson UUIDs to download UUIDs).
  - Potentially similar `[entity]-download-relations.ts` for posts, documentation if they have direct download relationships defined in SSOTs.
  - `packages/payload-local-init/data/README.md`.
- **Modified Structure/Content:**
  - `quiz-definitions.ts`: `explanation` field to store Lexical objects directly.
  - `lesson-quiz-relations.ts`: Keys become lesson UUIDs; values become quiz UUIDs. Ensure data is complete.
  - `collection-table-map.ts`: `COLLECTION_DOWNLOAD_MAPPINGS` section is removed (its functionality is superseded by more specific `*-download-relations.ts` files).
  - `data/definitions/quiz-types.ts`: Update `QuizQuestion` interface for `explanation` field type.
- **Raw Content (`packages/payload-local-init/data/raw/`):**
  - Review and standardize filenames (e.g., use slugs from corresponding definition files: `our-process.mdoc`).
  - Ensure a consistent way of referencing images or other assets within these files if they need to be linked during seeding.

This detailed plan should provide a clear path to making the SSOT files more robust, easier to use for the new seeding scripts, and ultimately contribute to a more reliable content migration system.
