# Bug Diagnosis: PTY Wrapper Test Mock Missing isFeatureFailed Export

**ID**: ISSUE-1859
**Created**: 2026-01-27T18:45:00Z
**Reporter**: CI Pipeline (workflow run 21408980903)
**Severity**: high
**Status**: new
**Type**: regression

## Summary

PR #1854 validation workflow fails on Unit Tests job due to a missing mock export in `pty-wrapper.spec.ts`. The test file mocks `progress-file.js` but does not include the `isFeatureFailed` function, which was added to `pty-wrapper.ts` in commit `aa633fa89` (bug fix #1852).

## Environment

- **Application Version**: dev branch, commit 08a1408cf
- **Environment**: CI (GitHub Actions workflow run 21408980903)
- **Node Version**: 20
- **pnpm Version**: 10.14.0
- **Last Working**: Before commit aa633fa89 (2026-01-27)

## Reproduction Steps

1. Push changes to dev branch triggering PR #1854
2. CI runs `pnpm test:unit` which executes the alpha-scripts test suite
3. Test file `.ai/alpha/scripts/lib/__tests__/pty-wrapper.spec.ts` fails
4. Vitest reports: `No "isFeatureFailed" export is defined on the "../progress-file.js" mock`

## Expected Behavior

Unit tests should pass when all mocked functions match the actual imports used by the module under test.

## Actual Behavior

Unit tests fail with error:
```
Error: [vitest] No "isFeatureFailed" export is defined on the "../progress-file.js" mock. Did you forget to return it from "vi.mock"?
```

## Diagnostic Data

### Console Output
```
X @slideheroes/alpha-scripts#test:coverage: command (/home/runner/_work/2025slideheroes/2025slideheroes/.ai/alpha/scripts) /home/runner/setup-pnpm/node_modules/.bin/pnpm run test:coverage exited (1)

X Error: [vitest] No "isFeatureFailed" export is defined on the "../progress-file.js" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock(import("../progress-file.js"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
  }
})

 ❯ attemptProgressFileRecovery lib/pty-wrapper.ts:225:6
 ❯ Module.waitWithTimeout lib/pty-wrapper.ts:164:11
```

### Network Analysis
N/A (not a network issue)

### Database Analysis
N/A (not a database issue)

### Performance Metrics
N/A (not a performance issue)

### Screenshots
N/A

## Error Stack Traces
```
Error: [vitest] No "isFeatureFailed" export is defined on the "../progress-file.js" mock.
 ❯ attemptProgressFileRecovery lib/pty-wrapper.ts:225:6
 ❯ Module.waitWithTimeout lib/pty-wrapper.ts:164:11

This error originated in "lib/__tests__/pty-wrapper.spec.ts" test file.
The latest test that might've caused the error is "should return stillRunning=true when progress file shows in_progress with recent heartbeat".
```

## Related Code
- **Affected Files**:
  - `.ai/alpha/scripts/lib/__tests__/pty-wrapper.spec.ts` (test file with incomplete mock)
  - `.ai/alpha/scripts/lib/pty-wrapper.ts` (imports isFeatureFailed at line 26)
  - `.ai/alpha/scripts/lib/progress-file.ts` (exports isFeatureFailed at line 174)
- **Recent Changes**: Commit `aa633fa89` added isFeatureFailed check on 2026-01-27
- **Suspected Functions**: `vi.mock("../progress-file.js", ...)` at line 30-34 of test file

## Related Issues & Context

### Direct Predecessors
- #1852 (CLOSED): Bug fix that introduced the `isFeatureFailed` call in pty-wrapper.ts

### Related Infrastructure Issues
None identified

### Similar Symptoms
- #809 (CLOSED): "Unit tests for impersonateUser fail due to stale test expectations" - Similar pattern of mocks not matching updated implementation

### Same Component
- #1767 (referenced in code): PTY timeout wrapper implementation

### Historical Context
This is a common regression pattern: implementation is updated with new dependencies but corresponding test mocks are not updated simultaneously.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The test file's vi.mock() for `progress-file.js` only mocks 3 functions but the implementation now imports 4.

**Detailed Explanation**:
In commit `aa633fa89` (fix(tooling): check failed status before stillRunning in PTY recovery), the `isFeatureFailed` function was added to `pty-wrapper.ts`:

```typescript
// pty-wrapper.ts line 26
import {
    isFeatureCompleted,
    isFeatureFailed,        // <-- NEW: Added in #1852
    isProgressFileStale,
    type ProgressFileData,
    readProgressFile,
} from "./progress-file.js";
```

However, the test file's mock at lines 30-34 only includes:
```typescript
vi.mock("../progress-file.js", () => ({
    readProgressFile: vi.fn(),
    isProgressFileStale: vi.fn(),
    isFeatureCompleted: vi.fn(),
    // MISSING: isFeatureFailed: vi.fn(),
}));
```

When Vitest runs the test and the code reaches line 225 (`if (isFeatureFailed(progressData))`), it attempts to call the mocked function which doesn't exist.

**Supporting Evidence**:
- Stack trace points directly to line 225: `attemptProgressFileRecovery lib/pty-wrapper.ts:225:6`
- Error message explicitly states: `No "isFeatureFailed" export is defined on the mock`
- Git history shows `isFeatureFailed` was added in commit `aa633fa89` without test update

### How This Causes the Observed Behavior

1. CI runs `pnpm test:coverage` on the alpha-scripts package
2. Vitest loads `pty-wrapper.spec.ts` which sets up the incomplete mock
3. Test "should return stillRunning=true when progress file shows in_progress with recent heartbeat" triggers timeout recovery
4. Recovery code calls `isFeatureFailed(progressData)` at line 225
5. Vitest detects the missing mock export and throws an error
6. Test suite fails, CI job fails, PR validation fails

### Confidence Level

**Confidence**: High

**Reasoning**:
1. Error message explicitly identifies the missing function
2. Code inspection confirms the mismatch between mock and implementation
3. Git history shows exact commit that introduced the dependency
4. Stack trace confirms the exact line where failure occurs

## Fix Approach (High-Level)

Add `isFeatureFailed: vi.fn()` to the vi.mock() declaration in `.ai/alpha/scripts/lib/__tests__/pty-wrapper.spec.ts` at line 30-34. The mock should become:

```typescript
vi.mock("../progress-file.js", () => ({
    readProgressFile: vi.fn(),
    isProgressFileStale: vi.fn(),
    isFeatureCompleted: vi.fn(),
    isFeatureFailed: vi.fn(),  // Add this line
}));
```

Then import the mocked function at line 37-41 and configure its return value in relevant tests.

## Diagnosis Determination

The root cause is definitively identified: commit `aa633fa89` added a new function import (`isFeatureFailed`) to `pty-wrapper.ts` but did not update the corresponding test mock in `pty-wrapper.spec.ts`. This is a straightforward mock synchronization issue with a clear single-line fix.

## Additional Context

- The Aikido Security Scan failures in the same workflow run are pre-existing issues unrelated to this regression
- The Accessibility Tests failure is also a separate issue (database setup failing)
- This specific unit test regression is blocking the PR validation workflow

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, gh pr view, Read, Grep, git log, git show*
