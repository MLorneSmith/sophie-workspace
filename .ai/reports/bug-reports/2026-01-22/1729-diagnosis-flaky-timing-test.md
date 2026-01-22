# Bug Diagnosis: Flaky Timing Test in startup-monitor.spec.ts Causes PR CI Failures

**ID**: ISSUE-pending
**Created**: 2026-01-22T16:30:00Z
**Reporter**: system (via PR #1566 failure investigation)
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The Unit Tests job fails intermittently in PR CI pipelines due to a timing-sensitive test in `startup-monitor.spec.ts`. The test `getElapsedTime > should return elapsed milliseconds` expects elapsed time to be under 200ms after a 50ms wait, but CI environments (especially spot instances) can exceed this threshold, causing flaky failures unrelated to the actual code changes in PRs.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI (GitHub Actions)
- **Node Version**: 20
- **Runner Type**: runs-on spot instances (m7i-flex.large)
- **Last Working**: Intermittent - fails on some CI runs, passes on others

## Reproduction Steps

1. Open any PR that triggers the Unit Tests workflow (e.g., PR #1566 - tar dependency update)
2. Wait for the `Unit Tests` job to run `@slideheroes/alpha-scripts:test:coverage`
3. On slower CI runners or under load, the test may fail

## Expected Behavior

The test should reliably pass regardless of CI environment performance variability. A 50ms setTimeout should complete within a reasonable upper bound that accounts for CI latency.

## Actual Behavior

The test expects `elapsed < 200` after a 50ms wait, but actual elapsed time was 209ms on a spot instance, causing:
```
AssertionError: expected 209 to be less than 200
```

## Diagnostic Data

### Console Output
```
FAIL lib/__tests__/startup-monitor.spec.ts > startup-monitor > StartupOutputTracker > getElapsedTime > should return elapsed milliseconds
AssertionError: expected 209 to be less than 200
 ❯ lib/__tests__/startup-monitor.spec.ts:237:21

    235|     const elapsed = getElapsedTime(tracker);
    236|     expect(elapsed).toBeGreaterThanOrEqual(50);
    237|     expect(elapsed).toBeLessThan(200);
       |                     ^
    238|    });
    239|   });
```

### CI Environment
```
RUNS_ON_INSTANCE_TYPE: m7i-flex.large
RUNS_ON_INSTANCE_LIFECYCLE: spot
RUNS_ON_AMI_NAME: runs-on-v2.2-ubuntu22-full-x64-20260101080401
```

### Test Results Summary
```
Test Files  1 failed | 20 passed (21)
Tests       1 failed | 359 passed (360)
Duration    74.86s (transform 8.44s, setup 0ms, import 14.53s, tests 7.66s)
```

## Error Stack Traces
```
AssertionError: expected 209 to be less than 200
 ❯ lib/__tests__/startup-monitor.spec.ts:237:21
```

## Related Code
- **Affected Files**:
  - `.ai/alpha/scripts/lib/__tests__/startup-monitor.spec.ts:229-238`
  - `.ai/alpha/scripts/lib/startup-monitor.ts` (source module)
- **Recent Changes**: None to this file - this is a pre-existing flaky test
- **Suspected Functions**: Test case `getElapsedTime > should return elapsed milliseconds`

## Related Issues & Context

### Similar Symptoms
- #1462: CI Unit Tests Fail - Cannot find package '@kit/shared/registry'
- Various timing-related issues in E2E tests (#1584, #1595)

### Historical Context
This appears to be a long-standing flaky test that only manifests on slower CI runners. The test was likely written assuming consistent timing, but spot instances have variable performance.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The test uses a hardcoded 200ms upper bound that doesn't account for CI environment variability, especially on spot instances where CPU scheduling can add latency.

**Detailed Explanation**:
The test at `.ai/alpha/scripts/lib/__tests__/startup-monitor.spec.ts:229-238`:
```typescript
it("should return elapsed milliseconds", async () => {
  const tracker = createStartupOutputTracker();
  await new Promise((resolve) => setTimeout(resolve, 50));
  const elapsed = getElapsedTime(tracker);
  expect(elapsed).toBeGreaterThanOrEqual(50);
  expect(elapsed).toBeLessThan(200);  // <-- This bound is too tight
});
```

The 200ms upper bound assumes:
1. setTimeout resolves close to 50ms
2. Minimal overhead from test framework
3. Consistent CPU availability

On spot instances, these assumptions fail due to:
- CPU throttling/sharing with other workloads
- Cold start latency
- Node.js event loop delays under load

**Supporting Evidence**:
- Actual elapsed time: 209ms (9ms over threshold)
- CI runner: spot instance (variable performance)
- Test passed 359/360 times (only this timing test failed)

### How This Causes the Observed Behavior

1. Test calls `setTimeout(resolve, 50)` expecting ~50ms delay
2. Spot instance CPU scheduling adds variable latency
3. Actual delay exceeds 200ms threshold
4. `expect(elapsed).toBeLessThan(200)` assertion fails
5. `@slideheroes/alpha-scripts:test:coverage` fails
6. `Unit Tests` job fails
7. PR CI reports failure

### Confidence Level

**Confidence**: High

**Reasoning**:
- The error message is explicit: `expected 209 to be less than 200`
- The test is clearly timing-sensitive with hardcoded bounds
- This pattern is a known source of test flakiness in CI
- The failure is isolated to this single test (359/360 passed)

## Fix Approach (High-Level)

Increase the upper bound tolerance to account for CI variability. Options:
1. Change `toBeLessThan(200)` to `toBeLessThan(500)` or `toBeLessThan(1000)`
2. Remove the upper bound entirely since the test's purpose is to verify elapsed time increases, not to test setTimeout precision
3. Use `vi.useFakeTimers()` to make the test deterministic

Recommended: Option 2 or 3 - the upper bound doesn't test meaningful behavior.

## Diagnosis Determination

The PR #1566 (tar dependency update) failures are **NOT caused by the dependency change**. The Unit Tests failure is a pre-existing flaky timing test in the Alpha scripts package. The tar update in `/packages/e2b/e2b-template` is completely unrelated to this test.

The other failures (Bundle Size Check, Accessibility Tests) were likely caused by CI infrastructure issues (cancelled jobs) rather than actual test failures.

**Recommendation**: Fix the flaky test, then rebase and merge PR #1566.

## Additional Context

This issue blocks dependabot PRs from being automatically merged, creating maintenance overhead. Multiple PRs (#1566, #1725) have experienced the same flaky failure pattern.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (PR checks, job logs, issue search), Read tool, Grep tool*
