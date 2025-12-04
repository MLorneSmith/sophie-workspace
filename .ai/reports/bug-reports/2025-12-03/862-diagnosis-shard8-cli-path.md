# Bug Diagnosis: E2E Shard 8 Seeding Tests Fail Due to Incorrect CLI Path Resolution

**ID**: ISSUE-862
**Created**: 2025-12-03T14:45:00Z
**Reporter**: user/system
**Severity**: high
**Status**: new
**Type**: bug

## Summary

E2E test shard 8 (Payload CMS Extended) experiences 26 test failures due to incorrect path resolution in the seeding tests. The `CLI_PATH` constant uses a relative path (`apps/payload/src/seed/seed-engine/index.ts`) that fails to resolve correctly when Playwright runs from the `apps/e2e` directory, resulting in the module not being found at `apps/e2e/apps/payload/...` instead of the correct `$PROJECT_ROOT/apps/payload/...`.

## Environment

- **Application Version**: 20ce4beb8 (dev branch)
- **Environment**: development
- **Node Version**: v22.16.0
- **Playwright Version**: 1.57.0
- **Payload Version**: 3.65.0
- **Test Shard**: 8 (Payload CMS Extended)

## Reproduction Steps

1. Run `/test 8` or `pnpm --filter web-e2e test:shard8`
2. Observe tests in `seeding.spec.ts` and `seeding-performance.spec.ts` fail
3. Error message shows: `Cannot find module '/home/msmith/projects/2025slideheroes/apps/e2e/apps/payload/src/seed/seed-engine/index.ts'`

## Expected Behavior

All seeding tests should execute successfully by finding the seed engine CLI at the correct path: `/home/msmith/projects/2025slideheroes/apps/payload/src/seed/seed-engine/index.ts`

## Actual Behavior

Tests fail with `ERR_MODULE_NOT_FOUND` because the relative path `apps/payload/src/seed/seed-engine/index.ts` is resolved from `apps/e2e/` (Playwright's working directory) instead of the project root.

## Diagnostic Data

### Console Output
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/home/msmith/projects/2025slideheroes/apps/e2e/apps/payload/src/seed/seed-engine/index.ts' imported from /home/msmith/projects/2025slideheroes/apps/e2e/
    at finalizeResolution (node:internal/modules/esm/resolve:275:11)
    at moduleResolve (node:internal/modules/esm/resolve:860:10)
    at defaultResolve (node:internal/modules/esm/resolve:984:11)
```

### Test Results Summary
| Test File | Total | Passed | Failed | Skipped |
|-----------|-------|--------|--------|---------|
| payload-auth.spec.ts | 9 | 8 | 0 | 1 |
| payload-collections.spec.ts | 22 | 21 | 0 | 1 |
| payload-database.spec.ts | 12 | 12 | 0 | 0 |
| seeding.spec.ts | 12 | 0 | 1 | 11 |
| seeding-performance.spec.ts | 14 | 0 | 14 | 0 |

**Total Shard 8 Failures**: 15 failures + 11 skipped = 26 tests affected

### Additional Warning
```
[supabase-config-loader] Failed to fetch config: spawnSync /bin/sh ENOENT. Using fallback values.
```
This warning appears during global setup but doesn't cause test failures.

## Error Stack Traces
```
Error: Seed command failed:
Command: pnpm tsx apps/payload/src/seed/seed-engine/index.ts seed --dry-run
Stdout:
Stderr:
node:internal/modules/run_main:123
    triggerUncaughtException(
    ^
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/home/msmith/projects/2025slideheroes/apps/e2e/apps/payload/src/seed/seed-engine/index.ts' imported from /home/msmith/projects/2025slideheroes/apps/e2e/

    at /home/msmith/projects/2025slideheroes/apps/e2e/tests/payload/seeding.spec.ts:51:10
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/payload/seeding.spec.ts:26` - CLI_PATH constant
  - `apps/e2e/tests/payload/seeding-performance.spec.ts` - Uses same pattern
- **Recent Changes**:
  - `ffae3fe0c` - "chore(payload): finalize seeding feature with tracking docs and test data"
  - `98bc00331` - "fix(e2e): resolve 166 test failures with three root cause fixes"
- **Suspected Functions**:
  - `execAsync()` calls using `CLI_PATH` with `cwd: process.cwd()`

## Related Issues & Context

### Direct Predecessors
- None found - this appears to be a new issue

### Same Component
- Issue #143: Payload CMS e2e tests (related infrastructure)

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `CLI_PATH` constant in `seeding.spec.ts:26` uses a relative path that incorrectly resolves when executed from the `apps/e2e` directory.

**Detailed Explanation**:
The test files define:
```typescript
const CLI_PATH = "apps/payload/src/seed/seed-engine/index.ts";
```

And execute commands with:
```typescript
await execAsync(`${CLI_EXECUTOR} ${CLI_PATH} seed --dry-run`, {
  cwd: process.cwd(),  // This is apps/e2e when Playwright runs
  env: { ...process.env, NODE_ENV: "test" },
});
```

When Playwright runs tests from `apps/e2e/`, `process.cwd()` returns `/home/msmith/projects/2025slideheroes/apps/e2e`, causing the relative path to resolve to:
- **Actual**: `apps/e2e/apps/payload/src/seed/seed-engine/index.ts`
- **Expected**: `$PROJECT_ROOT/apps/payload/src/seed/seed-engine/index.ts`

**Supporting Evidence**:
- Stack trace shows: `Cannot find module '/home/msmith/projects/2025slideheroes/apps/e2e/apps/payload/...'`
- Code reference: `apps/e2e/tests/payload/seeding.spec.ts:26` - `const CLI_PATH = "apps/payload/src/seed/seed-engine/index.ts"`
- Same issue affects both `seeding.spec.ts` and `seeding-performance.spec.ts`

### How This Causes the Observed Behavior

1. Playwright starts in `apps/e2e` directory
2. Test calls `execAsync()` with relative CLI_PATH
3. Node resolves path from `process.cwd()` (apps/e2e)
4. Path becomes `apps/e2e/apps/payload/...` which doesn't exist
5. Node throws `ERR_MODULE_NOT_FOUND`
6. Test fails, causing dependent tests to be skipped

### Confidence Level

**Confidence**: High

**Reasoning**:
- Error message explicitly shows the incorrect path being used
- Manually running tests confirms path resolution is the issue
- Other payload tests (auth, collections, database) that don't use CLI commands pass successfully
- The fix is deterministic and testable

## Fix Approach (High-Level)

Change `CLI_PATH` to use an absolute path resolved from the project root:

```typescript
import { resolve } from "node:path";

// Get project root (two levels up from apps/e2e)
const PROJECT_ROOT = resolve(__dirname, "../../../../");
const CLI_PATH = resolve(PROJECT_ROOT, "apps/payload/src/seed/seed-engine/index.ts");
```

Or use `process.cwd()` with parent directory navigation:
```typescript
const CLI_PATH = resolve(process.cwd(), "../../apps/payload/src/seed/seed-engine/index.ts");
```

Alternative: Change the `cwd` option in `execAsync()` to explicitly use project root.

## Diagnosis Determination

The root cause has been conclusively identified: relative path resolution in seeding E2E tests fails because Playwright executes from `apps/e2e/` directory, not the project root. The fix requires updating the path constants in both `seeding.spec.ts` and `seeding-performance.spec.ts` to use absolute paths.

## Additional Context

### Why Test Ran Long
The test infrastructure script showed "running for 720s" because:
1. The first seeding test fails immediately
2. Remaining 11 seeding tests are skipped (due to `mode: "serial"`)
3. All 14 seeding-performance tests run and fail individually
4. Each failure includes waiting for timeouts and retries

### Other Tests Pass
The other three test files in shard 8 pass because they don't use CLI commands:
- `payload-auth.spec.ts` - Uses Playwright browser automation
- `payload-collections.spec.ts` - Uses Playwright browser automation
- `payload-database.spec.ts` - Uses API health checks and database queries

---
*Generated by Claude Debug Assistant*
*Tools Used: BashOutput, Bash, Read, Grep*
