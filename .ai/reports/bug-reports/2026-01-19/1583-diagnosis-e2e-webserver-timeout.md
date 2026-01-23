# Bug Diagnosis: E2E Sharded Tests WebServer Timeout - Dev Server Stuck at Starting

**ID**: ISSUE-pending
**Created**: 2026-01-19T14:55:00Z
**Reporter**: CI/CD Monitoring
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The E2E Tests (Sharded) workflow is failing on all shards because the Playwright webServer times out after 120 seconds. The Next.js dev server starts but gets stuck at "Starting..." and never becomes ready to accept connections on port 3001. This is different from the previously fixed issue #1570 (no webServer config).

## Environment

- **Application Version**: Current dev branch (commit 54e41fb73)
- **Environment**: CI (GitHub Actions / RunsOn)
- **Node Version**: 20
- **Database**: Supabase local (ports 54521/54522)
- **Last Working**: Unknown - may have never fully worked after #1570 fix

## Reproduction Steps

1. Push to dev branch to trigger E2E Tests (Sharded) workflow
2. Wait for Setup Test Server job to complete
3. Observe E2E Shard jobs (1, 2, 3...) fail
4. Check logs for "Timed out waiting 120000ms from config.webServer"

## Expected Behavior

The Playwright webServer should:
1. Start `pnpm --filter web dev:test` command
2. Wait for Next.js dev server to become ready on port 3001
3. Proceed with running E2E tests once server is ready

## Actual Behavior

The webServer:
1. Starts `pnpm --filter web dev:test` command ✓
2. Shows "✓ Starting..." message
3. **Gets stuck and never becomes ready**
4. Times out after 120 seconds
5. All E2E tests fail without running

## Diagnostic Data

### Console Output
```
2026-01-19T14:50:36.2035848Z [WebServer] > web@0.1.0 dev:test /home/runner/_work/2025slideheroes/2025slideheroes/apps/web
2026-01-19T14:50:37.0371538Z [WebServer]  ✓ Starting...
2026-01-19T14:52:35.8867037Z Error: Timed out waiting 120000ms from config.webServer.
2026-01-19T14:52:35.9280206Z  ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  web-e2e@1.0.0 test:shard1: `playwright test tests/smoke/smoke.spec.ts --config=playwright.smoke.config.ts`
```

### Network Analysis
- Port 3001 never becomes available
- Server startup initiated but incomplete
- No connection errors - just timeout waiting for readiness

### Workflow Timeline
- 14:37:17Z - Workflow started
- 14:46:10Z - Shard 1 started (after stagger delay)
- 14:49:15Z - Supabase database started
- 14:50:33Z - Test command started
- 14:50:36Z - WebServer initiated
- 14:50:37Z - "✓ Starting..." shown
- 14:52:35Z - Timeout after 120 seconds (~2 minutes)

## Error Stack Traces
```
Error: Timed out waiting 120000ms from config.webServer.
```

## Related Code

- **Affected Files**:
  - `apps/e2e/playwright.smoke.config.ts:51-59` - webServer configuration
  - `apps/e2e/playwright.config.ts:198-222` - main webServer configuration
  - `apps/web/package.json` - dev:test script definition
  - `.github/workflows/e2e-sharded.yml` - workflow configuration

- **Recent Changes**:
  - Commit 3f9292a8d (2026-01-16): "fix(e2e): add webServer config to all Playwright configs" - added webServer config
  - Commit 54e41fb73 (2026-01-19): "fix(e2e): restore conditional webServer for deployed environment tests" - conditional logic for deployed environments

- **Suspected Functions**:
  - Next.js dev server startup in CI environment
  - Turbopack compilation in CI
  - Interaction between cached production build and dev mode

## Related Issues & Context

### Direct Predecessors
- #1570 (CLOSED): "Bug Fix: E2E Sharded Tests Fail - No Web Server Running" - Added webServer config
- #1569 (CLOSED): "Bug Diagnosis: E2E Sharded Tests Fail - No Web Server Running" - Original diagnosis

### Related Infrastructure Issues
- #262 (CLOSED): "Critical: WebServer startup timeouts causing E2E test failures in sharded execution"
- #269 (CLOSED): "Critical: E2E Test Suite Failures - 74% failure rate"

### Historical Context
Issue #1570 was fixed 3 days ago by adding webServer configuration to all Playwright configs. The fix enabled webServer to start, but now we're seeing the server start but never become ready. This could indicate:
1. The fix is incomplete (server starts but something else is blocking)
2. A new issue introduced after the fix
3. A latent issue that was masked by the original problem

## Root Cause Analysis

### Identified Root Cause

**Summary**: The Next.js dev server (with Turbopack) starts but fails to complete initialization in CI, likely due to interaction between cached production build artifacts and dev mode startup.

**Detailed Explanation**:
The E2E sharded workflow:
1. **Setup Test Server job**: Runs `pnpm build` which creates production artifacts in `apps/web/.next/`
2. **Caches**: `apps/web/.next`, `apps/payload/dist`, `packages/*/dist`, `.turbo`
3. **E2E Shard jobs**: Restore cache, then start dev server via webServer config

When `pnpm --filter web dev:test` (which runs `NODE_ENV=test next dev --turbo`) starts:
- It finds existing `.next` directory from production build
- Turbopack may try to reconcile production build artifacts with dev mode requirements
- This reconciliation may hang or take longer than expected
- The dev server shows "Starting..." but never completes initialization

**Supporting Evidence**:
- Server shows "✓ Starting..." but no subsequent output
- Timeout occurs after exactly 120 seconds (the configured timeout)
- No errors logged - just silent hang
- Workflow comment in line 132-134 mentions "Server startup is now handled by Playwright's webServer config" but doesn't account for cached build interaction

### How This Causes the Observed Behavior

1. Setup job runs `pnpm build` (production build)
2. Production `.next` artifacts are cached
3. Shard jobs restore cache with production `.next`
4. Playwright starts `next dev --turbo`
5. Turbopack encounters production artifacts
6. Dev server hangs trying to initialize with incompatible cached state
7. Server never reaches "ready" state on port 3001
8. Playwright times out after 120 seconds

### Confidence Level

**Confidence**: Medium

**Reasoning**: The timing (server starts, shows "Starting...", then hangs) strongly suggests initialization issues rather than configuration problems. The caching of production build artifacts followed by dev mode startup is a known pattern that can cause issues. However, without more detailed Next.js/Turbopack debug logs, we can't be 100% certain this is the exact mechanism.

## Fix Approach (High-Level)

Several potential fixes:
1. **Clear `.next` directory before dev server startup** - Add step in shard jobs to remove cached `.next` before running tests
2. **Use `next start` instead of `next dev`** - Run production server from cached build instead of dev server
3. **Don't cache `.next` directory** - Remove from cache path, let each shard build fresh
4. **Increase timeout and add logging** - Get more diagnostic info about what's blocking

Recommended: Option 2 (use `next start`) is most efficient - the build is already done, no need for dev server.

## Diagnosis Determination

The E2E sharded workflow fails because the Playwright webServer configuration attempts to start a Next.js dev server (`next dev --turbo`) in an environment where production build artifacts (`.next/`) are cached. The dev server cannot properly initialize with the incompatible cached state, causing it to hang indefinitely until Playwright's 120-second timeout.

This is a workflow architecture issue where the build strategy (production build + cache) doesn't match the test execution strategy (dev server startup).

## Additional Context

The dev:test script in `apps/web/package.json`:
```json
"dev:test": "NODE_ENV=test next dev --turbo"
```

The webServer config in `playwright.smoke.config.ts`:
```typescript
webServer: {
  cwd: "../../",
  command: "pnpm --filter web dev:test",
  url: "http://localhost:3001",
  reuseExistingServer: !process.env.CI,  // false in CI - starts fresh
  timeout: 120 * 1000,
  stdout: "pipe",
  stderr: "pipe",
}
```

Current workflow run: https://github.com/MLorneSmith/2025slideheroes/actions/runs/21141407892

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, grep, bash*
