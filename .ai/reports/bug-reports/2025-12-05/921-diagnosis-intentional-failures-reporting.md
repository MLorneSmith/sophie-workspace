# Bug Diagnosis: Intentional Failure Tests Should Use test.fail() Annotation

**ID**: ISSUE-921
**Created**: 2025-12-05T15:10:00Z
**Reporter**: user
**Severity**: low
**Status**: new
**Type**: bug

## Summary

The E2E test suite's configuration verification tests (shard 11) use regular assertions that fail, causing them to be reported as "3 failed" tests even though the infrastructure subtracts them and reports "(Intentional failures excluded: 3)". Other tests that shouldn't run use `test.skip()` which properly reports them as "skipped" without appearing in failure counts at all. The configuration verification tests should use Playwright's `test.fail()` annotation so they are reported as "expected failures" natively by Playwright, not as failures that need post-hoc adjustment.

## Environment

- **Application Version**: dev branch
- **Environment**: development/CI
- **Node Version**: 20.x
- **Playwright Version**: Current (supports test.fail() since v1.42)
- **Last Working**: N/A - this is a design issue

## Reproduction Steps

1. Run `/test 11` (Config Verification shard)
2. Observe output shows "8 passed, 3 failed"
3. Note the summary says "(Intentional failures excluded: 3)"
4. Compare to other shards where skipped tests show as "X skipped" not failures

## Expected Behavior

Tests that are expected to fail should:
1. Use Playwright's native `test.fail()` annotation
2. Be reported by Playwright as "expected failures" (not counted as failures)
3. Not require post-hoc adjustment in test-controller or safe-test-runner.sh
4. Be consistent with how other "skipped" tests are handled (not appearing in failure counts)

## Actual Behavior

1. Config verification tests use regular `expect().toBe()` assertions that fail
2. Playwright reports them as actual failures: "8 passed, 3 failed"
3. The test infrastructure (safe-test-runner.sh, e2e-test-runner.cjs) has special logic to:
   - Detect "test-configuration-verification.spec.ts" in output
   - Count occurrences of "Intentional FAILURE" text
   - Subtract 3 from the failure count
   - Display "(Intentional failures excluded: 3)"
4. This creates confusing output and requires maintenance of special-case handling

## Diagnostic Data

### Current Test Implementation

```typescript
// apps/e2e/tests/test-configuration-verification.spec.ts
test("Test 2: Intentional FAILURE", async () => {
  expect(true).toBe(false); // This will fail - ACTUALLY FAILS
});

test("Test 4: Another intentional FAILURE", async () => {
  throw new Error("This test throws an error intentionally"); // ACTUALLY FAILS
});

test("Test 7: Nested intentional FAILURE", async () => {
  expect("fail").toBe("pass"); // This will fail - ACTUALLY FAILS
});
```

### Infrastructure Workarounds

**safe-test-runner.sh (lines 197-204):**
```bash
# Adjust for intentional test failures
if grep -q "test-configuration-verification.spec.ts" "$LOG_FILE" 2>/dev/null; then
    INTENTIONAL_COUNT=$(grep -c "Intentional FAILURE" "$LOG_FILE" 2>/dev/null || echo "0")
    if [[ $INTENTIONAL_COUNT -ge 3 ]]; then
        TOTAL_FAILED=$((TOTAL_FAILED - 3))
        INTENTIONAL_FAILURES=3
    fi
fi
```

**e2e-test-runner.cjs (lines 1586-1603):**
```javascript
// Check for intentional failures in test-configuration-verification
if (buffer.includes("test-configuration-verification.spec.ts")) {
  const intentionalPatterns = [
    "Test 2: Intentional FAILURE",
    "Test 4: Another intentional FAILURE",
    "Test 7: Nested intentional FAILURE",
  ];
  let intentionalCount = 0;
  for (const pattern of intentionalPatterns) {
    if (buffer.includes(pattern)) {
      intentionalCount++;
    }
  }
  if (intentionalCount > 0) {
    results.intentionalFailures = intentionalCount;
  }
}
```

### How Other Tests Handle "Not Running"

Other tests that shouldn't run use `test.skip()`:
```typescript
// apps/e2e/tests/account/account.spec.ts
test.skip("user can update their email", async ({ page: _page }) => {
  // SKIPPED: Requires email confirmation which tests can't access
});
```

These are properly reported as "skipped" (not failures) by Playwright natively.

## Error Stack Traces

N/A - This is a design/consistency issue, not an error.

## Related Code

- **Affected Files**:
  - `apps/e2e/tests/test-configuration-verification.spec.ts` (tests to modify)
  - `.ai/ai_scripts/testing/infrastructure/safe-test-runner.sh` (workaround to remove)
  - `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs` (workaround to remove)
  - `.ai/ai_scripts/testing/infrastructure/test-controller-monolith.cjs` (workaround to simplify)

- **Recent Changes**: Original implementation from Issue #275 (configuration verification tests)

- **Suspected Functions**: Test definitions in test-configuration-verification.spec.ts

## Related Issues & Context

### Direct Predecessors
- #275 (CLOSED): "Configuration Verification Tests" - Original implementation that added these tests
- #638 (CLOSED): "E2E Test Sharding" - Moved config tests to isolated shard 11

### Historical Context
The configuration verification tests were added to ensure Playwright's `fullyParallel: true` setting works correctly (all tests run despite failures). The current implementation achieves this but uses a non-standard approach that requires infrastructure workarounds.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The configuration verification tests use regular failing assertions instead of Playwright's native `test.fail()` annotation, requiring multiple infrastructure workarounds to avoid reporting them as real failures.

**Detailed Explanation**:

Playwright provides `test.fail()` specifically for marking tests as "expected to fail". When a test marked with `test.fail()` fails:
- It's reported as an **expected failure** (not counted in failure totals)
- If it unexpectedly passes, Playwright flags it as an issue
- No post-processing is needed

The current implementation:
1. Uses `expect(true).toBe(false)` which Playwright treats as a real failure
2. Requires string matching on test names ("Intentional FAILURE") in output parsing
3. Requires manual subtraction of failure count in safe-test-runner.sh
4. Requires tracking `intentionalFailures` separately throughout the test infrastructure
5. Creates confusing output: "3 failed" then "(Intentional failures excluded: 3)"

**Supporting Evidence**:
- Playwright docs: `test.fail()` marks tests as "should fail" and Playwright ensures they actually fail
- Current code has hardcoded test name patterns in multiple files
- Output shows "3 failed" which is technically correct but misleading

### How This Causes the Observed Behavior

1. Tests run with regular assertions → Playwright reports actual failures
2. Test controller parses output, finds "Intentional FAILURE" strings
3. Controller sets `intentionalFailures = 3` separately
4. Safe-test-runner subtracts these from total failed count
5. Output shows both the raw "3 failed" from Playwright AND the "(excluded: 3)" note
6. Result is confusing and inconsistent with how other non-running tests are handled

### Confidence Level

**Confidence**: High

**Reasoning**:
- Playwright documentation explicitly describes `test.fail()` for this exact use case
- The current workarounds are well-documented in the codebase
- The fix is straightforward and well-understood

## Fix Approach (High-Level)

1. Update `apps/e2e/tests/test-configuration-verification.spec.ts` to use `test.fail()` annotation:
   ```typescript
   test.fail("Test 2: Intentional FAILURE", async () => {
     expect(true).toBe(false);
   });
   ```

2. Remove the workaround code from:
   - `safe-test-runner.sh` (lines 197-204)
   - `e2e-test-runner.cjs` (intentional failure detection logic)
   - `test-controller-monolith.cjs` (can simplify intentionalFailures tracking)

3. Verify that Playwright now reports these as "expected failures" natively

## Diagnosis Determination

The root cause is confirmed: using regular failing assertions instead of Playwright's `test.fail()` annotation. The fix is straightforward - convert the three intentional failure tests to use `test.fail()` and remove the infrastructure workarounds.

## Additional Context

- Playwright `test.fail()` was added in v1.42 (stable, widely supported)
- This change will also improve CI reporting since Playwright's native output will be cleaner
- The test infrastructure code can be simplified by removing ~50 lines of special-case handling

### Sources
- [Playwright Test Annotations](https://playwright.dev/docs/test-annotations)
- [Playwright Test API - test.fail()](https://playwright.dev/docs/api/class-test#test-fail)

---
*Generated by Claude Debug Assistant*
*Tools Used: Grep, Read, Task (Explore agent), context7-expert agent, WebSearch*
