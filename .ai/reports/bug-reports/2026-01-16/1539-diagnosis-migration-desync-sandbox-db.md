# Bug Diagnosis: Supabase Migration Desync Prevents Sandbox Database Setup

**ID**: ISSUE-1539
**Created**: 2026-01-16T19:35:00Z
**Reporter**: user
**Severity**: critical
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator's `resetSandboxDatabase()` function fails silently because `supabase db push` encounters orphan migration records in the remote database. Previous orchestrator runs created migrations (via sandbox features) that were recorded in `supabase_migrations.schema_migrations`, but when the orchestrator drops and recreates the `public` schema, it doesn't reset the migration history. Subsequent runs fail because local migrations don't include sandbox-created migrations.

## Environment

- **Application Version**: dev branch (commit c4835b88e)
- **Environment**: development
- **Node Version**: 20.x
- **Database**: PostgreSQL (Supabase)
  - Sandbox: `kdjbbhjgogqywtlctlzq` (slideheroes-alpha-sandbox)
- **Last Working**: Unknown - design flaw

## Reproduction Steps

1. Run the Alpha orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
2. A sandbox creates and pushes a migration (e.g., `create_user_activities_table`)
3. Run the orchestrator again
4. `resetSandboxDatabase()` drops public schema but preserves migration history
5. `supabase db push` fails: "Remote migration versions not found in local migrations directory"
6. Public schema is empty, no base tables created
7. UI shows no database events (events emitted but process failed)

## Expected Behavior

1. `resetSandboxDatabase()` should reset both the public schema AND the migration history
2. OR `supabase db push` should use `--force` or similar flag to ignore orphan migrations
3. Base migrations should apply successfully, creating all public tables
4. Database events should appear in UI showing successful reset, migrations, and verification

## Actual Behavior

1. `resetSandboxDatabase()` drops public schema only
2. `supabase db push --db-url` fails with migration desync error
3. Public schema remains empty (0 tables)
4. Migration catch block logs warning but continues
5. Database events emitted but success events never fire
6. Sandboxes start work without required database schema

## Diagnostic Data

### Migration Desync Evidence

```bash
# Local migrations (most recent)
$ ls apps/web/supabase/migrations/*.sql | tail -3
20251104193705_seed_e2e_test_users.sql
20251210090434_fix_security_linter_warnings.sql
20251215164009_add_phase_remove_image.sql

# Remote migration history (most recent)
$ psql "$SUPABASE_SANDBOX_DB_URL" -c "SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 3"
 20260116173835 | create_user_activities_table  <-- ORPHAN: doesn't exist locally
 20251215164009 | add_phase_remove_image
 20251210090434 | fix_security_linter_warnings
```

### supabase db push Output

```
$ supabase db push --db-url "$SUPABASE_SANDBOX_DB_URL"
Connecting to remote database...
Remote migration versions not found in local migrations directory.

Make sure your local git repo is up-to-date. If the error persists, try repairing the migration history table:
supabase migration repair --status reverted 20260116173835

And update local migrations to match remote database:
supabase db pull
```

### Database State

```bash
# Public schema - EMPTY (should have 30+ tables)
$ psql "$SUPABASE_SANDBOX_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
0

# Payload schema - has tables from previous seeding
$ psql "$SUPABASE_SANDBOX_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'payload'"
60
```

## Error Stack Traces

No explicit errors thrown - the migration failure is caught and logged as a warning:

```typescript
// database.ts:225-255
} catch (migrationErr) {
    warn(`   ⚠️ Migration push failed: ${errorMessage}`);
    // ... continues anyway
}
```

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/database.ts:144-267` (resetSandboxDatabase function)
  - `.ai/alpha/scripts/lib/database.ts:160-167` (DROP SCHEMA sql)
  - `.ai/alpha/scripts/lib/database.ts:192` (supabase db push command)

- **Recent Changes**:
  - Various issues (#1522, #1526, #1530, #1533, #1534, #1537, #1538) addressed different layers but not this root cause

- **Suspected Functions**:
  - `resetSandboxDatabase()` - doesn't reset migration history
  - Schema reset SQL only touches `public` schema, not `supabase_migrations`

### Problematic Code Block

```typescript
// database.ts:160-167
const resetScript = `
-- Reset public schema (preserves auth, storage managed by Supabase)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
COMMENT ON SCHEMA public IS 'standard public schema';
`;
// NOTE: Does NOT reset supabase_migrations.schema_migrations table
```

## Related Issues & Context

### Direct Predecessors
- #1533 (CLOSED): "Alpha DB Events Wrong Database" - Fixed hardcoded credentials
- #1534 (CLOSED): "E2B Template DB Credentials" - Removed hardcoded DATABASE_URI
- #1537 (CLOSED): "E2B Git Diverged" - Fixed git branch sync
- #1538 (CLOSED): "E2B Git Diverged Implementation" - Implemented force-reset

### Infrastructure Issues
- #1522, #1526, #1530: Event emission, UI routing, timing - all correct but masking this issue

### Historical Context
Multiple attempts to fix "missing DB events" addressed event emission and UI routing but missed the underlying migration desync. The events ARE being emitted, but for failed operations. The core issue is that `supabase db push` fails due to orphan migrations.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The orchestrator's `resetSandboxDatabase()` drops the `public` schema but doesn't reset the `supabase_migrations.schema_migrations` table. When sandboxes create migrations (as part of feature implementation) and push them to the remote, those migration records persist. Subsequent orchestrator runs fail because `supabase db push` can't find local files for those sandbox-created migrations.

**Detailed Explanation**:

1. **First Orchestrator Run**:
   - `resetSandboxDatabase()` drops public schema
   - `supabase db push` applies migrations (succeeds if migration history is clean)
   - Sandbox creates feature (e.g., "Activity Database Schema" #1373)
   - Feature creates migration `20260116173835_create_user_activities_table.sql`
   - Migration pushed to remote via `syncFeatureMigrations()`
   - Migration record added to `supabase_migrations.schema_migrations`

2. **Second Orchestrator Run**:
   - `resetSandboxDatabase()` drops public schema again
   - Migration history table STILL has `20260116173835` record
   - `supabase db push` fails: "Remote migration versions not found in local migrations directory"
   - Migration catch block logs warning but doesn't abort
   - Public schema remains EMPTY
   - Sandboxes start without base tables

**Supporting Evidence**:
- Remote has migration `20260116173835` (create_user_activities_table)
- Local has no such file
- Public schema has 0 tables
- `supabase db push` explicitly fails with "Remote migration versions not found"

### How This Causes the Observed Behavior

1. Orchestrator starts, creates event server
2. UI connects and sends ready signal
3. `resetSandboxDatabase()` called
4. Public schema dropped (db_reset_start, db_reset_complete events emitted)
5. `supabase db push` fails with migration desync error
6. Error caught, warning logged, db_migration_complete emitted with error flag
7. `verifyTablesExist()` returns 0 tables, db_verify emitted with warning
8. Orchestrator continues to sandbox creation
9. Sandboxes start working without base schema
10. Features fail or produce incorrect results

**Why Events Aren't Visible**:
- Events ARE emitted but may be:
  - Lost in timing race if UI not fully connected
  - Showing as warnings that don't stand out
  - Drowned out by sandbox events starting immediately after

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct SQL evidence shows migration desync (orphan remote migration)
- Direct SQL evidence shows empty public schema
- `supabase db push` command output explicitly states the failure reason
- The failure mode is reproducible and explainable
- Code analysis confirms migration history is not reset

## Fix Approach (High-Level)

**Primary Fix (Option A) - Reset Migration History**:
Add to `resetSandboxDatabase()`:
```sql
TRUNCATE supabase_migrations.schema_migrations;
```
This ensures each orchestrator run starts with clean migration state.

**Primary Fix (Option B) - Use --include-all Flag**:
Change `supabase db push` command to:
```bash
supabase db push --db-url "$URL" --include-all
```
This forces all local migrations to apply regardless of history.

**Secondary Fix - Better Error Handling**:
Don't continue after migration failure - either abort or force retry with repair:
```bash
supabase migration repair --status reverted <orphan-version>
supabase db push --db-url "$URL"
```

**Immediate Workaround**:
Manually repair the migration history:
```bash
supabase migration repair --status reverted 20260116173835
# Then re-run orchestrator
```

## Diagnosis Determination

The root cause has been definitively identified: **migration history desync between the remote sandbox database and the local migration files**.

The orchestrator's schema reset preserves the migration history table, causing `supabase db push` to fail when it finds orphan migrations created by previous sandbox runs. The error is caught and treated as non-fatal, leaving the database in an inconsistent state (empty public schema).

This is a **design flaw** in `resetSandboxDatabase()` - it should reset the migration history when resetting the schema, or use a migration command that handles orphan migrations gracefully.

## Additional Context

- The `supabase_migrations` schema is managed by Supabase CLI and contains migration tracking
- Sandbox-created migrations (via `syncFeatureMigrations()`) add records to this table
- The `DROP SCHEMA public CASCADE` command only affects the `public` schema
- This issue will recur every time a sandbox successfully pushes a migration

## Validation Commands

```bash
# Check for orphan migrations
psql "$SUPABASE_SANDBOX_DB_URL" -c \
  "SELECT version, name FROM supabase_migrations.schema_migrations WHERE version NOT IN ('20251215164009', '20251210090434', '20251104193705', '20251024141215')"

# Check public table count
psql "$SUPABASE_SANDBOX_DB_URL" -t -c \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"

# Test migration push (should fail with desync)
cd apps/web && supabase db push --db-url "$SUPABASE_SANDBOX_DB_URL"
```

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash (psql, git, ls), Glob*
