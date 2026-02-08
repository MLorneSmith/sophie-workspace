# Bug Diagnosis: Alpha Orchestrator Database Setup Fails Due to Dual Issues

**ID**: ISSUE-pending (will be assigned after GitHub issue creation)
**Created**: 2026-01-16T20:45:00Z
**Reporter**: user
**Severity**: critical
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator's database setup fails silently despite the fix in #1557 (adding `--yes` flag). Investigation reveals **two separate issues** that must both be addressed:

1. **The `--yes` flag doesn't bypass confirmation** - Supabase CLI v2.62.5 still prompts for confirmation even with `--yes`
2. **Trigger conflicts on auth.users** - Even if migrations start, they fail because triggers like `on_auth_user_updated` already exist from previous runs

## Environment

- **Application Version**: dev branch (commit 1cd801016)
- **Environment**: development (E2B sandbox + remote Supabase)
- **Node Version**: 22.x
- **Supabase CLI Version**: v2.62.5 (v2.72.7 available)
- **Database**: PostgreSQL (Supabase-managed)
- **Last Working**: Never - issue present since orchestrator implementation

## Reproduction Steps

1. Run the Alpha Orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
2. Observe the UI "Recent Events" section
3. See: `✅ Migration warning: Command failed: supabase db ...`
4. Sandboxes start executing features without database schema
5. Features fail or produce incorrect results

## Expected Behavior

- Database reset should complete successfully
- Migrations should apply all 37 migration files
- Public schema should have 30+ tables
- Sandboxes should have access to valid database schema

## Actual Behavior

- `supabase db push --yes` still prompts for confirmation (bug in CLI?)
- When run via `execSync` with piped stdio, command fails with "context canceled"
- Database has 0 tables in public schema
- Subsequent migration attempts fail with trigger conflict errors

## Diagnostic Data

### Database State
```
$ psql "$DB_URL" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
0
```

### Existing Triggers (Blocking Migrations)
```
$ psql "$DB_URL" -c "SELECT trigger_name FROM information_schema.triggers WHERE trigger_name LIKE 'on_auth%'"
on_auth_user_created
on_auth_user_updated
```

### --yes Flag Testing
```bash
# With --yes flag - STILL PROMPTS
$ supabase db push --yes --db-url "$DB_URL" 2>&1 | head -5
Connecting to remote database...
Do you want to push these migrations to the remote database?
 • 20221215192558_web_schema.sql
...
 [Y/n]   # <-- Still prompts despite --yes

# With piped input to bypass prompt
$ echo "y" | supabase db push --yes --db-url "$DB_URL" 2>&1 | tail -5
ERROR: trigger "on_auth_user_updated" for relation "users" already exists (SQLSTATE 42710)
```

### CLI Version Check
```
$ supabase --version
2.62.5
A new version of Supabase CLI is available: v2.72.7
```

## Error Stack Traces

### Issue 1: Context Canceled (when run non-interactively)
```
Error: Command failed: supabase db push --yes --db-url "postgresql://..."
context canceled
```

### Issue 2: Trigger Already Exists
```
ERROR: trigger "on_auth_user_updated" for relation "users" already exists (SQLSTATE 42710)
At statement: 65
create trigger "on_auth_user_updated"
after
update of email on auth.users for each row
execute procedure kit.handle_update_user_email ()
```

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/database.ts:198` - The `supabase db push` command
  - `.ai/alpha/scripts/lib/database.ts:160-173` - The reset script (missing trigger cleanup)
  - `apps/web/supabase/migrations/20221215192558_web_schema.sql` - Creates the trigger without IF NOT EXISTS

- **Recent Changes**:
  - `7511f06ee` - Added `--yes` flag (fix for #1557) - but doesn't solve the problem
  - `cc98c7617` - Reset migration history (fix for #1539/#1540) - partially helped

- **Suspected Functions**:
  - `resetSandboxDatabase()` in database.ts - doesn't clean up auth schema triggers
  - `supabase db push --yes` - flag not honored in v2.62.5

## Related Issues & Context

### Direct Predecessors
- #1557 (CLOSED): "Bug Fix: Supabase db push Missing --yes Flag" - Added `--yes` flag but doesn't work
- #1555 (CLOSED): "Bug Diagnosis: Supabase db push Requires Interactive Confirmation" - Original diagnosis

### Related Infrastructure Issues
- #1539 (CLOSED): "Bug Diagnosis: Supabase Migration Desync" - Added TRUNCATE for migration history
- #1540 (CLOSED): "Bug Fix: Supabase Migration Desync" - Fixed migration history
- #1533 (CLOSED): "Bug Diagnosis: Alpha Orchestrator DB Events Missing" - E2B template issues
- #1534 (CLOSED): "Bug Fix: E2B Template Database Misconfiguration"

### Same Component
- #1503 (CLOSED): "Bug Diagnosis: Remote Supabase sandbox database tables not created"
- #1506 (CLOSED): "Bug Fix: Remote Supabase sandbox database tables not created"

### Historical Context

This is the **fourth iteration** of database setup fixes for the Alpha Orchestrator. Previous fixes addressed:
1. Invalid credentials (#1496)
2. Migration desync (#1539/#1540)
3. Missing `--yes` flag (#1555/#1557) - **fix was ineffective**

The current failure has two components not previously identified.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Database setup fails due to (1) Supabase CLI `--yes` flag not working in v2.62.5, and (2) reset script not cleaning up triggers attached to `auth.users` table.

**Detailed Explanation**:

**Root Cause 1 - CLI Flag Bug**:
The `--yes` global flag in Supabase CLI v2.62.5 does not bypass the confirmation prompt for `db push`. When run via Node.js `execSync` with `stdio: ["pipe", "pipe", "pipe"]` (no TTY), the lack of interactive input causes the command to fail with "context canceled".

The flag is documented to "answer yes to all prompts" but doesn't work for this command. This may be:
- A bug in v2.62.5 (possibly fixed in v2.72.7)
- A specific prompt not covered by `--yes`
- Requires different flag position (before vs after subcommand)

**Root Cause 2 - Incomplete Schema Reset**:
The `resetSandboxDatabase()` function drops the `public` schema but doesn't clean up objects in other schemas. The migration `20221215192558_web_schema.sql` creates triggers on `auth.users`:

```sql
create trigger "on_auth_user_updated"
after update of email on auth.users for each row
execute procedure kit.handle_update_user_email ();
```

This trigger persists across resets because:
- `DROP SCHEMA public CASCADE` only affects `public` schema
- Triggers on `auth.users` are in the `auth` schema (Supabase-managed)
- The migration uses `CREATE TRIGGER` without `IF NOT EXISTS` or `OR REPLACE`

**Supporting Evidence**:
1. Database has 0 tables but existing triggers: Confirms reset runs but migrations fail
2. Error message `trigger "on_auth_user_updated" already exists`: Proves trigger conflict
3. `--yes` flag test still shows `[Y/n]` prompt: Confirms CLI flag bug

### How This Causes the Observed Behavior

1. Orchestrator calls `resetSandboxDatabase()` which:
   - Drops `public` schema (success)
   - Truncates migration history (success)
   - Runs `supabase db push --yes` (FAILS - context canceled)

2. UI shows: `✅ Migration warning: Command failed: supabase db ...`

3. Even if prompt was bypassed (e.g., with manual testing):
   - First migration tries to create `on_auth_user_updated` trigger
   - Trigger already exists from previous run
   - Migration fails with `SQLSTATE 42710`

4. Database left with 0 tables, sandboxes execute without valid schema

### Confidence Level

**Confidence**: High

**Reasoning**:
- Reproduced both failure modes independently
- Confirmed `--yes` flag doesn't suppress prompt (tested directly)
- Confirmed trigger exists and blocks migration (tested directly)
- Traced code path from orchestrator to database.ts
- Error messages match code expectations

## Fix Approach (High-Level)

**Two-part fix required**:

1. **Workaround CLI bug** (database.ts:198):
   - Option A: Upgrade to Supabase CLI v2.72.7 and test if `--yes` works
   - Option B: Use `echo "y" |` to pipe input (hacky but reliable)
   - Option C: Use `--dry-run` to check then force with different approach

2. **Clean up auth schema triggers** (database.ts:160-173):
   Add to reset script:
   ```sql
   -- Drop triggers on auth.users created by our migrations
   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
   ```

**Recommended**: Implement both fixes. The CLI upgrade may resolve issue 1, but issue 2 will persist regardless.

## Diagnosis Determination

The Alpha Orchestrator database setup failure has been conclusively traced to two root causes:

1. **Supabase CLI v2.62.5 bug**: The `--yes` flag doesn't bypass the confirmation prompt for `db push`, causing the command to fail when run non-interactively.

2. **Incomplete schema reset**: The reset script doesn't clean up triggers attached to `auth.users`, causing migration failures with "trigger already exists" errors on subsequent runs.

Both issues must be addressed for the orchestrator to function correctly. The fix for #1557 was necessary but not sufficient.

## Additional Context

- This is a **recurring pattern** - this is the fourth diagnosis for the same subsystem
- Consider adding **automated verification** that migrations actually applied (check table count > 0)
- The orchestrator currently treats migration failure as non-blocking (`warn` instead of `error`) which masks the severity

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (psql, supabase CLI, git), Read (database.ts, progress files, manifest), Grep (trigger search), GitHub CLI (issue history)*
