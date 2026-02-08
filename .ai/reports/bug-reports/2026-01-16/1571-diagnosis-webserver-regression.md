# Bug Diagnosis: dev-integration-tests workflow fails with webServer exit error

**ID**: ISSUE-pending
**Created**: 2026-01-16T23:15:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The dev-integration-tests GitHub Actions workflow started failing after commit `3f9292a8d` which unconditionally added `webServer` configuration to `playwright.config.ts`. This workflow tests against deployed Vercel environments and does not need local servers, but Playwright now tries to start them anyway and fails.

## Environment

- **Application Version**: dev branch at commit 3f9292a8d
- **Environment**: CI (GitHub Actions)
- **Node Version**: 22.x (from .nvmrc)
- **Last Working**: Commit prior to 3f9292a8d (around 2026-01-16T21:34:05Z)

## Reproduction Steps

1. Push any change to the `dev` branch to trigger the Deploy to Dev workflow
2. Wait for deployment to complete and dev-integration-tests workflow to start
3. Observe the Integration Tests job fails with "Process from config.webServer exited early"

## Expected Behavior

The dev-integration-tests workflow should run Playwright tests against the deployed Vercel environment at `https://dev.slideheroes.com` (or dynamic preview URL) without attempting to start local servers.

## Actual Behavior

Playwright attempts to start local development servers (`pnpm --filter web dev:test` and `pnpm --filter payload dev:test`) which immediately exit because the CI environment doesn't have the full build context, causing the error:

```
Error: Process from config.webServer exited early.
```

## Diagnostic Data

### Console Output
```
Integration Tests	Run integration test suite	2026-01-16T22:52:26.7685411Z
Integration Tests	Run integration test suite	2026-01-16T22:52:26.7686297Z Error: Process from config.webServer exited early.
Integration Tests	Run integration test suite	2026-01-16T22:52:26.7694008Z
Integration Tests	Run integration test suite	2026-01-16T22:52:26.8027171Z /home/runner/_work/2025slideheroes/2025slideheroes/apps/e2e:
Integration Tests	Run integration test suite	2026-01-16T22:52:26.8028632Z  ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  web-e2e@1.0.0 test:integration: `playwright test --grep @integration --project=chromium --retries=1 --max-failures=0`
```

### Workflow Run Details
- **Failing Run**: 21083272706 (2026-01-16T22:49:03Z)
- **Last Successful Run**: 21081546918 (2026-01-16T21:34:05Z)
- **Regression Commit**: 3f9292a8d (2026-01-16T17:42:12-0500)

### Git Diff (Root Cause)
```diff
-	webServer: process.env.PLAYWRIGHT_SERVER_COMMAND
-		? {
-				cwd: "../../",
-				command: process.env.PLAYWRIGHT_SERVER_COMMAND,
-				url: "http://localhost:3001",
-				reuseExistingServer: !process.env.CI,
-				stdout: "pipe",
-				stderr: "pipe",
-			}
-		: undefined,
+	webServer: [
+		{
+			cwd: "../../",
+			command: "pnpm --filter web dev:test",
+			url: "http://localhost:3001",
+			reuseExistingServer: !process.env.CI,
+			timeout: 120 * 1000,
+			stdout: "ignore",
+			stderr: "pipe",
+		},
+		{
+			cwd: "../../",
+			command: "pnpm --filter payload dev:test",
+			url: "http://localhost:3021",
+			reuseExistingServer: !process.env.CI,
+			timeout: 120 * 1000,
+			stdout: "ignore",
+			stderr: "pipe",
+		},
+	],
```

## Related Code
- **Affected Files**:
  - `apps/e2e/playwright.config.ts` (line 194-213)
- **Recent Changes**: Commit 3f9292a8d "fix(e2e): add webServer config to all Playwright configs"
- **Suspected Functions**: `webServer` configuration in `defineConfig()`

## Related Issues & Context

### Direct Predecessors
- #1570 (CLOSED): "E2E sharded tests fail with ERR_CONNECTION_REFUSED" - The fix for this issue introduced the regression

### Historical Context
The commit 3f9292a8d was intended to fix the e2e-sharded workflow (which runs tests locally and needs servers started), but inadvertently broke the dev-integration-tests workflow (which tests against deployed environments and should NOT start local servers).

## Root Cause Analysis

### Identified Root Cause

**Summary**: Commit 3f9292a8d removed the conditional `webServer` configuration, making it unconditional. This breaks workflows that test against deployed environments.

**Detailed Explanation**:
The old configuration used `process.env.PLAYWRIGHT_SERVER_COMMAND` as a feature flag:
- When set: Start a local server with the specified command
- When not set: `webServer: undefined` (no server startup)

The new configuration unconditionally defines `webServer` with hardcoded commands:
- Always tries to start `pnpm --filter web dev:test` and `pnpm --filter payload dev:test`
- In CI (`process.env.CI`), `reuseExistingServer: false` means Playwright will NOT reuse existing servers
- Since dev-integration-tests doesn't build locally, the server commands fail immediately
- Playwright reports "Process from config.webServer exited early"

**Supporting Evidence**:
- Stack trace: `Error: Process from config.webServer exited early`
- Code reference: `apps/e2e/playwright.config.ts:194-213` showing unconditional webServer config
- Git diff showing removal of conditional `process.env.PLAYWRIGHT_SERVER_COMMAND ? {...} : undefined`
- Successful runs before commit vs failures after commit

### How This Causes the Observed Behavior

1. dev-integration-tests workflow starts
2. Workflow sets `PLAYWRIGHT_BASE_URL` to deployed Vercel URL
3. Playwright loads `playwright.config.ts`
4. New unconditional `webServer` config triggers server startup
5. `pnpm --filter web dev:test` fails because CI doesn't have sparse checkout of all files needed for build
6. Playwright errors with "Process from config.webServer exited early"
7. Workflow job fails

### Confidence Level

**Confidence**: High

**Reasoning**:
- Clear correlation between commit timestamp and first failure
- Git diff shows exact code change that introduced the issue
- Error message directly matches the symptom (webServer exit)
- Previous configuration pattern was explicitly conditional

## Fix Approach (High-Level)

The fix should restore conditional webServer behavior while preserving the fix for e2e-sharded tests:

**Option A** (Recommended): Detect deployed URL and skip webServer
```typescript
const isDeployedEnv = process.env.PLAYWRIGHT_BASE_URL?.startsWith('https://');
webServer: isDeployedEnv ? undefined : [/* server config */]
```

**Option B**: Restore PLAYWRIGHT_SERVER_COMMAND pattern
- Keep the old conditional pattern
- Update e2e-sharded workflow to set `PLAYWRIGHT_SERVER_COMMAND`

**Option C**: Use separate config files
- `playwright.config.ts` for deployed environment tests (no webServer)
- `playwright.local.config.ts` for local/sharded tests (with webServer)

Option A is recommended as it's automatic and requires no workflow changes.

## Diagnosis Determination

Root cause has been definitively identified: Commit 3f9292a8d unconditionally defines `webServer` configuration, which fails in CI workflows testing deployed environments because those environments don't support running local development servers.

## Additional Context

The fix for #1570 (e2e-sharded ERR_CONNECTION_REFUSED) was well-intentioned but didn't account for the dev-integration-tests workflow's different execution model. The e2e-sharded workflow builds locally and needs servers started, while dev-integration-tests tests against already-deployed Vercel URLs.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run list, gh run view, git log, git show, Read tool*
