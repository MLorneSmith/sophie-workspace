# Single Source of Truth (SSOT) Files

This directory (`packages/payload-local-init/data/`) contains the Single Source of Truth (SSOT) files, definitions, and mappings used by the content migration and seeding system (`Initialize-PayloadData.ps1`).

The scripts in `packages/payload-local-init/stage-*-*/` read directly from these files to populate the Payload CMS database, ensuring consistency and reliability.

## Directory Structure

- **`definitions/`**: Contains core data definitions and type interfaces.
  - `quiz-types.ts`: TypeScript interfaces for quiz and question structures.
- **`mappings/`**: Contains mapping files used to relate different pieces of data, typically using UUIDs.
  - `collection-table-map.ts`: Maps Payload collection slugs to database table names.
  - `lesson-quiz-relations.ts`: Defines the relationship between lessons and quizzes, using lesson UUIDs as keys and quiz UUIDs as values.
  - `relationship-map.json`: (Evaluate necessity during script development - potentially deprecated).
  - `survey-id-map.ts`: Maps survey keys to their predefined UUIDs.
- **`raw/`**: Contains the original source content files before processing.
  - `courses/lessons/*.mdoc`: Markdown content for course lessons.
  - `courses/quizzes/*.mdoc`: Markdown content for quiz questions and explanations.
  - `documentation/**/*.mdoc`: Markdown content for documentation pages.
  - `posts/**/*.mdoc`: Markdown content for blog posts.
  - `surveys/*.yaml`: YAML definitions for surveys and survey questions.
  - `bpm/*.html`: HTML content for BPM-related items (evaluate necessity).
  - `lesson-metadata.yaml`: (Evaluate necessity - potentially superseded by `lesson-definitions.yaml`).
  - `lesson-todo-content.html`: (Evaluate necessity - potentially superseded by `lesson-definitions.yaml`).
- **`relations/`**: Contains files specifically defining relationships between entities, using parent entity UUIDs as keys.
  - `lesson-download-relations.ts`: Defines the relationship between lessons and downloads, using lesson UUIDs as keys and arrays of download UUIDs as values.
- **`download-definitions.ts`**: Defines all downloadable and media items, including their UUIDs, keys, filenames, URLs, and types. This consolidates information previously spread across `download-id-map.ts` and `image-mappings.ts`.
- **`lesson-definitions.yaml`**: Defines core metadata for course lessons, including UUIDs, slugs, titles, video info, todo items, and download information (PDFs).
- **`quiz-definitions.ts`**: Defines core metadata for quizzes and their associated questions, including UUIDs, slugs, titles, descriptions, passing scores, and question details (text, options, correct answer, Lexical explanation).

## Key Principles

- **Single Source:** Each piece of content or relationship is defined in one primary location within this directory.
- **UUIDs as Identifiers:** Relationships and mappings primarily use predefined UUIDs to ensure stable links across database resets.
- **Processed Content:** Content that requires transformation (e.g., Markdown to Lexical) is stored in `raw/`, and the transformation logic resides in the seeding scripts, not within the SSOT files themselves.
- **Relationships Centralized:** Relationship definitions are clearly defined, primarily in the `relations/` subdirectory or within definition files (like `quiz-definitions.ts` for questions).

## Maintenance

- When adding new content or relationships, update the relevant SSOT file(s) in this directory.
- Ensure UUIDs are unique and consistent.
- Refer to the SSOT Adaptation Plan (`z.plan/payload-refactor/Phase 2/2-refactor-ssot-files-plan.md`) for detailed guidelines on file structure and content.
