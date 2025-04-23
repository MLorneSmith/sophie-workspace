# UUID Tables Schema Mismatch and Diagnostic Fixes Plan

## Problem Overview

After analyzing the migration logs, we identified two critical issues in the migration process:

1. **UUID Tables Schema Mismatch**:

   - The migration scripts were referencing a column named `last_checked` in the `dynamic_uuid_tables` table, but this column doesn't exist in the current schema.
   - This caused errors during the post and private post migration steps.

2. **Post Migration Failures**:

   - As a result of the UUID tables issue, both blog posts and private posts were not being migrated.
   - The logs showed "No posts found in the database" and "No private posts found in the database" warnings.

3. **Diagnostic Tool Integration Issues**:
   - The diagnostic tool wasn't properly integrated with the PowerShell orchestration.
   - The TypeScript diagnostic tool wasn't being called correctly.

## Implementation Summary

We have implemented the following fixes:

### 1. UUID Tables Schema Updates:

Fixed all references to `last_checked` to use the correct column name `created_at` in:

- `packages/content-migrations/src/scripts/repair/database/run-uuid-tables-fix.ts`
- `packages/content-migrations/src/scripts/verify-uuid-tables.ts`
- `packages/content-migrations/src/scripts/sql/ensure-columns-fixed.ts`
- `packages/content-migrations/src/scripts/run-uuid-tables-fix.ts`

### 2. Schema Definition Alignment:

Updated all schema definitions to use the same structure:

```sql
CREATE TABLE IF NOT EXISTS payload.dynamic_uuid_tables (
  table_name TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  primary_key TEXT,
  needs_path_column BOOLEAN DEFAULT FALSE
);
```

### 3. Updated Fix Functions:

Improved the table scanning and fixing functions to:

- Check for and add all required columns to UUID tables
- Use more robust error handling
- Update the tracking table with modern column names
- Add proper logging to diagnose any remaining issues

### 4. Diagnostic Tool Enhancement:

- Created a TypeScript diagnostic tool at `packages/content-migrations/src/scripts/diagnostic/get-table-counts.ts`
- Updated PowerShell orchestration in `scripts/orchestration/utils/diagnostic.ps1` to use the new tool directly
- Added proper script references in `package.json`

## Validation

The changes ensure consistent schema references across all scripts and fixed the schema mismatch causing the errors. We also improved the diagnostic capabilities to make future troubleshooting easier.

After these changes, the migration process should:

1. Successfully run without UUID table schema errors
2. Successfully migrate blog posts and private posts
3. Provide clear diagnostic output about the database state

## Additional Recommendations

1. **Schema Version Control**: Implement a more robust schema version control system to track changes to database tables.
2. **Migration Validation Tests**: Create automated tests that verify migrations complete successfully.
3. **Error Recovery Procedures**: Develop specific recovery procedures for common migration failures.
