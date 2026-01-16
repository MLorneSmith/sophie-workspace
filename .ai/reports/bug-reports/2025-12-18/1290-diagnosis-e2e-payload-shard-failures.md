# Bug Diagnosis: E2E Payload Auth Tests Fail - Multiple Root Causes

**ID**: ISSUE-pending
**Created**: 2025-12-18T18:58:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

E2E Payload auth tests (shard 7) fail with multiple compounding issues: (1) the test controller doesn't set `NODE_ENV=test`, causing pre-flight validation to fail; (2) `supabase-config-loader.ts` throws `spawnSync /bin/sh ENOENT` errors during test execution; and (3) even when tests run, the Payload login page renders as a blank white page with JavaScript errors, causing all UI tests to timeout waiting for form elements.

## Environment

- **Application Version**: dev branch (ca2108bf4)
- **Environment**: development/test
- **Browser**: Chromium (Playwright)
- **Node Version**: v20.x
- **Database**: PostgreSQL via Supabase (port 54522)
- **Payload CMS**: Running on port 3021 (Docker container healthy)
- **Last Working**: Unknown - tests have been failing intermittently

## Reproduction Steps

1. Run `/test 7` to execute Payload auth shard
2. Observe test controller starts without setting `NODE_ENV=test`
3. Pre-flight validation fails with "NODE_ENV should be 'test' but is 'development'"
4. Tests proceed with fallback config but `spawnSync /bin/sh ENOENT` errors appear repeatedly
5. When tests execute, Payload login page shows blank white screen with "8 Issues" badge
6. Tests timeout waiting for `input[name="email"]` locator (45s timeout)
7. All 9 tests fail or timeout, shard reports 0/0 passed after 1309s

## Expected Behavior

- Test controller should set `NODE_ENV=test` before running tests
- `supabase-config-loader` should not throw ENOENT errors
- Payload login page should render correctly with email/password form visible
- Tests should complete within 3 minutes with pass/fail results

## Actual Behavior

- `NODE_ENV` remains `development` during test execution
- `spawnSync /bin/sh ENOENT` errors during config loading
- Payload login page renders blank white with Next.js dev tools showing "8 Issues"
- Tests timeout after 45-90 seconds per test, entire shard times out at 20+ minutes
- Final result: 0 tests passed, 0 failed, 0 skipped (no results captured)

## Diagnostic Data

### Console Output
```
[supabase-config-loader] Failed to fetch config: spawnSync /bin/sh ENOENT. Using fallback values.
[database-utilities] Unlocked Payload user: michael@slideheroes.com
×F°×T  [progress markers showing failures]
⏱️  TIMEOUT: Shard Payload Auth timed out after 1309s
```

### Test Failure Evidence
```
Error: expect(locator).toBeVisible() failed
Locator: locator('input[name="email"]')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

TimeoutError: page.waitForLoadState: Timeout 45000ms exceeded.
```

### Screenshot Analysis
Test failure screenshot shows:
- Blank white page (no content rendered)
- "N 8 Issues" badge in bottom-left corner (Next.js dev tools)
- No login form visible
- Indicates React/Next.js rendering failure or JavaScript errors

### Network Analysis
```
curl -s -I http://localhost:3021/admin/login
HTTP/1.1 200 OK
X-Powered-By: Next.js, Payload
Content-Type: text/html; charset=utf-8
```
Server responds correctly but client-side rendering fails.

## Error Stack Traces
```
Error: expect(locator).toBeVisible() failed
at /home/msmith/projects/2025slideheroes/apps/e2e/tests/payload/payload-auth.spec.ts:39:38

TimeoutError: page.waitForLoadState: Timeout 45000ms exceeded.
at PayloadLoginPage.waitForPageLoad (tests/payload/pages/PayloadBasePage.ts:32:19)
at PayloadLoginPage.navigateToLogin (tests/payload/pages/PayloadLoginPage.ts:38:14)
```

## Related Code
- **Affected Files**:
  - `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs` (doesn't set NODE_ENV)
  - `apps/e2e/tests/utils/supabase-config-loader.ts` (ENOENT error source)
  - `apps/e2e/tests/utils/e2e-validation.ts` (NODE_ENV check)
  - `apps/e2e/tests/payload/payload-auth.spec.ts` (failing tests)
  - `apps/payload/` (rendering issue in dev mode)
- **Recent Changes**: Recent E2E infrastructure updates (5afeeb848, e674421cf)
- **Suspected Functions**:
  - `getSupabaseConfig()` - line 106 `execSync()` call
  - `runPreflightValidations()` - NODE_ENV validation

## Related Issues & Context

### Direct Predecessors
- #1207 (CLOSED): "E2E Shard 6 Timeout - Mixed Test Types and Failing Payload Auth Tests" - Same payload-auth timeout pattern
- #1135 (CLOSED): "Payload CMS E2E tests timeout without executing" - Global setup deadlock, fixed with --project=payload
- #1136 (CLOSED): "Bug Fix: Payload CMS E2E tests timeout without executing" - Added --project=payload flag

### Related Infrastructure Issues
- #1139 (CLOSED): "E2E Account Tests Timeout - Conflicting Timeout Architecture"
- #1140 (CLOSED): "Bug Fix: E2E Account Tests Timeout"
- #992: "E2E Test Infrastructure Systemic Architecture Problems"

### Same Component
- #897 (OPEN): "Add E2E Smoke Tests for AI Canvas, Courses, and Dashboard"
- #898 (OPEN): "Add E2E Tests for Critical User Paths"

### Historical Context
This appears to be a regression or new manifestation of ongoing E2E infrastructure issues. The Payload tests were fixed in #1136 but a new issue has emerged: the test controller doesn't ensure `NODE_ENV=test` and the Payload CMS login page has client-side rendering failures in dev/test mode.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Three compounding issues cause Payload E2E test failures: (1) missing NODE_ENV=test in test controller, (2) execSync shell resolution failure in Playwright context, and (3) Payload CMS client-side React rendering errors in dev mode.

**Detailed Explanation**:

1. **NODE_ENV Not Set**: The test controller (`e2e-test-runner.cjs`) spawns Playwright tests without explicitly setting `NODE_ENV=test`. This causes pre-flight validation to fail. While tests can proceed with fallbacks, running in development mode triggers additional issues.

2. **execSync ENOENT Error**: The `supabase-config-loader.ts` uses `execSync("npx supabase status --output json")` which fails with `spawnSync /bin/sh ENOENT`. This happens in the Playwright worker process context, possibly due to PATH or shell resolution differences. The fallback config works, but the error is logged repeatedly (once per test).

3. **Payload CMS Rendering Failure**: The Payload login page at `http://localhost:3021/admin/login` returns HTTP 200 with valid HTML, but the React app fails to hydrate/render on the client side. The screenshot shows a blank page with "8 Issues" in the Next.js dev tools overlay. This indicates JavaScript errors preventing the login form from rendering.

**Supporting Evidence**:
- Pre-flight validation output: `NODE_ENV should be 'test' but is 'development'`
- Repeated log entries: `[supabase-config-loader] Failed to fetch config: spawnSync /bin/sh ENOENT`
- Screenshot: Blank white page with only "N 8 Issues" badge visible
- Test error: `locator('input[name="email"]') - element(s) not found`

### How This Causes the Observed Behavior

1. Test controller starts without `NODE_ENV=test`
2. Pre-flight validation fails for NODE_ENV check but test proceeds
3. Each test's `beforeAll` calls `unlockPayloadUser()` → `getSupabaseConfig()` → ENOENT error (but continues with fallback)
4. Test navigates to Payload login page
5. Page HTML loads (HTTP 200) but JavaScript has errors preventing React hydration
6. Login form never renders (blank page with error badge)
7. Test waits for `input[name="email"]` selector → times out after 10-45 seconds
8. All 9 tests fail similarly → shard times out at 20+ minutes
9. Results not captured due to SIGTERM termination

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct evidence from test logs, screenshots, and error messages
- Reproduced consistently when running `/test 7`
- The blank Payload page with "8 Issues" badge clearly shows client-side JS errors
- The `spawnSync ENOENT` error is logged consistently in test output
- NODE_ENV mismatch confirmed by pre-flight validation output

## Fix Approach (High-Level)

1. **Set NODE_ENV in test controller**: Modify `e2e-test-runner.cjs` to set `NODE_ENV=test` in the environment when spawning Playwright processes.

2. **Fix or suppress ENOENT errors**: Either fix the shell resolution issue in `supabase-config-loader.ts` (possibly by using absolute shell path or different exec options), or suppress the warning since fallback values work correctly.

3. **Investigate Payload CMS rendering errors**: The "8 Issues" shown by Next.js dev tools need investigation. This may require:
   - Checking the Payload CMS server logs for errors
   - Running Payload in production mode for tests (`NODE_ENV=production`)
   - Or investigating what JavaScript errors are preventing the login form from rendering

The highest priority fix is ensuring `NODE_ENV=test` is set, as this may resolve multiple downstream issues including the Payload rendering problem.

## Diagnosis Determination

The root cause is a combination of three issues that compound to make Payload E2E tests completely non-functional:

1. **Missing environment variable**: Test controller doesn't set `NODE_ENV=test`
2. **Shell execution issue**: `execSync` fails with ENOENT in Playwright worker context
3. **Client-side rendering failure**: Payload CMS login page has JavaScript errors preventing form rendering

All three issues need to be addressed, but fixing NODE_ENV may resolve the Payload rendering issue if it's caused by running in development mode during tests.

## Additional Context

- The `--project=payload` flag was correctly added per fix #1136
- Docker container `slideheroes-payload-test` shows as healthy
- Server responds with HTTP 200 and valid HTML
- The issue is client-side JavaScript execution failure
- Previous fixes focused on global setup deadlocks, but this is a new rendering issue

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (docker inspect, curl, grep), Read (test files, config), Glob, GitHub CLI (issue search)*
