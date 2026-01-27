# Bug Fix: Orchestrator UI Hang from Stuck Promise in Work Loop

**Related Diagnosis**: #1840 (REQUIRED)
**Severity**: high
**Bug Type**: deadlock
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Work loop promises hang without timeout detection; recovery mechanisms bypass when in-memory sandbox status remains "busy"
- **Fix Approach**: Add promise timeout monitor that tracks activeWork age and forces recovery on stale promises
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha orchestrator's work loop hangs indefinitely when a feature's execution promise gets stuck (PTY timeout, Claude process crash, etc.). The promise never resolves but the sandbox's in-memory `status` remains `"busy"`. This bypasses all recovery mechanisms:

1. **Deadlock detection skipped** - Only runs when `activeWork.size === 0`, but stuck promise keeps size > 0
2. **Stuck task recovery skipped** - Checks for `status !== "busy"` precondition, but status never changes
3. **No promise timeout** - Work loop's `Promise.race()` includes a sleep timer but no timeout on promises themselves

Result: Infinite loop where the orchestrator checks for work every 30 seconds but never recovers the stuck feature.

### Solution Approaches Considered

#### Option 1: Promise Timeout Monitor ⭐ RECOMMENDED

**Description**: Track how long each activeWork promise has been pending. If a promise exceeds a threshold (e.g., 10 minutes) without corresponding progress file updates, forcibly reject it and reset the feature.

**Pros**:
- Directly addresses the root cause (no timeout detection for promises)
- Works regardless of sandbox in-memory state
- Detects stalled execution accurately via multiple signals (promise age, progress file age, heartbeat)
- Doesn't interfere with healthy long-running features
- Clear, isolated implementation

**Cons**:
- Adds complexity to work loop cycle
- Need to track promise metadata (creation time, last heartbeat)

**Risk Assessment**: low-medium
- Promise rejection is safe (feature resets to pending)
- Threshold is generous (10 min) so won't false-trigger on slow work
- Tested thresholds exist from previous issues (#1767, #1786, #1688)

**Complexity**: moderate

#### Option 2: Decouple Stuck Task Detection from In-Memory Status

**Description**: Modify `detectAndRecoverStuckTasks()` to check external signals (progress file age, manifest assignment age) instead of relying on `status !== "busy"` precondition. Kill stuck features even if status says "busy".

**Pros**:
- Simpler approach, reuses existing detection logic
- No new async tracking needed

**Cons**:
- Risk of killing healthy but slow features (PTY legitimately busy)
- Doesn't actually timeout promises, just detects and kills
- Might interfere with legitimate long-running work
- Still needs heartbeat tracking to be reliable

**Why Not Chosen**: This approach treats the symptom (stuck status) rather than the root cause (no promise timeout). Option 1 is more surgical and safer.

#### Option 3: Separate Promise Pool with Built-in Timeouts

**Description**: Use a custom promise wrapper that includes automatic timeout rejection.

**Pros**:
- Elegant abstraction
- Reusable across codebase

**Cons**:
- Over-engineered for this use case
- Requires wrapping all activeWork promises
- Higher implementation complexity

**Why Not Chosen**: Option 1 is simpler and more targeted to the work loop's specific needs.

### Selected Solution: Promise Timeout Monitor

**Justification**: This directly addresses the root cause—promises hanging without timeout detection. It's safer than relying on in-memory state, doesn't interfere with healthy work, and uses proven timeout thresholds from previous issues. The monitor integrates naturally into the health check cycle.

**Technical Approach**:

1. **Track Promise Metadata**: Store creation time and assigned feature for each active promise
2. **Monitor Heartbeat**: Check progress file age for assigned features
3. **Timeout Detection**: If `(now - assignedAt > PROMISE_TIMEOUT_THRESHOLD) AND (now - lastHeartbeat > HEARTBEAT_TIMEOUT)`, reject promise
4. **Feature Reset**: On rejection, reset feature to `pending` and remove from activeWork
5. **Logging**: Log timeout with feature ID, sandbox, and metrics for debugging

**Architecture Changes**:
- Create PromiseAgeTracker in work-loop.ts to monitor activeWork entries
- Add heartbeat age check using progress file mtime
- Integrate timeout check into health check cycle

**No database or migration changes needed** - works with existing manifest and progress file system.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/work-loop.ts` - Work loop entry point; add promise monitor integration
- `.ai/alpha/scripts/lib/promise-age-tracker.ts` - **NEW** - Tracks promise ages and heartbeats
- `.ai/alpha/scripts/lib/deadlock-handler.ts` - No changes; works synergistically with monitor

### New Files

- `.ai/alpha/scripts/lib/promise-age-tracker.ts` - Promise timeout tracking utility
- Tests for promise timeout detection (covered in Step 3)

### Step-by-Step Tasks

#### Step 1: Create Promise Age Tracker Utility

Create a new utility that tracks promise metadata and detects timeouts.

- Create `.ai/alpha/scripts/lib/promise-age-tracker.ts`
- Define interfaces for tracked promise data (creation time, assigned feature, sandbox ID)
- Implement methods to:
  - Add promise with metadata
  - Get heartbeat age for a feature's progress file
  - Find stale promises
  - Remove promise when complete
- Handle edge cases (progress file missing, fs errors)

**Why this step first**: Foundation for the timeout monitor. Everything else builds on this.

#### Step 2: Integrate Timeout Monitor into Work Loop

Add the promise monitor to the work loop's health check cycle.

- Import PromiseAgeTracker in work-loop.ts
- Initialize tracker in WorkLoop constructor
- In `runHealthChecks()`, call new method `monitorPromiseAges()`
- Implement `monitorPromiseAges()` to:
  - Get all stale promises from tracker
  - For each stale promise:
    - Log timeout event (feature ID, age, heartbeat age)
    - Reject the promise
    - Find and reset feature to "pending" in manifest
    - Remove from activeWork
    - Signal feature reset (already handled by error in promise chain)

**Why this step follows Step 1**: Depends on PromiseAgeTracker being available.

#### Step 3: Add/Update Tests

Add comprehensive tests for promise timeout detection.

- Unit tests for PromiseAgeTracker:
  - Track promise creation times accurately
  - Detect stale promises by age
  - Handle progress file reads correctly
  - Edge case: progress file missing
  - Edge case: promise removed before timeout
- Integration tests for work loop:
  - Work loop calls monitor on health check cycle
  - Timeout rejection resets feature in manifest
  - Feature becomes available for reassignment
  - Multiple stale promises handled in one cycle
- Regression test for the original bug scenario

**Test files**:
- `.ai/alpha/scripts/__tests__/promise-age-tracker.spec.ts`
- `.ai/alpha/scripts/__tests__/work-loop-promise-timeout.spec.ts`

#### Step 4: Update Configuration and Constants

Define timeout thresholds used by the monitor.

- Add constants to work-loop.ts or config:
  - `PROMISE_TIMEOUT_MS` = 10 * 60 * 1000 (10 minutes; generous for slow features)
  - `HEARTBEAT_TIMEOUT_MS` = 5 * 60 * 1000 (5 minutes; progress file max age)
- Document rationale for thresholds (matches #1767 PTY timeout patterns)

#### Step 5: Validation

Test the fix with various scenarios.

- Run unit and integration tests
- Manual testing:
  - Verify timeout detection doesn't trigger on normal slow work
  - Verify timeout DOES trigger on hung promises
  - Verify feature resets correctly after timeout
  - Verify orchestrator continues (doesn't hang)
- Run against existing test specs to ensure no regressions
- Check logs for timeout events (feature ID, age, timestamps)

## Testing Strategy

### Unit Tests

Add/update unit tests for promise timeout tracking:
- ✅ PromiseAgeTracker.add() stores promise metadata correctly
- ✅ PromiseAgeTracker.isStale() detects old promises
- ✅ heartbeat age calculation from progress file mtime
- ✅ Edge case: progress file doesn't exist (treat as very old)
- ✅ Edge case: promise removed before check (doesn't error)
- ✅ Multiple promises tracked simultaneously
- ✅ Stale threshold boundary conditions

**Test file**:
- `.ai/alpha/scripts/__tests__/promise-age-tracker.spec.ts`

### Integration Tests

Test work loop integration:
- ✅ monitorPromiseAges() called during health check cycle
- ✅ Stale promise rejection resets feature in manifest
- ✅ Feature moves from "in_progress" to "pending"
- ✅ Feature becomes available for reassignment on next cycle
- ✅ Manifest checkpoint reflects feature reset
- ✅ Multiple stale promises in one cycle handled correctly
- ✅ Healthy promises not affected by timeout check

**Test file**:
- `.ai/alpha/scripts/__tests__/work-loop-promise-timeout.spec.ts`

### Regression Test for Original Bug

Simulate the exact bug scenario and verify it's fixed:
- Assign feature S1823.I4.F3 to sandbox
- Create stuck promise that never resolves
- Verify:
  - Promise timeout fires after 10 minutes (in test: use fake timers)
  - Feature resets to "pending"
  - Orchestrator continues (doesn't deadlock)
  - No error thrown, clean recovery

### Manual Testing Checklist

Execute these before considering fix complete:

- [ ] Run orchestrator with test spec (small, completes in minutes)
- [ ] Observe normal feature completion (no timeout triggers)
- [ ] Artificially create stuck promise (mock PTY hang)
- [ ] Wait for timeout to fire (should be <30s with test timers)
- [ ] Verify stuck feature resets in manifest
- [ ] Verify orchestrator reassigns and completes
- [ ] Check logs show timeout event with all metrics
- [ ] No new errors in console or logs
- [ ] Full test suite passes

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Timeout fires on legitimate slow work**: If a feature takes >10 minutes
   - **Likelihood**: low (most features are 5-10 min, threshold is generous)
   - **Impact**: medium (feature restarts, manifests as slow but eventually completes)
   - **Mitigation**: Use generous threshold (10 min), log thoroughly, monitor in production

2. **Progress file read errors block timeout check**: If `fs.stat()` fails
   - **Likelihood**: low (sandboxes managed cleanly)
   - **Impact**: low (timeout still fires via promise age, progress file not needed)
   - **Mitigation**: Handle fs errors gracefully, fall back to promise age alone

3. **Feature state inconsistency during reset**: If reset happens mid-work
   - **Likelihood**: low (timeout only fires if promise hung)
   - **Impact**: medium (manifest mismatch, requires manual intervention)
   - **Mitigation**: Log all state changes, validate consistency before continuing

4. **Performance overhead of tracking promises**: Additional metadata per promise
   - **Likelihood**: very low (small metadata dict)
   - **Impact**: negligible (<1ms per cycle)
   - **Mitigation**: Efficient tracking, cleanup when promises complete

**Rollback Plan**:

If this fix causes issues in production:

1. Remove `.ai/alpha/scripts/lib/promise-age-tracker.ts` import from work-loop.ts
2. Comment out `monitorPromiseAges()` call in `runHealthChecks()`
3. Redeploy orchestrator
4. Features may hang again, but orchestrator will fail safely (not crash)
5. Investigate what triggered timeout incorrectly

## Performance Impact

**Expected Impact**: negligible

The promise timeout monitor adds:
- Minimal overhead per work cycle (~1-2ms for metadata checks)
- Single `fs.stat()` call per tracked promise per health check interval
- No additional database queries or I/O
- Zero impact on feature execution time

**Performance Testing**:
- Measure work loop cycle time before/after with 10+ concurrent features
- Verify no noticeable slowdown (<5% acceptable)

## Security Considerations

**Security Impact**: none - low

No security implications. The fix:
- Doesn't change authentication or authorization
- Doesn't expose new APIs or endpoints
- Only affects internal orchestrator state management
- Logs basic metrics (timestamps, feature IDs) already tracked

**No security review needed**

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start orchestrator with test spec
tsx .ai/alpha/scripts/spec-orchestrator.ts S1823 --timeout-test

# Simulate PTY hang by blocking on a feature
# Monitor: UI should hang at ~35 minutes (exact timing varies)
# Manifest: one feature stuck in "in_progress"
# Progress files: all sandboxes show "idle"
# Expected: Orchestrator hangs indefinitely
```

**Expected Result**: Orchestrator hangs without recovery.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Format
pnpm format:fix

# Unit tests for new promise tracker
pnpm test .ai/alpha/scripts/__tests__/promise-age-tracker.spec.ts

# Integration tests for work loop
pnpm test .ai/alpha/scripts/__tests__/work-loop-promise-timeout.spec.ts

# Full orchestrator test suite (if exists)
pnpm test:alpha

# Manual verification with stuck promise
tsx .ai/alpha/scripts/spec-orchestrator.ts S1823-test --timeout-test

# Expected: Timeout fires after 10min, feature resets, orchestrator continues
```

**Expected Result**: All commands succeed, timeout detection works, orchestrator recovers gracefully.

### Regression Prevention

```bash
# Run all alpha orchestrator tests
pnpm test .ai/alpha/scripts/__tests__

# Verify no regressions in work loop behavior
# Check that normal (non-stuck) features still complete correctly
# Verify no false timeouts on slow-but-healthy work
```

## Dependencies

### New Dependencies

No new npm dependencies required. Uses existing:
- Node.js fs module for progress file access
- Existing promise handling patterns

## Database Changes

**No database changes required** - uses existing manifest and progress file system.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- No database migrations needed
- No environment variable changes needed
- No service restarts required (orchestrator script changes)
- Backwards compatible (old manifests work fine)

**Feature flags needed**: no

**Backwards compatibility**: maintained - works with existing manifests and progress files

## Success Criteria

The fix is complete when:

- [ ] PromiseAgeTracker utility fully implemented and tested
- [ ] Work loop integration complete, timeout monitor runs each cycle
- [ ] All unit tests pass
- [ ] All integration tests pass (especially regression test for #1840)
- [ ] Stuck promise timeout fires correctly
- [ ] Feature resets to "pending" after timeout
- [ ] Orchestrator continues and doesn't deadlock
- [ ] No false timeouts on normal slow features
- [ ] Performance acceptable (<5% overhead)
- [ ] Logs show timeout events clearly
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete

## Notes

**Threshold Rationale**:
- 10-minute timeout is generous for normal feature work
- Most features complete in 5-10 minutes on development sandboxes
- PTY disconnects detected in previous issues (#1767, #1786) occur within this window
- Heartbeat timeout (5 min) ensures we catch stalled progress file updates

**Related Issues Reference**:
- #1767: Initial PTY timeout handling
- #1786: PTY still-running detection loop
- #1688: Stuck task detection (checks in-memory status, doesn't timeout promises)
- #1777: Deadlock detection (skipped when activeWork.size > 0)

**Future Enhancements**:
- Adaptive timeout based on feature task count
- Prometheus metrics for timeout events
- Dashboard visualization of promise ages
- Automatic escalation to human review on repeated timeouts

---
*Bug Fix Plan: Orchestrator UI Hang from Stuck Promise in Work Loop*
*Based on Diagnosis: #1840*
*Created: 2026-01-26*
