# Bug Diagnosis: E2E Local Test Regression After Vercel Preview Cookie Fixes

**ID**: ISSUE-pending
**Created**: 2025-12-11T16:52:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

Multiple E2E test shards are failing locally after cookie configuration changes made today (commits `83f5dd813` and `9cdafcdc8`) designed to fix auth session issues in Vercel preview deployments. The local Docker-based E2E tests that were passing yesterday (Dec 10) are now failing with 12 test failures across 5 shards. Tests are being redirected to `/` (homepage) instead of staying on authenticated pages, indicating authentication sessions are not being recognized.

## Environment

- **Application Version**: dev branch (commit 9cdafcdc8)
- **Environment**: development (local Docker test environment)
- **Node Version**: 22.16.0
- **Database**: PostgreSQL via Supabase (Docker)
- **Last Working**: 2025-12-10 (yesterday)

## Reproduction Steps

1. Run `/test` command to execute comprehensive E2E test suite
2. Observe test failures in shards 3, 4, 9, 10, and 12
3. Failures show timeouts waiting for authenticated page elements
4. Logs show users being redirected to `http://localhost:3001/` (homepage)

## Expected Behavior

- Authenticated tests should navigate to protected pages successfully
- Test users should remain authenticated throughout test execution
- All 12 E2E shards should pass (as they did on Dec 10)

## Actual Behavior

- 12 test failures across 5 shards
- Tests timeout waiting for authenticated page elements like `[data-testid="team-selector"]`
- Navigation logs show repeated redirects to `/` (homepage)
- Only unauthenticated smoke tests pass reliably

## Diagnostic Data

### Test Results Summary

| Shard | Status | Passed | Failed | Skipped |
|-------|--------|--------|--------|---------|
| Smoke Tests | ✅ | 9 | 0 | 0 |
| Authentication | ✅ | 10 | 0 | 1 |
| Personal Accounts | ❌ | 2 | 3 | 2 |
| Admin & Invitations | ❌ | 2 | 5 | 4 |
| Payload CMS | ✅ | 41 | 0 | 2 |
| Seeding Tests | ✅ | 20 | 0 | 6 |
| User Billing | ❌ | 0 | 1 | 0 |
| Team Billing | ❌ | 0 | 1 | 0 |
| Config Verification | ✅ | 11 | 0 | 0 |
| Team Accounts | ❌ | 0 | 2 | 5 |

### Console Output

```
Error: page.waitForSelector: Timeout 20000ms exceeded.
Call log:
  - waiting for locator('[data-testid="team-selector"]') to be visible
  - waiting for" http://localhost:3001/" navigation to finish...
  - navigated to "http://localhost:3001/"

Error: Timeout 30000ms exceeded while waiting on the predicate
   at team-accounts/team-accounts.po.ts:105
```

### Cookie Configuration (Global Setup Logs)

```
🔗 Using Supabase Auth URL: http://127.0.0.1:54521
🍪 Using Supabase Cookie URL: http://host.docker.internal:54521 (for cookie naming)
🍪 Cookie domain config: localhost (isVercelPreview: false)
   🍪 sb-host-auth-token:
      Domain: localhost
      SameSite: Lax
      Secure: false
      HttpOnly: true
✅ Session injected into cookies and localStorage for test user
```

### Git History Analysis

Commits made today that modified E2E cookie handling:

```
9cdafcdc8 fix(e2e): add url property to cookies for Vercel preview deployments
83f5dd813 fix(e2e): remove explicit cookie domain for Vercel preview deployments
4e94c571b fix(e2e): remove invalid AuthError type cast in diagnostic logging
6fef3eec8 fix(e2e): implement cookie verification and auth session diagnostics
d8389e380 fix(e2e): disable Vercel Live toolbar to prevent auth session loss
```

### Yesterday's Results (2025-12-10)

| Shard | Status | Passed | Failed |
|-------|--------|--------|--------|
| Personal Accounts | ✅ | 11 | 0 |
| Admin & Invitations | ✅ | 9 | 0 |

## Error Stack Traces

```
TimeoutError: page.waitForSelector: Timeout 20000ms exceeded.
    at waitForHydration (/home/msmith/projects/2025slideheroes/apps/e2e/tests/utils/wait-for-hydration.ts:82:13)
    at navigateAndWaitForHydration (/home/msmith/projects/2025slideheroes/apps/e2e/tests/utils/wait-for-hydration.ts:196:2)
    at /home/msmith/projects/2025slideheroes/apps/e2e/tests/account/account-simple.spec.ts:25:3
```

## Related Code

- **Affected Files**:
  - `apps/e2e/global-setup.ts` (cookie configuration changes)
  - `apps/e2e/tests/team-accounts/team-accounts.spec.ts`
  - `apps/e2e/tests/admin/admin.spec.ts`
  - `apps/e2e/tests/invitations/invitations.spec.ts`
  - `apps/e2e/tests/account/account.spec.ts`
  - `apps/e2e/tests/user-billing/user-billing.spec.ts`
  - `apps/e2e/tests/team-billing/team-billing.spec.ts`

- **Recent Changes**: Commits `83f5dd813` and `9cdafcdc8` modified cookie domain handling in `global-setup.ts`
- **Suspected Functions**: `getCookieDomainConfig()` and cookie creation logic in `globalSetup()`

## Related Issues & Context

### Direct Predecessors

- #1102 (CLOSED): "Bug Fix: Playwright addCookies fails with missing domain/url for Vercel preview deployments"
- #1101 (CLOSED): "Bug Diagnosis: Playwright addCookies fails with missing domain/url for Vercel preview deployments"
- #1096 (CLOSED): "Bug Fix: Integration Tests Auth Session Lost in Vercel Preview Deployments"
- #1092 (CLOSED): "Bug Diagnosis: Integration Tests Auth Session Lost in Vercel Preview Deployments"

### Similar Symptoms

- #1067 (CLOSED): "Dev Integration Tests Auth Session Regression After #1063 Fix"
- #1063 (CLOSED): "Dev Integration Tests Fail - Authentication Session Not Persisted to Server"

### Historical Context

There is an ongoing pattern of E2E cookie/auth regressions. Multiple cycles of fixes for CI/Vercel preview environments have caused regressions in local Docker tests and vice versa. This is the latest instance in a series of auth session issues dating back to issues #1062, #1063, #1066, #1067, #1078, #1082, #1083, #1092, #1096, #1101, and #1102.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The cookie configuration changes for Vercel preview deployments in commits `83f5dd813` and `9cdafcdc8` did not break the local test cookie setup itself, but the broader changes introduced instability in how authentication sessions are handled. The actual root cause is likely an unintended side effect of the changes to `getCookieDomainConfig()` or how cookies are being processed by the Docker container's middleware.

**Detailed Explanation**:

The cookie setup appears correct on the surface:
1. Cookie name: `sb-host-auth-token` (derived from `host.docker.internal` - correct)
2. Cookie domain: `localhost` (correct for tests running against `localhost:3001`)
3. Cookie attributes: `SameSite: Lax`, `Secure: false`, `HttpOnly: true` (correct)

However, the tests show that authenticated users are being redirected to `/` after navigation. This indicates the middleware in the Docker container is not recognizing the auth session. Potential causes:

1. **Cookie URL vs Domain mismatch**: When `domain` is defined (localhost case), cookies are set with `{ ...cookieBase, domain }`. When undefined (Vercel preview), they use `{ ...cookieBase, url: baseURL }`. There may be a subtle difference in how Playwright handles these two cookie formats.

2. **Parallel test execution interference**: The failing tests use `page.context().clearCookies()` in some flows. With the new cookie handling, there may be timing issues where cookies are cleared and not properly restored.

3. **Docker container stale state**: The Docker container (`slideheroes-app-test`) was created on Dec 4th but code has changed. The container may have cached state that's incompatible with the new cookie handling.

**Supporting Evidence**:
- Yesterday (Dec 10) all tests passed with 0 failures in Personal Accounts and Admin & Invitations
- Today's test output shows 12 redirects to homepage during authenticated tests
- Docker container logs show GET `/` requests repeatedly during tests
- The specific error pattern ("waiting for http://localhost:3001/ navigation to finish") indicates auth redirect loops

### How This Causes the Observed Behavior

1. User credentials are correctly authenticated via Supabase API
2. Session tokens are correctly saved to auth state files with proper cookie name (`sb-host-auth-token`)
3. Playwright loads the auth state and navigates to protected pages
4. Middleware in Docker container attempts to validate session
5. Session validation fails (possibly due to cookie format differences or timing issues)
6. Middleware redirects unauthenticated requests to `/` (homepage)
7. Tests timeout waiting for authenticated page elements that never appear

### Confidence Level

**Confidence**: Medium

**Reasoning**: The diagnosis identifies the regression timeline and correlates it with specific commits, but the exact technical reason for the middleware not recognizing sessions requires further investigation. The cookie setup appears correct, suggesting the issue may be more subtle (timing, Playwright behavior, or Docker container state).

## Fix Approach (High-Level)

1. **Immediate mitigation**: Rebuild Docker test containers to clear any stale state:
   ```bash
   docker-compose -f docker-compose.test.yml down
   docker-compose -f docker-compose.test.yml build --no-cache
   docker-compose -f docker-compose.test.yml up -d
   ```

2. **If rebuild doesn't fix**: Revert commits `83f5dd813` and `9cdafcdc8` to restore the pre-regression state, then re-approach the Vercel preview fix with a more isolated change that doesn't affect local Docker tests.

3. **Long-term**: Consider separating the cookie handling logic for local Docker tests vs Vercel preview deployments more explicitly, perhaps using environment variable flags to control the behavior.

## Strategic Consideration

The user raised an important question: **"We may need to take a step back and ask ourselves whether we need to run these tests in the CI/CD pipeline, as getting this running is proving very difficult."**

Given the extensive history of auth session issues (#1062, #1063, #1066, #1067, #1078, #1082, #1083, #1092, #1096, #1101, #1102, and now this), the complexity of maintaining auth cookies that work across:
- Local development (localhost)
- Local Docker test containers (host.docker.internal)
- CI runners (GitHub Actions)
- Vercel preview deployments (*.vercel.app)

...may not be worth the maintenance burden. Options to consider:
1. **Simplify to local-only E2E tests**: Run comprehensive E2E tests only locally, use simpler smoke tests in CI
2. **Accept CI test flakiness**: Run E2E in CI but don't block deployments on failures
3. **Invest in proper test infrastructure**: Dedicated test environments with stable URLs and consistent cookie handling

## Diagnosis Determination

The E2E test regression was introduced by cookie configuration changes in commits `83f5dd813` and `9cdafcdc8`. While these changes were intended to fix auth session issues in Vercel preview deployments, they have caused local Docker-based E2E tests to fail. The root cause is likely a subtle incompatibility in cookie handling between the Playwright test runner and the Docker container's middleware, possibly exacerbated by stale Docker container state.

Recommended immediate action: Rebuild Docker containers and if that doesn't resolve the issue, revert the problematic commits.

## Additional Context

- This is the 13th auth/cookie-related issue in the past month
- The pattern suggests fundamental architectural complexity in supporting multiple test environments
- Consider architectural review to simplify the test infrastructure

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Bash, Grep, Glob, Git log, Docker inspect*
