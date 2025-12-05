# Bug Fix: E2E Test Runner Timeout Detection Pattern Too Aggressive

**Related Diagnosis**: #911 (REQUIRED)
**Severity**: medium
**Bug Type**: testing
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Overly broad pattern matching (`"Timeout"`, `"TimeoutError"`) kills processes whenever ANY output contains these strings, even in tests intentionally handling timeouts
- **Fix Approach**: Replace generic pattern matchers with specific ones that only match actual test failures (`"Test timeout of"`, `"exceeded while"`)
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E test runner's timeout detection handler (lines 1163-1189 in `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs`) uses overly broad pattern matching that triggers on ANY occurrence of "Timeout" or "TimeoutError" in output. This causes tests that intentionally handle timeout errors to fail because the runner kills the process before the test can execute its recovery logic.

**Specific Impact**: The test "should recover from connection timeout" in `apps/e2e/tests/payload/payload-database.spec.ts:306` fails because:
1. Test intentionally sets 5000ms timeout
2. Catches the timeout error (output contains "Timeout")
3. Runner detects "Timeout" string and kills the process via SIGKILL
4. Test never reaches recovery logic that would re-attempt with 30000ms timeout

For full details, see diagnosis issue #911.

### Solution Approaches Considered

#### Option 1: Make Pattern Matching More Specific ⭐ RECOMMENDED

**Description**: Replace generic `includes("Timeout")` and `includes("TimeoutError")` matchers with specific patterns that only match actual test failures. Keep only the specific patterns:
- `"Test timeout of"` - Playwright test timeout message
- `"exceeded while"` - Timeout exceeded pattern

**Pros**:
- Minimal code change (remove 2 lines)
- Still detects hung tests that actually need killing
- Allows tests to intentionally handle and recover from timeouts
- No performance impact
- No new dependencies

**Cons**:
- If Playwright changes its error message format, detection could break
- Tests with "Timeout" in the name still won't trigger detection (but that's OK - it's intentional)

**Risk Assessment**: low - We're being MORE conservative (removing false positives), not less. Worst case: a hung test takes longer to timeout naturally.

**Complexity**: simple - Two-line deletion

#### Option 2: Add Grace Period Before Killing

**Description**: Instead of immediately killing on timeout pattern, add a 5-10 second grace period to let tests handle their own timeout errors. Only kill if process is still hung after grace period.

**Pros**:
- Allows tests time to handle timeouts
- Safer for timeout recovery patterns

**Cons**:
- More complex implementation needed
- Adds latency to actual timeout detection
- Would need to track which tests are timing out
- More fragile due to timing dependencies

**Why Not Chosen**: Option 1 is simpler and more direct. If a test intentionally sets a timeout, it shouldn't be killed. Tests that are actually hung will timeout naturally.

#### Option 3: Context-Aware Detection

**Description**: Parse test names from output and only kill if the test name doesn't contain "timeout" or "recovery" keywords.

**Pros**:
- More intelligent about which tests to kill

**Cons**:
- Much more complex parsing logic
- Fragile pattern matching on test names
- Over-engineered for the actual problem

**Why Not Chosen**: Option 1 solves the problem with minimal code change. No need for complex logic.

### Selected Solution: Make Pattern Matching More Specific

**Justification**: The diagnosis clearly shows that the generic patterns (`"Timeout"`, `"TimeoutError"`) are causing false positives. The specific patterns (`"Test timeout of"`, `"exceeded while"`) are sufficient to detect actual hung tests while allowing tests that intentionally handle timeouts to complete. This is the most pragmatic fix that requires only removing two lines.

**Technical Approach**:
- Remove the two overly broad pattern matchers from lines 1167-1168
- Keep the two specific matchers that represent actual test failures
- Tests intentionally handling timeouts will continue to execute and complete normally
- Tests that actually hang will still be killed when Playwright's native timeout mechanism triggers the "Test timeout of" message

**Architecture Changes**: None - this is a pure pattern matching refinement

**Migration Strategy**: None needed - this is backward compatible (only stops false positives)

## Implementation Plan

### Affected Files

- `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs:1164-1169` - Remove overly broad pattern matchers from timeout detection condition

### New Files

None required

### Step-by-Step Tasks

#### Step 1: Modify Timeout Detection Pattern

Remove the two broad pattern matchers that trigger on any "Timeout" text:

**Current code (lines 1164-1169)**:
```javascript
if (
  line.includes("Test timeout of") ||
  line.includes("exceeded while") ||
  line.includes("Timeout") ||           // ← Remove this
  line.includes("TimeoutError")         // ← Remove this
) {
```

**New code**:
```javascript
if (
  line.includes("Test timeout of") ||
  line.includes("exceeded while")
) {
```

**Why this step first**: This is the core fix. The other patterns (`"Test timeout of"`, `"exceeded while"`) specifically match Playwright's actual test timeout messages, while the removed patterns were too generic.

#### Step 2: Add Regression Test

Add a test case to verify that tests with "timeout" in output but without matching the specific patterns are NOT killed:

Create test file: `apps/e2e/tests/timeout-recovery.spec.ts`

```typescript
import { expect, test } from "@playwright/test";

/**
 * This test verifies that the E2E runner doesn't kill tests
 * that intentionally handle timeout errors. Tests are killed
 * only when they match specific patterns like "Test timeout of".
 */
test("should recover from connection timeout", async ({ page }) => {
  // This test intentionally demonstrates timeout handling.
  // It should NOT be killed by the E2E runner.

  // Set a short timeout to trigger timeout handling
  const shortTimeoutMS = 5000;

  try {
    // This will timeout and throw an error containing "Timeout"
    await page.waitForNavigation({ timeout: shortTimeoutMS });
  } catch (error) {
    // Intentionally catch and handle the timeout
    if (error.message.includes("Timeout")) {
      // Recovery logic: increase timeout and retry
      await page.reload({ waitUntil: "networkidle" });
    }
  }

  // Verify page is in a valid state after recovery
  expect(page).toBeTruthy();
});
```

**Why this step**: Ensures the fix works and prevents regression. This test will fail with the old code (runner kills it) and pass with the fix.

#### Step 3: Verify the Failing Test Now Passes

Run the specific test that was failing with the buggy code:

```bash
pnpm --filter e2e test -- --grep "should recover from connection timeout"
```

**Why this step**: Confirms the original failing test now passes, proving the bug is fixed.

#### Step 4: Run Full E2E Test Suite

Execute the complete test suite to ensure no regressions:

```bash
pnpm test:e2e
```

Or use the test runner script that was failing:

```bash
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh
```

**Why this step**: Ensures the change doesn't break other tests or timeout detection for actually hung tests.

#### Step 5: Code Quality & Validation

Run all validation commands:

```bash
pnpm typecheck
pnpm lint
pnpm format
```

**Why this step**: Ensures code quality standards are met.

## Testing Strategy

### Unit Tests

Since this is a runner script change (not a library function), traditional unit tests aren't applicable. Instead, we rely on:

- ✅ Regression test: `timeout-recovery.spec.ts` - Verifies timeout handling works
- ✅ Full E2E suite: Ensures all tests still pass with new pattern matching
- ✅ Manual verification: Run problematic shard again

### Integration Tests

The fix will be validated by the existing E2E test suite, specifically:

**Test files**:
- `apps/e2e/tests/payload/payload-database.spec.ts:306` - "should recover from connection timeout" (was failing, should now pass)
- `apps/e2e/tests/timeout-recovery.spec.ts` - New regression test

### E2E Tests

Full E2E suite must pass with new timeout detection:

```bash
pnpm test:e2e
```

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run Payload CMS Extended shard (the one with failing test)
- [ ] Verify "should recover from connection timeout" test passes
- [ ] Verify test output doesn't show aggressive process kill
- [ ] Run full E2E suite and confirm all tests pass
- [ ] Check logs for no spurious timeout detections
- [ ] Verify other timeout-related tests still work
- [ ] Test runner should still kill actually hung processes

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Hung Test Not Detected**: If a test actually hangs but doesn't match `"Test timeout of"` or `"exceeded while"` patterns
   - **Likelihood**: low - These are Playwright's standard timeout messages
   - **Impact**: medium - Test would hang until OS timeout
   - **Mitigation**: The specific patterns are well-documented Playwright patterns. If Playwright changes them, we'd need to update. Monitor test run times to catch unexpectedly long tests.

2. **False Negatives in Timeout Detection**: A test that should be killed takes longer to fail naturally
   - **Likelihood**: low - Only applies if test doesn't match standard Playwright patterns
   - **Impact**: low - Test still fails, just takes longer (up to Playwright's configured timeout)
   - **Mitigation**: This is actually safer than false positives. Better to let a test timeout naturally than kill it prematurely.

**Rollback Plan**:

If this change causes issues:
1. Revert the 2-line deletion in `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs`
2. Re-add lines with `includes("Timeout")` and `includes("TimeoutError")`
3. Redeploy test runner
4. Tests with timeout handling will fail again (reverting to pre-fix state)

**Monitoring** (if needed):

Monitor test run times to ensure:
- No tests are hanging unexpectedly
- Timeout detection is still working for actually hung tests
- The specific test "should recover from connection timeout" passes consistently

## Performance Impact

**Expected Impact**: none

The change removes pattern matching logic, which is negligible overhead. No performance impact on test execution time.

## Security Considerations

**Security Impact**: none

This is a test runner configuration change with no security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run the problematic shard
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh

# Or specifically run the test that fails:
pnpm --filter e2e test -- --grep "should recover from connection timeout"
```

**Expected Result**: The test fails with message like:
```
Error: page.reload: net::ERR_ABORTED; maybe frame was detached?
[Shard 2] ⚠️ Playwright timeout detected - aggressively killing test
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run the previously failing test
pnpm --filter e2e test -- --grep "should recover from connection timeout"

# Run full E2E suite
pnpm test:e2e

# Run the problematic shard with test runner
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh
```

**Expected Result**:
- All commands succeed
- "should recover from connection timeout" test passes
- No spurious timeout kills in logs
- Full E2E suite passes
- Test runner completes without errors

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Check for any timeouts in logs (should only show "Test timeout of" or "exceeded while")
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 2>&1 | grep -i timeout
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this is a test infrastructure change, not application code

**Feature flags needed**: No

**Backwards compatibility**: Fully maintained - this is a pure bug fix with no breaking changes

## Success Criteria

The fix is complete when:
- [ ] Pattern matching removal is made (2-line change)
- [ ] New regression test added and passes
- [ ] Previously failing test "should recover from connection timeout" passes
- [ ] All E2E tests pass without spurious timeout kills
- [ ] Full test suite passes with `pnpm test`
- [ ] Code passes typecheck, lint, and format
- [ ] No test regressions detected
- [ ] Timeout detection still works for actually hung tests

## Notes

**Related Issues**:
- #909 - Fixed global `pkill` commands (related infrastructure issue)
- #906 - Fixed aggressive Playwright kill logic (related infrastructure issue)

**Key Insight**: The pattern matching in this runner was overly defensive. By removing generic patterns and keeping only specific Playwright error messages, we allow tests that intentionally handle timeouts to complete while still protecting against actually hung tests.

**Testing Philosophy**: Tests should be able to intentionally throw and catch errors. The runner's job is to kill tests that are hung, not to prevent tests from executing their error handling logic.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #911*
