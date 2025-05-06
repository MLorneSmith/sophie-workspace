# Payload Content Migration: Source of Truth (SSOT) Files

This document lists the key files identified within `packages/content-migrations/src/data/` that serve as Single Sources of Truth (SSOT), contain critical definitions, or provide essential mappings for the content migration process. The refactored migration system should rely primarily on these files for populating database content and relationships.

## Core SSOT Files

These files contain the definitive content or relationship definitions:

1.  **`quizzes-quiz-questions-truth.ts`**:

    - **Purpose:** Defines the exact relationship between each quiz and its constituent questions (which question IDs belong to which quiz ID).
    - **Role:** Critical SSOT for the `course_quizzes` <-> `quiz_questions` relationship.

2.  **`definitions/lesson-quiz-relations.ts`**:

    - **Purpose:** Defines the relationship between specific course lessons and their associated quizzes.
    - **Role:** Critical SSOT for the `course_lessons` <-> `course_quizzes` relationship.

3.  **`definitions/lessons_structured_content.yaml`**:

    - **Purpose:** Likely contains structured metadata and potentially content definitions for course lessons (e.g., title, slug, description, order, duration).
    - **Role:** Likely SSOT for core lesson data.

4.  **`definitions/quizzes.ts`**:

    - **Purpose:** Likely contains metadata for quizzes (e.g., title, slug, description, pass threshold). Complements `quizzes-quiz-questions-truth.ts`.
    - **Role:** Likely SSOT for core quiz data.

5.  **`mappings/lesson-downloads-mappings.ts`**:

    - **Purpose:** Defines the relationship between course lessons and associated downloadable files.
    - **Role:** SSOT for the `course_lessons` <-> `downloads` relationship.

6.  **`download-id-map.ts`**:

    - **Purpose:** Contains metadata or maps original identifiers to final UUIDs for items in the `downloads` collection.
    - **Role:** SSOT for download item definitions/metadata.

7.  **`survey-id-map.json`**:

    - **Purpose:** Contains metadata or maps original identifiers to final UUIDs for surveys.
    - **Role:** SSOT for survey definitions/metadata.

8.  **`definitions/quiz-types.ts`**:

    - **Purpose:** Defines the allowed types for quiz questions (e.g., 'multiple_choice').
    - **Role:** SSOT for quiz type enumeration/validation.

9.  **`raw/` (Directory)**:
    - **Purpose:** Contains the original source content files (e.g., Markdown for lessons, posts, docs).
    - **Role:** The ultimate SSOT for the raw textual/prose content before processing.

## Critical Mapping & Configuration Files

These files provide essential translations or configurations needed during migration:

10. **`mappings/image-mappings.ts`**:

    - **Purpose:** Maps image identifiers or properties, potentially bridging `media` and `downloads` concepts.
    - **Role:** Critical mapping for image/media handling.

11. **`mappings/collection-table-mappings.ts`**:

    - **Purpose:** Maps Payload collection slugs to their corresponding database table names.
    - **Role:** Essential configuration for database interactions.

12. **`mappings/relationship-map.json`**:
    - **Purpose:** A general lookup map potentially used for resolving various relationships during data processing.
    - **Role:** Important mapping configuration.

## Files Requiring Further Investigation

- **`data/definitions/` & `data/mappings/` Contents:** Other files within these directories might also contain relevant definitions or mappings that should be reviewed.
- **`data/fallbacks/`:** Understand what default data is provided here.

**Conclusion:**

The refactored migration process must be designed to read data and relationship definitions directly and reliably from these identified SSOT and mapping files to ensure consistency and correctness in the final database state.
