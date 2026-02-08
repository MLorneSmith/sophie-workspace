# Bug Fix: Review Sandbox Creation Times Out During Completion Phase

**Related Diagnosis**: #1739 (REQUIRED)
**Severity**: high
**Bug Type**: timeout
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Outer timeout wrapper (5 minutes / 300 seconds) is shorter than internal `pnpm install` timeout (10 minutes / 600 seconds)
- **Fix Approach**: Increase outer timeout from 300 seconds to 600 seconds to match or exceed internal operation timeout
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha orchestrator's completion phase fails to create a review sandbox, timing out at exactly 5 minutes. The root cause is a mismatch in timeout configurations:

- **Outer timeout** (orchestrator.ts:1596): 300,000 ms (5 minutes)
- **Inner timeout** (pnpm install in createReviewSandbox): 600,000 ms (10 minutes)

When dependencies take longer than 5 minutes to install on a fresh E2B sandbox, the outer wrapper cancels the operation before the inner operation completes, resulting in: `"No review sandbox available - could not start dev server"` error.

For full details, see diagnosis issue #1739.

### Solution Approaches Considered

#### Option 1: Increase Outer Timeout to 10 Minutes ⭐ RECOMMENDED

**Description**: Update the `withTimeout()` wrapper in orchestrator.ts:1596 from 300,000 ms (5 minutes) to 600,000 ms (10 minutes).

**Pros**:
- Surgical fix requiring only a single line change
- Aligns outer timeout with inner operation timeout
- Matches realistic operation times documented in comments
- Minimal risk of side effects
- Solves the immediate problem completely
- Requires no additional testing beyond regression verification

**Cons**:
- Could potentially mask other performance issues (though this is appropriate for legitimate long operations)
- Slightly increases orchestrator completion time on failure cases

**Risk Assessment**: low - Simple constant change, no logic modifications, no RLS or data integrity impacts

**Complexity**: simple - Single value update

#### Option 2: Reduce Inner Timeout to 5 Minutes

**Description**: Decrease the internal `pnpm install` timeout within `createReviewSandbox()` from 600,000 ms to 300,000 ms.

**Why Not Chosen**:
- `pnpm install` legitimately takes 100+ seconds on fresh sandboxes (documented in comment)
- Reducing to 5 minutes would create false timeouts and break valid operations
- Would require rollout to all installations to fix timeout behavior
- Less reliable than increasing the wrapper timeout

#### Option 3: Implement Exponential Backoff + Retry

**Description**: Add retry logic with exponential backoff to handle transient failures.

**Why Not Chosen**:
- This is not a transient/intermittent failure - it's a consistent timeout
- Adds unnecessary complexity for a straightforward timeout configuration issue
- Retries would compound the delay without solving the root cause
- Over-engineering for a simple fix

### Selected Solution: Increase Outer Timeout to 10 Minutes

**Justification**:
This is a straightforward timeout configuration mismatch. The outer timeout wrapper is shorter than the legitimate internal operation timeout. Increasing the outer timeout to match the inner timeout is the minimal, safe fix that aligns with the documented realistic operation times (pnpm install: 100+ seconds, git operations: 20-40 seconds each).

**Technical Approach**:
- Change `300000` (300 seconds / 5 minutes) to `600000` (600 seconds / 10 minutes)
- This matches the documented timeout for the internal pnpm install operation
- Maintains the safety of the timeout mechanism while preventing premature cancellation

**Architecture Changes**: None - this is a configuration adjustment only

**Migration Strategy**: Not applicable - no data or state changes

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/orchestrator.ts` - Line 1596: Update `withTimeout()` call with new timeout value

### New Files

None required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update Timeout Configuration

Increase the outer timeout wrapper for review sandbox creation from 5 minutes to 10 minutes.

- Open `.ai/alpha/scripts/lib/orchestrator.ts`
- Navigate to line 1596 (the `withTimeout()` call for `createReviewSandbox`)
- Change the timeout parameter from `300000` to `600000`
- Save the file

**Why this step first**: This is the only code change needed. It directly addresses the root cause identified in the diagnosis.

#### Step 2: Verify Timeout Logic

Ensure the timeout configuration is now consistent across all operations.

- Verify line 1596 now reads: `600000` (10 minutes)
- Cross-reference the `pnpm install` timeout in `sandbox.ts` (should be 600000 or matching)
- Confirm no other `withTimeout()` calls have similar conflicts

#### Step 3: Add Test Coverage

Create a test or validation to prevent regression.

- Add a unit test that verifies timeout values are consistent between wrapper and inner operations
- Alternatively, add a comment documenting the timeout alignment requirement
- Consider adding timeout configuration documentation in the orchestrator

#### Step 4: Manual Validation

Test the fix with the original reproduction steps.

- Run `tsx .ai/alpha/scripts/spec-orchestrator.ts 0000 --force-unlock --reset`
- Wait for features to complete
- Observe that review sandbox creation completes successfully (within 10 minutes)
- Verify no timeout error occurs
- Confirm dev server starts successfully

#### Step 5: Verification

Ensure the fix is complete and has no side effects.

- Run all validation commands (see Validation Commands section)
- Test that orchestrator completion phase works end-to-end
- Verify no regressions in other timeout operations

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Timeout configuration values are aligned between wrapper and internal operations
- ✅ `createReviewSandbox()` completes within the specified timeout on normal conditions
- ✅ Timeout errors still occur when operations genuinely exceed the timeout

**Test files**:
- `.ai/alpha/scripts/__tests__/orchestrator.spec.ts` - Timeout consistency checks
- `.ai/alpha/scripts/__tests__/sandbox.spec.ts` - Review sandbox creation timeout behavior

### Integration Tests

- Verify orchestrator completion phase succeeds with timeout increase
- Test end-to-end feature completion including review sandbox creation
- Verify timeout still triggers on genuinely slow operations

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run reproduction steps from diagnosis (spec-orchestrator.ts)
- [ ] Observe review sandbox creation completes successfully
- [ ] Verify sandbox dev server starts and loads
- [ ] Check no timeout errors in logs
- [ ] Confirm orchestrator completion phase completes successfully
- [ ] Test with fresh sandbox (highest dependency install time)
- [ ] Verify timeout still works for genuinely slow operations

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Extended Orchestrator Completion Time**:
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Only affects timeout-exceeded scenarios; normal operations are unaffected. The 10-minute timeout still ensures processes don't hang indefinitely.

2. **Masking Genuine Performance Issues**:
   - **Likelihood**: low
   - **Impact**: medium
   - **Mitigation**: This is appropriate for legitimate long operations like `pnpm install` on fresh sandboxes. The timeout still catches hung processes.

3. **Timeout Values Drifting Again in Future**:
   - **Likelihood**: medium
   - **Impact**: low
   - **Mitigation**: Add validation in tests or comments to ensure timeout alignment remains synchronized.

**Rollback Plan**:

If this fix causes issues:
1. Revert the timeout value in `orchestrator.ts:1596` back to `300000`
2. Restart the orchestrator
3. Consider investigating actual performance issues if the increase is still insufficient

**Monitoring** (optional):

No special monitoring needed. The timeout will continue to function as designed, just with a longer threshold.

## Performance Impact

**Expected Impact**: minimal

The 10-minute timeout only affects scenarios where operations take 5-10 minutes. For normal operations completing in under 5 minutes, there is zero performance change. For operations that were timing out at 5 minutes before, they now have a fair chance to complete.

**Performance Testing**:
- No special performance testing needed; this is a configuration adjustment
- Monitor orchestrator logs to verify review sandbox creation now completes successfully

## Security Considerations

No security implications. This is a timeout configuration adjustment with no changes to access control, validation, or security policies.

**Security Impact**: none

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# The current code times out at 5 minutes during review sandbox creation
tsx .ai/alpha/scripts/spec-orchestrator.ts 0000 --force-unlock --reset

# Expected behavior: Observes "No review sandbox available - could not start dev server" error
# Timeline: Exactly 5 minutes between feature completion and error
```

**Expected Result**: Timeout error occurs at exactly 5 minutes (300 seconds)

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

# Run reproduction steps again
tsx .ai/alpha/scripts/spec-orchestrator.ts 0000 --force-unlock --reset

# Run orchestrator end-to-end test (if exists)
pnpm test:alpha-orchestrator
```

**Expected Result**: All commands succeed. Review sandbox creation completes successfully. No timeout errors.

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Specifically test orchestrator and sandbox creation
pnpm test:alpha

# Check timeout behavior across all withTimeout calls
grep -r "withTimeout" .ai/alpha/scripts/ --include="*.ts"
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

## Database Changes

**No database changes required**

This is a configuration fix in the TypeScript orchestrator with no schema or data modifications.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

The fix is a simple constant value change in a TypeScript file. Standard deployment procedures apply:
- Rebuild application
- Deploy to sandbox or staging
- Test reproduction steps
- Deploy to production

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] Timeout value in `orchestrator.ts:1596` changed from `300000` to `600000`
- [ ] Type checking passes without errors
- [ ] Linting passes without errors
- [ ] Build succeeds without warnings related to this change
- [ ] Reproduction steps no longer timeout at 5 minutes
- [ ] Review sandbox creation completes successfully
- [ ] Orchestrator completion phase works end-to-end
- [ ] No regressions detected in other timeout operations
- [ ] Manual testing checklist complete

## Notes

**Rationale for Simple Fix**: This is a classic timeout configuration mismatch bug. The diagnosis clearly identified that:
- The outer timeout (300s) is shorter than the inner operation's timeout (600s)
- The exact 5-minute delay matches the outer timeout perfectly
- The inner operation (pnpm install) legitimately takes 100+ seconds on fresh sandboxes

Therefore, increasing the outer timeout to match the inner timeout is the correct fix. No architectural changes, retry logic, or redesigns are needed.

**Related Issues**:
- Bug fix #1727: Completion lifecycle redesign (related context)
- Bug fix #1724: Dev server startup timeout (related context)

**Documentation References**:
- E2B Sandbox: `.ai/ai_docs/context-docs/infrastructure/e2b-sandbox.md`
- Architecture: `.ai/ai_docs/context-docs/development/architecture-overview.md`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1739*
