# Bug Diagnosis: E2E Payload Shards Fail - Missing Payload CMS Migrations in CI

**ID**: ISSUE-1813
**Created**: 2026-01-26T15:30:00Z
**Reporter**: system
**Severity**: high
**Status**: new
**Type**: regression

## Summary

E2E Shards 7, 8, and 9 (Payload CMS tests) fail with `relation "payload.users" does not exist` errors. The root cause is that **Payload CMS migrations are not executed** in the CI workflow before starting the Payload production server. While Supabase migrations create the empty `payload` schema, Payload's own migrations (which create `payload.users`, `payload.media`, etc.) are never run.

## Environment

- **Application Version**: dev branch (commit 9992ecef7)
- **Environment**: CI (GitHub Actions)
- **Node Version**: 20
- **Database**: PostgreSQL (Supabase local - port 54522)
- **Payload CMS Version**: 3.72.0
- **Last Working**: N/A (potentially broken since PR #1783 changes)

## Reproduction Steps

1. Push code to dev branch triggering e2e-sharded workflow
2. Setup Test Server job builds the application
3. Supabase `db reset` runs, applying Supabase migrations (creates empty `payload` schema)
4. Shard jobs restore build cache and start local Supabase
5. `pnpm --filter payload start:test` starts Payload server in production mode
6. Payload tries to query `payload.users` to check for existing admin users
7. Query fails with `relation "payload.users" does not exist`

## Expected Behavior

Payload CMS migrations should run before the production server starts, creating all necessary tables (`payload.users`, `payload.media`, `payload.posts`, etc.).

## Actual Behavior

The workflow skips Payload migrations. The Supabase migration `20250327_create_payload_schema.sql` only creates an empty `payload` schema. When Payload's production server starts, it immediately queries `payload.users` and fails because the table doesn't exist.

## Diagnostic Data

### Console Output
```
[WebServer] error: relation "payload.users" does not exist
[WebServer]     at async Object.f [as findOne] (.next/server/chunks/1691.js:135:5846)
[WebServer]   code: '42P01'
[WebServer]   severity: 'ERROR'
```

### Database Analysis

The Supabase migration that creates the payload schema:
```sql
-- apps/web/supabase/migrations/20250327_create_payload_schema.sql
DROP SCHEMA IF EXISTS payload CASCADE;
CREATE SCHEMA payload;
-- NOTE: This only creates the SCHEMA, not the TABLES
-- Payload CMS creates tables via its own migration system
```

Payload migrations (not being run in CI):
- `apps/payload/src/migrations/20251208_141121.ts` - Creates users, media, posts tables
- `apps/payload/src/migrations/20251210_195519.ts` - Additional schema updates

### Workflow Analysis

Current workflow flow:
```
Setup Test Server → Build → Cache
       ↓
Shard Jobs → Restore Cache → Start Supabase → Reset DB → Extract Keys → Run Tests
                                    ↓
                              supabase db reset
                              (only runs Supabase migrations)
                                    ↓
                              pnpm --filter payload start:test
                              (expects payload.users to exist)
```

Missing step: `pnpm --filter payload payload migrate`

### Screenshots
N/A - CI workflow failure

## Error Stack Traces
```
[WebServer] Error: Failed query: select "users"."id", "users"."name", "users"."role", ...
           from "payload"."users" "users" ...
params: 1
    at p.queryWithCache (.next/server/chunks/1691.js:102:15142)
    at async Object.f [as findOne] (.next/server/chunks/1691.js:135:5846)
    at async ax (.next/server/app/(payload)/admin/[[...segments]]/page.js:59:307540)
{
  code: '42P01',  // PostgreSQL: undefined_table
  severity: 'ERROR'
}
```

## Related Code
- **Affected Files**:
  - `.github/workflows/e2e-sharded.yml` - Missing Payload migration step
  - `apps/payload/src/migrations/` - Payload migrations that need to run
  - `apps/web/supabase/migrations/20250327_create_payload_schema.sql` - Only creates empty schema
- **Recent Changes**:
  - Commit 9992ecef7 appears to be the latest
  - Issue #1800/#1801 fixed the `unlockPayloadUser()` timing issue but not this underlying migration problem
- **Suspected Functions**:
  - Payload's internal `findOne` query on startup
  - Missing `payload migrate` step in CI workflow

## Related Issues & Context

### Direct Predecessors
- #1800 (CLOSED): "Bug Diagnosis: E2E Payload Shards (7, 8, 9) Fail - unlockPayloadUser() Runs Before Payload Server Starts" - Similar symptoms but different root cause (that fix addressed test code timing, not server startup)
- #1801 (CLOSED): "Bug Fix: E2E Payload Shards - Timing Issue with unlockPayloadUser()" - Implemented error handling for missing table in test utilities, but doesn't address Payload server startup

### Similar Symptoms
- #1796: "Bug Diagnosis: CI/CD Pipeline Regression - PR Validation and E2E Sharded Workflow Failures"
- #1797: "Bug Fix: CI/CD Pipeline Regression - PR Validation and E2E Failures"

### Historical Context
The fix in #1801 added error handling to `unlockPayloadUser()` in the test utilities, which made the test code gracefully handle missing tables. However, the **actual Payload CMS server** still fails when it tries to query `payload.users` during startup. This is a different code path - the server's internal database queries, not the test utilities.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The E2E workflow does not run Payload CMS migrations (`pnpm --filter payload payload migrate`) before starting the Payload production server.

**Detailed Explanation**:

1. **Supabase migrations vs Payload migrations**: The project has two separate migration systems:
   - Supabase migrations (`apps/web/supabase/migrations/`) - Run via `supabase db reset`
   - Payload CMS migrations (`apps/payload/src/migrations/`) - Run via `pnpm --filter payload payload migrate`

2. **Schema creation is incomplete**: The Supabase migration `20250327_create_payload_schema.sql` only creates an empty `payload` schema. It does NOT create Payload's tables (users, media, posts, etc.).

3. **Production server expects tables**: When `start:test` runs `next start` for Payload, the server immediately tries to query `payload.users` to check for existing admin users. This is normal Payload behavior.

4. **Migrations never run in CI**: The workflow runs `supabase db reset` which applies Supabase migrations but never calls `pnpm --filter payload payload migrate` to apply Payload migrations.

**Supporting Evidence**:
- Stack trace shows `payload.users` table doesn't exist (error code 42P01)
- The `[WebServer]` prefix indicates error comes from Payload server, not test code
- Workflow file has no step for running Payload migrations
- The fix from #1801 only addresses test code, not server startup

### How This Causes the Observed Behavior

1. CI workflow builds Payload application
2. Shard job restarts Supabase and runs `supabase db reset --no-seed`
3. Supabase migrations create empty `payload` schema (no tables)
4. Playwright config starts Payload server via `pnpm --filter payload start:test`
5. Payload server starts and queries `payload.users` for admin user check
6. PostgreSQL returns error: "relation 'payload.users' does not exist"
7. Server continues with repeated errors, tests fail

### Confidence Level

**Confidence**: High

**Reasoning**:
- The error message explicitly states "relation 'payload.users' does not exist"
- PostgreSQL error code 42P01 (undefined_table) confirms table doesn't exist
- The workflow clearly lacks a Payload migration step
- Payload CLI has `migrate` command that would create these tables
- The `[WebServer]` log prefix confirms it's the server failing, not test code

## Fix Approach (High-Level)

Add Payload CMS migration step to the E2E workflow after Supabase is started and before tests run:

```yaml
# In .github/workflows/e2e-sharded.yml, e2e-shards job
- name: Run Payload CMS migrations
  if: steps.check-skip.outputs.skip != 'true'
  run: |
    cd apps/payload
    pnpm payload migrate
  env:
    DATABASE_URI: postgresql://postgres:postgres@localhost:54522/postgres
    PAYLOAD_SECRET: test_payload_secret_for_e2e_testing
```

This should be added after the "Start local Supabase" step and before tests run, similar to how it's done for Supabase migrations.

## Diagnosis Determination

The root cause is confirmed: **Payload CMS migrations are not executed in the CI workflow**. The Supabase migration creates an empty `payload` schema, but Payload's internal migrations (which create the actual tables like `users`, `media`, etc.) are never run.

The fix from #1801 (`unlockPayloadUser()` error handling) addresses a different issue - it made the **test code** gracefully handle missing tables. But this doesn't help when the **Payload server itself** fails to start because it can't query its own tables.

## Additional Context

The workflow comments reference Issue #1583/#1584 about using production server instead of dev server:
> "Use production server (next start) instead of dev server (next dev) in CI.
> The Setup Test Server job builds the application, so we can simply run the production build.
> Production server starts in 1-2 seconds vs dev server which may hang with cached build artifacts."

This switch to production mode may have masked this issue initially, since dev mode might auto-run migrations on startup, but production mode expects the database to already be set up.

---
*Generated by Claude Debug Assistant*
*Tools Used: GitHub CLI (gh), Grep, Read, Bash*
