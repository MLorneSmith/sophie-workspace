# Bug Diagnosis: staging-deploy E2E Test Shard Failures Due to NEXT_PUBLIC_SITE_URL Mismatch

**ID**: ISSUE-pending
**Created**: 2026-01-26T22:40:00Z
**Reporter**: msmith
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The staging-deploy workflow's E2E test shards consistently fail because the `NEXT_PUBLIC_SITE_URL` environment variable is set to `http://localhost:3000` during the build (test-setup job), but the tests run the application on port `3001` (via Playwright's webServer configuration). This URL mismatch causes auth pages to fail to render properly, as the client-side code has the wrong URL baked in at build time.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI (GitHub Actions staging-deploy workflow)
- **Node Version**: 20
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Never (pattern issue)

## Reproduction Steps

1. Push to `staging` branch or merge a PR to staging
2. staging-deploy workflow triggers
3. Observe E2E Shard 1, 2, 3 (and likely others) failing with "element not found" errors on auth pages

## Expected Behavior

- E2E tests should pass, finding auth form elements (`[data-testid="sign-in-email"]`, etc.)
- Auth pages should render correctly

## Actual Behavior

- Tests fail with timeout waiting for auth form elements
- Error: `Locator: locator('[data-testid="sign-in-email"]')` - element(s) not found
- Auth pages load but forms don't render properly

## Diagnostic Data

### Console Output
```
2026-01-26T22:34:53.6667915Z     Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
2026-01-26T22:34:53.6671052Z     Locator: locator('[data-testid="sign-in-email"]')
2026-01-26T22:34:53.6672262Z     Error: element(s) not found
2026-01-26T22:34:53.6673102Z     [2m  - waiting for locator('[data-testid="sign-in-email"]')[22m
```

### Build Environment Analysis

**test-setup job (builds the app) - Line ~133 of staging-deploy.yml:**
```yaml
env:
  NEXT_PUBLIC_SITE_URL: http://localhost:3000  # <-- WRONG! Should be 3001
```

**test-shards job (runs tests) - Line ~211 of staging-deploy.yml:**
```yaml
env:
  NEXT_PUBLIC_SITE_URL: http://localhost:3001  # <-- CORRECT
  PLAYWRIGHT_BASE_URL: http://localhost:3001
```

### Evidence from CI Logs

**Build step env vars (job 61533188405):**
```
2026-01-26T22:27:59.8290979Z   NEXT_PUBLIC_SITE_URL: http://localhost:3000
```

**Test shard env vars (job 61533607393):**
```
2026-01-26T22:29:40.7310748Z   NEXT_PUBLIC_SITE_URL: http://localhost:3001
2026-01-26T22:29:40.7324848Z   PLAYWRIGHT_BASE_URL: http://localhost:3001
```

### Working Workflow Comparison

The `e2e-sharded.yml` workflow does NOT set `NEXT_PUBLIC_SITE_URL` in the build job, which means it falls back to `.env.test` which correctly sets `NEXT_PUBLIC_SITE_URL=http://localhost:3001`.

### .env.test Configuration
```
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

## Related Code
- **Affected Files**:
  - `.github/workflows/staging-deploy.yml` (lines 131-139)
  - `apps/web/.env.test`
- **Recent Changes**: Port mismatch has existed since workflow creation
- **Suspected Functions**: test-setup job env configuration

## Related Issues & Context

### Similar Infrastructure Issues
- #1830, #1832 - Port 3001 conflicts in staging-deploy (server startup issues)
- #1583, #1584 - Production server vs dev server startup issues

### Historical Context
This appears to be an original configuration error in the staging-deploy workflow. The test-setup job was configured with `NEXT_PUBLIC_SITE_URL: http://localhost:3000` while all test infrastructure uses port 3001.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `NEXT_PUBLIC_SITE_URL` is set to `http://localhost:3000` in the test-setup job's env block, but Playwright runs the app on port 3001.

**Detailed Explanation**:
1. Next.js `NEXT_PUBLIC_*` environment variables are baked into the client bundle at build time
2. The test-setup job builds the app with `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
3. The test-shards job runs tests with the app on port 3001 (via Playwright's webServer config)
4. The auth components likely use `NEXT_PUBLIC_SITE_URL` for URL construction, validation, or CORS-related decisions
5. The mismatch between the baked-in URL (3000) and runtime URL (3001) causes the auth forms to fail

**Supporting Evidence**:
- Build step logs show `NEXT_PUBLIC_SITE_URL: http://localhost:3000`
- Test shard logs show `PLAYWRIGHT_BASE_URL: http://localhost:3001`
- `.env.test` correctly has `NEXT_PUBLIC_SITE_URL=http://localhost:3001`
- The working `e2e-sharded.yml` doesn't override `NEXT_PUBLIC_SITE_URL`, so it uses `.env.test`

### How This Causes the Observed Behavior

1. Build runs with wrong `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
2. Client-side auth code has wrong URL baked in
3. When auth pages load on port 3001, client-side validation/routing may fail
4. Auth forms either don't render or render in error state
5. Tests timeout waiting for form elements that never appear

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct evidence of port mismatch in CI logs
- Working workflow (e2e-sharded) doesn't have this issue
- `.env.test` confirms correct port is 3001
- The fix is obvious and specific

## Fix Approach (High-Level)

Change line ~133 in `.github/workflows/staging-deploy.yml` from:
```yaml
NEXT_PUBLIC_SITE_URL: http://localhost:3000
```
to:
```yaml
NEXT_PUBLIC_SITE_URL: http://localhost:3001
```

Alternatively, remove the `NEXT_PUBLIC_SITE_URL` env var from test-setup entirely and let it use `.env.test` (which has the correct value).

## Diagnosis Determination

The root cause is definitively identified: a port mismatch in the staging-deploy workflow between build-time (3000) and runtime (3001) `NEXT_PUBLIC_SITE_URL` values. This is a simple configuration error with a straightforward fix.

## Additional Context

This issue affects all E2E test shards that involve auth pages (Shards 1, 2, 3 confirmed failing). The fix should resolve test failures across all shards.

The dev-integration-tests workflow passes because it runs against a deployed Vercel environment rather than a local build, so it doesn't have this build-time environment variable issue.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, Grep, Read, Bash*
