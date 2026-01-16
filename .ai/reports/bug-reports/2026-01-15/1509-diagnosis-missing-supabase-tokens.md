# Bug Diagnosis: Missing Supabase Tokens Prevents Migration Sync to Sandbox Database

**ID**: ISSUE-1509
**Created**: 2026-01-15T22:15:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

When running the Alpha Orchestrator without `SUPABASE_ACCESS_TOKEN` and `SUPABASE_SANDBOX_PROJECT_REF` environment variables set, database migrations created by features are NOT applied to the remote sandbox database. This is critical for specs that create new database tables/schemas, as the migrations will only exist in the sandbox filesystem but won't be synced to the actual database.

## Environment

- **Application Version**: dev branch
- **Environment**: development (E2B sandbox)
- **Node Version**: v20+
- **Database**: Supabase (remote sandbox project)
- **Last Working**: N/A (tokens were never configured)

## Reproduction Steps

1. Run orchestrator WITHOUT setting `SUPABASE_ACCESS_TOKEN` and `SUPABASE_SANDBOX_PROJECT_REF`
2. Implement a feature that creates a database migration (e.g., new table)
3. Feature completes and migration file exists in `apps/web/supabase/migrations/`
4. Migration is NOT applied to the remote sandbox database

## Expected Behavior

Migrations created by features should be automatically pushed to the remote Supabase sandbox database after each feature completes, using `supabase db push --linked`.

## Actual Behavior

Warning is displayed at startup:
```
⚠️ Supabase CLI not configured (missing SUPABASE_ACCESS_TOKEN and SUPABASE_SANDBOX_PROJECT_REF)
   Database migration sync after features will be skipped
```

Two things are skipped:
1. Sandbox is NOT linked to the remote project (`supabase link` is skipped)
2. Migration sync after feature completion is skipped

## Diagnostic Data

### Console Output
```
⚠️ Supabase CLI not configured (missing SUPABASE_ACCESS_TOKEN and SUPABASE_SANDBOX_PROJECT_REF)
   Database migration sync after features will be skipped
```

### Code Flow Analysis

**sandbox.ts:178-222** - Supabase CLI setup in `createSandbox()`:
```typescript
const sandboxProjectRef = process.env.SUPABASE_SANDBOX_PROJECT_REF;
const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (sandboxProjectRef && supabaseAccessToken) {
    // Link to sandbox project
    await sandbox.commands.run(
        `cd ${WORKSPACE_DIR}/apps/web && pnpm exec supabase link --project-ref ${sandboxProjectRef}`,
        { envs: { SUPABASE_ACCESS_TOKEN: supabaseAccessToken } }
    );
} else if (sandboxProjectRef && !supabaseAccessToken) {
    log("   ⚠️ SUPABASE_ACCESS_TOKEN not set, skipping Supabase CLI setup");
}
```

**database.ts:289-301** - Migration sync check in `syncFeatureMigrations()`:
```typescript
if (!hasSupabaseAuth()) {
    const config = validateSupabaseConfig();
    log(`   ℹ️ ${config.message} - skipping migration sync`);
    return true; // Non-blocking - allow orchestrator to continue
}
```

**environment.ts:106-108** - Auth check:
```typescript
export function hasSupabaseAuth(): boolean {
    return !!(SUPABASE_ACCESS_TOKEN && SUPABASE_SANDBOX_PROJECT_REF);
}
```

## Related Code
- **Affected Files**:
  - `.ai/alpha/scripts/lib/environment.ts` (lines 97-139)
  - `.ai/alpha/scripts/lib/sandbox.ts` (lines 178-222)
  - `.ai/alpha/scripts/lib/database.ts` (lines 289-389)
- **Recent Changes**: None
- **Suspected Functions**: `hasSupabaseAuth()`, `createSandbox()`, `syncFeatureMigrations()`

## Related Issues & Context

### Related Infrastructure Issues
- #1506 (CLOSED): "Bug fix: sync feature migrations to sandbox database after completion" - Added the sync functionality but it requires tokens

## Root Cause Analysis

### Identified Root Cause

**Summary**: Missing required environment variables `SUPABASE_ACCESS_TOKEN` and `SUPABASE_SANDBOX_PROJECT_REF` prevent both sandbox project linking and migration sync operations.

**Detailed Explanation**:

The migration sync system requires two environment variables:

1. **`SUPABASE_SANDBOX_PROJECT_REF`** - The Supabase project reference ID (e.g., `abcdefghijklmnop`)
   - Found in: Supabase Dashboard → Project Settings → General → Reference ID
   - Used for: `supabase link --project-ref <ref>` during sandbox creation

2. **`SUPABASE_ACCESS_TOKEN`** - Personal access token for Supabase CLI authentication
   - Generated at: https://supabase.com/dashboard/account/tokens
   - Used for: Authentication when running `supabase link` and `supabase db push`

Without these:
1. `createSandbox()` at line 182 skips the `supabase link` command
2. `syncFeatureMigrations()` at line 297-301 returns early with "skipping migration sync"
3. Migrations created by features exist only in the sandbox filesystem, NOT in the remote database

**Supporting Evidence**:
- Code at `environment.ts:106-108` checks both variables with `hasSupabaseAuth()`
- Code at `sandbox.ts:182` requires both to be set for linking
- Code at `database.ts:297` calls `hasSupabaseAuth()` and skips if false
- Warning message explicitly states migrations will be skipped

### How This Causes the Observed Behavior

1. User runs orchestrator without tokens set
2. `checkEnvironment()` logs warning but continues (non-fatal)
3. `createSandbox()` skips `supabase link` (lines 182-219)
4. Feature implementation runs and creates migration files
5. `runFeatureImplementation()` calls `syncFeatureMigrations()` (line 638)
6. `syncFeatureMigrations()` checks `hasSupabaseAuth()` → returns false
7. Function logs "skipping migration sync" and returns true (non-blocking)
8. Migration files exist in sandbox but NOT applied to remote database

### Confidence Level

**Confidence**: High

**Reasoning**: Code path is deterministic and explicitly documented. The tokens are required environment variables that gate the entire migration sync functionality.

## Fix Approach (High-Level)

This is a **configuration issue**, not a code bug. The fix is to set the required environment variables:

1. Create a Supabase access token:
   - Go to https://supabase.com/dashboard/account/tokens
   - Generate a new token with appropriate permissions

2. Get the sandbox project reference:
   - Go to Supabase Dashboard → Project Settings → General
   - Copy the "Reference ID"

3. Set environment variables (in `.env` or shell):
   ```bash
   export SUPABASE_ACCESS_TOKEN="sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   export SUPABASE_SANDBOX_PROJECT_REF="abcdefghijklmnop"
   ```

4. Also ensure these sandbox database variables are set (for other DB operations):
   ```bash
   export SUPABASE_SANDBOX_URL="https://abcdefghijklmnop.supabase.co"
   export SUPABASE_SANDBOX_DB_URL="postgresql://postgres:password@db.abcdefghijklmnop.supabase.co:5432/postgres"
   ```

## Diagnosis Determination

The root cause is definitively identified: missing `SUPABASE_ACCESS_TOKEN` and `SUPABASE_SANDBOX_PROJECT_REF` environment variables. These are **required** for the migration sync feature to work but the orchestrator intentionally treats their absence as non-fatal to allow running without a remote database.

For specs that create database migrations, these tokens MUST be configured before running the orchestrator.

## Additional Context

The environment variables are documented in the CLI help (`.ai/alpha/scripts/cli/index.ts:120-126`):
```
Environment Variables (for sandbox database):
  SUPABASE_SANDBOX_PROJECT_REF   Sandbox project reference ID
  SUPABASE_SANDBOX_URL           Sandbox project URL
  SUPABASE_SANDBOX_ANON_KEY      Sandbox anon key
  SUPABASE_SANDBOX_SERVICE_ROLE_KEY  Sandbox service role key
  SUPABASE_SANDBOX_DB_URL        Sandbox database connection URL
  SUPABASE_ACCESS_TOKEN          CLI access token for linking
```

---
*Generated by Claude Debug Assistant*
*Tools Used: Read (sandbox.ts, database.ts, environment.ts, cli/index.ts), Grep*
