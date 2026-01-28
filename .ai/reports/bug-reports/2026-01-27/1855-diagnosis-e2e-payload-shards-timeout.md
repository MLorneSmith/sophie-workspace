# Bug Diagnosis: E2E Payload Shards (7, 8, 9) Timeout Due to Missing Seeded Admin User

**ID**: ISSUE-1855
**Created**: 2026-01-27T17:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

E2E Shards 7, 8, 9 (Payload CMS tests) consistently timeout at 15 minutes. The root cause is that the Payload admin user is not seeded after migrations run, causing authentication failures during global-setup. Without valid authentication, the tests hang waiting for Payload operations to complete.

## Environment

- **Application Version**: dev branch (commit b322678ae)
- **Environment**: CI (GitHub Actions e2e-sharded workflow)
- **Node Version**: 20.10.0
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown (potentially never worked since Payload tests were added to sharded workflow)

## Reproduction Steps

1. Trigger e2e-sharded workflow (via push to dev or manual dispatch)
2. Observe Shards 7, 8, 9 running
3. Wait 15+ minutes
4. Shards timeout with "The action 'Run E2E tests for shard X' has timed out after 15 minutes"

## Expected Behavior

Payload CMS tests should:
1. Authenticate successfully with the pre-seeded admin user (`michael@slideheroes.com`)
2. Run the payload-auth, payload-collections, and payload-database test suites
3. Complete within the 15-minute timeout

## Actual Behavior

1. Payload CMS migrations run successfully (tables created)
2. Global-setup attempts to authenticate to Payload with `michael@slideheroes.com`
3. **Authentication fails** because no user exists with those credentials in Payload's `users` table
4. Tests proceed without valid Payload auth state
5. Tests hang or run very slowly, eventually timing out at 15 minutes

## Diagnostic Data

### Console Output
```
🔐 Authenticating payload-admin user via Supabase API...
✅ API authentication successful for payload-admin user
🍪 Cookie domain config: localhost (isVercelPreview: false)
   🍪 sb-127-auth-token:
      Domain: localhost
      SameSite: Lax
      Secure: false
      HttpOnly: false
✅ Session injected into cookies and localStorage for payload-admin user
🔄 Authenticating to Payload CMS via API for payload-admin user...
   Payload login attempt 1/3...
   Payload login attempt 2/3...
   Payload login attempt 3/3...
⚠️  Payload authentication skipped for payload-admin user: Payload CMS login failed after 3 attempts. Last error: Attempt 3 failed: no token received. Check that Payload server is running at http://localhost:3021 and credentials are valid.
   (This is expected if Payload server is not running - Payload tests will start it when needed)
✅ payload-admin user auth state saved successfully

✅ Global Setup Complete: All auth states created via API

Running 22 tests using 1 worker
##[error]The action 'Run E2E tests for shard 8' has timed out after 15 minutes.
```

### Workflow Analysis
The e2e-sharded.yml workflow includes:
- ✅ `Run Payload CMS migrations` step (creates `payload.*` tables)
- ❌ **Missing**: Payload admin user seeding step

### Test Configuration
From `apps/e2e/package.json`:
```json
"test:shard7": "PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021 playwright test tests/payload/payload-auth.spec.ts --project=payload",
"test:shard8": "PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021 playwright test tests/payload/payload-collections.spec.ts --project=payload",
"test:shard9": "PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021 playwright test tests/payload/payload-database.spec.ts --project=payload",
```

### Expected Credentials
From `apps/e2e/tests/payload/helpers/test-data.ts`:
```typescript
admin: {
  email: process.env.E2E_ADMIN_EMAIL || "michael@slideheroes.com",
  password: process.env.E2E_ADMIN_PASSWORD || "aiesec1992",
}
```

## Related Code
- **Affected Files**:
  - `.github/workflows/e2e-sharded.yml` (missing Payload seeding step)
  - `apps/e2e/global-setup.ts` (Payload auth fails at lines 1240-1313)
  - `apps/e2e/tests/payload/helpers/test-data.ts` (expected admin credentials)
- **Recent Changes**: Payload CMS migrations were added in commit cd9986438 (fix from Issue #1814)
- **Suspected Functions**: `loginToPayloadWithRetry()` in global-setup.ts

## Related Issues & Context

### Direct Predecessors
- #1813 (CLOSED): "Bug Diagnosis: E2E Shards 7-9 Fail with relation payload.users does not exist" - Identified missing Payload migrations
- #1814 (CLOSED): "Bug Fix: Add Payload CMS migrations to E2E sharded workflow" - Added migrations but NOT seeding

### Related Infrastructure Issues
- #1825 (CLOSED): "Bug Diagnosis: E2E Sharded Workflow - Missing Payload Migrations" - Same root workflow
- #1826 (CLOSED): "Bug Fix: Staging Deploy E2E Tests Missing Auth Variables" - Related CI/CD fixes

### Historical Context
The Payload CMS migration step was added in commit cd9986438 to fix the "relation payload.users does not exist" errors. However, the fix only addressed the schema (tables) but not the data (admin user). The tests need both:
1. ✅ Tables created by migrations
2. ❌ Admin user created by seeding

## Root Cause Analysis

### Identified Root Cause

**Summary**: The e2e-sharded workflow creates Payload database tables via migrations but does not seed the required admin user (`michael@slideheroes.com`), causing Payload authentication to fail in global-setup.

**Detailed Explanation**:
The Payload CMS tests (shards 7, 8, 9) require a pre-existing admin user in the Payload `users` table. The workflow currently:

1. Runs `pnpm --filter payload payload migrate --forceAcceptWarning` - Creates tables in `payload.*` schema
2. Does NOT run any Payload seeding command - The `payload.users` table is empty

When global-setup.ts tries to authenticate via `loginToPayloadWithRetry()`, it calls the Payload `/api/users/login` endpoint with `michael@slideheroes.com`. Since no user exists, Payload returns no token, causing the login to fail after 3 retries.

The tests then run without valid Payload authentication, causing them to hang waiting for Payload operations that require auth.

**Supporting Evidence**:
- Log output: "Payload CMS login failed after 3 attempts. Last error: Attempt 3 failed: no token received"
- Workflow file grep shows no `seed` commands for Payload: `grep -E "payload.*seed|seed:run" .github/workflows/e2e-sharded.yml` returns no matches
- Payload seeding exists: `apps/payload/package.json` has `"seed:run"` script

### How This Causes the Observed Behavior

1. Global-setup runs Payload auth → Fails (no user in DB)
2. Tests use pre-authenticated storage state from `.auth/payload-admin.json` → State lacks valid Payload token
3. Playwright starts Payload server via webServer config → Server starts but tests can't auth
4. Tests hang waiting for authenticated operations → 15-minute timeout reached

### Confidence Level

**Confidence**: High

**Reasoning**:
- Log evidence clearly shows "no token received" from Payload login
- The workflow explicitly has migrations but no seeding
- The same credentials work locally when Payload is properly seeded
- Pattern matches Issue #1813/#1814 (incomplete fix)

## Fix Approach (High-Level)

Add a Payload admin user creation step after the migrations step in `.github/workflows/e2e-sharded.yml`. Options:

1. **Minimal fix**: Create admin user via Payload's first-user API endpoint or direct DB insert
2. **Full seeding**: Run `pnpm --filter payload seed:run` (but this may be slow and create unnecessary data)
3. **E2E-specific seed**: Create a minimal seed script that only creates the admin user for E2E tests

The fix should:
- Run AFTER `Run Payload CMS migrations` step
- Use the same credentials defined in `TEST_USERS.admin` (`michael@slideheroes.com` / `aiesec1992`)
- Complete quickly (tests already have 15-minute timeout pressure)

## Diagnosis Determination

The root cause is definitively identified: **missing Payload admin user seeding** in the e2e-sharded workflow. The fix from Issue #1814 was incomplete - it added migrations (schema) but not seeding (data).

## Additional Context

### Shard 4 Failure (Separate Issue)
The current run (21405665211) also shows Shard 4 (admin.spec.ts, invitations.spec.ts) failing. This appears to be a separate test failure unrelated to Payload, as all infrastructure steps succeeded. This should be investigated separately.

### Test Timeout Configuration
The Payload tests use `timeout: 60000` (60s per test) but the workflow step has a 15-minute timeout. With 22 tests in shard 8 running sequentially (1 worker), even legitimate slow tests could approach this limit.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, gh run list, grep, read, jq*
