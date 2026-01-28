# Bug Fix: Alpha Orchestrator Resume Fails - Stale Sandbox IDs and Cascade Failure

**Related Diagnosis**: #1857 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Four compounding failures in resume/reconnection logic: (1) missing sandbox ID validation, (2) features marked failed instead of pending, (3) cascade failures for dependents, (4) deadlock not recovered
- **Fix Approach**: Validate sandbox existence, reset features to pending on sandbox death, prevent cascade failures, improve deadlock recovery with feature retry
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

When the Alpha orchestrator is stopped and resumed after a sandbox dies (either via E2B 1-hour timeout or manual termination), the resume logic fails to properly reconcile the mismatch between stored sandbox IDs and actual running sandboxes. This leads to:

1. Features marked `failed` instead of `pending` when their sandbox dies
2. Dependent features marked `failed` as cascade failures
3. Deadlock conditions where sbx-b is idle waiting for features that can never complete
4. No forward progress possible - orchestrator appears stuck

For full details, see diagnosis issue #1857.

### Solution Approaches Considered

#### Option 1: Multi-Part Fix with Validation + Reset + Deadlock Recovery ⭐ RECOMMENDED

**Description**: Implement a four-part fix that addresses each failure point:

1. **Validate sandbox IDs during reconnection** - Check each stored ID actually exists in E2B before considering reconnection successful. If sandbox doesn't exist, clear it and mark any in-progress features as pending (not failed) for reassignment.

2. **Reset features to pending instead of marking failed** - When a sandbox dies or can't be reconnected, reset all in-progress features on that sandbox to `pending` with a recovery reason. Only mark as `failed` if max retries exceeded.

3. **Prevent cascade failures** - Don't mark dependent features as failed. Let the dependency system naturally block them. They'll become available once their deps complete.

4. **Improve deadlock recovery** - When no work is available, detect if there are failed features with retry attempts remaining. Reset them to `pending` and continue. This breaks deadlock cycles.

**Pros**:
- Addresses root cause, not symptoms
- Allows legitimate recovery when sandboxes die unexpectedly
- Features can be retried across different sandboxes
- Maintains feature autonomy - features don't fail based on dependency status
- Clear separation of concerns - each fix handles one failure point
- Minimal code changes - surgical fixes to key functions

**Cons**:
- Requires changes across 4 different files
- Need to handle edge cases (manifest corruption, orphaned sandbox refs)
- Testing complexity increases with 4-part fix
- Requires coordination between work loop and deadlock handler

**Risk Assessment**: medium - Changes touch critical orchestration logic, but fixes are localized and well-tested patterns exist in codebase (see bug fix #1634, #1786)

**Complexity**: moderate - Most changes are conditional logic and state management, not architectural

#### Option 2: Simpler Force-Reset Approach

**Description**: On resume, detect stale/missing sandboxes and force-reset the entire manifest - mark all failed features as pending and clear bad sandbox IDs.

**Pros**:
- Much simpler - one-time reset on resume
- Guarantees no orphaned references
- Quick to implement

**Cons**:
- Too aggressive - resets successful completions if manifest is partially corrupted
- Loses information about which features were intentionally failed
- Doesn't fix the underlying reconnection validation logic
- Same problem recurs on next resume
- Bad UX - potential repeated loss of progress

**Why Not Chosen**: Fixes symptoms, not root cause. Would need to be run every time orchestrator resumes after interruption.

#### Option 3: Sandbox Registry Service

**Description**: Add a persistent sandbox registry that tracks sandbox lifecycle events and health. When resume happens, consult registry to determine if reconnection is safe.

**Pros**:
- Comprehensive audit trail
- Could prevent other sandbox issues

**Cons**:
- Over-engineered for this bug
- Adds new infrastructure component
- Increases maintenance burden
- Better suited for production monitoring, not orchestrator recovery

**Why Not Chosen**: Adds complexity without addressing the immediate reconnection validation gap.

### Selected Solution: Multi-Part Fix with Validation + Reset + Deadlock Recovery

**Justification**: This approach directly addresses the four identified failure points without over-engineering. The fixes are surgical, localized, and build on existing patterns in the codebase (bug fix #1634 handles sandbox expiration, bug fix #1786 handles promise recovery). By validating sandbox existence, resetting features to pending, and improving deadlock recovery, we allow the orchestrator to gracefully recover from sandbox death instead of getting stuck.

**Technical Approach**:

1. **Sandbox Validation**: Before attempting to reconnect, verify sandbox IDs exist using E2B SDK
2. **Feature Reset Logic**: When sandbox is missing/dead, reset in-progress features to pending (not failed)
3. **Cascade Prevention**: Only mark features failed after max retries exhausted, not because dependency failed
4. **Deadlock Recovery**: In deadlock handler, detect and retry failed features with retries remaining

**Architecture Changes**:
- `reconnectToStoredSandboxes()` → Add E2B SDK verification step
- `work-loop.ts` → Add feature reset logic when sandbox dies
- `deadlock-handler.ts` → Add feature retry detection and reset

No architectural changes - all modifications are within existing components.

**Migration Strategy**:
- No data migration needed
- Feature state already supports `pending` status
- Manifest structure unchanged
- Backward compatible - old manifests work fine

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/orchestrator.ts` - Reconnection validation (lines 586-629)
- `.ai/alpha/scripts/lib/work-loop.ts` - Feature reset on sandbox death (lines 336-413)
- `.ai/alpha/scripts/lib/deadlock-handler.ts` - Feature retry detection in deadlock recovery
- `.ai/alpha/scripts/lib/sandbox.ts` - `reconnectToStoredSandboxes()` function and E2B validation

### New Files

No new files needed. All changes are within existing modules.

### Step-by-Step Tasks

#### Step 1: Add Sandbox Verification to Reconnection Logic

<describe what this step accomplishes>

Update `reconnectToStoredSandboxes()` in `sandbox.ts` to verify each stored sandbox ID actually exists:

- Call E2B SDK `sandbox.list()` to get all active sandbox IDs
- For each stored ID, check if it exists in active list AND is healthy
- Remove IDs that don't exist from manifest
- Return only successfully reconnected sandboxes
- Log verification results for debugging

**Why this step first**: This is the detection step - we must identify missing sandboxes before we can recover from them.

#### Step 2: Implement Feature Reset on Sandbox Death

Update work-loop.ts health check and keepalive logic to reset features instead of marking them failed:

- When `restartFailedSandbox()` is called (line 202), check for in-progress features on that sandbox
- Reset features to `pending` instead of leaving them `failed`
- Set error message to "Sandbox died - retrying on another sandbox" not "Sandbox is probably not running anymore"
- Increment retry count if already has one
- Only mark `failed` if retry count reaches max (DEFAULT_MAX_RETRIES from work-queue.ts)

**Diff location**: `work-loop.ts` lines 202-237 (restartFailedSandbox method)

#### Step 3: Improve Deadlock Handler to Detect Retryable Failed Features

Update `detectAndHandleDeadlock()` in `deadlock-handler.ts`:

- When no work is available and some features are `failed`, check if they can be retried
- For each failed feature, call `shouldRetryFailedFeature(feature, DEFAULT_MAX_RETRIES)`
- If retry is possible, reset feature to `pending` and increment retry_count
- Log the recovery action
- Return count of features retried so main loop knows work is available

**Diff location**: `deadlock-handler.ts` - add feature retry detection

#### Step 4: Fix Cascade Failure Prevention

Update orchestrator/feature.ts startup logic:

- When reconnection partial (some sandboxes reconnect, others fail), don't cascade-mark dependent features as failed
- Only mark a feature failed if:
  - It was running on the dead sandbox AND
  - It has exceeded max retries OR explicitly marked failed
- Leave dependent features in `pending` state - they'll be blocked by unmet dependencies naturally

#### Step 5: Add Regression Tests

Add tests to verify:

- ✅ `reconnectToStoredSandboxes()` returns only verified sandboxes
- ✅ Features on dead sandboxes are reset to `pending` (not `failed`)
- ✅ Retry count increments on each reset
- ✅ Features fail only after max retries exhausted
- ✅ Deadlock handler detects and retries failed features
- ✅ Cascade failures don't occur - dependents stay pending
- ✅ Manifest is saved after each reset
- ✅ No orphaned sandbox IDs in manifest after resume

**Test files**:
- `.ai/alpha/scripts/__tests__/sandbox.spec.ts` - Reconnection validation
- `.ai/alpha/scripts/__tests__/work-loop.spec.ts` - Feature reset logic
- `.ai/alpha/scripts/__tests__/deadlock-handler.spec.ts` - Feature retry detection

#### Step 6: Documentation Updates

- Add inline comments in `reconnectToStoredSandboxes()` explaining E2B verification
- Document the feature reset logic in `work-loop.ts`
- Update CLAUDE.md with recovery behavior expectations

## Testing Strategy

### Unit Tests

Add unit tests for:
- ✅ E2B sandbox verification logic returns correct list of active sandboxes
- ✅ Feature reset on sandbox death increments retry count
- ✅ Feature marked failed only after max retries exceeded
- ✅ Cascade failures don't occur (dependent features stay pending)
- ✅ Deadlock handler correctly identifies retryable failed features
- ✅ Manifest saved after feature reset
- ✅ Edge case: all sandboxes die → all features reset to pending
- ✅ Edge case: partial reconnection → some features stay assigned, some reset
- ✅ Regression test: original bug scenario no longer occurs

**Test files**:
- `sandbox.spec.ts` - E2B verification
- `work-loop.spec.ts` - Feature reset and retry logic
- `deadlock-handler.spec.ts` - Deadlock recovery with feature retry

### Integration Tests

Test full orchestrator scenarios:
- Resume after partial sandbox death (1 of 3 sandboxes dies)
- Resume after all sandboxes die
- Feature progression through retry cycle
- Deadlock detection and recovery
- No phantom failures

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] **Partial sandbox death**: Start orchestrator with 3 sandboxes, kill 1, resume → features reset and continue
- [ ] **All sandboxes die**: Stop orchestrator, let all sandboxes expire, resume → features reset, new sandboxes created, work continues
- [ ] **Retry progression**: Feature with max retries = 3 dies and is retried 3 times, then marked failed
- [ ] **Cascade prevention**: Feature depends on failed feature → dependent stays pending (not marked failed)
- [ ] **Deadlock recovery**: Deadlock detected, retryable features are reset, deadlock broken
- [ ] **No UI regressions**: Overall progress, UI updates, progress files all correct
- [ ] **Manifest integrity**: No orphaned sandbox IDs, feature states correct, retry counts accurate
- [ ] **Git operations**: Features still push changes correctly after reconnect

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Infinite retry loops**: If retry detection isn't careful, features could retry forever
   - **Likelihood**: medium
   - **Impact**: high (orchestrator hangs)
   - **Mitigation**: Always check `shouldRetryFailedFeature()` before retry, enforce DEFAULT_MAX_RETRIES limit, add retry count logging

2. **Cascade of errors**: If feature reset isn't done carefully, could corrupt manifest
   - **Likelihood**: low
   - **Impact**: high (orchestrator stuck)
   - **Mitigation**: Always call `saveManifest()` after reset, validate manifest integrity on load, test manifest recovery

3. **Incorrect E2B SDK calls**: E2B API changes or unexpected responses
   - **Likelihood**: low
   - **Impact**: medium (reconnection fails)
   - **Mitigation**: Wrap E2B calls in try-catch, log full responses, test with real E2B API

4. **Performance regression**: Frequent sandbox verification could slow down loops
   - **Likelihood**: low
   - **Impact**: low (UI perception)
   - **Mitigation**: Verify only on reconnect, not in main loop; cache verification results

**Rollback Plan**:

If this fix causes issues in production (orchestrator gets stuck, features don't progress):

1. Revert commits to `sandbox.ts`, `work-loop.ts`, `deadlock-handler.ts`
2. Use fallback: manually reset manifest features from `failed` → `pending`
3. Restart orchestrator
4. Investigate root cause and redeploy

**Monitoring** (if in production):

- Monitor orchestrator process health (restarts, hangs)
- Watch for retry count growth (indicates features thrashing)
- Alert on deadlock conditions persisting >5 minutes
- Log sandbox verification failures

## Performance Impact

**Expected Impact**: minimal

- E2B verification happens only during reconnection (not common)
- Feature reset is O(n) where n = features on dead sandbox (typically 1-3)
- Deadlock detection already exists, just enhanced
- No new loops or expensive operations

**Performance Testing**:
- Verify reconnection adds <1 second overhead
- Verify deadlock detection adds <100ms overhead
- Verify manifest save is fast (typically <10ms)

## Security Considerations

**Security Impact**: low

- Feature reset doesn't expose secrets or credentials
- Retry logic doesn't add network calls
- Manifest modifications are local to orchestrator
- No authentication changes

**Security considerations**: None

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start orchestrator with spec S1823
cd /home/msmith/projects/2025slideheroes
tsx .ai/alpha/scripts/spec-orchestrator.ts 1823 --ui

# Let it run, stop with Ctrl+C after sandboxes are created
# Restart with --force-unlock
tsx .ai/alpha/scripts/spec-orchestrator.ts 1823 --force-unlock --ui

# Expected Result: Sandboxes appear idle, no progress made
# Manifest shows failed features that should be retried
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Unit tests for orchestrator modules
pnpm --filter @kit/next test -- __tests__/(sandbox|work-loop|deadlock-handler).spec.ts

# Integration test for orchestrator
pnpm --filter @kit/next test -- __tests__/orchestrator-integration.spec.ts

# Build
pnpm build

# Manual orchestrator test (see Manual Testing Checklist above)
cd /home/msmith/projects/2025slideheroes
tsx .ai/alpha/scripts/spec-orchestrator.ts 1823 --ui
# Let it progress, verify sandbox restart behavior
```

**Expected Result**:
- All tests pass
- Orchestrator successfully resumes after sandbox failure
- Features are retried on remaining/new sandboxes
- Progress visible in UI
- No stuck/deadlocked state

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify orchestrator still works on fresh start
tsx .ai/alpha/scripts/spec-orchestrator.ts 1823 --ui --dry-run

# Check manifest validation
node -e "
const manifest = require('./.ai/alpha/specs/S1823-Spec-user-dashboard/spec-manifest.json');
console.log('Sandbox IDs:', manifest.sandbox.sandbox_ids);
console.log('Failed features:', manifest.feature_queue.filter(f => f.status === 'failed').map(f => f.id));
"
```

## Dependencies

### New Dependencies

No new dependencies required. All fixes use existing SDK calls and functions.

## Database Changes

**Database changes**: No

All changes are orchestrator logic and manifest state management. No database schema changes needed.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- None - code change only
- No database migrations
- No environment variable changes
- Backward compatible with existing manifests

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Bug scenario no longer reproduces (orchestrator resumes successfully)
- [ ] All unit tests pass (sandbox, work-loop, deadlock-handler)
- [ ] Integration tests pass (orchestrator full cycle)
- [ ] Zero regressions detected in existing tests
- [ ] Manual testing checklist complete (all 8 scenarios pass)
- [ ] Code review approved
- [ ] Performance acceptable (no slowdowns)
- [ ] Security considerations addressed (none identified)

## Notes

### Implementation Order is Critical

The four fixes must be implemented in this order:

1. **Sandbox verification** - Detection must come before recovery
2. **Feature reset** - Recovery must happen when sandbox dies
3. **Deadlock recovery** - Must pick up retryable features
4. **Cascade prevention** - Must prevent false failure propagation

### Key Files Summary

| File | Change | Lines | Reason |
|------|--------|-------|--------|
| `sandbox.ts` | Add E2B verification to `reconnectToStoredSandboxes()` | ≈20 | Validate sandbox existence |
| `work-loop.ts` | Reset features to pending in `restartFailedSandbox()` | ≈15 | Recover features from dead sandbox |
| `deadlock-handler.ts` | Add feature retry detection | ≈30 | Break deadlock with feature retry |
| `orchestrator.ts` | (Optional) Improve logging on reconnection | ≈5 | Better diagnostics |

### Related Issues

- Bug fix #1634: "Handle expired E2B sandboxes on restart" - Similar reconnection logic
- Bug fix #1786: "Promise timeout detection" - Similar recovery patterns
- Bug fix #1841: "Work loop recovery" - Sentinel for handling stuck promises

### Testing Notes

The orchestrator is difficult to test end-to-end because it requires real E2B sandboxes. Consider:

1. **Unit tests** - Mock E2B SDK and manifest operations
2. **Integration tests** - Use real E2B API with test sandbox
3. **Manual testing** - Required for full confidence

The reproduction scenario in "Validation Commands" section is straightforward and should be used for final verification.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1857*
