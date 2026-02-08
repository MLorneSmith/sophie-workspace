# Bug Diagnosis: E2E Sharded Tests Fail - No Web Server Running

**ID**: ISSUE-pending
**Created**: 2026-01-16T21:45:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The E2E Tests (Sharded) workflow fails on all test shards with `net::ERR_CONNECTION_REFUSED at http://localhost:3001/`. The e2e-shards job doesn't start a web server before running Playwright tests, and the Playwright configs for individual shards (smoke, auth, billing) don't have a `webServer` configuration to start one automatically.

## Environment

- **Application Version**: Current dev branch
- **Environment**: CI (GitHub Actions)
- **Node Version**: 20
- **Database**: PostgreSQL (Supabase local)
- **Workflow Run**: 21081417409
- **Commit**: 7ef5cf68b (fix for PAYLOAD_SECRET was successful - Setup Test Server job passed)

## Reproduction Steps

1. Push to dev branch or create PR touching e2e paths
2. E2E Tests (Sharded) workflow triggers
3. setup-server job completes successfully (build works now after #1565 fix)
4. e2e-shards jobs start on separate runners
5. Shards run `pnpm --filter web-e2e test:shardN`
6. All tests fail with connection refused

## Expected Behavior

E2E tests should have a running web application to connect to at localhost:3001.

## Actual Behavior

All test shards fail with:
```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/
Call log:
  - navigating to "http://localhost:3001/", waiting until "load"
```

## Diagnostic Data

### Console Output
```
[chromium] › tests/smoke/smoke.spec.ts:6:6 › Smoke Tests @smoke › homepage loads successfully @smoke

Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/
Call log:
  - navigating to "http://localhost:3001/", waiting until "load"

   5 |
   6 | 	test("homepage loads successfully @smoke", async ({ page }) => {
>  7 | 		await page.goto("/");
     | 		           ^
```

### Workflow Analysis

**e2e-shards job steps (e2e-sharded.yml:136-207)**:
1. Stagger matrix job start
2. Checkout
3. Setup deps
4. Setup Supabase CLI
5. Restore build and server state (cache)
6. Install Playwright browsers
7. Start local Supabase
8. **Run E2E tests** ← No web server start step before this!
9. Upload test results

**Missing step**: There is no step to start the Next.js web application before running tests.

### Playwright Configuration Analysis

**Main config (playwright.config.ts:192-201)**:
```typescript
webServer: process.env.PLAYWRIGHT_SERVER_COMMAND
    ? {
        cwd: "../../",
        command: process.env.PLAYWRIGHT_SERVER_COMMAND,
        url: "http://localhost:3001",
        reuseExistingServer: !process.env.CI,
      }
    : undefined,
```
- Only activates if `PLAYWRIGHT_SERVER_COMMAND` is set
- Workflow sets `PLAYWRIGHT_WEB_COMMAND` instead (wrong variable name)

**Shard-specific configs (smoke, auth, billing)**:
- `playwright.smoke.config.ts` - NO webServer config
- `playwright.auth.config.ts` - NO webServer config
- `playwright.billing.config.ts` - NO webServer config (assumed similar)

**Shard commands (apps/e2e/package.json)**:
```json
"test:shard1": "playwright test tests/smoke/smoke.spec.ts --config=playwright.smoke.config.ts",
"test:shard2": "playwright test tests/authentication/auth-simple.spec.ts ... --config=playwright.auth.config.ts",
```
- Shards 1, 2, 10, 11 use alternate configs with NO webServer
- Shards 3-9 use main config but `PLAYWRIGHT_SERVER_COMMAND` is not set

### Environment Variables Set
```yaml
PLAYWRIGHT_WEB_COMMAND: 'pnpm --filter=web dev:test'
PLAYWRIGHT_PAYLOAD_COMMAND: 'pnpm --filter=payload dev:test'
```
- These variables are NOT used by any Playwright config
- The config expects `PLAYWRIGHT_SERVER_COMMAND` (different name)

## Related Code

**Affected Files**:
- `.github/workflows/e2e-sharded.yml` (lines 136-207, e2e-shards job)
- `apps/e2e/playwright.config.ts` (webServer config at lines 192-201)
- `apps/e2e/playwright.smoke.config.ts` (no webServer)
- `apps/e2e/playwright.auth.config.ts` (no webServer)
- `apps/e2e/playwright.billing.config.ts` (no webServer)

**Recent Changes**:
- 7ef5cf68b - Fixed PAYLOAD_SECRET for build (now Setup Test Server passes)
- The underlying missing webServer issue predates this change

## Related Issues & Context

### Direct Predecessors
- #947 (CLOSED): "Bug Diagnosis: Staging E2E Shards Fail - Port Mismatch" - Same root cause pattern
- #262 (CLOSED): "WebServer startup timeouts causing E2E test failures in sharded execution"
- #1565 (CLOSED): "Bug Fix: E2E Sharded Build Fails - Missing PAYLOAD_SECRET" - Fixed the build, exposed this issue

### Same Component
- #1564 (CLOSED): "Bug Diagnosis: E2E Sharded Build Fails" - Diagnosed PAYLOAD_SECRET issue

### Historical Context
This is a recurring pattern where E2E workflows miss the web server startup configuration. Issue #947 documented the same problem for staging-deploy.yml.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The e2e-shards job does not start a web server before running Playwright tests, and the Playwright configs used by individual shards do not have `webServer` configuration to start one automatically.

**Detailed Explanation**:
The workflow architecture assumes each shard runs tests against a web application, but:

1. **No explicit server start step**: The e2e-shards job has no step to run `pnpm --filter web dev:test` or `pnpm --filter web start`

2. **Playwright configs missing webServer**: Shards 1, 2, 10, 11 use configs (`playwright.smoke.config.ts`, `playwright.auth.config.ts`, `playwright.billing.config.ts`) that have NO `webServer` property

3. **Wrong environment variable name**: The workflow sets `PLAYWRIGHT_WEB_COMMAND` but the main `playwright.config.ts` checks for `PLAYWRIGHT_SERVER_COMMAND`

4. **Shards run on separate runners**: Unlike a single-runner setup where you might start a server once, each shard runs on a different GitHub Actions runner, so each needs its own server

**Supporting Evidence**:
- All shards fail with `ERR_CONNECTION_REFUSED` at port 3001
- Workflow logs show no server startup before test execution
- Playwright configs explicitly lack webServer when using alternate configs
- `PLAYWRIGHT_SERVER_COMMAND` is never set in env section

### How This Causes the Observed Behavior

1. setup-server job builds the app and caches it ✓
2. e2e-shards job restores the build from cache ✓
3. e2e-shards job starts Supabase ✓
4. e2e-shards job immediately runs `pnpm --filter web-e2e test:shardN`
5. Playwright reads config (no webServer or wrong env var)
6. Tests try to connect to localhost:3001
7. No server listening → ERR_CONNECTION_REFUSED

### Confidence Level

**Confidence**: High

**Reasoning**:
- Error message explicitly states connection refused on port 3001
- Workflow analysis confirms no server start step
- Config analysis confirms no webServer in shard configs
- This matches the exact pattern from issue #947

## Fix Approach (High-Level)

Two options:

**Option A: Add server start step to e2e-shards job** (Recommended)
Add a step before "Run E2E tests" that starts the web server:
```yaml
- name: Start web server
  run: |
    pnpm --filter web dev:test &
    npx wait-on http://localhost:3001 --timeout 120000
```

**Option B: Set PLAYWRIGHT_SERVER_COMMAND**
Change env var from `PLAYWRIGHT_WEB_COMMAND` to `PLAYWRIGHT_SERVER_COMMAND`:
```yaml
env:
  PLAYWRIGHT_SERVER_COMMAND: 'pnpm --filter=web dev:test'
```
This would require using the main playwright.config.ts for all shards.

Option A is cleaner because it works with all existing shard configs.

## Diagnosis Determination

Root cause definitively identified: The e2e-shards job never starts a web server, and the Playwright configs used by individual shards don't have webServer configuration. The tests try to connect to localhost:3001 but nothing is listening.

This is a workflow configuration bug. The fix is to add a server startup step to the e2e-shards job.

## Additional Context

- The Setup Test Server job now passes after the #1565 fix for PAYLOAD_SECRET
- This exposed the underlying webServer issue that was previously masked by the build failure
- Each shard runs on a separate runner (RunsOn), so each needs its own server instance
- The `PLAYWRIGHT_WEB_COMMAND` env var appears to be a remnant from an older design that was never fully implemented

---
*Generated by Claude Debug Assistant*
*Tools Used: gh api, gh run view, Read, Grep, Glob*
