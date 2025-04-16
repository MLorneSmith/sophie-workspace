# Supabase Remote Migration Workflow

This document outlines the workflow for migrating the local Payload CMS and Supabase database to a remote Supabase instance.

## Migration Scripts Overview

The migration process uses several specialized scripts for different parts of the process. These scripts are organized in the `scripts/orchestration/remote-migration` directory.

### Connection Verification

- `tests/basic-connection-test.ps1` - Quick connectivity check
- `tests/direct-connection-test.ps1` - Comprehensive connection test with detailed diagnostics

### Schema Migration

- `migrate-schema.ps1` - Handles schema migration, including generating diff files and pushing to remote

### Data Migration

- `migrate-posts-direct.ps1` - Migrates posts data specifically
- `migrate-content-progressive.ps1` - Progressively migrates content in logical phases:
  1. Core system tables
  2. Posts content
  3. Documentation content
  4. Course content
  5. Quiz/Survey content

### Special Utilities

- `fix-remote-uuid-tables.ps1` - Manages UUID tables needed for proper relationships
- `fix-remote-relationships.ps1` - Repairs relationship data after migration
- `reset-remote-migrations.ps1` - **ONE-TIME USE SCRIPT** to reset the migration history in a remote database

## Recommended Migration Process

1. **Reset the migration history** (only if you're facing migration conflict issues):

   ```powershell
   ./scripts/orchestration/remote-migration/reset-remote-migrations.ps1
   ```

2. **Test the connection**:

   ```powershell
   ./supabase-remote-migration.ps1 -Test
   ```

3. **Migrate the schema**:

   ```powershell
   ./supabase-remote-migration.ps1 -SchemaOnly
   ```

4. **Fix UUID tables**:

   ```powershell
   ./supabase-remote-migration.ps1 -UUIDTablesOnly
   ```

5. **Migrate content progressively**:

   ```powershell
   ./supabase-remote-migration.ps1 -ProgressiveOnly
   ```

   To skip certain content types:

   ```powershell
   ./supabase-remote-migration.ps1 -ProgressiveOnly -SkipCourses -SkipQuizzes
   ```

6. **Fix relationships**:

   ```powershell
   ./supabase-remote-migration.ps1 -FixOnly
   ```

7. **Verify the migration**:
   ```powershell
   ./supabase-remote-migration.ps1 -VerifyOnly
   ```

## Troubleshooting

- If you're getting migration conflicts, you might need to reset the migration history using the `reset-remote-migrations.ps1` script.
- If data isn't migrating properly, check the migration logs in the `z.migration-logs` directory.
- Ensure all schemas exist in the remote database before attempting data migration.
- For posts migration issues, try running it separately with `./supabase-remote-migration.ps1 -PostsOnly`.

## One-Time Migration Reset Process

The `reset-remote-migrations.ps1` script is designed for one-time use to reset the migration history in a remote database. This should only be run when:

1. The migration process is failing due to conflicts between local and remote migration history
2. You're setting up a fresh remote database and need to start with a clean slate
3. The remote migration table has become corrupted or out of sync

**WARNING:** This script will DELETE all migration records from the remote database, which can lead to data loss if used incorrectly. Always ensure you understand the consequences before running it.
