# Phase 4: Script Naming Standardization Implementation

This document tracks the implementation of Phase 4 from the content migration system cleanup plan.

## Naming Conventions

- `fix-*`: Scripts that repair or correct data issues
- `verify-*`: Scripts that verify data integrity
- `migrate-*`: Scripts that perform actual migrations
- `generate-*`: Scripts that generate output files
- `process-*`: Scripts that transform raw data

## Implementation Tracking

| Original Script                      | New Standardized Name              | Status |
| ------------------------------------ | ---------------------------------- | ------ |
| `updated-generate-sql-seed-files.ts` | `generate-sql-seed-files.ts`       | ✅     |
| `verify-post-content.ts`             | `verify-post-content.ts`           | ✅     |
| `fix-quiz-id-consistency.ts`         | `fix-quiz-id-consistency.ts`       | ✅     |
| `create-full-lesson-metadata.ts`     | `generate-full-lesson-metadata.ts` | ✅     |
| `run-uuid-tables-fix.ts`             | `fix-uuid-tables.ts`               | ✅     |
| `test-post-migration.ts`             | `verify-post-migration.ts`         | ✅     |
| `update-lesson-todo-fields.ts`       | `fix-lesson-todo-fields.ts`        | ✅     |
| `parse-lesson-todo-html.ts`          | `process-lesson-todo-html.ts`      | ✅     |

## Next Steps

1. Complete the renaming process for all scripts
2. Update package.json script references
3. Test script execution to ensure everything works properly
