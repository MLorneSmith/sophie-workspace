# Bug Diagnosis: Staging E2E Shards Fail with Connection Refused

**ID**: ISSUE-pending
**Created**: 2025-12-05T21:52:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The newly implemented sharded E2E tests in staging-deploy.yml are failing with `net::ERR_CONNECTION_REFUSED` errors. All 9 test shards fail because Playwright tests try to connect to `http://localhost:3001/` but the application is started on port `3000`.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI (GitHub Actions)
- **Node Version**: 20
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: N/A (new implementation)
- **Workflow Run**: 19976435621

## Reproduction Steps

1. Push to staging branch triggering staging-deploy.yml workflow
2. Workflow runs test-setup job successfully
3. Workflow runs test-shards jobs (10 shards, 3 parallel)
4. All shards fail with connection refused errors

## Expected Behavior

E2E tests should connect to the application server successfully and execute tests.

## Actual Behavior

All test shards fail with:
```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/
```

## Diagnostic Data

### Console Output
```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/
Call log:
  - navigating to "http://localhost:3001/", waiting until "load"

    > 91 | 		await page.goto("/");
         | 		           ^
```

### Network Analysis
- Application started on port 3000 (`npx wait-on http://localhost:3000`)
- Playwright tests expect port 3001 (default in config)
- No `PLAYWRIGHT_BASE_URL` environment variable set

### Workflow Configuration Analysis

**test-shards job (staging-deploy.yml:182-286)**:
- Starts application: `pnpm --filter web start:test` (port 3000)
- Waits for: `npx wait-on http://localhost:3000`
- No PLAYWRIGHT_BASE_URL set in env

**Playwright config defaults (apps/e2e/playwright.*.config.ts)**:
```typescript
baseURL:
  process.env.PLAYWRIGHT_BASE_URL ||
  process.env.TEST_BASE_URL ||
  process.env.BASE_URL ||
  "http://localhost:3001",  // <-- Default when no env var set
```

## Error Stack Traces
```
[chromium] › tests/smoke/smoke.spec.ts:6:6 › Smoke Tests @smoke › homepage loads successfully @smoke

Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/
Call log:
  - navigating to "http://localhost:3001/", waiting until "load"

    at /home/runner/_work/2025slideheroes/2025slideheroes/apps/e2e/tests/smoke/smoke.spec.ts:7:14
```

## Related Code
- **Affected Files**:
  - `.github/workflows/staging-deploy.yml` (lines 182-286, test-shards job)
  - `apps/e2e/playwright.config.ts` (baseURL default)
  - `apps/e2e/playwright.smoke.config.ts` (baseURL default)
- **Recent Changes**: Commit a74b18a69 - "perf(ci): implement sharded E2E tests for staging deploy"
- **Suspected Functions**: test-shards job env configuration

## Related Issues & Context

### Direct Predecessors
- #943 (CLOSED): "Bug Fix: Implement Sharded E2E Tests for Staging Deploy" - The implementation that introduced this bug

### Related Infrastructure Issues
- #942: "Bug Diagnosis: Staging Deploy E2E Test Timeout" - Original diagnosis that led to sharding implementation

## Root Cause Analysis

### Identified Root Cause

**Summary**: The test-shards job in staging-deploy.yml does not set the `PLAYWRIGHT_BASE_URL` environment variable, causing Playwright to use its default port 3001 while the application actually runs on port 3000.

**Detailed Explanation**:
The staging-deploy.yml workflow starts the web application using `pnpm --filter web start:test &` which runs `next start` on the default Next.js port 3000. The workflow correctly waits for the application to be ready using `npx wait-on http://localhost:3000`. However, the Playwright configuration files default to port 3001 when no environment variable is set:

```typescript
// apps/e2e/playwright.config.ts:76-80
baseURL:
  process.env.PLAYWRIGHT_BASE_URL ||
  process.env.TEST_BASE_URL ||
  process.env.BASE_URL ||
  "http://localhost:3001",
```

Since none of these environment variables are set in the test-shards job, Playwright attempts to connect to port 3001, which has nothing listening on it.

**Supporting Evidence**:
- Error message: `net::ERR_CONNECTION_REFUSED at http://localhost:3001/`
- Workflow waits for: `http://localhost:3000` (line 273)
- Playwright default: `http://localhost:3001` (config files)
- No `PLAYWRIGHT_BASE_URL` in test-shards env section (lines 197-206)

### How This Causes the Observed Behavior

1. test-setup job builds the application
2. test-shards job starts with `pnpm --filter web start:test &` on port 3000
3. `wait-on http://localhost:3000` succeeds (app is running)
4. Playwright launches tests, reads config, sees no PLAYWRIGHT_BASE_URL
5. Playwright defaults to `http://localhost:3001`
6. All requests to port 3001 fail with connection refused

### Confidence Level

**Confidence**: High

**Reasoning**: The error message explicitly states the connection is refused on port 3001, while the workflow clearly starts the app on port 3000 and waits for it there. The Playwright config explicitly shows the fallback to port 3001 when no environment variable is set.

## Fix Approach (High-Level)

Add `PLAYWRIGHT_BASE_URL: http://localhost:3000` to the env section of the test-shards job (around line 206 in staging-deploy.yml). This will tell Playwright to connect to the correct port where the application is running.

## Diagnosis Determination

The root cause is definitively identified: a missing environment variable (`PLAYWRIGHT_BASE_URL`) in the test-shards job causes a port mismatch between where the application runs (3000) and where Playwright expects it (3001).

This is a straightforward configuration bug introduced when creating the sharded test structure. The fix is to add the missing environment variable.

## Additional Context

The e2e-sharded.yml workflow also doesn't explicitly set PLAYWRIGHT_BASE_URL but uses different test commands that may handle this differently (e.g., using `PLAYWRIGHT_WEB_COMMAND` and `PLAYWRIGHT_PAYLOAD_COMMAND` env vars). The staging deploy workflow was modeled after e2e-sharded.yml but missed this configuration detail.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run list, gh run view, gh api (jobs/logs), Read, Grep*
