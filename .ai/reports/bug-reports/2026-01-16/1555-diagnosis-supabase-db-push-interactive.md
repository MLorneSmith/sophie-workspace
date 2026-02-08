# Bug Diagnosis: Supabase db push Requires Interactive Confirmation

**ID**: ISSUE-1555
**Created**: 2026-01-16T20:45:00Z
**Reporter**: user
**Severity**: critical
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator's database reset/migration step fails silently because the `supabase db push` command requires interactive confirmation, but is run non-interactively via `execSync`. This causes the command to fail with "context canceled" when stdin receives EOF, resulting in no tables being created in the sandbox database. Sandboxes then start working on tasks without a valid database schema.

## Environment

- **Application Version**: dev branch (commit a596c1e15)
- **Environment**: development
- **Node Version**: Node.js (tsx runner)
- **Database**: PostgreSQL via Supabase (remote sandbox: kdjbbhjgogqywtlctlzq)
- **Supabase CLI Version**: Current installed version
- **Last Working**: Never (bug present since original implementation)

## Reproduction Steps

1. Run the Alpha Orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --ui`
2. Wait for the orchestrator to start database setup
3. Observe "Migration warning: Command failed: supabase db ..." in Recent Events
4. Query the database - shows 0 tables in public schema
5. Sandboxes start working on features without database

## Expected Behavior

The database reset should:
1. Drop and recreate the public schema
2. Truncate migration history
3. Apply all migrations successfully
4. Result in 30+ tables in the public schema
5. Complete within 30-60 seconds

## Actual Behavior

The database reset:
1. Drops and recreates the public schema (success)
2. Truncates migration history (success)
3. `supabase db push` prompts for confirmation (failure - no `--yes` flag)
4. Command receives EOF on stdin and exits with "context canceled"
5. Error is caught and logged as warning, orchestrator continues
6. Database has 0 tables

## Diagnostic Data

### Command Test (Non-Interactive)
```bash
$ cd apps/web && echo "n" | timeout 5 supabase db push --db-url "$DB_URL"
Connecting to remote database...
Do you want to push these migrations to the remote database?
 • 20221215192558_web_schema.sql
 • [37 more migrations...]

 [Y/n] n
context canceled
Exit code: 1
```

### Database State Verification
```bash
$ psql "$SUPABASE_SANDBOX_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
     0
```

### Problematic Code
```typescript
// .ai/alpha/scripts/lib/database.ts:198
execSync(`supabase db push --db-url "${dbUrl}"`, {
    cwd: webDir,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],  // stdin is piped (no TTY)
});
```

### Timeline from Logs
- `2026-01-16T20:20:58.799Z`: Orchestrator started (overall-progress.json lastCheckpoint)
- `2026-01-16T20:21:00.245Z`: Sandbox sbx-a started working on feature #1367

**Gap: ~2 seconds** - Far too fast for database reset + migrations + seeding to have completed (expected 2-5 minutes).

## Error Stack Traces

The error is caught at line 231-250 in database.ts:
```typescript
catch (migrationErr) {
    const errorMessage = migrationErr instanceof Error
        ? migrationErr.message
        : String(migrationErr);
    warn(`   ⚠️ Migration push failed: ${errorMessage}`);
    // ...
    emitOrchestratorEvent(
        "db_migration_complete",
        `Migration warning: ${errorMessage}`,
        { error: errorMessage, success: false },
    );
}
```

The error message would be: `Command failed: supabase db push --db-url "..."` (full command execution failure).

## Related Code
- **Affected Files**:
  - `.ai/alpha/scripts/lib/database.ts:198` - Missing `--yes` flag
  - `.ai/alpha/scripts/lib/orchestrator.ts:1014-1025` - Calls resetSandboxDatabase()

- **Recent Changes**:
  - `a596c1e15`: Added TRUNCATE schema_migrations (fixes orphan migration issue)
  - But did not add `--yes` flag to the db push command

- **Suspected Functions**:
  - `resetSandboxDatabase()` in `database.ts:144-272`

## Related Issues & Context

### Direct Predecessors
- #1539 (CLOSED): Supabase Migration Desync - Added TRUNCATE schema_migrations
- #1540 (CLOSED): Bug Fix for #1539 - Same issue, but fix was incomplete
- #1545 (CLOSED): Missing DB Events - Identified Python dependencies but not this root cause

### Infrastructure Issues
- #1503, #1506: Earlier attempts to fix sandbox database setup
- #1533, #1534: E2B template database configuration

### Historical Context
Multiple attempts have been made to fix database setup issues:
1. #1503: Identified connection issues
2. #1539/#1540: Fixed orphan migration records with TRUNCATE
3. #1545: Fixed Python dependencies for event server

This diagnosis reveals that the `--yes` flag has been missing from the original implementation, causing consistent failures that were obscured by other issues.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `supabase db push` command in `resetSandboxDatabase()` is missing the `--yes` flag, causing it to fail when run non-interactively.

**Detailed Explanation**:

1. **Line 198 of database.ts**: The command `supabase db push --db-url "${dbUrl}"` is executed via `execSync` with `stdio: ["pipe", "pipe", "pipe"]`.

2. **No TTY Available**: When stdin is piped rather than a TTY, the Supabase CLI still prompts for confirmation: "Do you want to push these migrations to the remote database? [Y/n]"

3. **EOF on Stdin**: Since `execSync` provides no input to stdin, the process receives EOF immediately. The Supabase CLI interprets this as cancellation and exits with "context canceled".

4. **Error is Caught**: The catch block at line 231 catches the error and logs a warning, but the orchestrator continues without a valid database.

5. **Sandboxes Start Immediately**: The orchestrator creates sandboxes and assigns features without waiting for database setup to complete successfully.

**Supporting Evidence**:
- Manual test confirms `supabase db push` prompts for confirmation
- Manual test with piped 'n' shows "context canceled" exit
- Database has 0 tables after orchestrator runs
- Sandbox logs show work starting ~2s after orchestrator start (impossible if DB setup completed)

### How This Causes the Observed Behavior

1. `resetSandboxDatabase()` is called in orchestrator.ts:1016
2. Schema reset and TRUNCATE succeed
3. `supabase db push` fails due to missing `--yes` flag
4. Error is caught, logged as warning, and execution continues
5. `isDatabaseSeeded()` returns false (no tables exist)
6. `seedSandboxDatabase()` is called but likely fails (no schema to seed)
7. Orchestrator creates sandboxes and starts work loop
8. Sandboxes try to work with database that has no tables

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct command-line testing confirms the `--yes` flag behavior
- Code inspection shows the flag is absent
- Database state confirms 0 tables
- Timeline analysis proves DB setup couldn't have completed
- The fix is trivial and clearly addresses the root cause

## Fix Approach (High-Level)

Add the `--yes` flag to the `supabase db push` command at line 198:

```typescript
// BEFORE:
execSync(`supabase db push --db-url "${dbUrl}"`, {

// AFTER:
execSync(`supabase db push --yes --db-url "${dbUrl}"`, {
```

**Additional Consideration**: There may also be a secondary issue where migrations fail with "trigger already exists" errors if the auth schema has pre-existing triggers. This would require a more thorough reset that also handles the auth/kit schemas. However, the `--yes` flag is the primary blocker.

## Diagnosis Determination

**Root Cause Confirmed**: The `supabase db push` command at `.ai/alpha/scripts/lib/database.ts:198` is missing the `--yes` flag, causing the command to fail with "context canceled" when run non-interactively via `execSync`.

**Secondary Issue**: Even with `--yes`, migrations may fail with "trigger already exists" errors for triggers in the auth schema. This is a separate issue that should be addressed after the primary fix.

## Additional Context

The Supabase CLI added the `--yes` flag specifically for CI/CD and automated workflows. The documentation states:
> `--yes`: Answer yes to all prompts (non-interactive mode)

Without this flag, any automated database push will fail in non-TTY environments.

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (command testing), Read (code inspection), Grep (code search), GitHub CLI (issue history)*
