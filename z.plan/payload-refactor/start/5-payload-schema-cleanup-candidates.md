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
