# Bug Diagnosis: Remote Supabase Sandbox Database Tables Not Created

**ID**: ISSUE-1503
**Created**: 2026-01-15T21:45:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Autonomous Coding workflow orchestrator completes spec implementation (Spec #1362), but the remote Supabase sandbox database (`slideheroes-alpha-sandbox`, project ref `kdjbbhjgogqywtlctlzq`) contains no tables. Database tasks (Feature #1373: Activity Database Schema) created migration files but never applied them to the remote database. This prevents human-in-the-loop review via E2B preview URLs since the dev server requires a working database.

## Environment

- **Application Version**: dev branch (commit `e9807e807`)
- **Environment**: development (E2B sandboxes)
- **Node Version**: 20.x
- **Database**: PostgreSQL (Supabase managed)
- **Orchestrator**: `.ai/alpha/scripts/spec-orchestrator.ts`
- **Last Working**: Never (new feature)

## Reproduction Steps

1. Configure `.env` with `SUPABASE_SANDBOX_*` environment variables
2. Create a spec with database tasks (e.g., Spec #1362 with Feature #1373)
3. Run the orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
4. Wait for spec implementation to complete
5. Check the remote Supabase project in Supabase Studio
6. Observe: No tables exist in the `public` schema

## Expected Behavior

After orchestrator completes:
1. Remote sandbox database should have tables created from all migration files
2. Database tasks (T7: Apply migration, T8: Generate types) should execute successfully
3. Dev server should be able to connect and serve pages that require database queries

## Actual Behavior

1. Orchestrator runs `resetSandboxDatabase()` which calls `supabase db push` BEFORE features are implemented
2. Features create new migration files (e.g., `20260115191018_create_user_activities_table.sql`)
3. These new migrations are NEVER pushed to the remote database
4. Database tasks T7 and T8 are marked as "Ready (requires DB)" but not executed
5. Remote database remains empty
6. Dev server fails when accessing pages requiring database queries

## Diagnostic Data

### Console Output
```
# From sbx-b.log - Feature #1373 implementation
| T7 | Apply migration to database | ✅ Ready (requires DB) |
| T8 | Generate TypeScript types | ✅ Ready (requires DB) |

### Next Steps (when database is available)
```bash
pnpm --filter web supabase migration up
pnpm supabase:web:typegen
```
```

### Database Connection Test
```
$ psql "$SUPABASE_SANDBOX_DB_URL" -c "\dt"
psql: error: connection to server at "aws-0-us-west-2.pooler.supabase.com"
FATAL: Tenant or user not found
```

### Missing Environment Variable
```
$ grep -c "SUPABASE_ACCESS_TOKEN=" .env
0
```

The `SUPABASE_ACCESS_TOKEN` is not set in `.env`, which is required for the Supabase CLI to authenticate for `db push` operations.

### Created Files Not Applied
```
# Files created in sandbox (from sbx-b.log)
- apps/web/supabase/schemas/18-user-activities.sql
- apps/web/supabase/migrations/20260115191018_create_user_activities_table.sql

# Files on alpha/spec-1362 branch (checked locally)
$ git show alpha/spec-1362:apps/web/supabase/schemas/
# Only shows files 00-17, NO 18-user-activities.sql!
```

## Error Stack Traces

No explicit error - the process completes "successfully" but the database operations were silently skipped due to design flaws.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/database.ts` - `resetSandboxDatabase()` and `seedSandboxDatabase()`
  - `.ai/alpha/scripts/lib/orchestrator.ts` - Main orchestration loop (lines 930-1033)
  - `.ai/alpha/scripts/lib/sandbox.ts` - `createSandbox()` Supabase CLI setup (lines 178-222)
  - `.claude/commands/alpha/implement.md` - Database task handling instructions (lines 649-726)

- **Recent Changes**: Initial implementation of sandbox database support
- **Suspected Functions**:
  - `resetSandboxDatabase()` runs at startup ONLY, not after migrations are created
  - `createSandbox()` links to sandbox project but doesn't apply migrations
  - `implement.md` instructs Claude to use `supabase db push` but sandbox lacks CLI auth

## Related Issues & Context

### Direct Predecessors
No prior issues - this is the first comprehensive diagnosis of the sandbox database flow.

### Related Infrastructure Issues
- #1500: Sandbox database not created (related diagnosis from earlier today)

### Historical Context
The sandbox database infrastructure was developed recently as part of the Alpha Autonomous Coding workflow. This is the first real-world usage attempt.

## Root Cause Analysis

### Identified Root Cause

**Summary**: New database migrations created during feature implementation are never applied to the remote sandbox database because `supabase db push` only runs once at orchestrator startup, before features create any migrations.

**Detailed Explanation**:

The orchestrator's database handling has a fundamental timing/sequencing flaw:

1. **Startup Phase** (`orchestrator.ts:941-951`):
   ```typescript
   if (!options.skipDbReset) {
     await resetSandboxDatabase(options.ui);  // Runs ONCE at startup
   }
   ```
   This calls `supabase db push` with the LOCAL codebase's existing migrations.

2. **Feature Implementation Phase**:
   Claude agents in E2B sandboxes implement database features, creating NEW migration files like `20260115191018_create_user_activities_table.sql`.

3. **Missing Step**:
   There is NO mechanism to apply these newly-created migrations to the remote sandbox database.

4. **CLI Authentication Missing**:
   Even if we added a post-implementation `db push`, the sandbox lacks `SUPABASE_ACCESS_TOKEN` for CLI authentication. The `.env` file shows:
   - ✅ `SUPABASE_SANDBOX_PROJECT_REF` set
   - ✅ `SUPABASE_SANDBOX_DB_URL` set
   - ❌ `SUPABASE_ACCESS_TOKEN` NOT set

5. **Connection String Invalid**:
   The `SUPABASE_SANDBOX_DB_URL` connection returns "Tenant or user not found", suggesting either:
   - The Supabase project was deleted/paused
   - The credentials are expired
   - The password is incorrect

**Supporting Evidence**:
1. Log from sbx-b shows T7/T8 marked "Ready (requires DB)" not "Complete"
2. Branch `alpha/spec-1362` has no `18-user-activities.sql` schema file
3. Database connection fails with authentication error
4. `SUPABASE_ACCESS_TOKEN` is not in `.env`

### How This Causes the Observed Behavior

1. Orchestrator starts → calls `resetSandboxDatabase()` → pushes LOCAL (existing) migrations
2. E2B sandboxes implement features → create NEW migration files
3. Migrations are committed to git branch but NEVER applied to database
4. Dev server tries to query non-existent tables → fails
5. Human-in-the-loop review cannot work without database

### Confidence Level

**Confidence**: High

**Reasoning**:
- The log explicitly shows "Ready (requires DB)" status for T7/T8
- The branch inspection confirms migration files exist but weren't applied
- The database connection test fails, proving no tables exist
- The code flow analysis clearly shows `db push` only runs at startup

## Fix Approach (High-Level)

Three issues need to be fixed:

1. **Add `SUPABASE_ACCESS_TOKEN` to `.env`**: Required for Supabase CLI authentication in sandboxes to run `db push`.

2. **Verify/recreate Supabase sandbox project**: The "Tenant or user not found" error suggests the project may need to be recreated or credentials refreshed.

3. **Add post-feature migration sync**: The orchestrator needs a mechanism to push migrations after features are implemented. Options:
   - Option A: After each feature completes, have the sandbox run `supabase db push` if it has `requires_database: true` tasks
   - Option B: Add a "migration sync" phase after all features complete but before dev server starts
   - Option C: Have the orchestrator pull the branch and run `db push` locally before starting dev server

## Diagnosis Determination

The remote Supabase sandbox database remains empty because:
1. **Timing issue**: `resetSandboxDatabase()` runs at startup, before new migrations are created
2. **Missing auth**: `SUPABASE_ACCESS_TOKEN` not configured for CLI operations
3. **Invalid credentials**: Database connection string returns authentication errors
4. **No sync mechanism**: No code exists to push newly-created migrations to remote database

The fix requires: (1) valid database credentials, (2) CLI authentication token, and (3) a migration sync mechanism that runs AFTER feature implementation.

## Additional Context

The Alpha Autonomous Coding workflow is designed for autonomous multi-sandbox feature development. Database support is critical because:
- Features may create new tables/schemas
- Dev server needs database for preview URLs
- Human-in-the-loop review requires working database queries

This diagnosis reveals a significant architectural gap in the database sync workflow that needs to be addressed for the system to support database-modifying features.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (psql, git)*
