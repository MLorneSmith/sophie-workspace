# Bug Diagnosis: E2E Auth Config Missing globalSetup

**ID**: ISSUE-1608
**Created**: 2026-01-20T15:11:00Z
**Reporter**: Claude Debug Assistant
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The e2e-sharded workflow fails on authentication tests (shard 2) because `playwright.auth.config.ts` doesn't have a `globalSetup` configuration that would create test users via `setupTestUsers()`. After each shard runs `supabase db reset --no-seed`, the test users don't exist, causing authentication failures.

## Environment

- **Application Version**: dev branch (commit 7e09454d0)
- **Environment**: CI (GitHub Actions)
- **Node Version**: 20
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown (systemic issue)

## Reproduction Steps

1. Push changes to the dev branch that trigger the e2e-sharded workflow
2. The workflow runs `supabase db reset --no-seed` in each shard
3. Shard 2 runs authentication tests using `playwright.auth.config.ts`
4. Tests attempt to log in as `test1@slideheroes.com`
5. Authentication fails with "The credentials entered are invalid"

## Expected Behavior

Authentication tests should be able to log in with test user credentials (`test1@slideheroes.com` / `aiesec1992`).

## Actual Behavior

Authentication fails with error message: "Sorry, we could not authenticate you - The credentials entered are invalid"

The test users do not exist in the database because:
1. `supabase db reset --no-seed` wipes all data
2. `playwright.auth.config.ts` has no `globalSetup` to call `setupTestUsers()`
3. Tests run against an empty auth database

## Diagnostic Data

### Console Output
```
Running test: authentication-auth-simple - sign in with valid credentials

Error: expect(locator).toContainText(expected)
Expected: "Test User 1"
Received: "Sorry, we could not authenticate you"
```

### Network Analysis
```
POST /auth/v1/token - 400 Bad Request
Response: {"error":"invalid_grant","error_description":"Invalid login credentials"}
```

### Error Context (from test artifacts)
```yaml
- alert:
    - heading "Sorry, we could not authenticate you" [level=5]
    - generic: The credentials entered are invalid
```

## Error Stack Traces
```
Authentication test failed after 4 retries
User: test1@slideheroes.com
Error: Invalid login credentials - user does not exist in auth.users
```

## Related Code
- **Affected Files**:
  - `apps/e2e/playwright.auth.config.ts` - Missing globalSetup
  - `apps/e2e/global-setup.ts` - Contains setupTestUsers() call
  - `apps/e2e/tests/helpers/test-users.ts` - User creation logic
  - `.github/workflows/e2e-sharded.yml` - db reset without seed
- **Recent Changes**:
  - 9ec55a5fb - Added setupTestUsers() to global-setup.ts (but only for configs with globalSetup)
- **Suspected Functions**:
  - `playwright.auth.config.ts` - Missing `globalSetup: "./global-setup.ts"` line

## Related Issues & Context

### Direct Predecessors
- #1603 (CLOSED): "Bug Fix: E2E Sharded Tests Fail Due to Missing Test Users" - Same root cause, fix only applied to `playwright.config.ts`, not `playwright.auth.config.ts`
- #1602 (CLOSED): "Bug Diagnosis: E2E Sharded Tests Fail Due to Missing Test Users" - Original diagnosis

### Same Component
- #1584 (CLOSED): "Fix: Use production server instead of dev server in CI" - Related webServer config changes

### Historical Context
The fix for #1603 added `setupTestUsers()` to `global-setup.ts`, but this only works for Playwright configs that include `globalSetup: "./global-setup.ts"`. The `playwright.auth.config.ts` was intentionally designed without globalSetup because auth tests "start fresh" - but this means test users are never created.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `playwright.auth.config.ts` file is missing the `globalSetup` configuration that would trigger `setupTestUsers()` to create test users after database reset.

**Detailed Explanation**:
The workflow structure is:
1. Each shard independently runs `supabase db reset --no-seed` (line 238 in e2e-sharded.yml)
2. This wipes ALL data from the database including auth.users
3. Playwright configs WITH `globalSetup: "./global-setup.ts"` run `setupTestUsers()` to recreate test users
4. `playwright.auth.config.ts` has NO globalSetup, so users are never created
5. Authentication tests fail because `test1@slideheroes.com` doesn't exist

**Supporting Evidence**:
- Error context from test artifacts shows: "The credentials entered are invalid"
- `playwright.auth.config.ts` line 14-64: No `globalSetup` property
- `playwright.config.ts` line 72: Has `globalSetup: "./global-setup.ts"`
- Shard 1 (smoke tests) passes because it doesn't need authentication
- Shard 2 (auth tests) fails because it needs test users but config has no globalSetup

### How This Causes the Observed Behavior

1. Workflow triggers on PR to dev branch
2. Each shard starts its own runner with fresh Supabase
3. Shard runs `supabase db reset --no-seed` to get clean state
4. Shard 2 runs `pnpm --filter web-e2e test:shard2`
5. This uses `--config=playwright.auth.config.ts`
6. Playwright starts webServer (production Next.js)
7. Playwright does NOT run globalSetup (not configured)
8. Test attempts to sign in as `test1@slideheroes.com`
9. Supabase returns 400 because user doesn't exist
10. Test fails with "credentials entered are invalid"

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct evidence from test artifacts confirms "credentials invalid" error
- Code inspection confirms `playwright.auth.config.ts` has no `globalSetup`
- Same pattern (missing globalSetup) confirmed to be the cause in #1602/#1603
- Fix for #1603 only addressed `global-setup.ts`, not the missing config in auth tests

## Fix Approach (High-Level)

Add `globalSetup: "./global-setup.ts"` to `playwright.auth.config.ts` so that `setupTestUsers()` is called before authentication tests run. This matches how `playwright.config.ts` handles the same issue.

Alternatively, create a minimal `auth-global-setup.ts` that ONLY calls `setupTestUsers()` without the full authentication state creation (since auth tests should start without pre-authenticated state).

## Diagnosis Determination

The root cause has been conclusively identified: `playwright.auth.config.ts` lacks the `globalSetup` configuration that creates test users. The fix is straightforward - either add the full `globalSetup` or create a dedicated setup just for user creation.

The auth tests intentionally don't use pre-authenticated storage state (they test the auth flows themselves), but they DO need the test users to exist in the database. The current configuration doesn't ensure this.

## Additional Context
- Shard 1 passes: Uses `playwright.smoke.config.ts` (no auth needed for public pages)
- Shards 3-6 fail: Use default `playwright.config.ts` (has globalSetup, but may have timing issues)
- The recent fix (#1603) addressed only `global-setup.ts`, not the missing `globalSetup` in `playwright.auth.config.ts`

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run list, gh run view, git log, grep, Read, file download*
