# Bug Fix: Alpha Orchestrator Premature Exit Due to Competing Retry Mechanisms

**Related Diagnosis**: #1463
**Severity**: high
**Bug Type**: race condition
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Race condition between health check timeout (3 min) and feature startup retry loop (~3.25 min)
- **Fix Approach**: Increase `STARTUP_OUTPUT_TIMEOUT_MS` from 3 to 5 minutes in health.ts
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Orchestrator exits prematurely at 5-6 minutes despite sandboxes actively working. The root cause is a collision between two competing timeout mechanisms:

1. **feature.ts startup retry loop**: Handles startup hangs with 60s timeout + 3 retries (~3.25 min total)
2. **health.ts health check**: Triggers "startup hung" detection at 3 minutes (`STARTUP_OUTPUT_TIMEOUT_MS`)

When Claude CLI hangs during OAuth (only produces 2 output lines), the health check fires at 3 minutes and kills the process while the retry loop is still handling it. This causes all 3 sandboxes to fail simultaneously, triggering the `activeWork.size === 0` exit condition.

For full details, see diagnosis issue #1463.

### Solution Approaches Considered

#### Option 1: Increase STARTUP_OUTPUT_TIMEOUT_MS ⭐ RECOMMENDED

**Description**: Simply increase the `STARTUP_OUTPUT_TIMEOUT_MS` constant from 3 minutes to 5 minutes in health.ts:57. This ensures the health check's startup detection doesn't fire until after the feature.ts startup retry loop has completed its 3 attempts.

**Pros**:
- One-line change - surgical and minimal risk
- Follows the principle of least surprise (longer timeout allows longer retries)
- No state management or coordination needed
- Easy to understand and maintain
- Fixes the race condition by separating timeout windows

**Cons**:
- If startup really is hung, it takes 5 minutes instead of 3 to detect
- But this is acceptable because the retry loop won't finish until ~3.25 min anyway

**Risk Assessment**: Low - simple constant change with clear causality

**Complexity**: simple - one-line change

#### Option 2: Add Coordination Flag Between Retry Systems

**Description**: Add an `instance.startupRetryInProgress` flag that health check respects. feature.ts sets the flag when entering retry loop, health.ts skips startup hung detection if flag is set, feature.ts clears flag when retry completes.

**Pros**:
- More elegant coordination between systems
- Health check respects feature.ts retry attempts
- Could be extended to other coordination needs

**Cons**:
- More complex implementation (3+ files modified)
- Adds state management that could introduce new bugs
- Requires testing state transitions
- Overkill for a simple timeout conflict

**Why Not Chosen**: The simplicity of Option 1 outweighs the elegance of Option 2. We should avoid premature abstraction.

#### Option 3: Consolidate Retry Logic

**Description**: Move all startup retry handling to one place (either feature.ts or health.ts) to eliminate duplicate logic.

**Pros**:
- Eliminates the race condition at the source
- Single source of truth for startup handling

**Cons**:
- Major refactoring affecting multiple systems
- High risk of breaking existing functionality
- Significant testing burden
- Not necessary to fix the current bug

**Why Not Chosen**: This is over-engineering for the current problem. The bug is a simple timing issue, not a fundamental design flaw.

### Selected Solution: Increase STARTUP_OUTPUT_TIMEOUT_MS to 5 Minutes

**Justification**:

The timeout conflict is a simple timing issue where two independent timeout mechanisms happened to have misaligned windows (health check at 3 min, startup retry complete at ~3.25 min). By extending the health check timeout to 5 minutes, we give the startup retry loop time to complete all 3 attempts without interference. This is:

1. **Minimal** - One constant change
2. **Safe** - No new code paths or state management
3. **Justified** - The 3-minute health check timeout is arbitrary; 5 minutes is more reasonable given the retry loop timing
4. **Effective** - Completely eliminates the race condition by separating the timeout windows

**Technical Approach**:

The fix is straightforward:
- Increase `STARTUP_OUTPUT_TIMEOUT_MS` from `3 * 60 * 1000` to `5 * 60 * 1000` in `.ai/alpha/scripts/lib/health.ts:57`
- The health check will still detect true startup hangs, but with a more reasonable timeout window
- The startup retry loop (which completes in ~3.25 min) will finish before the health check fires
- No coordination flags or state changes needed

**Architecture Changes**: None - pure constant adjustment

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/health.ts:57` - `STARTUP_OUTPUT_TIMEOUT_MS` constant definition

### New Files

No new files needed.

### Step-by-Step Tasks

#### Step 1: Update the Timeout Constant

Update the `STARTUP_OUTPUT_TIMEOUT_MS` constant in health.ts to 5 minutes.

- Locate line 57 in `.ai/alpha/scripts/lib/health.ts`
- Change `const STARTUP_OUTPUT_TIMEOUT_MS = 3 * 60 * 1000;` to `const STARTUP_OUTPUT_TIMEOUT_MS = 5 * 60 * 1000;`
- Add a comment explaining the timeout relationship to the startup retry loop

**Why this step first**: This is the only code change needed. The constant is defined early and affects all health check behavior, so fixing it is sufficient.

#### Step 2: Test the Fix Locally

Verify the orchestrator works with the updated timeout.

- Run the spec orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
- Allow it to run past the 5-minute mark to verify it doesn't exit prematurely
- Monitor that the 3 sandboxes continue executing features

#### Step 3: Validate No Regressions

Ensure the longer timeout doesn't negatively impact other health checks.

- Verify health checks still catch actual startup problems (run a test that deliberately causes startup to fail)
- Check that other health check conditions (stale heartbeat, missing progress file) still work properly
- Confirm the UI still updates correctly during execution

#### Step 4: Code Quality

Run type checking and linting.

- `pnpm typecheck` - Verify no type errors
- `pnpm lint` - Check for linting issues

## Testing Strategy

### Unit Tests

No unit tests needed - this is a configuration constant change, not algorithmic.

### Integration Tests

**Test Case 1: Normal Feature Execution (Verification)**
- Run spec orchestrator with features that execute normally
- Verify all 3 sandboxes complete their features
- Verify orchestrator doesn't exit prematurely
- Timeline should be 10-15 minutes (depending on feature complexity)

**Test Case 2: Startup Hang Recovery (Regression)**
- Simulate a startup hang by blocking OAuth authentication
- Verify the startup retry loop triggers and retries (feature.ts)
- Verify health check doesn't interfere before retries complete
- Verify features eventually fail after 3 retries if hang persists
- Timeline: ~3-4 minutes to complete all retries

**Test Case 3: True Startup Failure (Regression)**
- Cause a real startup failure (e.g., broken command, missing dependency)
- Verify health check detects it within 5 minutes
- Verify feature is marked as failed appropriately
- Verify sandbox becomes available for next feature

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run orchestrator with spec #1362, observe it completes without premature exit
- [ ] Monitor the UI dashboard to verify 3 sandboxes stay active throughout
- [ ] Check progress file is being updated regularly (indicates active execution)
- [ ] Verify exit happens only when all features are completed or retries exhausted
- [ ] Monitor logs for no "startup hung" false positives during normal execution
- [ ] Test with different auth methods (API key, OAuth, cached) to ensure robustness
- [ ] Verify individual feature logs show proper startup output tracking
- [ ] Check memory usage doesn't increase significantly over 15+ minute run

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Longer Timeout Delays True Startup Problems**:
   - **Likelihood**: Low
   - **Impact**: Medium (5 min delay in detecting actual startup failure)
   - **Mitigation**: The startup retry loop detects hangs at 60s, so "true" startup failures (that don't hang) are caught immediately. The 5-minute timeout is only for detecting OAuth hangs that pass the 60s check.

2. **Timeout Window Still Misaligned with Other Systems**:
   - **Likelihood**: Low
   - **Impact**: Low (would manifest as different race condition)
   - **Mitigation**: We've analyzed the retry loop timing (3.25 min) and health check timing (now 5 min). No other systems depend on these specific windows.

3. **Unexpected Behavior Changes**:
   - **Likelihood**: Very Low
   - **Impact**: Low (only affects timeout constant)
   - **Mitigation**: This is a configuration constant with no logic changes. The behavior is deterministic and well-understood.

**Rollback Plan**:

If this fix causes unforeseen issues in production:
1. Revert the timeout change: `const STARTUP_OUTPUT_TIMEOUT_MS = 3 * 60 * 1000;`
2. Re-deploy and restart orchestrators
3. Investigate the specific failure mode (likely indicates a different issue)

**Monitoring** (if needed):
- Monitor orchestrator exit patterns for 24-48 hours after deployment
- Watch for "startup hung" health check logs appearing less frequently
- Alert if orchestrators exit in clusters again (would indicate persistence of race condition)

## Performance Impact

**Expected Impact**: Minimal

The only change is a timeout constant. There will be no observable performance difference. If anything, the 5-minute timeout slightly reduces CPU usage from rapid retries, but this is negligible.

## Security Considerations

**Security Impact**: None

This is a timeout constant change with no security implications. No credentials, validation logic, or access controls are affected.

## Validation Commands

### Before Fix (Bug Should Be Reproducible)

```bash
# Run orchestrator with problematic feature set
# Should exit prematurely at ~5-6 minutes
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Expected: Exit at 5-6 min with error about empty activeWork
```

**Expected Result**: Orchestrator exits at 5-6 minutes despite sandboxes showing active.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Run orchestrator - should not exit prematurely
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Monitor for:
# - UI shows 3 active sandboxes throughout
# - Features complete without premature exit
# - Log files show proper output tracking
# - Exit happens when all features complete or max retries hit
```

**Expected Result**:
- All validation commands succeed (zero errors)
- Orchestrator runs to completion without premature exit
- Exit happens at appropriate time based on feature execution, not at 5-6 minute mark

### Regression Prevention

```bash
# Run comprehensive health check tests
# These ensure health checks still work for:
# - Stale heartbeats
# - Missing progress files
# - Other health conditions

# Verify startup monitoring still works
# - Startup hangs are detected within 60s (feature.ts)
# - Health check doesn't interfere before feature.ts completes
# - Retries work as expected
```

## Dependencies

### New Dependencies

No new dependencies required.

### Affected Modules

- `health.ts` - Startup timeout constant
- `feature.ts` - Uses `health.ts` for process killing (no changes needed, but verify integration)
- `orchestrator.ts` - Calls health check in main loop (no changes needed, but verify exit conditions)

## Database Changes

**Database changes needed**: No

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**: None

This is a one-line constant change with no database migrations, no API changes, and no breaking changes.

**Feature flags needed**: No

**Backwards compatibility**: Maintained - pure configuration adjustment

## Success Criteria

The fix is complete when:
- [ ] Code change applied: `STARTUP_OUTPUT_TIMEOUT_MS = 5 * 60 * 1000`
- [ ] Type checking passes: `pnpm typecheck`
- [ ] Linting passes: `pnpm lint`
- [ ] Orchestrator runs past 6 minutes without exiting (manual test)
- [ ] All 3 sandboxes remain active throughout normal execution
- [ ] Features complete as expected
- [ ] No "startup hung" false positives in logs
- [ ] Health checks still catch actual problems (regression tests pass)

## Notes

The diagnosis was excellent in identifying this as a race condition between competing retry mechanisms. The fix is appropriately surgical - changing only the misaligned timeout constant to separate the timeout windows. This follows the principle of making the minimal change that fixes the root cause without introducing unnecessary complexity.

The longer 5-minute timeout is justified because:
1. It aligns with the startup retry loop completion time (~3.25 min)
2. It's still reasonable for detecting true startup hangs
3. The startup monitor in feature.ts catches actual problems at 60 seconds anyway
4. It eliminates the race condition without adding state management overhead

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1463*
