# Bug Fix: Orchestrator Deadlock from Orphaned In-Progress Features

**Related Diagnosis**: #1948 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Deadlock detector only checks `failed` features, missing orphaned `in_progress` features assigned to idle sandboxes
- **Fix Approach**: Detect and reset orphaned features before exit decision + reverse illogical E2E test dependencies
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Spec Orchestrator hung indefinitely after 1h42m while implementing S1918 (User Dashboard) with GPT provider. Two independent root causes were identified:

**Root Cause A - Orchestrator Bug (Critical)**: Feature S1918.I2.F3 (Activity Aggregation) stuck in `in_progress` status with `assigned_sandbox: "sbx-a"` but the sandbox is idle. The deadlock detector (`detectAndHandleDeadlock()`) only checks for `failed` features, not orphaned `in_progress` features. This creates an infinite loop:

```
mainLoop() while loop:
  1. workableFeatures found (6 features pending/in_progress) → don't exit
  2. assignWorkToIdleSandboxes() → nothing available (all blocked)
  3. activeWork.size === 0 → handleIdleState()
  4. detectAndHandleDeadlock():
     - busySandboxes = 0 ✓
     - getNextAvailableFeature() = null ✓
     - phantom completions = none (2/10 tasks, not complete)
     - failed features = none (S1918.I2.F3 is "in_progress", NOT "failed") ← THE GAP
     - returns shouldExit: false
  5. retryableFeatures (pending) exist → returns false
  6. continue → infinite loop
```

**Root Cause B - Spec Decomposition (Design Issue)**: S1918.I6.F2 (Error Boundaries) and S1918.I6.F3 (Accessibility) depend on S1918.I6.F4 (E2E Test Suite) — logically backwards. E2E tests should depend on error boundaries and accessibility, not the reverse. This creates unnecessary blocking dependencies.

For full details, see diagnosis issue #1948.

### Solution Approaches Considered

#### Option 1: Detect Orphaned In-Progress Features (Simple) ⭐ RECOMMENDED

**Description**: Add orphaned `in_progress` feature detection in `detectAndHandleDeadlock()`. When all sandboxes are idle and a feature is `in_progress` with `assigned_sandbox` set but that sandbox isn't busy, reset it to `pending` or mark as `failed`.

**Pros**:
- **Minimal code change** - ~20 lines in deadlock-handler.ts
- **Surgical fix** - targets exact root cause without refactoring
- **Fast recovery** - orphaned features reset immediately and reassigned
- **Follows existing patterns** - uses `resetFailedFeatureForRetry()` already in code
- **Low risk** - no changes to working systems

**Cons**:
- Doesn't fix the underlying spec dependency issue (design smell)
- Treats symptom rather than root cause of F3 assignment failure

**Risk Assessment**: low - isolated to deadlock detection path, proven patterns

**Complexity**: simple - add one condition check + reset call

#### Option 2: Full Refactoring of Assignment Logic (Comprehensive)

**Description**: Refactor the entire work assignment system to prevent in-progress features from becoming orphaned in the first place. Review all sandbox assignment, health check, and restart logic.

**Pros**:
- Prevents root cause entirely
- Would catch similar issues in future

**Cons**:
- High risk - touches many interdependent systems
- Could destabilize proven code paths
- 4-6 hours work vs 1 hour for Option 1
- Reduces time for spec dependency fix

**Why Not Chosen**: Diminishing returns - Option 1 fixes the hang immediately while we investigate root causes. Refactoring should be Phase 2 after stabilization.

#### Option 3: Just Fix Spec Dependencies (Incomplete)

**Description**: Reverse the I6 feature dependencies to be logically correct (E2E depends on F2/F3, not vice versa).

**Pros**:
- Fixes the spec design issue
- Prevents future orchestrator confusion

**Cons**:
- Doesn't fix the current hang (Feature #F3 will still be in_progress)
- Only works for new runs, not active runs

**Why Not Chosen**: Incomplete - doesn't resolve active hang. Must combine with Option 1.

### Selected Solution: Option 1 + Dependency Fix

**Justification**: The orchestrator hang is blocking S1918 completion. Option 1 provides immediate recovery with minimal risk, using proven patterns already in the codebase. Combining with the spec fix prevents recurrence while improving overall design. This is the pragmatic approach that unblocks users while improving the system.

**Technical Approach**:

1. **Add orphaned feature detection** in `detectAndHandleDeadlock()` - checks for `in_progress` features with `assigned_sandbox` set but that sandbox is idle and not running the feature
2. **Reset orphaned features** to `pending` status for reassignment on another sandbox
3. **Fix spec dependencies** - remove backwards F2→F4 and F3→F4 dependencies
4. **Add validation** to prevent future backwards dependencies in E2E testing

**Architecture Changes**: None - uses existing patterns and state management

**Migration Strategy**: N/A - existing features already in broken state will be reset

## Implementation Plan

### Affected Files

List files that need modification:

- `.ai/alpha/scripts/lib/deadlock-handler.ts` - Add orphaned feature detection
- `.ai/alpha/specs/S1918-Spec-user-dashboard/spec-manifest.json` - Fix F2, F3 dependencies (OR re-decompose feature)

### New Files

No new files needed - uses existing state management and patterns

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add Orphaned Feature Detection in Deadlock Handler

**What this step accomplishes**: Detect when a feature is `in_progress` but assigned to an idle sandbox that's not actually running it. These are orphaned features that will never progress.

**Specific changes**:

1. In `.ai/alpha/scripts/lib/deadlock-handler.ts`, in the `detectAndHandleDeadlock()` function, after checking phantom completions but before checking for failed features:

```typescript
// NEW: Bug fix #1948 - Detect orphaned in_progress features
// These are features stuck in in_progress with assigned_sandbox set
// but the sandbox is idle/not actually running them
const orphanedFeatures = manifest.feature_queue.filter(f => {
  if (f.status !== "in_progress" || !f.assigned_sandbox) return false;

  const assignedSandbox = instances.find(i => i.label === f.assigned_sandbox);
  if (!assignedSandbox) return false;

  // Feature is orphaned if:
  // 1. Sandbox is not busy, AND
  // 2. Sandbox is not running this feature, OR
  // 3. Feature has been assigned for too long without progress
  const isNotBusyAndNotRunning =
    assignedSandbox.status !== "busy" &&
    assignedSandbox.currentFeature !== f.id;

  const assignedDuration = f.assigned_at ? Date.now() - f.assigned_at : 0;
  const hasNoProgress = assignedDuration > 120000 && (f.tasks_completed ?? 0) === 0;

  return isNotBusyAndNotRunning || hasNoProgress;
});

if (orphanedFeatures.length > 0) {
  log(`\n🔮 [ORPHANED_FEATURE] Detected ${orphanedFeatures.length} orphaned in_progress feature(s):`);

  for (const feature of orphanedFeatures) {
    log(`   #${feature.id}: assigned to ${feature.assigned_sandbox} but not running`);

    // Reset to pending for reassignment
    if (shouldRetryFailedFeature(feature, DEFAULT_MAX_RETRIES)) {
      feature.retry_count = (feature.retry_count ?? 0) + 1;
      feature.status = "pending";
      feature.assigned_sandbox = undefined;
      feature.assigned_at = undefined;
      feature.error = `Orphaned in_progress feature reset (attempt ${feature.retry_count}/${DEFAULT_MAX_RETRIES})`;

      log(`   ✅ Reset to pending for reassignment (retry ${feature.retry_count}/${DEFAULT_MAX_RETRIES})`);
    } else {
      // Max retries exceeded
      feature.status = "failed";
      feature.assigned_sandbox = undefined;
      feature.assigned_at = undefined;
      feature.error = `Orphaned in_progress feature - max retries (${DEFAULT_MAX_RETRIES}) exceeded`;

      log(`   ❌ Max retries exceeded - marked as failed`);
    }
  }

  saveManifest(manifest);

  // Return early to let reassignment happen
  return {
    shouldExit: false,
    retriedCount: orphanedFeatures.length,
    failedInitiatives: [],
  };
}
```

**Why this step first**: This detection must happen before checking for failed features, as it's a more specific condition that needs recovery. It unblocks the work loop when orphaned features are detected.

#### Step 2: Fix Spec Dependency Issues

**What this step accomplishes**: Remove illogical backwards dependencies where E2E tests are dependencies for error boundaries and accessibility.

**Current (Wrong)**:
- S1918.I6.F2 (Error Boundaries) depends on S1918.I6.F4 (E2E Tests)
- S1918.I6.F3 (Accessibility) depends on S1918.I6.F4 (E2E Tests)

**Corrected (Right)**:
- S1918.I6.F4 (E2E Tests) should depend on S1918.I6.F2 and S1918.I6.F3
- Error boundaries and accessibility are code implementations
- E2E tests verify those implementations

**Specific changes**:

1. Open `.ai/alpha/specs/S1918-Spec-user-dashboard/spec-manifest.json`
2. Find S1918.I6.F2 (Error Boundaries) feature entry
3. Remove "S1918.I6.F4" from its dependencies array
4. Find S1918.I6.F3 (Accessibility) feature entry
5. Remove "S1918.I6.F4" from its dependencies array
6. Find S1918.I6.F4 (E2E Tests) feature entry
7. Verify it has these dependencies: `["S1918.I1", "S1918.I2", "S1918.I3", "S1918.I4", "S1918.I5"]` (or add F2, F3 references if desired)

**Alternative approach** (if editing manifest directly is risky):
- Re-run the feature decomposition for I6 with corrected dependencies
- More thorough but slower

**Why this step second**: Step 1 fixes the immediate hang. Step 2 prevents recurrence by fixing the underlying design issue. This makes the spec consistent with testing principles (tests verify implementations, not vice versa).

#### Step 3: Add Unit Tests for Orphaned Feature Detection

**What this step accomplishes**: Prevent regressions - test the new orphaned feature detection logic

**Test files**:
- `.ai/alpha/scripts/__tests__/deadlock-handler.test.ts` - Add test for orphaned feature detection

**Test scenarios**:
- ✅ Detects in_progress feature assigned to idle sandbox
- ✅ Detects in_progress feature assigned to busy sandbox that's not running it
- ✅ Resets feature to pending when retries available
- ✅ Marks feature as failed when max retries exceeded
- ✅ Returns correct retriedCount in result
- ✅ Does NOT detect normal in_progress features on busy sandboxes
- ✅ Does NOT detect pending features

#### Step 4: Update Work Loop Logging for Visibility

**What this step accomplishes**: Improve diagnostics so future hang debugging is easier

**Changes**:
- Log when features transition from in_progress to pending via deadlock detection
- Log the orphaned feature count in deadlock detection output
- Add UI event emission for orchestrator visibility

**Why this step**: Better observability prevents similar issues from being hidden

#### Step 5: Validation and Testing

- Run orchestrator tests to verify deadlock detection still works
- Verify E2E tests for orchestrator pass
- Manual test: Create a scenario with orphaned feature and verify recovery
- Check spec dependency logic is correct

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Orphaned feature detection - identifies in_progress with idle assigned_sandbox
- ✅ Feature reset logic - correctly increments retry_count
- ✅ Max retries handling - marks as failed when limit exceeded
- ✅ Spec dependencies - no circular dependencies in I6
- ✅ Backwards dependencies - E2E doesn't depend on F2/F3
- ✅ Edge case: Feature assigned but never started
- ✅ Edge case: Feature started then sandbox disconnected
- ✅ Regression test: Original bug S1918.I2.F3 doesn't reoccur

**Test files**:
- `.ai/alpha/scripts/__tests__/deadlock-handler.test.ts` - orphaned feature detection

### Integration Tests

<if applicable, describe integration test scenarios>

**Test scenarios**:
- Run orchestrator with intentionally orphaned feature - should recover
- Run orchestrator with corrected spec dependencies - should not create orphaned features
- Verify all dependent features unblock correctly after feature resets

### E2E Tests

<if UI or critical user journey affected>

**Test files**:
- Orchestrator integration tests if available

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Read deadlock-handler.ts changes and verify logic is sound
- [ ] Review spec-manifest.json dependency changes
- [ ] Run the orchestrator on S1918 spec
- [ ] Simulate orphaned feature (manually edit manifest) and verify detection/recovery
- [ ] Verify no regressions in normal deadlock detection
- [ ] Check logs contain new orphaned feature messages
- [ ] Verify E2E test dependencies are no longer backwards

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Detection false positives**: Orphaned feature detection might catch normal features
   - **Likelihood**: low
   - **Impact**: high - would mark working features as failed
   - **Mitigation**: Use multiple conditions (assigned_sandbox set AND sandbox status idle AND assigned duration > threshold) - reduces false positives

2. **Spec dependency change breaks existing runs**: If some features depend on E2E being ready
   - **Likelihood**: low (E2E tests verify implementations, not prerequisites)
   - **Impact**: medium - features might be unblocked earlier than expected
   - **Mitigation**: Review spec carefully, test in dev environment first

3. **Orphaned features reset but underlying cause remains**: If the root cause of orphaning is subtle, fixing just the symptom won't help
   - **Likelihood**: medium
   - **Impact**: medium - might see orphaned features again
   - **Mitigation**: Combine with deadlock detection improvements and monitoring

4. **Timing issues**: Features assigned_at might not be set consistently
   - **Likelihood**: low
   - **Impact**: low - detection uses multiple conditions
   - **Mitigation**: Verify assigned_at is always set when assigning features

**Rollback Plan**:

If this fix causes issues in production:

1. Revert `.ai/alpha/scripts/lib/deadlock-handler.ts` to previous version
2. Revert spec-manifest.json dependency changes
3. Re-run orchestrator with previous code
4. Open new bug issue to investigate false positives

**Monitoring** (if needed):
- Monitor orchestrator logs for orphaned feature detection frequency
- Alert if more than 1-2 features per run are detected as orphaned (indicates underlying issue)
- Track retry_count on features to detect patterns

## Performance Impact

**Expected Impact**: minimal

The orphaned feature detection adds a single pass through feature_queue looking for the specific condition. This is already happening in deadlock detection, so the performance cost is negligible (~1-2ms).

## Security Considerations

**Security Impact**: none

This is internal orchestrator logic with no security implications.

## Validation Commands

### Before Fix (Orchestrator Should Hang)

The S1918 orchestrator is currently in a hung state. The bug is confirmed from diagnosis #1948.

### After Fix (Orchestrator Should Complete or Fail Gracefully)

```bash
# Build the orchestrator
cd .ai/alpha && pnpm build

# Run orchestrator on S1918 (should not hang after fix)
# Note: This will require E2B sandboxes and API keys
pnpm orchestrator S1918 --provider gpt

# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Manual verification
# 1. Check orchestrator logs for "ORPHANED_FEATURE" detection
# 2. Verify features reset to pending status
# 3. Verify orchestrator exits normally (completes or fails, doesn't hang)
```

**Expected Result**: Orchestrator completes S1918 implementation without hanging after 1h42m

### Regression Prevention

```bash
# Run full test suite for orchestrator
pnpm test .ai/alpha/scripts/__tests__/deadlock-handler.test.ts

# Check spec consistency
pnpm validate-specs .ai/alpha/specs/S1918-Spec-user-dashboard/

# Verify no regressions in previous bug fixes
# Bug #1782, #1858, #1841, #1767 etc should still work
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

### Existing Dependencies Used

- `saveManifest()` - Already used for persisting state
- `shouldRetryFailedFeature()` - Already used for retry logic
- `emitOrchestratorEvent()` - Already used for UI events

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- No database migrations needed
- No config changes needed
- No new environment variables needed

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] Deadlock handler detects orphaned in_progress features
- [ ] Orphaned features are reset to pending for reassignment
- [ ] S1918 orchestrator completes or fails gracefully (no hang)
- [ ] All unit tests pass
- [ ] Spec dependencies are corrected
- [ ] No regressions in existing deadlock detection
- [ ] Code review approved
- [ ] Manual testing checklist complete

## Notes

**Related Issues**:
- #1840 (CLOSED): In-Progress Feature State Mismatch - similar symptom, different trigger
- #1858 (CLOSED): Reset feature on sandbox death - handles sandbox crash, but not idle-with-assignment
- #1782 (CLOSED): Phantom completion - handles tasks_completed >= task_count, but not orphaned in_progress
- #1841 (CLOSED): Stuck Promise in Work Loop - detects stuck promises, but needs orphaned feature context

**Design Notes**:
- The root cause likely stems from how S1918.I2.F3 was assigned but then became blocked. Investigation in Phase 2 should examine assignment logic more deeply.
- The spec dependency issue (E2E depending on F2/F3) is a common pattern mistake - tests should verify implementations, not block them.
- Consider adding validation in future feature decomposition to catch backwards dependencies.

**Related Documentation**:
- Orchestrator architecture: `.ai/alpha/scripts/README.md`
- Deadlock detection: `.ai/alpha/scripts/lib/deadlock-handler.ts`
- Work loop: `.ai/alpha/scripts/lib/work-loop.ts`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1948*
*Complexity: moderate | Effort: medium | Risk: medium*
