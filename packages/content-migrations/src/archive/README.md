# Archive Directory

This directory contains files that were part of the original content migration system but are no longer actively used in the current implementation. These files have been preserved here for reference purposes but are not part of the active migration flow.

## Archived Files

### JavaScript Files Superseded by TypeScript

- `data/mappings/lesson-downloads-mappings.js`: Replaced by TypeScript version
- `utils/get-env-vars.js`: Replaced by direct environment variable access in TypeScript
- `utils/payload-client.js`: Replaced by enhanced-payload-client.ts

### Redundant Scripts

- `scripts/core/migrate-all-direct-fixed.ts`: Functionality replaced by individual migration scripts
- `scripts/sql/new-generate-sql-seed-files.ts`: Superseded by updated-generate-sql-seed-files.ts
- `scripts/repair/repair-edge-cases.ts`: Duplicates functionality in fix-edge-cases.ts

### Duplicate Data

- `data/raw/quizzes/`: Content duplicated in raw/courses/quizzes/ which is the primary source

## Why Files Were Archived

These files were archived during the content migration system cleanup to:

1. Reduce code duplication
2. Improve maintainability
3. Clarify the active migration flow
4. Standardize on TypeScript for all scripts
5. Remove deprecated approaches

## Note on Migration Process

If you're trying to understand the content migration process, please refer to:

1. The main `reset-and-migrate.ps1` script at the project root
2. The README files in the active directories (`/scripts`, `/data`, etc.)
3. The module files in `scripts/orchestration/` directory

This archive is not part of the active migration process and should not be used for reference when running migrations.
