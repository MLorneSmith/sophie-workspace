## General Design Requirements: Payload CMS & Migration System Refactor

**Version:** 1.0
**Date:** May 6, 2025

### 1. Introduction & Goals

This document outlines the design requirements for refactoring the Payload CMS integration and the associated content migration system (`reset-and-migrate`). The primary goals of this refactor are to:

- **Enhance Stability & Reliability:** Eliminate persistent errors, data inconsistencies, and unpredictable behavior in both the Payload admin UI and the frontend application.
- **Improve Maintainability:** Simplify the overall architecture, making it easier to understand, debug, and extend.
- **Ensure Data Integrity:** Establish robust processes that guarantee consistency between different data representations, especially for relationships.
- **Streamline Development:** Create a predictable and efficient workflow for managing content schema and data, from development to production.

This refactor involves two main thrusts:

1.  Setting up a new, clean Payload CMS application instance.
2.  Re-architecting the content migration and seeding system.

### 2. Guiding Design Principles

The refactor will adhere to the following design principles, derived from key learnings:

1.  **Data Consistency by Design:** The system must be architected to ensure that all representations of data (e.g., `_rels` tables, JSONB fields) are populated atomically and consistently from a single source of truth.
2.  **Simplified Orchestration:** The migration and seeding process will be linear and modular, with clear separation of concerns (schema, core data, relationships, verification). Complex, interwoven repair logic within the main flow will be avoided.
3.  **Strict Adherence to Single Source of Truth (SSOT):** All content and relationship data will be derived directly from predefined SSOT files. The system will not rely on querying potentially inconsistent database states to build other states.
4.  **Robust and Atomic Data Population:** Data will be populated using reliable methods (e.g., `psql` for bulk SQL, Payload Local API for targeted operations). Critical steps will occur within explicit, well-managed transactions.
5.  **Strategic Use of Payload's API:** Payload's Local API will be leveraged for operations where its internal logic (validation, hook execution, relationship management) is beneficial, particularly for creating/updating individual documents and managing relationships. Direct SQL will be considered for initial bulk data seeding where performance is paramount.
6.  **Decoupled Verification:** Data verification will be a distinct phase, executed _after_ all data population and relationship building is complete and committed. Verification scripts will report issues, not attempt to fix them within the verification step itself.
7.  **Granular Debugging and Comprehensive Logging:** All scripts involved in the migration and seeding process will implement detailed, contextual logging to aid in troubleshooting.
8.  **Configuration Alignment:** Payload collection configurations must be meticulously aligned with the database schema and intended data behaviors (especially versioning and relationships).
9.  **Incremental Development and Testing:** The refactor will proceed in manageable stages, with regular testing, including deployments to a production-like environment, to validate changes and catch issues early.

### 3. Phase 1: New Payload CMS Application Setup

This phase focuses on establishing a clean foundation for Payload CMS.

1.  **Archive Existing Payload App:**
    - The current `apps/payload` directory will be renamed (e.g., `apps/payload_legacy`) to preserve it for reference.
2.  **Initialize New Payload App:**
    - A new Payload CMS application will be installed and initialized within `apps/payload`.
    - Basic Payload configuration (`payload.config.ts`) will be set up, including database connection (Supabase), admin user, and essential plugins (e.g., S3 plugin for Cloudflare R2).
3.  **Define Collections:**
    - Working collection definitions from the `payload_legacy` app will be selectively copied and adapted to the new app. This includes collections identified as largely functional:
      - `Media` (Downloads) - ensuring S3/R2 plugin is correctly configured.
      - `Documentation`
      - `Posts`
      - `Private Posts` (with specific testing for rich text field functionality).
      - `Surveys`
      - `SurveyQuestions`
      - `Courses`
      - `CourseLessons`
      - `CourseQuizzes`
      - `QuizQuestions`
    - Collection definitions will be reviewed against `z.plan/payload-refactor/start/5-payload-schema-cleanup-candidates.md` to implement a cleaner schema from the outset, avoiding deprecated fields and structures.
    - Ensure all collections have appropriate versioning configuration (e.g., `versions: { drafts: true }`) if versioning fields (`_status`) are used.
4.  **Initial Schema Migration:**
    - Payload's default migration capabilities (`payload migrate`) will be used to generate and apply the initial database schema based on the new collection definitions. This will create the necessary tables in the `payload` schema in Supabase.
5.  **Type Generation:**
    - Payload's `payload generate:types` command will be run to create TypeScript types for the collections.

### 4. Phase 2: Refactoring Content Migration & Seeding System

This phase focuses on redesigning the process for populating the database. The system will be modular, with distinct stages. Node.js scripts utilizing the Payload Local API and direct SQL execution (via `psql` or a robust Node.js SQL library) will be the primary tools.

**Overall Staged Architecture:**

1.  **Stage 0: Database Reset (Optional but recommended for development)**
    - A script to drop and recreate the `payload` schema or relevant tables in Supabase.
2.  **Stage 1: Schema Application (Payload Migrations)**
    - Run `payload migrate` to ensure the database schema matches the defined Payload collections.
3.  **Stage 2: Core Content Seeding (Non-Relationship Data)**
    - **Objective:** Populate main collection tables with their attributes, excluding complex relationships.
    - **Source:** SSOT files identified in `z.plan/payload-refactor/start/7-payload-sso-truth-files.md` (e.g., `lessons_structured_content.yaml`, `quizzes.ts`, `download-id-map.ts`, raw Markdown content from `raw/`).
    - **Methodology:**
      - For bulk seeding of numerous simple records from structured SSOT files (YAML, TS objects), **generate and execute SQL `INSERT` statements**. This is generally more performant for large initial data loads. Scripts will parse SSOT files and construct these SQL statements.
      - For content requiring processing (e.g., Markdown to Lexical JSON), Node.js scripts will read raw content, transform it, and then use either generated SQL or Payload's Local API (`payload.create`) to insert. The choice will depend on the complexity of the object and whether Payload hooks need to run during creation.
    - **Data:** This stage populates fields like titles, slugs, descriptions, content (Lexical JSON), status, types, etc., for all core collections.
4.  **Stage 3: Relationship Population**
    - **Objective:** Establish connections between documents in different collections.
    - **Source:** SSOT files specifically defining relationships (e.g., `quizzes-quiz-questions-truth.ts`, `definitions/lesson-quiz-relations.ts`, `mappings/lesson-downloads-mappings.ts`).
    - **Methodology:**
      - **Utilize Payload's Local API (`payload.update`) exclusively for this stage.** This is critical because:
        - Payload's API correctly handles the dual storage of relationships (in the parent document's JSONB field and the corresponding `_rels` table).
        - It ensures the `path` column in `_rels` tables is populated correctly.
        - It respects any relationship-specific hooks or validation defined in Payload.
      - Node.js scripts will:
        1.  Initialize Payload (`await payload.init(...)`).
        2.  Read the relevant relationship SSOT file.
        3.  Iterate through parent documents (e.g., a specific quiz).
        4.  For each parent, retrieve the IDs of its related child documents (e.g., question IDs for that quiz) from the SSOT.
        5.  Use `await payload.update({ collection: 'parent_collection_slug', id: parentId, data: { relationship_field: childIdsArray } })` to update the relationship field. `childIdsArray` should be an array of objects like `{ relationTo: 'child_collection_slug', value: 'child_id' }` or just `['child_id']` depending on the relationship type.
5.  **Stage 4: Verification**
    - **Objective:** Perform checks to ensure data integrity and completeness after all seeding and relationship population.
    - **Methodology:**
      - A set of independent Node.js scripts or SQL queries.
      - These scripts will _not_ attempt to fix data but will report errors and discrepancies.
      - **Checks to include:**
        - All content from SSOT files is present in the database.
        - Relationships defined in SSOTs are correctly reflected in both JSONB fields and `_rels` tables.
        - The `path` column in all `_rels` tables is correctly populated.
        - No orphaned relationship records.
        - Key fields (e.g., slugs, required content) are populated.
        - Counts of related items match SSOT definitions.
    - **Output:** Clear reports on any issues found.

**Tooling for Migration & Seeding:**

- **Node.js:** For scripting, interacting with Payload Local API, parsing SSOT files, and complex data transformations.
- **`psql` or a robust Node.js PostgreSQL library:** For executing generated SQL for bulk seeding and for running verification queries.
- **PowerShell/Bash:** For orchestrating the execution of the different stages. The main `reset-and-migrate.ps1` script will be refactored to call these new, modular Node.js/SQL scripts in sequence.

### 5. Testing Strategy

1.  **Unit Tests:**
    - For individual Node.js utility functions used in parsing SSOTs, transforming data, or generating SQL.
2.  **Integration Tests (Per Stage):**
    - **Core Content Seeding:** After running Stage 2, scripts to verify that a sample of core documents exists with correct non-relationship attributes.
    - **Relationship Population:** After running Stage 3, scripts to verify that a sample of relationships is correctly established (checking both JSONB and `_rels` tables via Payload API `depth=1` calls and direct SQL).
3.  **End-to-End (E2E) Tests:**
    - Run the entire refactored `reset-and-migrate` process.
    - Test key functionalities:
      - Payload Admin UI: Can all collections be accessed? Can documents be created/edited? Are relationships displayed correctly?
      - Application Frontend: Do pages dependent on CMS content load correctly (e.g., course pages, lessons, quizzes, blog posts, documentation)?
      - Payload API: Test key API endpoints directly (e.g., fetching courses with `depth=2`) to ensure data is returned as expected.
4.  **Incremental Production Pushes:**
    - As significant milestones in the refactor are achieved (e.g., new Payload app setup, first successful run of the new migration system in a staging environment), changes should be pushed to production or a production-like environment to validate them in a real-world setting. This helps catch environment-specific issues early.
5.  **Manual Spot Checks:**
    - Regularly perform manual checks in the Payload admin UI and the frontend application throughout the development process.

### 6. Key Considerations & Open Questions

- **Performance of Payload Local API for Bulk Updates:** While ideal for correctness, the performance of `payload.update` for populating relationships across thousands of documents needs to be monitored. If it's too slow, alternative strategies for `_rels` table population might be explored, but with extreme caution to maintain consistency.
- **Lexical Rich Text Seeding:** The strategy for seeding Lexical JSON content needs to be robust. Ensure that the JSON structure generated from source (e.g., Markdown) is valid and renders correctly in Payload.
- **Handling of `_status` and Versioning:** The seeding process must correctly set the `_status` field (e.g., to 'published') for content that should be live. If versioning is heavily used, the implications for seeding specific versions need to be considered.
- **Error Handling and Rollback in Orchestration:** The main orchestration script (`reset-and-migrate.ps1`) needs robust error handling. If a stage fails, subsequent stages should not run. Decide on a rollback strategy (e.g., for development, a full DB reset might be acceptable if a mid-process stage fails).
- **Environment-Specific Configurations:** Ensure the new system can handle different configurations for development, staging, and production environments (e.g., different SSOT files or API endpoints if necessary).

This document provides a high-level design. Detailed specifications for each script and stage will be developed as part of the implementation.
