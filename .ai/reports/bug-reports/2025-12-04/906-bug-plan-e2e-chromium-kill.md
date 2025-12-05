# Bug Fix: E2E Tests Failing Due to Aggressive Chromium Process Killing

**Related Diagnosis**: #906 (REQUIRED)
**Severity**: high
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Global `pkill` commands in timeout detection kill ALL chromium/playwright processes system-wide, not just the timed-out test's processes
- **Fix Approach**: Remove global pkill commands and rely on process group killing via SIGKILL to isolate timeout handling per shard
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E tests fail with "Target page, context or browser has been closed" errors when the test runner's timeout detection logic aggressively kills ALL chromium processes system-wide using `pkill -9 -f "chromium"`. This kills innocent processes from running tests in other shards, causing cascading failures.

The issue occurs at lines 1185-1192 in `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs` where timeout detection executes:

```javascript
execSync(`pkill -9 -f "chromium" || true`, { stdio: "ignore", timeout: 1000 });
execSync(`pkill -9 -f "playwright" || true`, { stdio: "ignore", timeout: 1000 });
```

This pattern matching approach is too broad - it kills processes from all shards, not just the one that timed out.

For full details, see diagnosis issue #906.

### Solution Approaches Considered

#### Option 1: Remove Global pkill Commands ⭐ RECOMMENDED

**Description**: Remove the global `pkill` commands entirely and rely only on the existing `SIGKILL` signal sent to the process group (line 1181: `proc.kill("SIGKILL")`). The process group killing is sufficient to terminate the timed-out Playwright process and its children.

**Pros**:
- Simplest fix - just delete 2 lines of code
- Eliminates the root cause completely
- Process group killing via SIGKILL is already in place and works correctly
- No risk of unintended process termination
- Maintains isolation between parallel shards
- Lower maintenance burden

**Cons**:
- If process group killing doesn't work as expected (rare), may need additional safety measures
- Less "aggressive" timeout handling (though current timeout is already aggressive enough at 240s detection window)

**Risk Assessment**: low - The SIGKILL signal to `proc` already terminates the process and its children. The global pkill was redundant safety that's causing harm.

**Complexity**: simple - Just remove the problematic code

#### Option 2: Use PID-Specific Killing

**Description**: Instead of pattern matching with pkill, use the specific PID of the spawned process: `kill -9 <pid>`. This would be more targeted but is already being done via `proc.kill("SIGKILL")`.

**Pros**:
- Very precise targeting
- Explicit and auditable

**Cons**:
- Same functionality already exists via process group killing
- Additional code for no benefit
- Still requires execSync which adds overhead

**Why Not Chosen**: The process-level SIGKILL (line 1181) already provides this functionality. The global pkill is redundant and harmful.

#### Option 3: Add Process Isolation Per Shard

**Description**: Isolate each shard in its own process group or namespace to prevent cross-shard killing.

**Why Not Chosen**: Complexity is too high for what should be a simple fix. The root cause is the global pkill command, not lack of isolation. Removing the harmful command solves the problem immediately.

### Selected Solution: Remove Global pkill Commands

**Justification**:

The global `pkill` commands are:
1. **Redundant** - SIGKILL to the process group (line 1181) already terminates the Playwright process and all its children
2. **Harmful** - Pattern matching kills innocent processes from other shards
3. **Unnecessary** - The test runner already has adequate timeout handling via the 240-second stall detection window

Removing these 8 lines of code eliminates the root cause while maintaining all legitimate timeout protection. This is the principle of "do the simplest thing that fixes the problem."

**Technical Approach**:
- Delete lines 1185-1192 in `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs`
- Keep the existing `proc.kill("SIGKILL")` which is the correct way to terminate the process group
- Keep the stall detection timeout logic (240s detection window)
- Keep the error logging to track timeout events

**Architecture Changes**:
- None - this is purely removing dead/harmful code
- The process termination mechanism via SIGKILL remains unchanged
- Timeout detection behavior remains the same (240s window)

**Migration Strategy**:
- No data migration or API changes needed
- No backwards compatibility concerns
- Simply update the test runner file and re-run tests

## Implementation Plan

### Affected Files

- `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs` - Remove global pkill commands (lines 1185-1192)

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Remove harmful pkill commands

Remove lines 1185-1192 from `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs`:

- Delete the execSync call for chromium pkill
- Delete the execSync call for playwright pkill
- Keep the surrounding try-catch block and error logging
- Keep the SIGKILL signal to proc (line 1181) which correctly terminates the process group

**Why this step first**: This is the root cause. Removing it immediately stops the cascade failures.

After this change, the timeout handling should look like:

```javascript
try {
  if (stalled) {
    proc.kill("SIGKILL");
    // pkill commands removed - process group killing via SIGKILL is sufficient
  }
} catch (error) {
  log(`${shardPrefix}⚠️ Failed to kill timeout process: ${error.message}`);
}
```

#### Step 2: Verify file changes

- Confirm lines 1185-1192 are deleted
- Confirm surrounding code structure is intact
- Run `pnpm typecheck` to verify no syntax errors

#### Step 3: Run E2E tests to verify fix

Run the full E2E test suite to confirm the bug is resolved:

- Execute: `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh`
- Watch for: The previously failing tests should now pass without "Target page, context or browser has been closed" errors
- Expected: All 5 previously failing tests pass
  - Accessibility: Lighthouse performance benchmark
  - Payload CMS: should recover from temporary network issues
  - Payload CMS: should handle session expiry gracefully
  - Payload CMS: should handle database schema initialization
  - Payload Extended: should maintain data integrity on concurrent updates

#### Step 4: Validate no regressions

After fix verification:

- Run full test suite: `pnpm test`
- Check for any new failures in other tests
- Verify no other tests are affected by the removal of pkill
- Monitor for any timeout-related issues (should not occur - SIGKILL is still in place)

#### Step 5: Document the fix

- Update any inline comments if needed
- Consider adding a comment explaining why only SIGKILL is used (process group killing is sufficient)

## Testing Strategy

### Unit Tests

No unit tests needed - this is a test runner fix, not application code.

### Integration Tests

No integration tests needed - this is infrastructure code.

### E2E Tests

**Verify the fix**:
- ✅ Run full E2E suite: `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh`
- ✅ All previously failing tests should now pass
- ✅ No new failures should appear
- ✅ Test execution should complete without "Target page, context or browser has been closed" errors
- ✅ Timeout detection should still work (tests that genuinely hang should still be killed)

**Test files affected**:
- `apps/e2e/tests/accessibility/lighthouse.spec.ts`
- `apps/e2e/tests/payload/cms.spec.ts`
- `apps/e2e/tests/payload/extended-payload.spec.ts`

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Apply the fix by deleting lines 1185-1192
- [ ] Run `pnpm typecheck` - should pass
- [ ] Run `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh`
- [ ] All 5 previously failing tests should pass
- [ ] No new failures should appear in the test output
- [ ] Timeout detection still works (run a deliberately long test to verify it gets killed)
- [ ] Verify no errors in stderr output related to process killing
- [ ] Verify no errors in stderr output related to chromium/playwright process termination

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Risk: Timeout detection might not work after removing pkill**
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: The SIGKILL signal to the process group (line 1181) remains in place. Testing will verify this works.

2. **Risk: Existing long-running tests might not be properly killed**
   - **Likelihood**: low
   - **Impact**: medium
   - **Mitigation**: SIGKILL properly terminates process groups. Manual testing will verify timeout termination works.

**Rollback Plan**:

If after applying the fix we discover that timeout detection no longer works (processes hang indefinitely):

1. Revert the change by re-adding lines 1185-1192
2. Run tests again to confirm original behavior returns
3. Open a new GitHub issue to investigate why SIGKILL wasn't sufficient
4. Consider option 2 (PID-specific killing) or option 3 (process isolation) at that point

**Monitoring** (if needed):
- No production monitoring needed - this is test infrastructure
- Monitor E2E test execution for any new timeout-related failures during next few test runs
- No performance impact expected (if anything, slightly faster due to removing execSync calls)

## Performance Impact

**Expected Impact**: minimal (slight positive)

- Removing 2 execSync calls slightly reduces test runner overhead
- No change to test execution time
- Faster timeout handling (no 1000ms timeout on pkill commands)

## Security Considerations

**Security Impact**: positive

The original code was a security anti-pattern:
- Global process killing via pattern matching is dangerous
- Killing other users' processes could be an issue in multi-user environments
- Process isolation is better addressed through proper process groups

This fix improves security by removing the anti-pattern.

## Validation Commands

### Before Fix (Bug Should Reproduce)

Run the full E2E test suite and observe the failures:

```bash
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh
```

**Expected Result**: 5 failures with "Target page, context or browser has been closed" errors in:
- Accessibility shard: Lighthouse performance benchmark
- Payload CMS shard: multiple tests with page.reload/page.goto errors

### After Fix (Bug Should Be Resolved)

```bash
# Type check (should pass)
pnpm typecheck

# Run E2E tests
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh

# Expected Result: All tests pass, no "Target page, context or browser has been closed" errors
```

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# All tests should pass
# Specifically verify E2E shard tests
pnpm test:e2e
```

## Dependencies

### New Dependencies (if any)

No new dependencies required.

**No new dependencies needed** - This is a code deletion, not addition.

## Database Changes

No database changes required.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this is a test runner fix, only affects local and CI E2E test execution.

**Feature flags needed**: no

**Backwards compatibility**: maintained - E2E tests continue to work the same way, just more reliably.

## Success Criteria

The fix is complete when:
- [ ] Lines 1185-1192 are removed from e2e-test-runner.cjs
- [ ] `pnpm typecheck` passes
- [ ] All 5 previously failing E2E tests now pass
- [ ] No new test failures appear
- [ ] Timeout detection still works (verified by manual test)
- [ ] Zero regressions in full test suite
- [ ] No "Target page, context or browser has been closed" errors appear

## Notes

**Why This Fix is Correct**:

The global `pkill` commands are a cargo cult pattern - they were added as "aggressive" timeout handling, but they're solving the wrong problem. The actual root cause (a test hanging) is already being handled by SIGKILL to the process group.

The key insight: When you `proc.kill("SIGKILL")`, you're sending SIGKILL to the process group, which means:
- The parent process dies
- All children of that process die
- The browser instance terminates
- All temporary files/resources are cleaned up

This is the correct and complete way to terminate a Playwright process and is already implemented. The global pkill commands are redundant and harmful.

**Related Documentation**:
- Diagnosis: #906
- E2E Testing Fundamentals: `.ai/ai_docs/context-docs/testing+quality/e2e-testing.md`
- Test Infrastructure: `.ai/ai_scripts/testing/infrastructure/safe-test-runner.sh`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #906*
