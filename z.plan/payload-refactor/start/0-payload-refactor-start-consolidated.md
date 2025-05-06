z.plan\payload-refactor\start\1-payload-cms-key-learnings.md

# Key Learnings for Payload CMS Functionality (Post-Debugging)

This document summarizes the critical insights gained from extensive debugging of Payload CMS integration, particularly concerning content migrations, relationship handling, and API errors within the Makerkit/Next.js Turborepo setup.

## 1. Relationship Data Integrity is Paramount

- **Core Problem:** The most persistent issues (frontend 404/500 errors, Payload UI "Nothing Found") stemmed from inconsistencies between relationship data stored in dedicated join tables (e.g., `payload.course_quizzes_rels`) and the corresponding JSONB relationship fields within parent documents (e.g., `payload.course_quizzes.questions`).
- **Payload API Sensitivity:** Payload's API, especially when fetching related data (`?depth=1` or greater), is highly sensitive to the format and consistency of this relationship data. Malformed JSONB arrays or mismatches with `_rels` tables cause internal API failures, often manifesting as 404 or 500 errors even if the base documents exist.
- **`path` Column:** The `path` column in `_rels` tables (e.g., `course_quizzes_rels`) _must_ be correctly populated with the field name from the parent collection (e.g., 'questions') for Payload to resolve the relationship correctly. `NULL` values break this link.

## 2. Migration System Complexity is a Major Risk

- **Fragile Repairs:** The existing `reset-and-migrate.ps1` system, with its multiple phases and interwoven repair/verification scripts, proved extremely difficult to debug. Fixes in one area were often undone or masked by issues elsewhere, particularly due to suspected transaction rollbacks triggered by verification errors.
- **Ineffective Fixes:** Scripts attempting to repair relationships by merging potentially corrupt data from both `_rels` tables and JSONB fields were unreliable. Direct SQL fixes applied during the migration often failed to persist.
- **Need for Simplicity:** A simpler, more linear migration process focused on generating the correct final state directly from a source of truth is required for reliability. Complex, multi-step repair logic within the migration itself is prone to failure.

## 3. Establish a Single Source of Truth (SSOT)

- **Critical Finding:** Identifying `packages/content-migrations/src/data/quizzes-quiz-qestions-truth.ts` as the SSOT for quiz relationships was crucial.
- **Mandatory Use:** Any migration or seeding process _must_ use designated SSOT files to populate content and relationship data. Relying on querying potentially inconsistent database states to build other states is unreliable.

## 4. Database Seeding Requires Robustness

- **SQL Execution:** Executing complex SQL seed files (especially those with multi-line strings or JSON) directly via simple script runners or basic string splitting is unreliable. Dedicated SQL execution utilities (like `psql` or robust Node.js wrappers) are necessary.
- **Syntax & Escaping:** Careful attention must be paid to SQL syntax, particularly JSONB formatting (`jsonb_build_array`, `jsonb_build_object`) and string escaping (dollar-quoting `$$...$$` is often safest).
- **Column Population:** Ensure seed generation logic correctly targets and populates _all_ required columns, including those added later (like `pass_threshold`, `correct_answer`).

## 5. Payload Configuration Essentials

- **Versioning (`versions: { drafts: true }`):** This configuration is essential in collection definitions if the underlying database schema uses Payload's versioning fields (`_status`, `publishedAt`, etc.). Missing this config leads to unexpected API behavior, even if data exists in the DB with `_status = 'published'`.
- **Hooks (`afterRead`, `beforeChange`):**
  - `afterRead` hooks run _after_ Payload's internal data fetching (including relationship population). They cannot fix underlying data inconsistencies that cause the initial fetch to fail (e.g., 404/500 errors on `depth > 0` calls).
  - Hooks should be used for their intended purpose (data transformation/validation) and not as a primary mechanism to fix persistent data integrity issues originating from the migration/seeding process. Ensure hooks are resilient to potentially malformed data if they must run before data integrity is guaranteed.

## 6. Debugging Strategy

- **Isolate Components:** When debugging, isolate the failing component (migration script, Payload API, frontend fetch). Test API endpoints directly (`curl`, Postman) to bypass the frontend. Run migration sub-scripts individually.
- **Verify Database State Directly:** Use direct SQL queries (`psql` or MCP tool) to verify the _actual_ state of the database after migration steps, rather than relying solely on script logs or verification scripts that might themselves be flawed or affected by transaction issues.
- **Analyze Payload Server Logs:** For API errors (404/500), the Payload server's own logs are often more informative than the calling application's logs.

## Conclusion

Achieving reliable Payload CMS functionality in this complex setup requires:

1.  A **simplified and robust content migration/seeding process** that generates the correct database state directly from a **single source of truth**.
2.  Ensuring **relationship data is perfectly consistent** between `_rels` tables and JSONB fields, with the correct format and `path` values.
3.  Correct **Payload collection configuration**, especially regarding versioning.
4.  Treating the migration process as the primary mechanism for ensuring data integrity, rather than relying on complex runtime hooks to fix underlying data issues.


z.plan\payload-refactor\start\2-payload-design-principles.md

# Payload CMS & Migration System: Emergent Design Principles

Based on extensive debugging of the Payload CMS integration and the `reset-and-migrate.ps1` content migration system, the following principles should guide future development and refactoring efforts to improve reliability and maintainability.

1.  **Principle: Prioritize Data Consistency by Design.**

    - **Learning:** Core issues stemmed from inconsistencies between related data in `_rels` tables and JSONB fields. Payload's API requires strict consistency, especially for deep fetches (`depth > 0`).
    - **Guideline:** Design data seeding/update processes to guarantee consistency. Populate different representations of the same relationship (e.g., `_rels` entry and JSONB field) atomically from the same source. Avoid processes where they can diverge.

2.  **Principle: Simplify Migration Orchestration.**

    - **Learning:** The complex, multi-phase `reset-and-migrate.ps1` script with interwoven repairs and verifications was fragile and hard to debug. Errors often caused silent rollbacks.
    - **Guideline:** Favor a linear, simpler orchestration flow. Separate distinct concerns (schema migration, data seeding, relationship population, verification) into independent, sequential stages. Minimize complex repair logic within the main migration flow.

3.  **Principle: Adhere Strictly to a Single Source of Truth (SSOT).**

    - **Learning:** Using defined SSOT files (like `quizzes-quiz-questions-truth.ts`) was crucial for correcting data. Relying on potentially inconsistent database states to derive other data proved unreliable.
    - **Guideline:** Define clear SSOT files/sources for all core content and relationships. All data seeding and relationship population logic _must_ read directly from these SSOTs.

4.  **Principle: Ensure Robust and Atomic Data Population.**

    - **Learning:** Executing complex SQL through multiple script layers was unreliable. Direct `psql` was more robust. Transaction rollbacks likely caused data persistence issues.
    - **Guideline:** Use direct and reliable methods for database interactions (e.g., `psql`, robust Node.js libraries). Ensure critical data population steps occur within explicit, well-managed transactions for atomicity.

5.  **Principle: Leverage Payload's API/Logic Where Appropriate.**

    - **Learning:** Manually replicating Payload's relationship logic (JSONB formatting, `_rels` management) is complex.
    - **Guideline:** For _updates_ or potentially _seeding_ (if performance allows), consider using Payload's Local API (`payload.create`, `payload.update`). This leverages Payload's internal logic, hooks, and validation. However, for initial bulk seeding, direct SQL generation from SSOT might be necessary for speed.

6.  **Principle: Decouple Verification from Population.**

    - **Learning:** Running verification scripts _during_ data population caused errors that likely triggered transaction rollbacks, undoing the population work.
    - **Guideline:** Execute verification scripts as a distinct phase _after_ all data population and relationship building is complete and committed. Verification should report errors, not attempt fixes within the main flow.

7.  **Principle: Implement Granular Debugging and Monitoring.**

    - **Learning:** High-level logs were insufficient. Detailed script logging and direct database inspection were required.
    - **Guideline:** Ensure migration scripts have detailed, contextual logging. Create specific, independent diagnostic scripts to check data integrity.

8.  **Principle: Understand and Align with Payload Configuration.**
    - **Learning:** Missing Payload collection configurations (like `versions: { drafts: true }`) directly impacted API behavior, even with correct database schema/data.
    - **Guideline:** Keep Payload configurations aligned with the database schema and intended behavior (especially versioning, relationships). Regenerate types after config changes.


z.plan\payload-refactor\start\3-payload-unique-requirements-summary.md


# Summary: Unique Requirements & Characteristics of Payload CMS Migrations & Relationships

This document summarizes key findings regarding Payload CMS's specific approach to database schema, migrations, and relationship management, based on documentation review, community discussions, and debugging efforts within the project. Understanding these characteristics is crucial for building reliable data seeding and migration processes.

1.  **Dual Relationship Storage & Synchronization:**

    - **Mechanism:** Payload often represents relationships in two places:
      - Dedicated SQL join tables (e.g., `payload.collection_rels`).
      - A JSONB array field within the parent document (e.g., `parent_document.relationship_field`).
    - **Requirement:** For Payload's API (especially deep fetches using `?depth=N`) and Admin UI to function correctly, these two representations **must be perfectly synchronized and correctly formatted**. Discrepancies lead to errors (404s, 500s) or missing data, even if the underlying records exist.
    - **Challenge:** Keeping these synchronized during complex seeding or data repair operations is a primary challenge and likely necessitated many of the custom "repair" scripts.

2.  **Strict JSONB Relationship Formatting:**

    - **Requirement:** The JSONB array used to store relationships within a parent document requires a very specific format, particularly for `hasMany: true` or polymorphic relationships (e.g., `[{ "id": "...", "relationTo": "...", "value": { "id": "..." } }, ...]`).
    - **Challenge:** Ensuring data seeded or repaired via custom scripts adheres precisely to this format is critical. Incorrect formatting breaks API relationship population.

3.  **Importance of `_rels` Table `path` Column:**

    - **Requirement:** The `path` column within relationship join tables (`_rels`) must contain the _exact name_ of the corresponding relationship field in the parent collection's configuration (e.g., 'questions' for the `questions` field in `course_quizzes`).
    - **Challenge:** If this column is `NULL` or incorrect, Payload cannot link the relationship record back to the field definition, breaking relationship resolution. Custom seeding/repair scripts must explicitly populate this correctly.

4.  **Standard Migrations Focus on Schema:**

    - **Payload's Intent:** The built-in `payload migrate` system excels at managing database _schema_ changes driven by modifications to the Payload config (collections, fields).
    - **Limitation:** It is not inherently designed for complex _data_ transformations, seeding based on external logic/files (like an SSOT), or intricate data integrity repairs across multiple tables/formats (like `_rels` vs. JSONB sync).

5.  **Necessity of Custom Scripts for Complex Data Operations:**

    - **Requirement:** Tasks like seeding data from source-of-truth files, complex data reformatting (e.g., Lexical content migration), or ensuring the dual relationship storage consistency often require custom scripts (Node.js, SQL executed via `psql`, etc.) run alongside or outside the standard Payload migration flow.
    - **Challenge:** These custom scripts need careful implementation, robust error handling, and proper transaction management to avoid introducing the very inconsistencies they aim to fix. The previous "repair" scripts likely originated from this need but became overly complex and fragile.

6.  **Application vs. Database Layer Constraints:**
    - **Observation:** Some relationship constraints defined in the Payload config (e.g., `unique: true`, `required: true` on a `hasMany: false` relationship) might be primarily enforced at the Payload application layer, not necessarily via strict database constraints on the underlying `_rels` tables (which often resemble many-to-many structures).
    - **Implication:** Relying solely on the database schema might not fully represent all intended data rules; Payload's API layer adds its own enforcement. However, for data integrity during seeding/migration, ensuring the database state is correct according to the _intended_ logic is paramount.

**Conclusion:**

Successfully managing data within this Payload CMS setup requires acknowledging that standard migrations handle the schema, but robust, custom scripting is necessary for complex seeding, transformation, and particularly for ensuring the consistency of Payload's dual-storage relationship model based on a defined source of truth. The design of these custom scripts must prioritize simplicity, atomicity, and directness to avoid the pitfalls encountered previously.


z.plan\payload-refactor\start\4-payload-schema-summary.md

# Payload Schema Summary (Supabase)

This document summarizes the tables and columns found within the `payload` schema in the Supabase database, based on a query of `information_schema.columns`.

## Views

### `payload.course_content_view`
- `course_id` (uuid)
- `course_title` (text)
- `lesson_id` (uuid)
- `lesson_title` (text)
- `lesson_order` (text)
- `quiz_id` (uuid)
- `quiz_title` (text)

### `payload.course_quiz_questions_view`
- `quiz_id` (uuid)
- `quiz_title` (text)
- `question_id` (uuid)
- `question_title` (text)
- `question_type` (text)
- `question_order` (integer)

### `payload.downloads_diagnostic`
- `id` (uuid)
- `title` (text)
- `filename` (text)
- `url` (text)
- `mimetype` (text)
- `filesize` (integer)
- `width` (integer)
- `height` (integer)
- `sizes_thumbnail_url` (text)
- `lesson_count` (bigint)
- `related_lessons` (ARRAY)

### `payload.downloads_relationships_view`
- `download_id` (uuid)
- `download_title` (text)
- `filename` (text)
- `url` (text)
- `parent_type` (text)
- `parent_id` (uuid)
- `parent_title` (text)

### `payload.invalid_relationships_view`
- `relationship_type` (text)
- `source_id` (uuid)
- `target_id` (uuid)
- `path` (text)
- `issue_type` (text)
- `source_name` (text)

### `payload.lesson_quiz_view`
- `lesson_id` (uuid)
- `lesson_title` (text)
- `quiz_id` (uuid)
- `quiz_title` (text)

### `payload.survey_questions_view`
- `survey_id` (uuid)
- `survey_title` (text)
- `question_id` (uuid)
- `question_prompt` (text)
- `question_order` (integer)

### `payload.uuid_tables_scan`
- `table_name` (name)
- `id_column` (text)
- `parent_id_column` (text)
- `path_column` (text)
- `private_id_column` (text)

## Tables

### `payload.course_lessons`
- `id` (uuid)
- `title` (text)
- `slug` (text)
- `description` (text)
- `content` (text) - *Note: Likely Lexical JSONB, but reported as text*
- `lesson_number` (integer)
- `estimated_duration` (integer)
- `published_at` (timestamp with time zone)
- `quiz_id` (uuid) - *Note: Likely deprecated/redundant*
- `quiz_id_id` (uuid) - *Note: Likely deprecated/redundant*
- `course_id` (uuid) - *Note: Likely deprecated/redundant*
- `course_id_id` (uuid) - *Note: Likely deprecated/redundant*
- `featured_image_id` (uuid) - *Note: Likely deprecated/redundant*
- `featured_image_id_id` (uuid) - *Note: Likely deprecated/redundant*
- `media_id` (uuid) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `bunny_video_id` (text)
- `bunny_library_id` (text)
- `todo_complete_quiz` (boolean)
- `todo_watch_content` (text)
- `todo_read_content` (text)
- `todo_course_project` (text)
- `survey_id` (uuid) - *Note: Likely deprecated/redundant*
- `survey_id_id` (uuid) - *Note: Likely deprecated/redundant*
- `downloads_id` (ARRAY) - *Note: Likely deprecated/redundant*
- `todo` (text) - *Note: Likely Lexical JSONB, but reported as text*
- `youtube_video_id` (text)
- `video_source_type` (text)
- `parent_id` (text) - *Note: Payload internal?*
- `path` (text) - *Note: Payload internal?*
- `private_id` (text) - *Note: Payload internal?*
- `order` (text) - *Note: Payload internal?*
- `course_lessons_id` (text) - *Note: Payload internal?*
- `course_quizzes_id` (text) - *Note: Payload internal?*
- `surveys_id` (text) - *Note: Payload internal?*
- `survey_questions_id` (text) - *Note: Payload internal?*
- `posts_id` (text) - *Note: Payload internal?*
- `documentation_id` (text) - *Note: Payload internal?*

### `payload.course_lessons__downloads` (Many-to-Many Join Table)
- `id` (uuid)
- `parent_id` (text) - *Refers to `course_lessons.id`*
- `downloads_id` (uuid) - *Refers to `downloads.id`*
- `order_column` (integer) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `order` (integer) - *Payload relationship order*
- `path` (text) - *Payload internal?*
- `private_id` (text) - *Payload internal?*
- `course_id` (text) - *Payload internal?*
- `course_lessons_id` (text) - *Payload internal?*
- `course_quizzes_id` (text) - *Payload internal?*
- `surveys_id` (text) - *Payload internal?*
- `survey_questions_id` (text) - *Payload internal?*
- `posts_id` (text) - *Payload internal?*
- `documentation_id` (text) - *Payload internal?*

### `payload.course_lessons_downloads` (Many-to-Many Join Table - Likely Deprecated)
- `id` (uuid)
- `lesson_id` (uuid)
- `download_id` (uuid)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.course_lessons_rels` (Relationship Join Table)
- `id` (uuid)
- `_parent_id` (uuid) - *Refers to `course_lessons.id`*
- `field` (character varying) - *Name of the relationship field in `course_lessons`*
- `value` (uuid) - *Note: Likely deprecated/redundant*
- `order` (integer) - *Note: Likely deprecated/redundant*
- `_order` (integer) - *Payload relationship order*
- `path` (character varying) - *Path/field name, e.g., 'course_id', 'quiz_id'*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `parent_id` (uuid) - *Note: Likely deprecated/redundant*
- `downloads_id` (uuid) - *ID of related download*
- `posts_id` (uuid) - *ID of related post*
- `documentation_id` (uuid) - *ID of related documentation*
- `surveys_id` (uuid) - *ID of related survey*
- `survey_questions_id` (uuid) - *ID of related survey question*
- `courses_id` (uuid) - *ID of related course*
- `course_lessons_id` (uuid) - *ID of related lesson (self-ref?)*
- `course_quizzes_id` (uuid) - *ID of related quiz*
- `quiz_questions_id` (uuid) - *ID of related quiz question*
- `quiz_id_id` (uuid) - *Note: Likely deprecated/redundant*
- *Plus several Payload internal columns*

### `payload.course_quizzes`
- `id` (uuid)
- `title` (text)
- `slug` (text)
- `description` (text)
- `passing_score` (integer) - *Note: Likely deprecated/redundant*
- `media_id` (uuid) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `downloads_id` (ARRAY) - *Note: Likely deprecated/redundant*
- `course_id_id` (text) - *Note: Likely deprecated/redundant*
- `pass_threshold` (integer)
- `questions` (jsonb) - *Stores array of question relationships*
- `_status` (character varying) - *Payload versioning status*
- *Plus several Payload internal columns*

### `payload.course_quizzes__downloads` (Many-to-Many Join Table)
- `id` (uuid)
- `parent_id` (text) - *Refers to `course_quizzes.id`*
- `downloads_id` (uuid) - *Refers to `downloads.id`*
- `order_column` (integer) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `order` (integer) - *Payload relationship order*
- *Plus several Payload internal columns*

### `payload.course_quizzes_rels` (Relationship Join Table)
- `id` (uuid)
- `_parent_id` (uuid) - *Refers to `course_quizzes.id`*
- `field` (character varying) - *Name of the relationship field in `course_quizzes`*
- `parent_id` (uuid) - *Note: Likely deprecated/redundant*
- `order` (integer) - *Note: Likely deprecated/redundant*
- `_order` (integer) - *Payload relationship order*
- `path` (character varying) - *Path/field name, e.g., 'questions'*
- `quiz_questions_id` (uuid) - *ID of related quiz question*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several other potential related ID columns and Payload internal columns*

### `payload.courses`
- `id` (uuid)
- `title` (text)
- `slug` (text)
- `description` (text)
- `show_progress_bar` (boolean)
- `estimated_duration` (integer)
- `status` (text)
- `published_at` (timestamp with time zone)
- `intro_content` (jsonb) - *Likely Lexical*
- `completion_content` (jsonb) - *Likely Lexical*
- `featured_image_id` (uuid) - *Note: Likely deprecated/redundant*
- `featured_image_id_id` (uuid) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `downloads_id` (ARRAY) - *Note: Likely deprecated/redundant*
- `content` (jsonb) - *Likely Lexical*
- *Plus several Payload internal columns*

### `payload.courses__downloads` (Many-to-Many Join Table)
- `id` (uuid)
- `parent_id` (text) - *Refers to `courses.id`*
- `downloads_id` (uuid) - *Refers to `downloads.id`*
- `order_column` (integer) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `order` (integer) - *Payload relationship order*
- *Plus several Payload internal columns*

### `payload.courses_rels` (Relationship Join Table)
- `id` (uuid)
- `_parent_id` (uuid) - *Refers to `courses.id`*
- `field` (character varying) - *Name of the relationship field in `courses`*
- `value` (uuid) - *Note: Likely deprecated/redundant*
- `parent_id` (uuid) - *Note: Likely deprecated/redundant*
- `_order` (integer) - *Payload relationship order*
- `path` (character varying) - *Path/field name, e.g., 'lessons'*
- `course_lessons_id` (uuid) - *ID of related lesson*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several other potential related ID columns and Payload internal columns*

### `payload.documentation`
- `id` (uuid)
- `title` (character varying)
- `slug` (character varying)
- `status` (character varying)
- `content` (jsonb) - *Likely Lexical*
- `parent` (uuid) - *Note: Likely deprecated/redundant*
- `parent_id` (uuid) - *Self-referencing ID for hierarchy*
- `description` (text)
- `order` (numeric) - *Note: Likely deprecated/redundant*
- `_order` (numeric) - *Payload order*
- `published_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- `downloads_id` (ARRAY) - *Note: Likely deprecated/redundant*
- *Plus several Payload internal columns*

### `payload.documentation__downloads` (Many-to-Many Join Table)
- `id` (uuid)
- `parent_id` (text) - *Refers to `documentation.id`*
- `downloads_id` (uuid) - *Refers to `downloads.id`*
- `order_column` (integer) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `order` (integer) - *Payload relationship order*
- *Plus several Payload internal columns*

### `payload.documentation_breadcrumbs` (Likely Array Block Data)
- `id` (uuid)
- `_order` (integer)
- `_parent_id` (uuid) - *Refers to `documentation.id`*
- `doc` (uuid) - *Note: Likely deprecated/redundant*
- `doc_id` (uuid) - *ID of related documentation page*
- `label` (character varying)
- `url` (character varying)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.documentation_categories` (Likely Array Block Data)
- `id` (uuid)
- `_order` (integer)
- `_parent_id` (uuid) - *Refers to `documentation.id`*
- `category` (character varying)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.documentation_downloads` (Many-to-Many Join Table - Likely Deprecated)
- `id` (uuid)
- `documentation_id` (uuid)
- `downloads_id` (uuid)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.documentation_downloads_rels` (Relationship Join Table - Likely Deprecated)
- `id` (text)
- `_parent_id` (text)
- `field` (text)
- `value` (text)
- `parent_id` (text)
- `order` (integer)
- `_order` (integer)
- `path` (text)
- `documentation_id` (text)
- `downloads_id` (text)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.documentation_rels` (Relationship Join Table)
- `id` (uuid)
- `_parent_id` (uuid) - *Refers to `documentation.id`*
- `field` (character varying) - *Name of the relationship field in `documentation`*
- `value` (uuid) - *Note: Likely deprecated/redundant*
- `path` (character varying) - *Path/field name, e.g., 'parent'*
- `documentation_id` (uuid) - *ID of related documentation (self-ref)*
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several other potential related ID columns and Payload internal columns*

### `payload.documentation_tags` (Likely Array Block Data)
- `id` (uuid)
- `_order` (integer)
- `_parent_id` (uuid) - *Refers to `documentation.id`*
- `tag` (character varying)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.downloads`
- `id` (uuid)
- `filename` (text)
- `url` (text)
- `description` (text)
- `lesson_id` (uuid) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `title` (text)
- `type` (text)
- `key` (text)
- `filesize` (integer)
- `mimetype` (text)
- `thumbnail_u_r_l` (text) - *Note: Likely deprecated/redundant*
- `mime_type` (text) - *Note: Likely deprecated/redundant*
- `mime` (text) - *Note: Likely deprecated/redundant*
- `alt_text` (text)
- `filename_original` (text)
- `width` (integer)
- `height` (integer)
- `focal_x` (numeric)
- `focal_y` (numeric)
- `sizes` (jsonb) - *Payload image sizes*
- `sizes_srcsets` (jsonb) - *Payload image sizes*
- `sizes_thumbnail_url` (text)
- `sizes_thumbnail_width` (integer)
- `sizes_thumbnail_height` (integer)
- `sizes_thumbnail_mime_type` (text)
- `sizes_thumbnail_filesize` (integer)
- `sizes_thumbnail_filename` (text)
- `sizes_card_url` (text)
- `sizes_card_width` (integer)
- `sizes_card_height` (integer)
- `sizes_card_mime_type` (text)
- `sizes_card_filesize` (integer)
- `sizes_card_filename` (text)
- `sizes_tablet_url` (text)
- `sizes_tablet_width` (integer)
- `sizes_tablet_height` (integer)
- `sizes_tablet_mime_type` (text)
- `sizes_tablet_filesize` (integer)
- `sizes_tablet_filename` (text)
- `caption` (text)
- `created_by` (text)
- `updated_by` (text)
- *Plus several Payload internal columns*

### `payload.downloads_relationships` (Utility Table?)
- `collection_id` (text)
- `download_id` (text)
- `collection_type` (text)
- `table_name` (text)

### `payload.downloads_rels` (Relationship Join Table)
- `id` (uuid)
- `_parent_id` (uuid) - *Refers to `downloads.id`*
- `field` (text) - *Name of the relationship field in `downloads`*
- `value` (text) - *Note: Likely deprecated/redundant*
- `order_column` (integer) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `order` (integer) - *Payload relationship order*
- `path` (text) - *Path/field name*
- `courses_id` (uuid) - *ID of related course*
- `course_lessons_id` (uuid) - *ID of related lesson*
- `course_quizzes_id` (uuid) - *ID of related quiz*
- `parent_id` (uuid) - *Note: Likely deprecated/redundant*
- *Plus several other potential related ID columns and Payload internal columns*

### `payload.dynamic_uuid_tables` (Utility Table)
- `table_name` (text)
- `primary_key` (text)
- `created_at` (timestamp with time zone)
- `needs_path_column` (boolean)
- `id` (text)
- *Plus several Payload internal columns*

### `payload.media` (Likely Deprecated/Replaced by `downloads`)
- `id` (uuid)
- `alt` (character varying)
- `filename` (character varying)
- `mime_type` (character varying)
- `filesize` (numeric)
- `width` (numeric)
- `height` (numeric)
- `url` (character varying)
- `thumbnail_u_r_l` (character varying)
- `focal_x` (numeric)
- `focal_y` (numeric)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.payload_locked_documents` (Payload Internal)
- `id` (uuid)
- `collection` (character varying)
- `document_id` (character varying)
- `lock_expiration` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- `global_slug` (character varying)
- *Plus several Payload internal columns and potential related ID columns*

### `payload.payload_locked_documents_rels` (Payload Internal Relationship Table)
- `id` (uuid)
- `order` (integer)
- `parent_id` (uuid) - *Refers to `payload_locked_documents.id`*
- `path` (character varying)
- `users_id` (uuid) - *ID of related user*
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several other potential related ID columns and Payload internal columns*

### `payload.payload_migrations` (Payload Internal)
- `id` (integer)
- `name` (character varying)
- `batch` (numeric)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.payload_preferences` (Payload Internal)
- `id` (uuid)
- `user` (uuid) - *Note: Likely deprecated/redundant*
- `key` (character varying)
- `value` (jsonb)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.payload_preferences_rels` (Payload Internal Relationship Table)
- `id` (uuid)
- `order` (integer)
- `parent_id` (uuid) - *Refers to `payload_preferences.id`*
- `path` (character varying)
- `users_id` (uuid) - *ID of related user*
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several other potential related ID columns and Payload internal columns*

### `payload.posts`
- `id` (uuid)
- `title` (character varying)
- `slug` (character varying)
- `status` (character varying)
- `content` (jsonb) - *Likely Lexical*
- `description` (text)
- `image_id` (uuid) - *Note: Likely deprecated/redundant*
- `image_id_id` (uuid) - *Note: Likely deprecated/redundant*
- `featured_image_id` (uuid) - *Note: Likely deprecated/redundant*
- `featured_image_id_id` (uuid) - *Note: Likely deprecated/redundant*
- `published_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- `downloads_id` (ARRAY) - *Note: Likely deprecated/redundant*
- *Plus several Payload internal columns*

### `payload.posts__downloads` (Many-to-Many Join Table)
- `id` (uuid)
- `parent_id` (text) - *Refers to `posts.id`*
- `downloads_id` (uuid) - *Refers to `downloads.id`*
- `order_column` (integer) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `order` (integer) - *Payload relationship order*
- *Plus several Payload internal columns*

### `payload.posts_categories` (Likely Array Block Data)
- `id` (uuid)
- `_order` (integer)
- `_parent_id` (uuid) - *Refers to `posts.id`*
- `category` (character varying)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.posts_downloads` (Many-to-Many Join Table - Likely Deprecated)
- `id` (uuid)
- `posts_id` (uuid)
- `downloads_id` (uuid)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.posts_downloads_rels` (Relationship Join Table - Likely Deprecated)
- `id` (text)
- `_parent_id` (text)
- `field` (text)
- `value` (text)
- `parent_id` (text)
- `order` (integer)
- `_order` (integer)
- `path` (text)
- `posts_id` (text)
- `downloads_id` (text)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.posts_rels` (Relationship Join Table)
- `id` (uuid)
- `_parent_id` (uuid) - *Refers to `posts.id`*
- `field` (character varying) - *Name of the relationship field in `posts`*
- `value` (uuid) - *Note: Likely deprecated/redundant*
- `path` (character varying) - *Path/field name, e.g., 'featured_image'*
- `media_id` (uuid) - *ID of related media/download*
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several other potential related ID columns and Payload internal columns*

### `payload.posts_tags` (Likely Array Block Data)
- `id` (uuid)
- `_order` (integer)
- `_parent_id` (uuid) - *Refers to `posts.id`*
- `tag` (character varying)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.private` (Private Posts Collection)
- `id` (uuid)
- `title` (character varying)
- `slug` (character varying)
- `description` (text)
- `content` (jsonb) - *Likely Lexical*
- `status` (character varying)
- `published_at` (timestamp with time zone)
- `image_id` (uuid) - *Note: Likely deprecated/redundant*
- `image_id_id` (uuid) - *Note: Likely deprecated/redundant*
- `featured_image_id` (uuid) - *Note: Likely deprecated/redundant*
- `featured_image_id_id` (uuid) - *Note: Likely deprecated/redundant*
- `downloads_id` (ARRAY) - *Note: Likely deprecated/redundant*
- `path` (text) - *Note: Payload internal?*
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.private__downloads` (Many-to-Many Join Table)
- `id` (uuid)
- `_parent_id` (uuid) - *Refers to `private.id`*
- `parent_id` (uuid) - *Note: Likely deprecated/redundant*
- `downloads_id` (uuid) - *Refers to `downloads.id`*
- `_order` (integer) - *Payload relationship order*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.private_categories` (Likely Array Block Data)
- `id` (uuid)
- `_order` (integer)
- `_parent_id` (uuid) - *Refers to `private.id`*
- `parent_id` (uuid) - *Note: Likely deprecated/redundant*
- `category` (character varying)
- `path` (text) - *Note: Payload internal?*
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.private_downloads` (Many-to-Many Join Table - Likely Deprecated)
- `id` (uuid)
- `private_id` (uuid)
- `downloads_id` (uuid)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.private_downloads_rels` (Relationship Join Table - Likely Deprecated)
- `id` (text)
- `_parent_id` (text)
- `field` (text)
- `value` (text)
- `parent_id` (text)
- `order` (integer)
- `_order` (integer)
- `path` (text)
- `private_id` (text)
- `downloads_id` (text)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.private_rels` (Relationship Join Table)
- `id` (uuid)
- `_parent_id` (uuid) - *Refers to `private.id`*
- `parent_id` (uuid) - *Note: Likely deprecated/redundant*
- `field` (text) - *Name of the relationship field in `private`*
- `value` (uuid) - *Note: Likely deprecated/redundant*
- `order` (integer) - *Note: Likely deprecated/redundant*
- `_order` (integer) - *Payload relationship order*
- `media_id` (uuid) - *ID of related media/download*
- `path` (text) - *Path/field name*
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several other potential related ID columns and Payload internal columns*

### `payload.private_tags` (Likely Array Block Data)
- `id` (uuid)
- `_order` (integer)
- `_parent_id` (uuid) - *Refers to `private.id`*
- `parent_id` (uuid) - *Note: Likely deprecated/redundant*
- `tag` (character varying)
- `path` (text) - *Note: Payload internal?*
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.quiz_question_relationships` (Utility Table?)
- `quiz_id` (text)
- `question_id` (text)
- `created_at` (timestamp without time zone)

### `payload.quiz_questions`
- `id` (uuid)
- `question` (text)
- `options` (jsonb) - *Stores array of options, e.g., `[{"id": "uuid", "text": "Option A", "isCorrect": false}]`*
- `correct_answer` (text) - *Note: Stores the UUID of the correct option*
- `type` (text) - *e.g., 'multiple_choice'*
- `explanation` (text)
- `order` (integer) - *Note: Likely deprecated/redundant*
- `_order` (integer) - *Payload order*
- `media_id` (uuid) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.quiz_questions_options` (Likely Array Block Data - Deprecated?)
- `id` (uuid)
- `_order` (integer)
- `order` (integer) - *Note: Likely deprecated/redundant*
- `_parent_id` (uuid) - *Refers to `quiz_questions.id`*
- `text` (character varying)
- `is_correct` (boolean)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.quiz_questions_rels` (Relationship Join Table)
- `id` (uuid)
- `_parent_id` (uuid) - *Refers to `quiz_questions.id`*
- `field` (character varying) - *Name of the relationship field in `quiz_questions`*
- `value` (uuid) - *Note: Likely deprecated/redundant*
- `order` (integer) - *Note: Likely deprecated/redundant*
- `_order` (integer) - *Payload relationship order*
- `path` (character varying) - *Path/field name, e.g., 'quiz_id'*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `course_quizzes_id` (uuid) - *ID of related quiz*
- *Plus several other potential related ID columns and Payload internal columns*

### `payload.survey_questions`
- `id` (uuid)
- `question` (text)
- `options` (jsonb) - *Stores array of options, e.g., `[{"id": "uuid", "option": "Option A"}]`*
- `text` (character varying) - *Note: Likely deprecated/redundant*
- `type` (character varying) - *e.g., 'multiple_choice', 'text'*
- `description` (text)
- `required` (boolean)
- `category` (character varying)
- `questionspin` (integer) - *Note: Typo? Likely 'position'*
- `position` (integer) - *Note: Likely deprecated/redundant*
- `order` (integer) - *Note: Likely deprecated/redundant*
- `_order` (integer) - *Payload order*
- `surveys_id` (uuid) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.survey_questions_options` (Likely Array Block Data)
- `id` (uuid)
- `_order` (integer)
- `order` (integer) - *Note: Likely deprecated/redundant*
- `_parent_id` (uuid) - *Refers to `survey_questions.id`*
- `option` (character varying)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.survey_questions_rels` (Relationship Join Table)
- `id` (uuid)
- `_parent_id` (uuid) - *Refers to `survey_questions.id`*
- `field` (character varying) - *Name of the relationship field in `survey_questions`*
- `value` (uuid) - *Note: Likely deprecated/redundant*
- `surveys_id` (uuid) - *ID of related survey*
- `order` (integer) - *Note: Likely deprecated/redundant*
- `_order` (integer) - *Payload relationship order*
- `path` (character varying) - *Path/field name, e.g., 'survey_id'*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several other potential related ID columns and Payload internal columns*

### `payload.surveys`
- `id` (uuid)
- `title` (text)
- `slug` (text)
- `description` (text)
- `start_message` (text)
- `end_message` (text)
- `show_progress_bar` (boolean)
- `summary_content` (jsonb) - *Likely Lexical*
- `status` (character varying)
- `published_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `downloads_id` (ARRAY) - *Note: Likely deprecated/redundant*
- *Plus several Payload internal columns*

### `payload.surveys__downloads` (Many-to-Many Join Table)
- `id` (uuid)
- `parent_id` (text) - *Refers to `surveys.id`*
- `downloads_id` (uuid) - *Refers to `downloads.id`*
- `order_column` (integer) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `order` (integer) - *Payload relationship order*
- *Plus several Payload internal columns*

### `payload.surveys_downloads` (Many-to-Many Join Table - Likely Deprecated)
- `id` (uuid)
- `surveys_id` (uuid)
- `downloads_id` (uuid)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.surveys_downloads_rels` (Relationship Join Table - Likely Deprecated)
- `id` (text)
- `_parent_id` (text)
- `field` (text)
- `value` (text)
- `parent_id` (text)
- `order` (integer)
- `_order` (integer)
- `path` (text)
- `surveys_id` (text)
- `downloads_id` (text)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.surveys_rels` (Relationship Join Table)
- `id` (uuid)
- `_parent_id` (uuid) - *Refers to `surveys.id`*
- `field` (character varying) - *Name of the relationship field in `surveys`*
- `value` (uuid) - *Note: Likely deprecated/redundant*
- `parent_id` (uuid) - *Note: Likely deprecated/redundant*
- `order` (integer) - *Note: Likely deprecated/redundant*
- `_order` (integer) - *Payload relationship order*
- `path` (character varying) - *Path/field name, e.g., 'questions'*
- `survey_questions_id` (uuid) - *ID of related survey question*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several other potential related ID columns and Payload internal columns*

### `payload.users` (Payload Users)
- `id` (uuid)
- `email` (character varying)
- `reset_password_token` (character varying)
- `reset_password_expiration` (timestamp with time zone)
- `salt` (character varying)
- `hash` (character varying)
- `login_attempts` (numeric)
- `lock_until` (timestamp with time zone)
- `first_name` (character varying)
- `last_name` (character varying)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.uuid_table_monitor` (Utility Table)
- `id` (integer)
- `table_name` (text)
- `created_at` (timestamp without time zone)
- `monitoring_status` (text)
- *Plus several Payload internal columns*

z.plan\payload-refactor\start\5-payload-schema-cleanup-candidates.md

# Payload Schema Cleanup Candidates

This document analyzes the `payload` schema summary (`z.plan/payload-refactor/payload-schema-summary.md`) to identify tables and columns that appear potentially unnecessary, redundant, or deprecated. These are candidates for removal or investigation during the refactoring of the content migration system to simplify the overall database structure.

**Important:** Thorough verification is required before removing any table or column to ensure it's not actively used by Payload internals, application code, or foreign key constraints.

## Potentially Redundant/Deprecated Join Tables

These tables seem to duplicate functionality provided by Payload's standard `__` join tables or `_rels` tables.

- `payload.course_lessons_downloads` (vs. `payload.course_lessons__downloads`)
- `payload.documentation_downloads` (vs. `payload.documentation__downloads`)
- `payload.documentation_downloads_rels` (Purpose unclear, potentially legacy)
- `payload.posts_downloads` (vs. `payload.posts__downloads`)
- `payload.posts_downloads_rels` (Purpose unclear, potentially legacy)
- `payload.private_downloads` (vs. `payload.private__downloads`)
- `payload.private_downloads_rels` (Purpose unclear, potentially legacy)
- `payload.surveys_downloads` (vs. `payload.surveys__downloads`)
- `payload.surveys_downloads_rels` (Purpose unclear, potentially legacy)

## Potentially Deprecated Collections/Fields

- **`payload.media` Table:** The `payload.downloads` collection appears more comprehensive (includes image sizes, etc.) and might have replaced `payload.media`. If `downloads` is the current standard for all media/uploads, `media` could potentially be removed.
- **`payload.quiz_questions_options` Table:** This table likely stored options for quiz questions as separate rows. If options are now consistently stored within the `options` JSONB column of `payload.quiz_questions`, this table might be deprecated.

## Utility/Diagnostic Tables (Potentially Temporary or Custom)

These tables might have been created for specific debugging, migration steps, or custom tooling and may not be required for core Payload functionality. Their necessity should be evaluated based on current scripts.

- `payload.quiz_question_relationships`
- `payload.downloads_relationships`
- `payload.uuid_table_monitor`
- `payload.dynamic_uuid_tables`

## Potentially Redundant Columns (Within Tables)

Schema evolution might have left redundant columns within core tables. The `_` prefixed columns are typically the ones Payload actively uses.

- **Duplicate ID Columns:** Columns ending in `_id_id` (e.g., `quiz_id_id`, `course_id_id`, `featured_image_id_id`) are often artifacts and might be redundant if the primary relationship (e.g., `quiz_id`) is correctly managed via `_rels` or JSONB.
- **Order Columns:** `order` vs. `_order`. Payload typically uses `_order`.
- **Parent Columns:** `parent` vs. `parent_id` vs. `_parent_id`. Payload typically uses `_parent_id` in `_rels` tables.
- **Direct Foreign Keys:** Columns like `quiz_id`, `course_id`, `survey_id`, `media_id` directly within collection tables might be deprecated if those relationships are now exclusively managed via `_rels` tables or JSONB fields as defined in the Payload config.

## Next Steps During Refactor

1.  **Analyze Payload Config:** Cross-reference this list with the current collection definitions in `apps/payload/src/collections`. Identify which tables and relationships are actually defined.
2.  **Analyze Code Usage:** Search the codebase (`apps/web`, `apps/payload`, `packages/*`) for any direct queries or references to the potentially deprecated tables/columns.
3.  **Verify Constraints:** Check for any foreign key constraints that might depend on these tables.
4.  **Plan Removal:** If a table/column is confirmed as unused and unnecessary, plan its removal as part of the migration system refactor (e.g., by not including it in the new seeding scripts and potentially adding a cleanup migration).


z.plan\payload-refactor\start\6-payload-refactor-collections-status.md

The following collections (and their related tables) seem to function correctly in the old version of Paylaod, so we can probably just copy the setup.

Media - correctly uses the S3 plugin with Cloudflare R2
Documentation
Posts
Private Posts - not sure about the rich text in the Content field. this should be tested
Surveys
Survey Questions
Courses
Downloads


z.plan\payload-refactor\start\7-payload-sso-truth-files.md

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

