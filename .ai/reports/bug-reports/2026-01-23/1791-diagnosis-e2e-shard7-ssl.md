# Bug Diagnosis: E2E Shard 7 Fails - Payload CMS SSL Connection Error in CI

**ID**: ISSUE-pending
**Created**: 2026-01-23T21:45:00Z
**Reporter**: system (CI workflow failure)
**Severity**: high
**Status**: new
**Type**: regression

## Summary

E2E Shard 7 (Payload Auth tests) fails in CI with `relation "payload.users" does not exist` error. The root cause is that Payload CMS cannot connect to the local Supabase PostgreSQL database because it attempts SSL connection, but local Supabase doesn't support SSL. This is a regression - shard 7 passed on 2026-01-22.

## Environment

- **Application Version**: SlideHeroes dev branch (commit e10a8ae1f)
- **Environment**: CI (GitHub Actions)
- **Node Version**: 20.10.0
- **Database**: PostgreSQL (Supabase local, ports 54521/54522)
- **Payload CMS**: 3.72.0
- **Last Working**: 2026-01-22 (workflow run 21262090954)

## Reproduction Steps

1. Push to dev branch or trigger E2E workflow
2. Wait for E2E Shard 7 to run
3. Observe failure with `relation "payload.users" does not exist`

## Expected Behavior

Payload CMS should connect to local Supabase PostgreSQL without SSL (since local Supabase has SSL disabled) and create its `payload.users` table during initialization.

## Actual Behavior

1. Payload starts with `pnpm --filter payload start:test` which has `NODE_ENV=test`
2. **Next.js `next start` overrides `NODE_ENV` to `production`** - this is documented Next.js behavior
3. `database-adapter-singleton.ts` checks `this.environment === "production"` and returns `true` for SSL
4. Payload attempts SSL connection to local Supabase PostgreSQL
5. Connection fails: `The server does not support SSL connections`
6. Payload never initializes, schema is never created
7. Test runs `unlockPayloadUser()` which queries `payload.users` → table doesn't exist

## Diagnostic Data

### Console Output (from CI logs)
```
[WebServer] Error: Error: cannot connect to Postgres: The server does not support SSL connections
    at Object.i [as connect] (.next/server/chunks/1691.js:135:9307)
    at async bp.init (.next/server/chunks/1452.js:31:8247)
...
error: relation "payload.users" does not exist
   at utils/database-utilities.ts:340
```

### Health Check Output
```
⚠️  Payload is unhealthy - Payload auth will be skipped. Payload tests may fail.
📋 Server Health Check Results:
  ✅ Supabase: Supabase healthy (21ms)
  ✅ Next.js: Next.js healthy (953ms)
  ⚠️ Payload: Payload returned status 500
```

### Workflow History
| Run ID | Date | Shard 7 Status |
|--------|------|----------------|
| 21262090954 | 2026-01-22 | ✅ success |
| 21298502989 | 2026-01-23 | ❌ failure |
| 21301012920 | 2026-01-23 | ❌ failure |

## Error Stack Traces
```
Error: cannot connect to Postgres: The server does not support SSL connections
    at Object.i [as connect] (.next/server/chunks/1691.js:135:9307)
    at async bp.init (.next/server/chunks/1452.js:31:8247)
    at async bs (.next/server/chunks/1452.js:31:12521)
    at async m (.next/server/chunks/7209.js:1:350)
    at async q (.next/server/chunks/7209.js:1:3799)
    at async (.next/server/chunks/7209.js:1:7739)
    at async k (.next/server/app/(payload)/api/[...slug]/route.js:1:7401) {
  payloadInitError: true
}
```

## Related Code

### Affected Files
- `apps/payload/src/lib/database-adapter-singleton.ts:181-199` - `shouldEnableSSL()` method
- `apps/payload/package.json:14` - `start:test` script
- `.github/workflows/e2e-sharded.yml` - CI workflow

### Critical Code Section (database-adapter-singleton.ts:181-199)
```typescript
private shouldEnableSSL(connectionString?: string): boolean {
  // Check for explicit SSL configuration first
  if (process.env.PAYLOAD_ENABLE_SSL === "true") {
    return true;
  }

  // Supabase Cloud pooler always requires SSL
  if (connectionString && this.isSupabaseCloud(connectionString)) {
    return true;
  }

  // For remote migrations, check if we're in migration mode
  if (process.env.PAYLOAD_MIGRATION_MODE === "production") {
    return true;
  }

  // Default to production environment check (backward compatibility)
  return this.environment === "production";  // ← THIS IS THE PROBLEM
}
```

### Recent Changes
- `5664edf66` (2026-01-23): "fix(e2e): set NODE_ENV=test in Payload start:test to disable SSL"
  - This fix added `NODE_ENV=test` to `start:test` script but **doesn't work** because Next.js overrides it

## Related Issues & Context

### Direct Predecessors
- #881 (CLOSED): "Bug Diagnosis: NODE_ENV=production in Claude Code causes Payload CMS SSL connection errors" - Same root cause but different trigger (Claude Code shell vs CI)
- #882 (CLOSED): "Bug Fix: NODE_ENV=production in Claude Code causes Payload CMS SSL connection errors"

### Similar Symptoms
- #879 (CLOSED): "Bug Fix: Payload CMS database connection SSL certificate error"

### Historical Context
This is a recurring issue with the same root cause: **relying on `NODE_ENV` to determine SSL configuration is fragile** because:
1. Next.js `next start` **always forces** `NODE_ENV=production` regardless of environment variable
2. Claude Code shell environment has `NODE_ENV=production`
3. Various tools and CI systems may set `NODE_ENV` inconsistently

The fix in commit `5664edf66` was **ineffective** because it tried to override `NODE_ENV` before `next start`, but Next.js internally resets it.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Next.js `next start` command forcibly sets `NODE_ENV=production` internally, overriding any external `NODE_ENV=test` setting. The `database-adapter-singleton.ts` uses `NODE_ENV` to determine SSL configuration, causing SSL to be enabled in CI against local Supabase which doesn't support SSL.

**Detailed Explanation**:

1. **Next.js Behavior**: According to [Next.js documentation](https://nextjs.org/docs/messages/non-standard-node-env) and [GitHub discussion #48914](https://github.com/vercel/next.js/discussions/48914), `next start` always runs in production mode regardless of `NODE_ENV` environment variable set externally.

2. **Code Path**:
   - CI runs `pnpm --filter payload start:test` which executes `cross-env NODE_ENV=test next start`
   - `next start` internally sets `process.env.NODE_ENV = 'production'` overriding the `test` value
   - `DatabaseAdapterManager` constructor reads `process.env.NODE_ENV` → gets `'production'`
   - `shouldEnableSSL()` returns `true` because `this.environment === 'production'`
   - Payload tries SSL connection to local Supabase PostgreSQL (port 54522)
   - Local Supabase has SSL disabled → connection fails
   - Payload never initializes → schema not created → tests fail

3. **Why It Worked Before (2026-01-22)**:
   - Investigation needed - the code path should have had the same issue
   - Possible: Cache from a previous successful run, timing differences, or state from setup job

**Supporting Evidence**:
- CI log shows `NODE_ENV: test` in environment diagnostics (set before `next start`)
- Error message: `The server does not support SSL connections` (SSL is being attempted)
- Payload health check returns 500 (server can't initialize)
- `payload.users` table doesn't exist (schema never created)

### How This Causes the Observed Behavior

1. `next start` resets `NODE_ENV=production`
2. `shouldEnableSSL()` returns `true`
3. SSL connection attempted against local Supabase (SSL disabled)
4. Connection fails → Payload can't initialize
5. `payload.users` table never created
6. `unlockPayloadUser()` in `beforeAll` hook queries non-existent table
7. Test fails with `relation "payload.users" does not exist`

### Confidence Level

**Confidence**: High

**Reasoning**:
1. Error message explicitly says "server does not support SSL connections" - proves SSL is being attempted
2. Next.js `next start` forcing `NODE_ENV=production` is documented behavior
3. Previous issue #881 had same root cause (different trigger)
4. Code review of `shouldEnableSSL()` confirms it checks `this.environment === 'production'`

## Fix Approach (High-Level)

**Option 1 (Recommended)**: Use a custom environment variable instead of `NODE_ENV`
- Add `PAYLOAD_ENV` or `APP_ENV` that Next.js won't override
- Modify `shouldEnableSSL()` to check `process.env.PAYLOAD_ENV` instead of `process.env.NODE_ENV`
- Set `PAYLOAD_ENV=test` in `start:test` script

**Option 2**: Explicit SSL disable flag
- Add `PAYLOAD_DISABLE_SSL=true` to the `start:test` command
- Modify `shouldEnableSSL()` to return `false` when `PAYLOAD_DISABLE_SSL=true`

**Option 3**: Check for localhost connections
- In `shouldEnableSSL()`, detect if DATABASE_URI points to localhost and disable SSL automatically

Option 1 is recommended because it's the standard pattern for Next.js applications needing environment-specific configuration that differs from the NODE_ENV development/production dichotomy.

## Diagnosis Determination

The root cause is definitively identified: **Next.js `next start` overrides `NODE_ENV=production` regardless of external settings**, causing the SSL configuration check to enable SSL against local Supabase which has SSL disabled.

The fix in commit `5664edf66` was well-intentioned but ineffective because it didn't account for Next.js's internal `NODE_ENV` override behavior.

## Additional Context

- This affects both E2E Shard 7 (Payload Auth) and potentially Shards 8 (Payload Seeding)
- The "fix" commit is in the dev branch but the issue persists because the fix approach was wrong
- Multiple shards (4, 7, 8, 9) failed in run 21298502989, suggesting related timing/initialization issues

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (workflow logs, issue search), grep, git log, web search*
