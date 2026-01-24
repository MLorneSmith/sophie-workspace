# Bug Diagnosis: E2E Payload Shards (7, 8, 9) Fail - payload.users Table Not Created

**ID**: ISSUE-pending
**Created**: 2026-01-24T18:40:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

E2E Shards 7, 8, and 9 (Payload CMS tests) fail with `relation "payload.users" does not exist` error. The root cause is a **timing issue**: the `unlockPayloadUser()` function in `test.beforeAll()` runs BEFORE Playwright's webServer starts the Payload CMS server, which is responsible for creating the `payload.users` table during initialization.

## Environment

- **Application Version**: dev branch (commit b37c4b7bf)
- **Environment**: CI (GitHub Actions)
- **Node Version**: 20
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Before #1791/#1792 investigation (issue was misdiagnosed)

## Reproduction Steps

1. Push changes to dev branch
2. E2E Sharded workflow triggers
3. Shards 7, 8, 9 run Payload tests
4. Tests fail immediately in `beforeAll()` hook

## Expected Behavior

Payload tests should wait for Payload CMS server to initialize and create its schema before running tests.

## Actual Behavior

Tests fail with `error: relation "payload.users" does not exist` because:
1. `payload-auth.spec.ts:23` calls `unlockPayloadUser()` in `test.beforeAll()`
2. This runs BEFORE Playwright's webServer starts the Payload server
3. Payload server is what creates the `payload.users` table during initialization
4. Query fails because table doesn't exist yet

## Diagnostic Data

### Console Output
```
E2E Shard 7: error: relation "payload.users" does not exist
   at utils/database-utilities.ts:340
   at unlockPayloadUser
   at /apps/e2e/tests/payload/payload-auth.spec.ts:23:3

E2E Shard 9: [WebServer] [cause]: error: relation "payload.users" does not exist
```

### Workflow Run Evidence
- Run ID: 21319089609
- Shard 7: Failed with exit code 1 (7m47s)
- Shard 8: Timed out after 15 minutes (22m19s)
- Shard 9: Timed out after 15 minutes (22m27s)
- Shards 1-6, 10-12: All passed

### Previous Run (21317819325) - Same Error
- Shard 4: Timed out (missing EMAIL_SENDER) - **FIXED**
- Shard 7: `payload.users` does not exist - **NOT FIXED**
- Shard 8: `payload.users` does not exist - **NOT FIXED**
- Shard 9: `payload.users` does not exist - **NOT FIXED**

## Error Stack Traces
```
error: relation "payload.users" does not exist

   at utils/database-utilities.ts:340

      338 | 		await client.connect();
      339 |
    > 340 | 		const result = await client.query(
          | 		               ^
      341 | 			`UPDATE payload.users
      342 | 			 SET lock_until = NULL, login_attempts = 0, updated_at = NOW()
      343 | 			 WHERE email = $1`,
        at unlockPayloadUser (/apps/e2e/tests/utils/database-utilities.ts:340:18)
        at /apps/e2e/tests/payload/payload-auth.spec.ts:23:3
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/payload/payload-auth.spec.ts:21-24` - `test.beforeAll()` that calls `unlockPayloadUser()`
  - `apps/e2e/tests/utils/database-utilities.ts:329-356` - `unlockPayloadUser()` function
  - `apps/e2e/playwright.config.ts:225-235` - webServer configuration for Payload

- **Recent Changes**:
  - Commit `dab0fe737`: PAYLOAD_ENV fix (addresses SSL but not timing)
  - Commit `0d57ad222`: EMAIL_SENDER and port fixes (unrelated to this issue)

- **Suspected Functions**:
  - `unlockPayloadUser()` - attempts to query before table exists
  - `test.beforeAll()` in payload-auth.spec.ts - runs before webServer starts

## Related Issues & Context

### Direct Predecessors
- #1796 (OPEN): Original diagnosis - partially correct about symptoms but root cause was different
- #1797 (CLOSED): Fix attempt - addressed EMAIL_SENDER and port but not the timing issue
- #1791 (CLOSED): SSL diagnosis - **misdiagnosed** the root cause as SSL configuration
- #1792 (CLOSED): PAYLOAD_ENV fix - correct fix for SSL but doesn't solve timing issue

### Historical Context
The SSL fix (PAYLOAD_ENV) was correct for preventing SSL errors, but the primary issue is timing:
- Playwright's `test.beforeAll()` runs BEFORE `webServer` starts
- The `webServer` config starts Payload CMS, which creates the `payload.users` table
- The `unlockPayloadUser()` call in `beforeAll()` fails because the table doesn't exist yet

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `unlockPayloadUser()` function is called in `test.beforeAll()` which executes BEFORE Playwright starts the Payload webServer, causing the query to fail because the `payload.users` table doesn't exist yet.

**Detailed Explanation**:
1. Playwright test file `payload-auth.spec.ts` has a `test.beforeAll()` hook at line 22-24
2. This hook calls `unlockPayloadUser(TEST_USERS.admin.email)` to reset login attempts
3. `test.beforeAll()` runs BEFORE Playwright's `webServer` configuration is processed
4. The webServer is responsible for starting Payload CMS via `pnpm --filter payload start:test`
5. When Payload starts, it initializes the database and creates the `payload.users` table
6. Since `beforeAll()` runs first, the table doesn't exist when `unlockPayloadUser()` executes

**Supporting Evidence**:
- Error occurs at `database-utilities.ts:340` - the `UPDATE payload.users` query
- Stack trace shows the call originates from `payload-auth.spec.ts:23`
- Shards 8 and 9 timeout waiting for Payload server, which keeps failing with the same error
- Non-Payload shards (1-6, 10-12) all pass because they don't call `unlockPayloadUser()`

### How This Causes the Observed Behavior

1. **Shard 7 (7m47s, exit code 1)**: Test fails immediately in `beforeAll()` when `unlockPayloadUser()` throws
2. **Shard 8 (22m19s, timeout)**: Playwright repeatedly tries to start Payload server, which fails due to schema errors
3. **Shard 9 (22m27s, timeout)**: Same as Shard 8 - server startup keeps failing

### Confidence Level

**Confidence**: High

**Reasoning**:
- Clear stack trace showing the exact line of failure
- Error message explicitly states `relation "payload.users" does not exist`
- Timing is consistent: `beforeAll()` runs before `webServer`
- Non-Payload tests all pass, confirming the issue is specific to Payload test setup

## Fix Approach (High-Level)

**Option 1 (Recommended)**: Make `unlockPayloadUser()` gracefully handle missing table
- Wrap the query in a try-catch
- If table doesn't exist, log a message and return `false`
- This is safe because if the table doesn't exist, there's no locked user to unlock

**Option 2**: Move the unlock logic inside the test or use `test.beforeEach()`
- `beforeEach()` runs after the webServer is confirmed ready
- However, this would run the unlock for every test, which is wasteful

**Option 3**: Add explicit Payload server startup check
- Wait for Payload server to be ready in `beforeAll()` before calling unlock
- More complex but ensures proper ordering

## Diagnosis Determination

The root cause has been identified with high confidence. The issue is **NOT** an SSL configuration problem (as previously diagnosed in #1791/#1792), but rather a **timing issue** where the test's `beforeAll()` hook runs before Playwright's webServer starts the Payload CMS server that creates the required database tables.

The fix requires modifying `unlockPayloadUser()` to gracefully handle the case where the `payload.users` table doesn't exist yet.

## Additional Context

**PR Validation Workflow**: PASSED (all checks green)
**Affected Shards**: 7, 8, 9 (all Payload-related tests)
**Fixed Issues**: Shard 4 now passes (EMAIL_SENDER fix worked)

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (workflow inspection, issue search), Grep, Read, Bash*
