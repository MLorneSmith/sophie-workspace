# Bug Fix: Alpha Orchestrator - UI Output, Race Conditions, and Timeout Handling

**Related Diagnosis**: #1424
**Severity**: high
**Bug Type**: bug, integration
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Four independent orchestrator failures: UI polling from stale logs, race condition in feature assignment, hung startup detection, keepalive timeout overlap
- **Fix Approach**: Multi-part fix addressing each root cause independently with atomic feature assignment, proper log streaming, health check improvements, and keepalive interval adjustment
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Spec Orchestrator encountered four critical failures during a 1-hour execution on Spec #1362:

1. **UI Output Stale**: Progress poller reads buffered logs instead of JSON progress files, causing UI columns to freeze
2. **Duplicate Feature Assignment**: Race condition when updating feature manifest allows multiple sandboxes to claim same feature
3. **Hung Process No Recovery**: Sandbox startup timeout (5 min) doesn't trigger restart; only produces 3-line log
4. **Timeout Without Recovery**: Keepalive interval (30 min) is too close to sandbox lifetime (1 hour), causing simultaneous expiration

Full context available in diagnosis issue #1424.

### Solution Approaches Considered

#### Option 1: Hybrid Fix with Atomic Operations ⭐ RECOMMENDED

**Description**: Address each root cause with targeted, minimal fixes:
1. Change UI to read `recent_output` from JSON instead of log files
2. Add timestamp-based conflict detection when assigning features
3. Implement startup timeout with automatic restart
4. Reduce keepalive interval to 15-20 minutes with staggered renewal

**Pros**:
- Surgical fixes: each change fixes one specific issue
- Low risk: isolated modifications don't affect other systems
- Maintainable: clear cause-effect relationship for each fix
- Testable: each part can be verified independently
- Reversible: can roll back individual fixes if needed

**Cons**:
- Multiple small changes across different files
- Requires coordination between UI, orchestrator, and work queue
- Testing each fix independently before integration

**Risk Assessment**: Medium - Changes are isolated but coordination required between components

**Complexity**: Moderate - Each fix is straightforward but requires careful ordering

#### Option 2: Complete Rewrite

**Description**: Redesign orchestrator with proper state management, mutex-based locking, and complete health monitoring

**Why Not Chosen**: Excessive scope, high risk of new bugs, 4-5x effort with minimal benefit since issues are well-understood and fixable

#### Option 3: Manual Intervention Workflow

**Description**: Add UI controls to manually restart sandboxes and reassign features without fixing root causes

**Why Not Chosen**: Doesn't fix the underlying problems, creates operational burden, regressions will reoccur

### Selected Solution: Hybrid Fix with Atomic Operations

**Justification**: The diagnosis clearly identifies four independent root causes that can be fixed with targeted changes. This approach:
- Minimizes blast radius by fixing only what's broken
- Allows incremental testing and validation
- Maintains backward compatibility
- Follows the principle of least change
- Is fully reversible if issues arise

**Technical Approach**:

1. **UI Output Fix**: Direct JSON read vs buffered log dependency
2. **Race Condition**: Add monotonic timestamp and compare before assignment
3. **Startup Detection**: Add timeout detection within 5-minute window, trigger restart
4. **Keepalive Interval**: Reduce from 30 to 15 minutes, add verification step before expiration

**Architecture Changes**:
- Minimal: all fixes are within existing files
- No new dependencies
- No database schema changes
- No new APIs or exports

**Migration Strategy**: No migration needed - fixes are backward compatible

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts` - Change log reading to JSON progress file reading (UI output fix)
- `.ai/alpha/scripts/lib/work-queue.ts` - Add atomic feature assignment with timestamp conflict detection (race condition fix)
- `.ai/alpha/scripts/lib/orchestrator.ts` - Add startup timeout detection and reduce keepalive interval (startup + timeout fixes)
- `.ai/alpha/scripts/lib/orchestrator.ts` - Implement health checks at startup boundary (health check improvement)

### New Files

No new files required. All fixes are modifications to existing files.

### Step-by-Step Tasks

#### Step 1: Fix UI Output Reading

**Objective**: UI progress poller displays real-time output from JSON progress files instead of stale buffered logs

**Files**: `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts:751`

**Changes**:
- Locate the `readRecentLogs()` function call in `useProgressPoller.ts`
- Change to read `recent_output` field from progress JSON file instead of raw log file
- Update the poll interval if necessary to match JSON file write frequency
- Add fallback to log file if JSON doesn't exist (for backward compatibility)

**Why this step first**: Fixes immediate user visibility issue that blocks monitoring the orchestrator

**Validation**: After fix, UI columns should update smoothly during execution; output should match actual recent work

---

#### Step 2: Implement Atomic Feature Assignment

**Objective**: Prevent race condition where multiple sandboxes claim the same feature

**Files**: `.ai/alpha/scripts/lib/work-queue.ts:26-98`

**Changes**:
- Add timestamp-based conflict detection in `getNextAvailableFeature()`
- Before assigning feature:
  - Read current feature state from manifest
  - Check if feature was recently assigned (within 30 seconds) by another sandbox
  - Compare timestamps: if another sandbox claimed it more recently, skip to next feature
- After assignment:
  - Write assignment timestamp to manifest
  - Re-read manifest to confirm assignment wasn't overwritten (atomic check)
  - If assignment lost to another sandbox, return to step of checking next feature

**Implementation detail**:
```typescript
// Pseudo-code pattern
const currentFeature = availableFeatures[0];
const lastAssignmentTime = manifest.features[currentFeature].assigned_at;
const now = Date.now();

if (now - lastAssignmentTime < 30000) {
  // Feature claimed by another sandbox recently, skip it
  continue;
}

// Try to claim it
manifest.features[currentFeature].assigned_sandbox = sandboxId;
manifest.features[currentFeature].assigned_at = now;
await writeManifest(manifest);

// Verify our assignment won
const updated = await readManifest();
if (updated.features[currentFeature].assigned_sandbox !== sandboxId) {
  // Lost race, try next feature
  continue;
}
```

**Why this step next**: Prevents wasted compute on duplicate feature assignments

**Validation**: Run with 3+ concurrent sandboxes; verify no two sandboxes work on same feature; check assignment timestamps in manifest

---

#### Step 3: Add Startup Timeout Detection with Automatic Restart

**Objective**: Detect when sandbox startup hangs and automatically restart

**Files**: `.ai/alpha/scripts/lib/orchestrator.ts:299-374`

**Changes**:
- Add startup timeout monitor: if no output from Claude process after 5 minutes, mark sandbox unhealthy
- Trigger automatic restart:
  - Kill the hung Claude process
  - Kill the sandbox if needed
  - Update manifest to mark sandbox unhealthy
  - Re-spawn sandbox with fresh instance
- Add logging to track restarts (for debugging)

**Implementation detail**:
```typescript
// Monitor startup output
const startTime = Date.now();
const outputReceived = waitForOutput(); // Monitor for first output

const timeout = setTimeout(() => {
  if (!outputReceived) {
    logger.warn(`Sandbox ${sandboxId} hung on startup after 5 minutes`);
    // Kill hung process
    await killClaudeProcess(sandboxId);
    // Mark unhealthy
    manifest.sandboxes[sandboxId].health = 'unhealthy';
    // Trigger respawn
    await spawnSandbox(sandboxId);
  }
}, 5 * 60 * 1000);
```

**Why this step next**: Recovers from hung startup processes that block feature completion

**Validation**: Artificially hang a startup (no output); verify timeout triggers after ~5 min; verify restart completes feature

---

#### Step 4: Reduce Keepalive Interval and Add Verification

**Objective**: Prevent simultaneous sandbox expiration by staggering restarts

**Files**: `.ai/alpha/scripts/lib/orchestrator.ts:299-374`

**Changes**:
- Change keepalive interval from 30 minutes to 15 minutes
- Add keepalive verification: before sending keepalive, verify sandbox is still responding
- Add staggered timing: offset each sandbox's keepalive by 2-3 minutes to prevent synchronized timeouts
- Add pre-expiration check: at 50 minutes (10 minutes before 1 hour limit), do a hard restart instead of waiting for timeout

**Implementation detail**:
```typescript
// Stagger keepalive timing
const baseInterval = 15 * 60 * 1000; // 15 minutes
const staggerOffset = sandboxIndex * 2 * 60 * 1000; // 2 min per sandbox
const effectiveInterval = baseInterval + staggerOffset;

// Pre-expiration restart at 50 minutes
const maxAge = 50 * 60 * 1000;
if (sandboxAge > maxAge) {
  logger.info(`Restarting sandbox ${sandboxId} before expiration`);
  await restartSandbox(sandboxId);
}

// Keepalive with verification
async function sendKeepalive() {
  try {
    const response = await ping(sandbox);
    if (response.timeout) {
      logger.warn(`Sandbox ${sandboxId} not responding, scheduling restart`);
      scheduleRestart(sandboxId);
    }
  } catch (e) {
    logger.error(`Keepalive failed for ${sandboxId}`, e);
    scheduleRestart(sandboxId);
  }
}
```

**Why this step last**: Requires other fixes to be in place; depends on proper startup detection

**Validation**: Run orchestrator for 1+ hour; verify no sandboxes expire simultaneously; verify all sandboxes restart smoothly

---

#### Step 5: Add Tests for Race Conditions and Timeouts

**Objective**: Prevent regressions of these specific bugs

**Files**:
- `.ai/alpha/tests/orchestrator-race-conditions.spec.ts` (new)
- `.ai/alpha/tests/orchestrator-timeouts.spec.ts` (new)

**Tests**:

1. **Atomic Feature Assignment**:
   - Simulate 3 concurrent sandboxes
   - Verify only 1 gets each feature
   - Verify timestamps are monotonic

2. **UI Output Freshness**:
   - Write to progress JSON
   - Poll UI
   - Verify output appears within 1 second

3. **Startup Timeout**:
   - Mock hung Claude process
   - Verify restart after 5 minutes
   - Verify new process receives output

4. **Keepalive Staggering**:
   - Start 3+ sandboxes
   - Verify keepalive times differ by at least 2 minutes
   - Verify no simultaneous restarts

**Why this step after**: Tests validate fixes work correctly and prevent regression

---

#### Step 6: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Test all edge cases
- Confirm bugs are fixed

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Atomic feature assignment with concurrent requests
- ✅ Timestamp comparison prevents race condition
- ✅ Startup timeout detection within 5-minute window
- ✅ Keepalive interval calculation with staggering
- ✅ Keepalive verification detects unresponsive sandboxes
- ✅ Pre-expiration restart triggers at 50 minutes
- ✅ UI progress file reading returns recent_output field
- ✅ Fallback to log file if progress JSON missing

**Test files**:
- `.ai/alpha/tests/work-queue.spec.ts` - Atomic assignment tests
- `.ai/alpha/tests/orchestrator-startup.spec.ts` - Startup timeout tests
- `.ai/alpha/tests/orchestrator-keepalive.spec.ts` - Keepalive interval tests
- `.ai/alpha/tests/ui-progress-poller.spec.ts` - UI polling tests

### Integration Tests

- ✅ Simulate multiple concurrent sandboxes with feature assignments
- ✅ Verify race condition prevention under concurrent load
- ✅ Simulate sandbox startup hang; verify restart
- ✅ Run for 1+ hour; verify no simultaneous expirations
- ✅ Verify UI updates match actual recent output

**Test files**:
- `.ai/alpha/tests/orchestrator-integration.spec.ts` - Full scenario tests

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run orchestrator on medium spec (5-10 features)
- [ ] Monitor UI output columns update smoothly (not frozen)
- [ ] Verify no duplicate feature assignments in manifest
- [ ] Artificially hang one sandbox's startup; verify restart after ~5 min
- [ ] Run orchestrator for 1+ hour; verify all sandboxes complete
- [ ] Check logs for staggered keepalive times (not synchronized)
- [ ] Verify no "sandbox expired" errors during completion
- [ ] All features eventually complete successfully
- [ ] No hung processes left after orchestrator finish

## Risk Assessment

**Overall Risk Level**: Medium

**Potential Risks**:

1. **Race Condition Detection Timing**: If timestamp window (30s) is too small, may still see races
   - **Likelihood**: Low (30s is substantial buffer)
   - **Impact**: Medium (partial feature duplication)
   - **Mitigation**: Increase window to 60s if races still occur; add detailed logging

2. **Startup Timeout False Positives**: Very slow machine might timeout processes that are working
   - **Likelihood**: Low (5 minutes is generous)
   - **Impact**: Medium (unnecessary restart restarts legitimate work)
   - **Mitigation**: Log all startup timeouts for analysis; can extend window to 10 min if needed

3. **Keepalive Staggering Complexity**: Offset calculation might conflict with other timing logic
   - **Likelihood**: Low (straightforward addition)
   - **Impact**: Low (keepalive still works, just not staggered)
   - **Mitigation**: Verify keepalive timing in logs; simplify if needed

4. **Backwards Compatibility**: Old progress files might not have JSON format
   - **Likelihood**: Medium (during transitional period)
   - **Impact**: Low (fallback to logs exists)
   - **Mitigation**: Fallback handling already planned

**Rollback Plan**:

If this fix causes issues in orchestrator execution:

1. Revert `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts` to read logs again
2. Remove timestamp-based conflict detection in `work-queue.ts`
3. Remove startup timeout detection in `orchestrator.ts`
4. Revert keepalive interval to 30 minutes
5. Verify orchestrator completes successfully on simple spec
6. Investigate which specific fix caused the issue

**Monitoring** (during/after fix):

- Monitor orchestrator execution logs for new error patterns
- Track feature assignment collisions (should be zero after fix)
- Track startup timeouts and restarts (expect low rate)
- Track keepalive failures and recovery
- Track UI responsiveness (no frozen columns)

## Performance Impact

**Expected Impact**: Minimal to positive

- UI polling from JSON instead of logs: Slightly faster (no disk buffering delay)
- Atomic assignment with timestamp check: Negligible (simple comparison)
- Startup timeout detection: No impact (only triggers on failure cases)
- Keepalive staggering: Slightly improves by reducing simultaneous load on sandbox system

**Performance Testing**:
- Measure orchestrator completion time before and after fix (should be similar or faster)
- Monitor CPU/memory during keepalive staggering (should be distributed, not spiky)

## Security Considerations

**Security Impact**: None - Low

- No security implications: fixes are internal operational improvements
- No new external APIs or data exposure
- No authentication/authorization changes

## Validation Commands

### Before Fix (Bugs Should Reproduce)

```bash
# Navigate to project
cd /home/msmith/projects/2025slideheroes

# Run orchestrator on test spec
pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts --spec 1362 --ui

# Observe issues:
# 1. UI output columns freeze after 5-10 minutes
# 2. Check manifest for duplicate feature assignments
# 3. Monitor for "sandbox expired" errors after 1 hour
```

**Expected Result**:
- UI columns stop updating
- Multiple sandboxes claim same feature
- Sandbox expires without proper recovery

### After Fix (Bugs Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run orchestrator tests
pnpm tsx --test .ai/alpha/tests/orchestrator-*.spec.ts

# Run orchestrator on test spec
pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts --spec 1362 --ui

# Manual verification
# 1. UI columns update smoothly throughout execution
# 2. Check manifest: no duplicate feature assignments
# 3. All features eventually complete
# 4. No sandbox timeouts/expirations
# 5. Orchestrator completes successfully
```

**Expected Result**:
- All tests pass
- UI updates smoothly
- No duplicate assignments
- All features complete
- No timeout errors
- Orchestrator finishes successfully

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run orchestrator on multiple spec sizes
pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts --spec 1362 --ui &  # Small
pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts --spec 1363 --ui &  # Medium

# Verify both complete successfully
wait

# Check no file descriptor leaks or hung processes
ps aux | grep -E "(node|tsx|claude)" | grep -v grep
```

## Dependencies

### New Dependencies

No new dependencies required - all fixes use existing libraries and patterns in the codebase.

### External Dependencies Check

- `fs` (Node.js built-in) - for reading JSON progress files
- `child_process` (Node.js built-in) - for killing hung processes
- All already in use in orchestrator code

## Database Changes

**No database changes required** - all fixes are in-memory manifest manipulation and log file handling

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**: None required

**Feature flags needed**: No

**Backwards compatibility**: Fully maintained - existing manifests work with new code

## Success Criteria

The fix is complete when:

- [ ] All validation commands pass
- [ ] UI output updates smoothly during execution
- [ ] No duplicate feature assignments occur
- [ ] Startup hang detection works correctly
- [ ] Keepalive intervals are properly staggered
- [ ] Orchestrator completes 1-hour execution without timeout
- [ ] All tests pass (unit, integration, manual)
- [ ] Zero regressions in existing functionality
- [ ] Code review approved

## Notes

**Key Insights from Diagnosis**:
- These are four independent failures, not interconnected
- Minimal changes can fix each one without redesign
- Performance/safety trade-off (keepalive closer to timeout) is the root of Issue D
- Log buffering is the root of Issue A; JSON is real-time

**Testing Strategy**:
- Test each fix independently first
- Then test all together for integration issues
- Run full spec execution as final validation

**Documentation**: Update orchestrator README with:
- UI output polling mechanism (JSON vs logs)
- Feature assignment atomicity guarantees
- Sandbox lifetime and keepalive strategy
- Startup timeout recovery behavior

---

*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1424*
