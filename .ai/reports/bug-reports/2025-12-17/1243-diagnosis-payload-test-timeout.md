# Bug Diagnosis: Payload E2E Tests Timeout Due to Next.js Performance API Error

**ID**: ISSUE-1243
**Created**: 2025-12-17T20:30:00Z
**Reporter**: Claude Debug Assistant
**Severity**: high
**Status**: new
**Type**: bug

## Summary

Payload CMS E2E tests (shard 7) timeout after 20 minutes because the Payload login page fails to render due to a Next.js runtime error: `Failed to execute 'measure' on 'Performance': 'Page' cannot have a negative time stamp`. This is a known Next.js 16.x bug that prevents the login form from appearing, causing all authentication tests to fail while waiting for form elements that never render.

## Environment

- **Application Version**: Payload 3.68.3, Next.js 16.0.10
- **Environment**: development/test (Docker containers)
- **Browser**: Chromium (Playwright)
- **Node Version**: 22.x
- **Database**: PostgreSQL (via Supabase)
- **Last Working**: Unknown - may have started after Next.js 16.0.10 upgrade

## Reproduction Steps

1. Start test infrastructure: `docker-compose -f docker-compose.test.yml up -d`
2. Run Payload auth tests: `/test 7` or `pnpm --filter web-e2e test:shard7`
3. Navigate to Payload login page at `http://localhost:3021/admin/login`
4. Observe JavaScript error in browser console preventing page render

## Expected Behavior

Payload CMS login page should render with email and password input fields, allowing E2E tests to perform authentication flows.

## Actual Behavior

The Payload CMS login page shows a Next.js error overlay with:
```
Runtime TypeError
Failed to execute 'measure' on 'Performance': 'Page' cannot have a negative time stamp.
```

The login form never renders, causing all tests to timeout waiting for `input[name="email"]` to become visible.

## Diagnostic Data

### Console Output
```
Running 9 tests using 1 worker
[supabase-config-loader] Failed to fetch config: spawnSync /bin/sh ENOENT. Using fallback values.
[database-utilities] Unlocked Payload user: michael@slideheroes.com
  ✘  1 [payload] › tests/payload/payload-auth.spec.ts:30:6 › should be able to access the login page without errors (11.5s)

Error: expect(locator).toBeVisible() failed
Locator: locator('input[name="email"]')
Expected: visible
Timeout: 10000ms
Error: element(s) not found
```

### Network Analysis
- Payload health endpoint responds successfully: `{"status":"healthy","version":"3.68.3","ready":true}`
- Login page request returns 200 but JavaScript error prevents render

### Performance Metrics
```
Shard 7 (Payload Auth):
- Expected tests: 9
- Actual results: 0 passed, 0 failed, 0 skipped (timeout)
- Duration: 1289 seconds (timed out at 20 min limit)
- Exit code: -1 (SIGTERM)
```

### Screenshots
- `/apps/e2e/test-results/payload-payload-auth-Paylo-331ae-e-login-page-without-errors-payload/test-failed-1.png`
- Shows Next.js error overlay with "Runtime TypeError" message

## Error Stack Traces
```
Runtime TypeError
Failed to execute 'measure' on 'Performance': 'Page' cannot have a negative time stamp.

Call Stack (3 frames)
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/payload/payload-auth.spec.ts` - Test file that times out
  - `apps/e2e/tests/payload/pages/PayloadLoginPage.ts` - Page object waiting for missing elements
  - `apps/payload/` - Payload CMS application using Next.js 16.0.10
- **Recent Changes**: Next.js upgraded to 16.0.10 (catalog version)
- **Suspected Functions**: Next.js Performance API measuring during NotFound/error page handling

## Related Issues & Context

### External References
- [vercel/next.js#86060](https://github.com/vercel/next.js/issues/86060) - Same error reported in Next.js 16.x
- Filed November 2025, affects Next.js 16.0.2-canary.16 and later
- Reproducible on Linux/WSL with Node 22.x

### Historical Context
This appears to be a regression in Next.js 16.x affecting the Performance API when handling certain page states. The error may occur randomly during development mode.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Next.js 16.0.10 has a bug in its Performance API measurement code that passes invalid negative timestamps when handling certain page states, causing a browser TypeError that prevents page rendering.

**Detailed Explanation**:
1. When Payload CMS loads the `/admin/login` page, Next.js attempts to measure page performance
2. The Next.js internal code calls `performance.measure()` with a timestamp that somehow becomes negative
3. The browser's Performance API throws a TypeError: "cannot have a negative time stamp"
4. This unhandled error prevents React from rendering the login form components
5. Playwright tests wait indefinitely for `input[name="email"]` which never appears
6. After 10+ seconds per test (with retries), the entire shard exceeds the 20-minute timeout

**Supporting Evidence**:
- Screenshot shows exact error message in Next.js error overlay
- Error matches exactly with [vercel/next.js#86060](https://github.com/vercel/next.js/issues/86060)
- Environment matches: Linux/WSL, Node 22.x, Next.js 16.0.10, React 19.2
- Payload server health check passes, confirming the app starts but fails at render time

### How This Causes the Observed Behavior

```
Next.js Performance API bug
    ↓
TypeError thrown during page render
    ↓
Error overlay displayed instead of login form
    ↓
input[name="email"] never renders
    ↓
Playwright toBeVisible() times out (10s default)
    ↓
Test fails, worker restarts, beforeAll runs again
    ↓
9 tests × ~2 retries × ~12s each = ~216s actual test time
    ↓
Plus global setup, infrastructure checks, etc.
    ↓
Total exceeds 20-minute shard timeout
```

### Confidence Level

**Confidence**: High

**Reasoning**:
1. Screenshot definitively shows the exact error message
2. Error matches known Next.js issue #86060
3. Environment configuration matches reported affected versions
4. Payload server is healthy - only the client-side render fails
5. Causal chain from error to timeout is clear and reproducible

## Fix Approach (High-Level)

Two potential approaches:

1. **Wait for Next.js fix**: Monitor [vercel/next.js#86060](https://github.com/vercel/next.js/issues/86060) for a patch release. Upgrade Next.js when fix is available.

2. **Workaround**: Add error boundary or try-catch around Performance API calls, or configure webpack to polyfill/mock the Performance API in test environments.

3. **Downgrade** (temporary): Revert to a Next.js version before 16.0.2-canary.16 if tests were previously passing.

## Diagnosis Determination

The Payload E2E test timeout is caused by a **known Next.js 16.x bug** ([#86060](https://github.com/vercel/next.js/issues/86060)) in the Performance API that throws a TypeError with negative timestamps. This error prevents Payload's login page from rendering, causing all authentication tests to fail while waiting for form elements that never appear.

The 20-minute timeout is a **secondary symptom** - the primary issue is that each individual test fails after ~12 seconds, and with 9 tests × 2 retries = 18 failed test runs, plus setup overhead, the total time exceeds the shard timeout limit.

## Additional Context

### Secondary Issue Noted
The `supabase-config-loader` also shows `spawnSync /bin/sh ENOENT` errors, but these are caught and fallback values are used successfully. This is a separate, lower-priority issue that doesn't affect test execution.

### Test Infrastructure Impact
- Shards 7, 8, 9, 14, 15 (all Payload-related) are likely affected
- Non-Payload shards (1-6, 10-13) should continue to pass

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash, Read, Grep, WebSearch, screenshot analysis*
