# Bug Diagnosis: Staging E2E Tests Fail - Port 3001 Already in Use

**ID**: ISSUE-1830
**Created**: 2026-01-26T19:55:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The staging deploy workflow E2E tests fail with "Error: http://localhost:3001 is already used" because the workflow explicitly starts the web server in the "Start Stripe CLI and application" step, and then Playwright's webServer config tries to start it again with `reuseExistingServer: false` (the default in GitHub Actions environments).

## Environment

- **Application Version**: dev branch (commit 70a6c5bfd)
- **Environment**: CI/GitHub Actions (staging deploy workflow)
- **Node Version**: Latest (from RunsOn runners)
- **Database**: PostgreSQL (local Supabase)
- **Last Working**: Before commit aba5c9b4b (which added explicit server startup)

## Reproduction Steps

1. Push to staging branch (or merge dev into staging)
2. Staging Deploy workflow triggers
3. Test-shards matrix jobs start
4. In each shard job, the "Start Stripe CLI and application" step starts the web server on port 3001
5. The "Run E2E tests for shard X" step invokes Playwright
6. Playwright's webServer config attempts to start the server AGAIN
7. Port 3001 is already in use, causing the error

## Expected Behavior

E2E tests should run successfully against the web application.

## Actual Behavior

All E2E shard jobs fail with:
```
Error: http://localhost:3001 is already used, make sure that nothing is running on the port/url or set reuseExistingServer:true in config.webServer.
```

## Diagnostic Data

### Console Output
```
2026-01-26T19:54:03.5660903Z    ▲ Next.js 16.0.10
2026-01-26T19:54:03.5662172Z    - Local:         http://localhost:3001
2026-01-26T19:54:03.5662671Z    - Network:       http://10.1.44.235:3001
2026-01-26T19:54:03.5664764Z
2026-01-26T19:54:03.5666479Z  ✓ Starting...
...
2026-01-26T19:54:15.2964959Z
2026-01-26T19:54:15.2966078Z Error: http://localhost:3001 is already used, make sure that nothing is running on the port/url or set reuseExistingServer:true in config.webServer.
2026-01-26T19:54:15.2970013Z
2026-01-26T19:54:15.3396772Z /home/runner/_work/2025slideheroes/2025slideheroes/apps/e2e:
2026-01-26T19:54:15.3398600Z  ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  web-e2e@1.0.0 test:shard1: `playwright test tests/smoke/smoke.spec.ts --config=playwright.smoke.config.ts`
2026-01-26T19:54:15.3399181Z Exit status 1
```

### Network Analysis
Not applicable - this is a local port conflict issue.

### Database Analysis
Not applicable - Supabase starts successfully before the error occurs.

### Performance Metrics
Not applicable.

### Screenshots
N/A

## Error Stack Traces
```
Error: http://localhost:3001 is already used, make sure that nothing is running on the port/url or set reuseExistingServer:true in config.webServer.
```

## Related Code

- **Affected Files**:
  - `.github/workflows/staging-deploy.yml` (lines 333-345 - "Start Stripe CLI and application" step)
  - `apps/e2e/playwright.smoke.config.ts` (lines 54-64 - webServer configuration)
  - Other `apps/e2e/playwright.*.config.ts` files with similar webServer configs

- **Recent Changes**:
  - Commit aba5c9b4b "fix(ci): synchronize staging-deploy E2E test configuration with e2e-sharded" - This fix added environment variables but retained the explicit server startup step

- **Suspected Functions**:
  - `staging-deploy.yml` "Start Stripe CLI and application" step
  - Playwright webServer config with `reuseExistingServer: !process.env.GITHUB_ACTIONS`

## Related Issues & Context

### Direct Predecessors
- #1826 (CLOSED): "Bug Fix: Staging Deploy E2E Tests Failing Due to Missing Environment Variables" - Fixed env vars but missed the port conflict issue
- #1825 (CLOSED): "Bug Diagnosis: Staging Deploy E2E Tests Failing Due to Missing Environment Variables" - Related diagnosis

### Similar Symptoms
- #1779 (CLOSED): "Bug Diagnosis: Staging E2E Tests Fail Due to Port Mismatch (3001 vs 3000)" - Different port issue (mismatch vs conflict)
- #1781 (CLOSED): "Bug Fix: Staging E2E Tests Port Mismatch (3001 vs 3000)" - Fix for port mismatch

### Same Component
- #1583, #1584 (CLOSED): Server startup configuration issues - These issues introduced the webServer config pattern

### Historical Context
The staging-deploy workflow diverged from the e2e-sharded workflow. The e2e-sharded workflow does NOT have a "Start Stripe CLI and application" step - it relies entirely on Playwright's webServer config to start the server. The staging-deploy workflow has BOTH an explicit server startup AND Playwright's webServer config, causing a conflict.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The staging-deploy workflow double-starts the web server - once explicitly in the "Start Stripe CLI and application" step (lines 333-345) and again through Playwright's webServer config. In GitHub Actions, `reuseExistingServer` is `false` so Playwright refuses to use the already-running server.

**Detailed Explanation**:

1. **staging-deploy.yml lines 333-345** explicitly starts the server:
   ```yaml
   - name: Start Stripe CLI and application
     run: |
       # Start Stripe CLI in background
       docker run ... stripe/stripe-cli:latest listen ...

       # Start application
       pnpm --filter web start:test &

       # Wait for application to be ready
       npx wait-on http://localhost:3001 -t 60000
   ```

2. **playwright.smoke.config.ts lines 54-64** has a webServer config:
   ```typescript
   webServer: {
     cwd: "../../",
     command: "pnpm --filter web start:test",
     url: "http://localhost:3001",
     reuseExistingServer: !process.env.GITHUB_ACTIONS,  // false in CI
     timeout: 120 * 1000,
   },
   ```

3. When Playwright runs, `GITHUB_ACTIONS=true` so `reuseExistingServer` evaluates to `false`
4. Playwright attempts to start the server but port 3001 is already in use
5. Playwright fails with "port already used" error

**Supporting Evidence**:
- Stack trace: "Error: http://localhost:3001 is already used"
- Code reference: `.github/workflows/staging-deploy.yml:342` starting `pnpm --filter web start:test &`
- Code reference: `apps/e2e/playwright.smoke.config.ts:60` setting `reuseExistingServer: !process.env.GITHUB_ACTIONS`
- Working e2e-sharded.yml does NOT have explicit server startup step (relies on Playwright webServer)

### How This Causes the Observed Behavior

1. GitHub Actions workflow step "Start Stripe CLI and application" runs
2. Server starts on port 3001 and waits for it to be ready (wait-on succeeds)
3. Next step "Run E2E tests for shard X" invokes Playwright
4. Playwright checks if server is running at http://localhost:3001 (it is)
5. Because `reuseExistingServer: false`, Playwright tries to start another server
6. Port 3001 is already bound, causing "port already used" error
7. Playwright exits with failure
8. All 12 shard jobs fail with the same error

### Confidence Level

**Confidence**: High

**Reasoning**:
- The error message is unambiguous: "http://localhost:3001 is already used"
- The workflow explicitly starts the server before Playwright runs
- The Playwright config explicitly sets `reuseExistingServer: false` in CI
- The working e2e-sharded workflow does NOT have explicit server startup
- This is a classic double-initialization pattern bug

## Fix Approach (High-Level)

Two possible fixes:

**Option A (Recommended)**: Remove the explicit server startup from staging-deploy.yml and let Playwright handle it (matching e2e-sharded.yml pattern)
- Remove lines 333-345 ("Start Stripe CLI and application" step)
- The Stripe CLI portion needs to be handled separately if needed, or removed if not used

**Option B**: Keep explicit server startup but set `reuseExistingServer: true` in Playwright configs when server is pre-started
- Requires environment variable to signal "server already running"
- More complex, less aligned with e2e-sharded pattern

Option A is recommended because it aligns staging-deploy with the proven working e2e-sharded workflow.

## Diagnosis Determination

The root cause is confirmed: The staging-deploy workflow has diverged from the working e2e-sharded workflow by including an explicit "Start Stripe CLI and application" step that conflicts with Playwright's webServer configuration. This is a regression introduced when trying to fix other issues (#1826).

## Additional Context

The e2e-sharded workflow does not use Stripe CLI at all for its tests. The staging-deploy workflow added this step, but it's unclear if the Stripe CLI is actually needed. The tests may work fine without it if billing tests are skipped or use mock data.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, Read, Grep, Bash*
