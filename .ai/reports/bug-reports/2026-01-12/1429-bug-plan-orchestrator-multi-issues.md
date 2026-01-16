# Bug Fix: Alpha Orchestrator Multiple Issues (UI output, progress counts, sandbox management)

**Related Diagnosis**: #1428
**Severity**: high
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Four distinct issues - UI output not streaming to display, progress counters incrementing without idempotency, sandbox IDs accumulating without cleanup, feature assignment race condition
- **Fix Approach**: Add periodic UI progress writes with output tracker, replace increment-based counting with set-based calculation, remove old sandbox IDs on replacement, make feature assignment atomic with manifest save
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Spec Orchestrator has four critical bugs affecting reliability: (A) UI output freezes after initial messages, (B) progress counters exceed totals (18/13 features, 261/110 tasks), (C) sandbox IDs accumulate beyond 15 instead of maintaining 3, and (D) multiple sandboxes get assigned to the same feature due to non-atomic check-assign-save operations.

For full details, see diagnosis issue #1428.

### Solution Approaches Considered

#### Option 1: Minimal Surgical Fixes ⭐ RECOMMENDED

**Description**: Fix each issue with the minimum code change necessary:
- **Issue A**: Add a dedicated interval that writes UI progress every 2-3 seconds with the output tracker
- **Issue B**: Replace increment operations with set-based counting from manifest state
- **Issue C**: Remove old sandbox ID before adding new one during replacement
- **Issue D**: Move `saveManifest()` call inside `assignFeatureToSandbox()` to make it atomic

**Pros**:
- Minimal code changes reduce regression risk
- Each fix is independent and can be tested separately
- Maintains existing architecture and patterns
- Low complexity - straightforward to implement
- Can be deployed incrementally if needed

**Cons**:
- Issue A adds another polling interval (minor performance impact)
- Issue B recalculates on every save (negligible performance cost)
- Doesn't address deeper architectural issues

**Risk Assessment**: Low - Changes are localized and don't affect core logic

**Complexity**: Moderate - Four distinct fixes requiring careful coordination

#### Option 2: Architectural Refactor

**Description**: Redesign the progress tracking and sandbox management systems:
- Centralize all progress tracking in a single state manager
- Use event-driven architecture for real-time updates
- Implement proper locking mechanism for feature assignment
- Redesign sandbox lifecycle management

**Pros**:
- More robust long-term architecture
- Eliminates entire classes of bugs
- Better separation of concerns

**Cons**:
- High complexity and risk
- Requires extensive testing
- Could introduce new bugs
- Much larger effort (days vs hours)
- Delays fixing critical issues

**Why Not Chosen**: The current bugs are well-understood and can be fixed surgically. A full refactor is overkill and introduces unnecessary risk. Save architectural improvements for a dedicated refactoring initiative.

#### Option 3: Workarounds Only

**Description**: Apply minimal workarounds without fixing root causes:
- Cap progress counts at totals
- Periodically clean up stale sandbox IDs
- Add retry logic for assignment conflicts

**Why Not Chosen**: Doesn't fix root causes, just masks symptoms. Would lead to confusing behavior and maintenance burden.

### Selected Solution: Minimal Surgical Fixes

**Justification**: Option 1 provides the best balance of fixing all four bugs completely while minimizing risk and complexity. The fixes are straightforward, testable, and don't require architectural changes. This approach gets the orchestrator to a stable state quickly while preserving the option for future refactoring.

**Technical Approach**:
- **Issue A**: Add `setInterval` in `runFeatureImplementation()` that calls `writeUIProgress()` every 2 seconds with `outputTracker`
- **Issue B**: Change `writeOverallProgress()` to calculate counts from manifest state instead of using stored values
- **Issue C**: Add array splice operation before push in sandbox replacement code
- **Issue D**: Move the `saveManifest()` call from orchestrator into `assignFeatureToSandbox()` function

**Architecture Changes**: None - all fixes work within existing architecture

**Migration Strategy**: Not needed - fixes are backwards compatible

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/feature.ts` - Add UI progress write interval (Issue A), remove progress increments (Issue B)
- `.ai/alpha/scripts/lib/progress.ts` - Update writeUIProgress to handle frequent calls
- `.ai/alpha/scripts/lib/manifest.ts` - Change writeOverallProgress to calculate from state (Issue B)
- `.ai/alpha/scripts/lib/orchestrator.ts` - Add old ID removal before new ID push (Issue C), remove saveManifest after assignment (Issue D)
- `.ai/alpha/scripts/lib/work-queue.ts` - Add saveManifest call inside assignFeatureToSandbox (Issue D)

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Fix Issue D - Make Feature Assignment Atomic

This must be first because it prevents corruption during testing of other fixes.

- Move `saveManifest(manifest)` call from `orchestrator.ts:524` into `assignFeatureToSandbox()` function in `work-queue.ts`
- Add manifest parameter to `assignFeatureToSandbox(feature, sandboxLabel, manifest)` signature
- Update all callers to pass manifest parameter
- Remove the standalone `saveManifest(manifest)` call after assignment in orchestrator

**Why this step first**: Prevents race conditions that could corrupt the manifest during testing

#### Step 2: Fix Issue C - Clean Up Old Sandbox IDs

- In `orchestrator.ts:370-372` (preemptive restart), add before the push:
  ```typescript
  const oldIdIndex = manifest.sandbox.sandbox_ids.indexOf(instance.id);
  if (oldIdIndex !== -1) {
    manifest.sandbox.sandbox_ids.splice(oldIdIndex, 1);
  }
  ```
- Repeat for `orchestrator.ts:440-445` (expiration restart)
- Repeat for `orchestrator.ts:267-286` (health check restart)

**Why this step second**: Cleans up state corruption before testing progress calculations

#### Step 3: Fix Issue B - Replace Increment-Based Counting with Set-Based Calculation

- In `feature.ts:335`, remove the line `manifest.progress.features_completed++;`
- In `feature.ts:343`, remove the line `initiative.features_completed++;`
- In `feature.ts:366`, remove the line `manifest.progress.tasks_completed += tasksCompleted;`
- In `manifest.ts:writeOverallProgress()`, calculate counts from manifest state:
  ```typescript
  // Calculate features completed by counting
  const featuresCompleted = manifest.feature_queue.filter(f => f.status === "completed").length;

  // Calculate tasks completed by summing from all completed features
  const tasksCompleted = manifest.feature_queue
    .filter(f => f.status === "completed")
    .reduce((sum, f) => sum + (f.tasks_completed || 0), 0);

  // Cap at totals to prevent > 100%
  const cappedFeaturesCompleted = Math.min(featuresCompleted, manifest.progress.features_total);
  const cappedTasksCompleted = Math.min(tasksCompleted, manifest.progress.tasks_total);
  ```
- Update initiative features_completed calculation in `work-queue.ts:258` to use counting:
  ```typescript
  const completedCount = initFeatures.filter(f => f.status === "completed").length;
  initiative.features_completed = completedCount;
  ```

**Why this step third**: Progress calculations must be correct before adding real-time UI updates

#### Step 4: Fix Issue A - Add Real-Time UI Progress Updates

- In `feature.ts:runFeatureImplementation()`, after starting progress polling (~line 196), add:
  ```typescript
  // Write UI progress at regular intervals to show real-time output
  let uiProgressInterval: ReturnType<typeof setInterval> | null = null;
  if (uiEnabled) {
    uiProgressInterval = setInterval(() => {
      writeUIProgress(
        instance.label,
        progressPoller.getLastProgress(),
        instance,
        feature,
        outputTracker
      );
    }, 2000); // Every 2 seconds
  }
  ```
- Clear the interval in the try/finally blocks:
  ```typescript
  if (uiProgressInterval) clearInterval(uiProgressInterval);
  ```
- Ensure `writeUIProgress()` handles null progress gracefully

**Why this step fourth**: Only add real-time updates after all data correctness issues are fixed

#### Step 5: Add Tests and Validation

- Add unit test for `assignFeatureToSandbox` atomicity
- Add unit test for sandbox ID cleanup
- Add unit test for set-based progress calculation with bounds checking
- Add integration test that runs orchestrator with 3 sandboxes and verifies:
  - UI output updates within 3 seconds
  - Progress never exceeds 100%
  - Only 3 sandbox IDs in manifest
  - No duplicate feature assignments
- Run full validation suite

**Why this step last**: Validate all fixes work correctly together

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `assignFeatureToSandbox()` saves manifest and returns success
- ✅ `assignFeatureToSandbox()` prevents duplicate assignments
- ✅ Sandbox ID cleanup removes old ID before adding new one
- ✅ Progress calculation counts correctly from manifest state
- ✅ Progress calculation caps at totals
- ✅ `writeUIProgress()` handles null progress gracefully
- ✅ Regression test: Features completing multiple times don't increment counters

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/work-queue.spec.ts` - Feature assignment tests
- `.ai/alpha/scripts/lib/__tests__/manifest.spec.ts` - Progress calculation tests
- `.ai/alpha/scripts/lib/__tests__/orchestrator.spec.ts` - Sandbox cleanup tests

### Integration Tests

Add integration test that:
- Starts orchestrator with 3 sandboxes
- Simulates multiple feature completions with retries
- Verifies progress counts never exceed totals
- Verifies only 3 sandbox IDs exist after multiple restarts
- Verifies no race conditions in feature assignment

**Test files**:
- `.ai/alpha/scripts/__tests__/orchestrator-integration.spec.ts`

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Reproduce original issues (should see frozen output, >100% progress, 15+ sandboxes, duplicate assignments)
- [ ] Apply fixes
- [ ] Run orchestrator with `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
- [ ] Verify UI output updates in real-time (within 3 seconds)
- [ ] Monitor progress bars - should never exceed 100%
- [ ] Check `spec-manifest.json` after 30 minutes - should have exactly 3 sandbox IDs
- [ ] Verify each feature is only assigned to one sandbox at a time
- [ ] Let orchestrator run for 1 hour to test sandbox restarts
- [ ] Verify no duplicate work or race conditions

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **UI Progress Interval Performance Impact**: Writing progress every 2 seconds could cause I/O contention
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Monitor file system I/O during testing. If problematic, increase interval to 3-5 seconds.

2. **Manifest Save Inside Assignment Could Slow Work Loop**: Adding I/O to the assignment function could create bottlenecks
   - **Likelihood**: low
   - **Impact**: medium
   - **Mitigation**: Profile the work loop. The assignment happens infrequently (once per feature start), so impact should be minimal.

3. **Set-Based Counting Could Miss Edge Cases**: Calculation logic might not handle all feature states correctly
   - **Likelihood**: low
   - **Impact**: high
   - **Mitigation**: Comprehensive unit tests for all status combinations. Add capping to prevent >100% even if calculation is wrong.

**Rollback Plan**:

If these fixes cause issues in production:
1. Revert the four affected files to previous commit
2. Restart orchestrator - will continue from last checkpoint
3. File detailed bug report with logs
4. Investigate root cause offline

**Monitoring**:
- Monitor orchestrator logs for "Lost race" messages (should be zero)
- Watch progress percentages during runs (should never exceed 100%)
- Check sandbox_ids array length periodically (should stay at 3)
- Monitor file I/O on `.ai/alpha/progress/` directory

## Performance Impact

**Expected Impact**: minimal

**UI Progress Interval**: Writing JSON files every 2 seconds adds ~0.5ms I/O per write × 3 sandboxes = 1.5ms/2s = negligible.

**Set-Based Counting**: Iterating through 13 features to count is O(n) but n is small. Performance impact: <1ms per manifest save.

**Atomic Assignment**: Adding one file write per feature start. Features start infrequently (every 5-30 minutes), so impact is negligible.

**Performance Testing**:
- Run orchestrator for full spec (13 features, 110 tasks)
- Measure total runtime vs baseline
- Monitor CPU and I/O usage
- Verify <5% performance degradation

## Security Considerations

**Security Impact**: none

These are internal orchestration fixes with no security implications. No user data, authentication, or external APIs are affected.

## Validation Commands

### Before Fix (Bugs Should Reproduce)

```bash
# Start orchestrator
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# In another terminal, monitor progress
watch -n 1 'cat .ai/alpha/progress/overall-progress.json | jq "{features: .featuresCompleted, featuresTotal: .featuresTotal, tasks: .tasksCompleted, tasksTotal: .tasksTotal}"'

# Check sandbox IDs
watch -n 10 'cat .ai/alpha/specs/1362-Spec-user-dashboard-home/spec-manifest.json | jq ".sandbox.sandbox_ids | length"'

# Observe UI - output should freeze after initial messages
```

**Expected Result**: Output freezes, progress exceeds 100%, sandbox IDs accumulate

### After Fix (Bugs Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Format
pnpm format:fix

# Unit tests (after adding them)
pnpm --filter @alpha/scripts test work-queue.spec.ts
pnpm --filter @alpha/scripts test manifest.spec.ts
pnpm --filter @alpha/scripts test orchestrator.spec.ts

# Integration test (after adding it)
pnpm --filter @alpha/scripts test orchestrator-integration.spec.ts

# Build
pnpm build

# Manual verification - start orchestrator
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Monitor in separate terminals:
# 1. UI output should update every 2-3 seconds
# 2. Progress should stay ≤100%
watch -n 1 'cat .ai/alpha/progress/overall-progress.json | jq "{features: .featuresCompleted, featuresTotal: .featuresTotal, tasks: .tasksCompleted, tasksTotal: .tasksTotal, pct: ((.tasksCompleted / .tasksTotal) * 100)}"'

# 3. Sandbox IDs should stay at 3
watch -n 10 'cat .ai/alpha/specs/1362-Spec-user-dashboard-home/spec-manifest.json | jq ".sandbox.sandbox_ids | length"'

# 4. No duplicate feature assignments
watch -n 5 'cat .ai/alpha/specs/1362-Spec-user-dashboard-home/spec-manifest.json | jq "[.feature_queue[] | select(.status == \"in_progress\") | {id: .id, sandbox: .assigned_sandbox}]"'
```

**Expected Result**: All commands succeed, all four bugs are resolved, zero regressions.

### Regression Prevention

```bash
# Run orchestrator for multiple hours to stress-test
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Monitor for issues:
# - No race condition warnings in logs
# - Progress stays ≤100% throughout
# - Sandbox count stays at 3
# - UI output continuously updates
```

## Dependencies

**No new dependencies required**

All fixes use existing Node.js and TypeScript built-ins.

## Database Changes

**No database changes required**

All fixes are to the orchestrator runtime logic only.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this is a client-side orchestrator script

**Feature flags needed**: no

**Backwards compatibility**: maintained - fixes work with existing manifest files

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] UI output updates in real-time (visible within 3 seconds)
- [ ] Progress percentages never exceed 100%
- [ ] Only 3 sandbox IDs in manifest after 1+ hour run
- [ ] Zero duplicate feature assignments observed
- [ ] All unit tests pass
- [ ] Integration test passes
- [ ] Manual testing checklist complete
- [ ] No performance degradation (< 5% slower)
- [ ] Clean run of full spec without errors

## Notes

**Implementation Order is Critical**: Fix Issue D (atomicity) first to prevent corruption during testing of other fixes.

**Testing Strategy**: Each issue should be testable independently. Start with unit tests for each fix, then integration test for the full system.

**Progress Calculation Design Decision**: Using set-based counting (iterating and filtering) instead of maintaining counters trades a small amount of CPU for correctness and simplicity. The manifest only has ~13 features and ~110 tasks, so iteration cost is negligible (<1ms).

**UI Update Frequency**: 2 seconds is chosen as a balance between real-time feel and I/O overhead. If tests show performance issues, can increase to 3-5 seconds.

**Atomic Assignment Pattern**: Moving `saveManifest()` inside `assignFeatureToSandbox()` makes the function less pure but eliminates an entire class of race conditions. This is the right trade-off for correctness.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1428*
