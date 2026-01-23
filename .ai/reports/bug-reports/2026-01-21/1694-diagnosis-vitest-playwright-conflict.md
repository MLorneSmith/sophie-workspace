# Bug Diagnosis: Vitest Test File Being Loaded by Playwright Causes CI Failure

**ID**: ISSUE-pending
**Created**: 2026-01-21T15:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The dev-integration-tests.yml workflow fails because a Vitest unit test file (`supabase-health.spec.ts`) is placed in the Playwright test directory and gets picked up by Playwright's test runner. Playwright tries to load the file, but Vitest's ESM-only `import { describe, expect, it, vi } from "vitest"` cannot be imported using CommonJS `require()`, causing the test run to crash.

## Environment

- **Application Version**: dev branch (commit bb8af7328)
- **Environment**: CI (GitHub Actions)
- **Node Version**: v20.10.0
- **Last Working**: Before commit 426546f43 (Jan 20, 2026)

## Reproduction Steps

1. Push to dev branch
2. dev-integration-tests.yml workflow triggers
3. Playwright test runner starts and scans `apps/e2e/tests/` directory
4. Playwright finds `apps/e2e/tests/setup/supabase-health.spec.ts`
5. Playwright tries to load the file, but it imports from `vitest`
6. Vitest's `index.cjs` throws error about CommonJS require not supported
7. Entire test run fails

## Expected Behavior

Playwright should only run Playwright test files, not Vitest unit tests. Vitest tests should either:
1. Be in a separate directory outside Playwright's testDir
2. Be excluded via testIgnore patterns
3. Use a different file extension

## Actual Behavior

```
Error: Vitest cannot be imported in a CommonJS module using require(). Please use "import" instead.

at setup/supabase-health.spec.ts:10

> 10 | import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
     | ^
```

The workflow exits with code 1.

## Diagnostic Data

### Console Output
```
✅ Global Setup Complete: All auth states created via API

Error: Vitest cannot be imported in a CommonJS module using require(). Please use "import" instead.

If you are using "import" in your source code, then it's possible it was bundled into require() automatically by your bundler. In that case, do not bundle CommonJS output since it will never work with Vitest, or use dynamic import() which is available in all CommonJS modules.

   at setup/supabase-health.spec.ts:10

   8 |  */
   9 |
> 10 | import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
     | ^
  11 |
  12 | // Mock pg Client
  13 | vi.mock("pg", () => ({

    at Object.<anonymous> (node_modules/.pnpm/vitest@4.0.15/node_modules/vitest/index.cjs:1:7)
    at Object.<anonymous> (apps/e2e/tests/setup/supabase-health.spec.ts:10:1)
```

### Network Analysis
N/A - Issue occurs before any network requests

### Database Analysis
N/A - Issue occurs before database checks

### Performance Metrics
N/A - Issue occurs at test discovery phase

## Error Stack Traces
```
Error: Vitest cannot be imported in a CommonJS module using require()
    at Object.<anonymous> (/home/runner/_work/2025slideheroes/2025slideheroes/node_modules/.pnpm/vitest@4.0.15_@opentelemetry+api@1.9.0_@types+node@24.10.3_jiti@2.6.1_jsdom@27.3.0_post_5d55435c58c011744bea2b0cf840e265/node_modules/vitest/index.cjs:1:7)
    at Object.<anonymous> (/home/runner/_work/2025slideheroes/2025slideheroes/apps/e2e/tests/setup/supabase-health.spec.ts:10:1)
```

## Related Code

- **Affected Files**:
  - `apps/e2e/tests/setup/supabase-health.spec.ts` - The problematic Vitest test file
  - `apps/e2e/playwright.config.ts` - Missing testIgnore pattern for Vitest files
- **Recent Changes**:
  - Commit `426546f43` added `supabase-health.spec.ts` as a Vitest test for the health check utility
  - The file was placed in `apps/e2e/tests/setup/` which is inside Playwright's `testDir: "./tests"`
- **Suspected Functions**:
  - Playwright's test discovery in `playwright.config.ts` line 68: `testDir: "./tests"`
  - The testIgnore patterns at line 153 only exclude `*.setup.ts` files, not Vitest tests

## Related Issues & Context

### Direct Predecessors
- #1684 (CLOSED): "Bug Fix: Dev Integration Tests Health Check Scope - Complete Fix" - Fixed health check logic
- #1691 (CLOSED): "Bug Fix: Dev Integration Tests - Skip Test User Setup for CI with Remote Supabase" - Fixed test user setup

### Related Infrastructure Issues
- #1641, #1642: "E2E Sharded Workflow Dual Failure Modes" - Original issue that prompted the health check refactoring

### Same Component
- Commit 426546f43 introduced the problematic file while fixing E2E sharded workflow issues

### Historical Context
This is NOT a regression of a previously fixed issue. It's a new bug introduced in commit 426546f43 when a Vitest test file was accidentally placed in the Playwright test directory.

## Root Cause Analysis

### Identified Root Cause

**Summary**: A Vitest unit test file (`supabase-health.spec.ts`) was placed in the Playwright test directory (`apps/e2e/tests/setup/`) and is being loaded by Playwright, which cannot handle Vitest's ESM-only imports.

**Detailed Explanation**:

1. In commit `426546f43`, two files were added to `apps/e2e/tests/setup/`:
   - `supabase-health.ts` - The health check utility (non-test file)
   - `supabase-health.spec.ts` - A Vitest unit test for the utility

2. The Playwright config (`playwright.config.ts`) specifies `testDir: "./tests"` (line 68), which means ALL `.spec.ts` files under `apps/e2e/tests/` are treated as Playwright tests.

3. The `testIgnore` patterns in the config (line 153) only exclude:
   - `*.setup.ts` files
   - `*payload*` files (for the chromium project)

4. There is NO exclusion for Vitest test files. When Playwright discovers `supabase-health.spec.ts`, it tries to load it using CommonJS require().

5. Vitest 4.x is ESM-only and its `index.cjs` explicitly throws an error when loaded via require():
   ```javascript
   // vitest/index.cjs
   throw new Error('Vitest cannot be imported in a CommonJS module using require()...')
   ```

**Supporting Evidence**:
- Error message points directly to line 10 of `supabase-health.spec.ts`: `import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"`
- The file uses Vitest-specific features: `vi.mock()`, `vi.fn()`, `beforeEach`, `afterEach` from vitest
- All other `.spec.ts` files in the Playwright test directory use `@playwright/test` imports

### How This Causes the Observed Behavior

1. Workflow triggers → Playwright runs `pnpm --filter web-e2e test:integration`
2. Playwright scans `testDir: "./tests"` for test files
3. Playwright finds `tests/setup/supabase-health.spec.ts` (matches `*.spec.ts` pattern)
4. Playwright loads the file via CommonJS require()
5. The file has `import { ... } from "vitest"` at line 10
6. Node.js resolves to `vitest/index.cjs` which throws the ESM error
7. Playwright crashes with exit code 1

### Confidence Level

**Confidence**: High

**Reasoning**:
- The error message explicitly identifies the file and line causing the issue
- The root cause is simple: wrong test framework imports in a file located in Playwright's test directory
- The fix is straightforward: either move the file or exclude it from Playwright

## Fix Approach (High-Level)

**Option A (Recommended)**: Add a testIgnore pattern for Vitest tests in playwright.config.ts:
```typescript
testIgnore: [/.*\.setup\.ts/, /.*\.vitest\.spec\.ts/, /tests\/setup\/.*\.spec\.ts/]
```

**Option B**: Move `supabase-health.spec.ts` to a different location outside Playwright's testDir (e.g., `apps/e2e/unit-tests/` or rename to `supabase-health.vitest.ts`)

**Option C**: Rename the file to use a different extension that Playwright doesn't pick up (e.g., `supabase-health.test.ts` if Playwright is configured to only match `.spec.ts`)

Option A is recommended because:
1. Minimal changes (just config update)
2. Keeps related files together (health check utility and its tests)
3. Establishes a clear pattern for future Vitest tests in the E2E package

## Diagnosis Determination

The root cause is definitively identified: A Vitest test file was placed in Playwright's test directory without proper exclusion patterns. The fix is straightforward - add a testIgnore pattern or move the file.

This was introduced in commit 426546f43 on Jan 20, 2026, which fixed E2E health check issues but inadvertently placed a Vitest unit test in the wrong location.

## Additional Context

The file `supabase-health.ts` (the actual utility) is correctly placed and works fine. Only the test file (`supabase-health.spec.ts`) is problematic because it uses Vitest instead of Playwright's test runner.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, gh issue view, git log, Read, Glob*
