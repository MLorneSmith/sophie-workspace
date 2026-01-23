# Bug Fix: Missing Dev Server URL on Orchestrator Completion Screen

**Related Diagnosis**: #1731
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Review sandbox creation times out at 60 seconds but requires 40-150+ seconds to complete
- **Fix Approach**: Increase timeout from 60 seconds to 300 seconds (5 minutes) to accommodate realistic sandbox creation time
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

When the Alpha Orchestrator completes spec implementation and displays the completion screen, the dev server URL is missing because the review sandbox creation is wrapped in a 60-second timeout, but the actual operations (E2B sandbox creation, git fetch/checkout/pull, pnpm install) require 40-150+ seconds to complete.

For full details, see diagnosis issue #1731.

### Solution Approaches Considered

#### Option 1: Increase Timeout to 5 Minutes ⭐ RECOMMENDED

**Description**: Increase the outer timeout wrapper from 60 seconds to 300 seconds (5 minutes) to accommodate realistic sandbox creation operations. This matches the individual operation timeouts already configured within `createReviewSandbox()`:
- `pnpm install`: 600s (10 min)
- `git fetch`: 120s (2 min)
- `git checkout`: 60s (1 min)
- `git pull`: 60s (1 min)
- `build`: 120s (2 min)

**Pros**:
- Minimal code change (single line)
- Matches realistic operation times observed in production
- No architectural changes required
- Maintains existing error handling and timeout logic
- Conservative 5-minute timeout provides safety net while allowing operations to complete

**Cons**:
- Users may wait longer if sandbox creation genuinely hangs (mitigated by individual operation timeouts)
- Does not address underlying slowness of operations (out of scope for this bug)

**Risk Assessment**: low - This is a configuration change that increases an existing timeout to match realistic operation times

**Complexity**: simple - Single-line change to timeout value

#### Option 2: Make Review Sandbox Creation Non-Blocking

**Description**: Remove the outer timeout wrapper entirely and allow review sandbox creation to complete in the background, displaying the URL when ready.

**Pros**:
- No timeout concerns
- Could improve perceived completion speed
- More flexible architecture

**Cons**:
- Requires significant architectural changes to handle async URL display
- Increases complexity of UI state management
- No timeout protection if operations genuinely hang
- User experience becomes unpredictable (when will URL appear?)
- Out of scope for this bug (architectural refactor)

**Why Not Chosen**: Overly complex solution for a simple timeout misconfiguration

#### Option 3: Optimize Individual Operations

**Description**: Optimize each operation (git fetch, pnpm install, etc.) to complete faster, keeping the 60-second timeout.

**Pros**:
- Addresses underlying slowness
- Could improve overall orchestrator performance

**Cons**:
- Out of scope for this bug
- Some operations (network I/O, npm registry) are inherently slow
- Requires extensive research and testing
- May not be feasible to get under 60 seconds consistently

**Why Not Chosen**: Not a bug fix, would be a separate performance optimization initiative

### Selected Solution: Increase Timeout to 5 Minutes

**Justification**: This is the simplest, lowest-risk fix that directly addresses the root cause. The 60-second timeout was an arbitrary choice that doesn't match the realistic time requirements of the operations being performed. Increasing it to 300 seconds provides a reasonable safety net while allowing operations to complete normally.

**Technical Approach**:
- Change timeout value from 60000ms to 300000ms at line 1595
- No other code changes required
- Maintains existing error handling and timeout logic
- Individual operations already have their own timeouts (up to 600s for pnpm install)

**Architecture Changes**: None - this is a configuration adjustment

**Migration Strategy**: Not needed - no breaking changes or data migrations

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/orchestrator.ts` - Line 1595: Change timeout from 60000 to 300000

### New Files

None - no new files needed

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update Timeout Value

Update the timeout value in orchestrator.ts

- Open `.ai/alpha/scripts/lib/orchestrator.ts`
- Navigate to line 1595
- Change `60000` to `300000`
- Add comment explaining the timeout value matches realistic operation times

**Why this step first**: This is the complete fix - single line change

#### Step 2: Verify No Other Timeout Issues

Review the createReviewSandbox function to ensure individual operation timeouts are still appropriate

- Confirm `pnpm install` timeout is 600000ms (10 minutes) - line 879
- Confirm `git fetch` timeout is 120000ms (2 minutes) - line 856
- Confirm `git checkout` timeout is 60000ms (1 minute) - line 862
- Confirm `git pull` timeout is 60000ms (1 minute) - line 868
- Confirm `build` timeout is 120000ms (2 minutes) - line 886
- These are already configured correctly

#### Step 3: Add Unit Tests for Timeout Logic

Add test to verify timeout behavior (if testing infrastructure supports async timeout testing)

- Consider adding a test that verifies the timeout is set to 300000ms
- Consider adding a test that simulates slow sandbox creation (mocked)
- Test should verify timeout error is thrown after 300s, not 60s

**Note**: May need to investigate existing test patterns for orchestrator module

#### Step 4: Manual Testing

Test the fix manually by running the orchestrator

- Run `/alpha:implement` on a spec
- Verify completion screen shows dev server URL
- Verify no timeout errors occur during review sandbox creation
- Verify timing logs show sandbox creation completed within 300s window

#### Step 5: Code Review and Documentation

- Review change with team
- Update any documentation that references the 60-second timeout
- Add inline comment explaining the 5-minute timeout choice

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Timeout value is 300000ms (5 minutes)
- ✅ Review sandbox creation completes within timeout
- ✅ Timeout error is thrown if operations exceed 300s
- ✅ Individual operation timeouts are still respected
- ✅ Regression test: 60-second timeout would fail (mock slow operation)

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/orchestrator.test.ts` - Test timeout configuration

**Note**: Need to investigate existing test infrastructure for orchestrator module. May need to add new test file if none exists.

### Integration Tests

Not applicable - this is a timeout configuration change, no integration testing needed beyond manual verification.

### E2E Tests

Not applicable - orchestrator completion flow is already tested in the Alpha workflow. This change should make those tests more reliable.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `/alpha:implement` on an existing spec
- [ ] Monitor orchestrator logs for review sandbox creation timing
- [ ] Verify completion screen displays dev server URL
- [ ] Verify no timeout errors occur
- [ ] Verify timing is between 60-300 seconds (should complete within new window)
- [ ] Check that error handling still works if sandbox creation fails
- [ ] Verify sandbox cleanup still occurs properly

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Longer Wait Time for Genuine Hangs**: Users may wait up to 5 minutes instead of 60 seconds if sandbox creation genuinely hangs
   - **Likelihood**: low (individual operations have their own timeouts)
   - **Impact**: low (users already experience similar waits in normal operation)
   - **Mitigation**: Individual operations already have timeouts (up to 10 minutes for pnpm install), so the outer 5-minute timeout is actually more restrictive than some inner timeouts. This means genuine hangs will still be caught relatively quickly.

2. **No Risk Identified for Normal Operation**: In normal operation, this change only removes false-positive timeouts
   - **Likelihood**: n/a
   - **Impact**: positive (bug is fixed)
   - **Mitigation**: n/a

**Rollback Plan**:

If this fix causes issues in production (extremely unlikely):
1. Revert the single-line change (300000 back to 60000)
2. Commit and push
3. Re-deploy

**Monitoring**: Not needed - this is a timeout configuration change

## Performance Impact

**Expected Impact**: none to positive

This change does not affect performance of the operations themselves. It only removes a premature timeout that was causing operations to fail before completing. Users may experience slightly longer wait times in edge cases where operations take 60-150 seconds, but they will now get successful results instead of timeout errors.

**Performance Testing**:
- Monitor orchestrator completion logs to verify sandbox creation completes within 5-minute window
- Confirm typical completion time is 60-150 seconds

## Security Considerations

**Security Impact**: none

This is a timeout configuration change with no security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run orchestrator on a spec - observe timeout error after 60 seconds
pnpm tsx .ai/alpha/scripts/orchestrator.ts --spec S1692-Spec-user-dashboard

# Expected output in logs around 60-second mark:
# ⚠️ Failed to create review sandbox: Timeout after 60000ms: Review sandbox creation
```

**Expected Result**: Review sandbox creation times out after 60 seconds, dev server URL missing from completion screen

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Build
pnpm build

# Manual verification - run orchestrator
pnpm tsx .ai/alpha/scripts/orchestrator.ts --spec S1692-Spec-user-dashboard

# Verify in logs:
# ✅ Review sandbox created successfully
# Completion screen shows dev server URL
```

**Expected Result**: All commands succeed, review sandbox completes within 300s, dev server URL appears on completion screen

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify orchestrator still handles errors properly
# (simulate by temporarily breaking git credentials or network)
```

## Dependencies

### New Dependencies

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - standard deployment process

**Feature flags needed**: no

**Backwards compatibility**: maintained - this is a timeout increase, no breaking changes

## Success Criteria

The fix is complete when:
- [ ] Timeout value changed from 60000 to 300000 in orchestrator.ts:1595
- [ ] All validation commands pass (typecheck, lint, format, build)
- [ ] Manual testing shows dev server URL appears on completion screen
- [ ] No timeout errors occur during review sandbox creation
- [ ] Completion time is within 60-300 second window
- [ ] Code review approved (if applicable)
- [ ] Unit tests added/updated (if test infrastructure allows)

## Notes

### Context on Timeout Values

The `createReviewSandbox()` function performs several operations with individual timeouts:
- `pnpm install --frozen-lockfile`: 600s (10 min) - slowest operation
- `pnpm --filter @kit/shared build`: 120s (2 min)
- `git fetch origin`: 120s (2 min)
- `git checkout`: 60s (1 min)
- `git pull`: 60s (1 min)

The outer timeout of 60s was too aggressive and didn't account for the cumulative time of these operations (40-150+ seconds in practice). The new 5-minute timeout provides a reasonable safety net while allowing normal operations to complete.

### Related Work

- #1727 (CLOSED): Completion phase redesign that introduced this issue
- #1720: Related orchestrator completion phase work

### Future Optimization Opportunities (Out of Scope)

While this fix addresses the immediate bug, there are potential optimizations for future consideration:
1. Cache dependencies between sandboxes to speed up `pnpm install`
2. Use shallow git clones for faster checkout
3. Parallelize independent operations (git fetch + build setup)
4. Consider progressive UI updates (show URL when available, not just at completion)

These are architectural improvements outside the scope of this bug fix.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1731*
