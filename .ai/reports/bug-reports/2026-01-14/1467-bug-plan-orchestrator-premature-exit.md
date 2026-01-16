# Bug Fix: Orchestrator Premature Exit When All Sandboxes Fail Simultaneously

**Related Diagnosis**: #1466
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Work loop exits when `activeWork.size === 0` without checking for retryable (failed) features without dependencies
- **Fix Approach**: Check for ANY retryable features before exiting the work loop, regardless of dependency status
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Orchestrator exits prematurely after approximately 6 minutes when all three sandboxes experience simultaneous startup failures. The work loop in `runWorkLoop()` has a flawed exit condition that only checks for blocked features WITH dependencies, ignoring failed features without dependencies. This causes the orchestrator to exit even though retryable features exist.

For full details, see diagnosis issue #1466.

### Solution Approaches Considered

#### Option 1: Fix Exit Condition to Check ALL Retryable Features ⭐ RECOMMENDED

**Description**: Modify the exit condition in the work loop to check for ANY retryable features (pending OR failed), regardless of whether they have dependencies. Only exit if no retryable features exist.

**Pros**:
- Minimal code change (5-10 lines modified)
- Directly addresses root cause
- No architectural changes required
- Low risk of side effects
- Maintains existing retry logic

**Cons**:
- Does not prevent features from entering failed state due to sandbox retries
- Features will still fail if sandboxes exhaust retries (expected behavior)

**Risk Assessment**: low - Purely conditional logic change, no data mutation or infrastructure changes

**Complexity**: simple - Change only affects the exit condition check

#### Option 2: Track Feature Assignments Separately

**Description**: Maintain separate tracking of feature assignments vs active work, with explicit state transitions to "failed" before marking activeWork complete.

**Pros**:
- More explicit state tracking
- Better observability of feature status

**Cons**:
- Requires more extensive changes (20+ lines)
- Adds complexity to work loop logic
- Risk of introducing race conditions in concurrent updates
- May require changes to manifest structure

**Why Not Chosen**: Overengineering for this specific issue. The exit condition is the direct problem - fix that first, keep state tracking as-is.

#### Option 3: Implement Feature Assignment Timeout

**Description**: Add a timeout that forces feature state transition to "failed" if a feature stays in "in_progress" beyond a threshold.

**Pros**:
- Prevents infinite hangs if features get stuck

**Cons**:
- Adds complexity and configuration
- Requires careful timeout tuning
- May introduce false positives
- Masks the underlying exit condition bug

**Why Not Chosen**: The root cause is the exit condition logic, not missing timeouts. Timeout management is orthogonal and should be addressed separately if needed.

### Selected Solution: Fix Exit Condition to Check ALL Retryable Features

**Justification**: The root cause is clear from the diagnosis - the `blockedFeatures` filter only considers features WITH dependencies, ignoring failed features without dependencies. The fix is surgical: change the exit condition to check for ANY retryable features. This directly resolves the issue with minimal risk and no side effects.

**Technical Approach**:
1. Change `blockedFeatures` to `retryableFeatures` and remove the dependency filter
2. Check if retryable features exist before deciding to exit
3. Use `continue` instead of unconditional `break` when retryable features exist
4. Preserve existing logging for visibility

**Architecture Changes**: None - this is a pure logic fix with no architectural modifications.

**Migration Strategy**: Not applicable - this is a bug fix with no data migration.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/orchestrator.ts:702-718` - Work loop exit condition logic

### New Files

None required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Read and Understand Current Exit Logic

<describe what this step accomplishes>

- Read `.ai/alpha/scripts/lib/orchestrator.ts` focusing on lines 702-718
- Understand the current `blockedFeatures` filter and exit condition
- Identify the exact issue: filter only checks `dependencies.length > 0`
- Understand how `activeWork` is managed and when features are assigned/removed

**Why this step first**: You need to understand the exact code before making changes to avoid introducing new bugs.

#### Step 2: Implement the Fix

<describe what this step accomplishes>

- Change variable name from `blockedFeatures` to `retryableFeatures` for clarity
- Modify the filter to check for ANY features with status "pending" or "failed", removing the dependency check
- Change the exit logic: if `retryableFeatures.length === 0`, then `break`; otherwise `continue`
- Update comments to reflect the new logic

**Specific changes**:
```typescript
// OLD:
if (activeWork.size === 0) {
    const blockedFeatures = manifest.feature_queue.filter(
        (f) =>
            (f.status === "pending" || f.status === "failed") &&
            f.dependencies.length > 0,  // <-- REMOVE THIS FILTER!
    );
    // ...
    break;  // <-- UNCONDITIONAL EXIT!
}

// NEW:
if (activeWork.size === 0) {
    const retryableFeatures = manifest.feature_queue.filter(
        (f) => f.status === "pending" || f.status === "failed"
    );

    if (retryableFeatures.length === 0) {
        break;  // No work to do - exit
    }

    // Log blocked features for visibility
    // ... (preserve existing logging)

    continue;  // Continue loop to retry features
}
```

#### Step 3: Add/Update Tests

<describe the testing strategy>

- Add unit test for exit condition: loop should NOT exit when retryable features exist
- Add unit test for normal exit: loop SHOULD exit when no retryable features exist
- Add edge case test: features without dependencies should trigger retry attempts
- Add regression test: ensure features with dependencies still work correctly
- Update existing tests if any assert on the old behavior

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/orchestrator.spec.ts` - Add exit condition tests

#### Step 4: Manual Verification

- Run the orchestrator with test manifest containing:
  - All 3 sandboxes failing simultaneously
  - Mixed features with and without dependencies
- Verify orchestrator does NOT exit prematurely
- Verify failed features trigger retry attempts
- Verify orchestrator exits cleanly when all retries exhausted
- Check logs show retryable features being identified

#### Step 5: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions in existing tests
- Test all edge cases
- Confirm bug is fixed

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Exit condition: should NOT exit when retryable features exist
- ✅ Exit condition: SHOULD exit when no retryable features exist
- ✅ Retryable feature detection: features without dependencies are included
- ✅ Retryable feature detection: features with dependencies are included
- ✅ Edge case: empty feature queue should exit immediately
- ✅ Edge case: all features have status "succeeded" should exit
- ✅ Regression test: existing assignment logic still works

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/orchestrator.spec.ts` - Exit condition behavior tests

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Reproduce original bug (orchestrator exits at ~6min with retryable features)
- [ ] Apply fix and verify orchestrator continues running when retryable features exist
- [ ] Test with all 3 sandboxes failing: should retry features without dependencies
- [ ] Test with failed features that have dependencies: should remain blocked until dependencies resolve
- [ ] Verify logs identify which features are retryable and why
- [ ] Verify orchestrator eventually exits cleanly when all retries exhausted
- [ ] Verify no new log spam or performance degradation
- [ ] Run full test suite to catch regressions

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Infinite loop if retry condition never changes**: <description>
   - **Likelihood**: low - Features do eventually fail after N retries
   - **Impact**: medium - Orchestrator would hang indefinitely
   - **Mitigation**: Verify features transition to "failed" status before testing; add safeguard check for feature exhausted retries

2. **Regression in features with dependencies**: <description>
   - **Likelihood**: low - The dependency check is now removed from exit condition only
   - **Impact**: medium - Dependent features might behave unexpectedly
   - **Mitigation**: Run full test suite; specifically test features with complex dependency chains

3. **Unexpected behavior in edge cases**: <description>
   - **Likelihood**: low - Logic is straightforward
   - **Impact**: low - Would be caught by manual testing
   - **Mitigation**: Execute comprehensive manual testing checklist; test mixed dependency scenarios

**Rollback Plan**:

If this fix causes issues:
1. Revert changes to `.ai/alpha/scripts/lib/orchestrator.ts`
2. Redeploy orchestrator
3. Verify rollback restores previous behavior
4. Re-open diagnosis issue #1466 with additional context

**Monitoring** (if needed):
- Monitor orchestrator uptime for next 10 runs
- Watch for unexpected exits or hangs
- Alert if orchestrator runs exceed 30 minutes without progress

## Performance Impact

**Expected Impact**: none

The fix is purely logical - no additional computation, no new loops or lookups. Performance should be identical.

## Security Considerations

**Security Impact**: none

This is a control flow fix with no security implications. No data access changes, no permission model changes, no external API calls modified.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Orchestrator should exit at ~6 minutes with active "in_progress" features
# when all 3 sandboxes fail simultaneously
cd /home/msmith/projects/2025slideheroes
pnpm --filter @kit/alpha run orchestrator test-manifest.json

# Expected Result: Exit after ~6 minutes, features remain in "in_progress"
```

**Expected Result**: Orchestrator exits prematurely despite retryable features existing

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests for orchestrator
pnpm --filter @kit/alpha test:unit orchestrator.spec.ts

# Full test suite
pnpm test:unit

# Manual verification
# (Run orchestrator with same test scenario - should continue running)
pnpm --filter @kit/alpha run orchestrator test-manifest.json
```

**Expected Result**: All commands succeed, orchestrator continues running and eventually exits cleanly, zero regressions in other tests.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Additional regression checks
# - Verify features with dependencies still respect blocking
# - Verify feature assignment logic unchanged
# - Verify manifest state transitions unchanged
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] Exit condition logic is corrected per specification
- [ ] All validation commands pass
- [ ] Bug no longer reproduces (orchestrator continues with retryable features)
- [ ] All unit tests pass
- [ ] Zero regressions detected in full test suite
- [ ] Manual testing checklist complete
- [ ] Code review approved (if applicable)

## Notes

**Related Issues**:
- #1463 - Bug Diagnosis: Competing Retry Mechanisms (similar symptoms, different root cause)
- #1465 - Bug Fix: Competing Retry Mechanisms (timeout race fix, separate from this exit condition bug)

**Key Decision**: The exit condition is the ONLY fix needed. Do NOT modify the retry mechanism, timeout values, or feature state tracking. This is a surgical fix to the exit logic.

**Test Scenarios to Cover**:
1. All 3 sandboxes fail, features without dependencies should retry
2. Mixed features: some with dependencies, some without
3. Dependency chains: features waiting for dependencies should not be retried
4. Clean exit: when no retryable features exist, exit promptly
5. Edge case: empty feature queue should exit immediately

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1466*
