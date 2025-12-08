# Bug Diagnosis: test.fail() Annotation Incorrectly Used With Passing Assertions

**ID**: ISSUE-979
**Created**: 2025-12-08T17:55:00Z
**Reporter**: system (test execution)
**Severity**: low
**Status**: new
**Type**: bug

## Summary

The configuration verification tests in shard 11 report 3 failures with "Expected to fail, but passed" because the `test.fail()` annotation was incorrectly combined with passing assertions. The previous fix (issue #922) misunderstood how `test.fail()` works - it inverts test expectations, so tests marked with `test.fail()` are expected to have their assertions FAIL, not pass.

## Environment

- **Application Version**: dev branch
- **Environment**: development/CI
- **Node Version**: 22.x
- **Playwright Version**: Latest (from package.json)
- **Last Working**: Before commit ba5c6804c (2025-12-05)

## Reproduction Steps

1. Run E2E shard 11: `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 11`
2. Observe 3 tests fail with "Expected to fail, but passed"
3. The failing tests are: Test 2, Test 4, Test 7

## Expected Behavior

All 11 tests should pass:
- 8 normal passing tests
- 3 tests marked as "expected failures" (not counted as failures)

## Actual Behavior

Results: 8 passed, 3 failed
- The 3 `test.fail()` tests report "Expected to fail, but passed"
- These are counted as actual failures in the test results

## Diagnostic Data

### Console Output
```
✘  1) [chromium] › tests/test-configuration-verification.spec.ts:20:6 › @skip-in-ci Configuration Verification - Continue on Failure › Test 2: Expected failure - demonstrates test.fail() annotation
    Expected to fail, but passed.

✘  2) [chromium] › tests/test-configuration-verification.spec.ts:31:6 › @skip-in-ci Configuration Verification - Continue on Failure › Test 4: Expected failure - demonstrates error handling
    Expected to fail, but passed.

✘  3) [chromium] › tests/test-configuration-verification.spec.ts:46:7 › @skip-in-ci Configuration Verification - Continue on Failure › Nested suite with failures › Test 7: Nested expected failure
    Expected to fail, but passed.
```

### Test Code Analysis

**Current (incorrect) implementation:**
```typescript
test("Test 2: Expected failure - demonstrates test.fail() annotation", async () => {
  test.fail();
  expect(true).toBe(true); // PASSES - but test.fail() expects it to FAIL
});
```

**How test.fail() actually works:**
- `test.fail()` marks a test as "expected to fail"
- If the test body FAILS → Playwright reports it as "passed" (expected behavior occurred)
- If the test body PASSES → Playwright reports it as "failed" with "Expected to fail, but passed"

**The bug:** The assertions pass (`expect(true).toBe(true)`), but `test.fail()` expects them to fail.

## Error Stack Traces

No stack traces - Playwright correctly identifies the mismatch between annotation and result.

## Related Code

- **Affected Files**:
  - `apps/e2e/tests/test-configuration-verification.spec.ts` (lines 20-25, 31-35, 46-50)

- **Recent Changes**:
  - Commit `ba5c6804c` (2025-12-05): "fix(e2e): use Playwright test.fail() for intentional failures"
  - This commit introduced the bug by misunderstanding `test.fail()` behavior

- **Suspected Functions**: The 3 test functions with `test.fail()` annotation

## Related Issues & Context

### Direct Predecessors
- #921 (CLOSED): "Bug Diagnosis: Intentional Failure Tests Should Use test.fail() Annotation" - This diagnosis recommended using test.fail()
- #922 (CLOSED): "Bug Fix: Use test.fail() Annotation for Intentional Test Failures" - This fix introduced the current bug

### Historical Context
Issue #921 correctly identified that intentional failure tests should use `test.fail()`, but the implementation in #922 misunderstood the annotation's semantics. The original tests had failing assertions (`expect(true).toBe(false)`); the "fix" changed them to passing assertions while adding `test.fail()`, which is backwards.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `test.fail()` annotation was added to tests with passing assertions, but `test.fail()` expects the test to actually fail.

**Detailed Explanation**:
Playwright's `test.fail()` works by inverting test expectations:
- It tells Playwright "this test SHOULD fail"
- If the test fails → success (expected failure)
- If the test passes → failure ("Expected to fail, but passed")

The implementation in commit `ba5c6804c` got this backwards. It:
1. Added `test.fail()` annotation
2. Changed assertions from failing (`expect(true).toBe(false)`) to passing (`expect(true).toBe(true)`)
3. Added comments claiming "This passes, so with test.fail() the test fails as expected"

This comment is incorrect - with `test.fail()`, if the test body passes, Playwright reports it as a failure.

**Supporting Evidence**:
- Playwright documentation: "Marks a test as 'should fail'. Playwright will run this test and ensure it does indeed fail."
- Error message: "Expected to fail, but passed" - Playwright is telling us the test was supposed to fail but didn't
- Test code at `apps/e2e/tests/test-configuration-verification.spec.ts:20-50`

### How This Causes the Observed Behavior

1. Test runs with `test.fail()` annotation
2. Test body executes `expect(true).toBe(true)` - this PASSES
3. Playwright checks: "Was this test supposed to fail?" → Yes (due to `test.fail()`)
4. Playwright checks: "Did it actually fail?" → No, it passed
5. Playwright reports: "Expected to fail, but passed" and counts it as a failure

### Confidence Level

**Confidence**: High

**Reasoning**:
- The Playwright documentation clearly states `test.fail()` expects tests to fail
- The error message "Expected to fail, but passed" directly confirms this
- The test code clearly shows passing assertions with `test.fail()`
- The commit history shows when this was introduced

## Fix Approach (High-Level)

Two valid approaches:

**Option A: Make tests actually fail (recommended for "continue on failure" verification)**
```typescript
test("Test 2: Expected failure", async () => {
  test.fail();
  expect(true).toBe(false); // Actually fails - test.fail() expects this
});
```

**Option B: Remove test.fail() and keep passing tests**
If the goal is just to verify all tests run, remove `test.fail()` and use normal passing assertions.

**Option C: Use test.fixme() to skip entirely**
If these tests serve no purpose, mark them with `test.fixme()` to skip execution.

Recommendation: Option A - the original purpose was to verify Playwright continues running tests after failures, so keeping them as expected failures makes sense.

## Diagnosis Determination

The root cause is definitively identified: `test.fail()` was combined with passing assertions, but it requires failing assertions to work correctly. This is a regression introduced in commit `ba5c6804c` when implementing issue #922.

## Additional Context

- The tests are tagged `@skip-in-ci` but still run in shard 11
- This is a low-severity issue - the tests themselves are for verifying Playwright configuration, not testing application functionality
- The fix is straightforward: change `expect(true).toBe(true)` to `expect(true).toBe(false)` in the 3 affected tests

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Bash (test runner, git log, gh issue), WebSearch, WebFetch*
