# Bug Diagnosis: Orchestrator Deadlock Due to Unmet Initiative Dependencies

**ID**: ISSUE-pending
**Created**: 2026-01-23T18:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The spec orchestrator deadlocks (hangs indefinitely) when Initiative I1 has a failed feature (F4) that prevents the initiative from being marked as "completed", which in turn blocks all features in Initiative I2, I3, and I4 that depend on Initiative I1. All three sandboxes become idle waiting for dependencies that can never be resolved, causing the orchestrator UI to appear hung.

## Environment

- **Application Version**: Current dev branch
- **Environment**: development
- **Node Version**: 20.x
- **Last Working**: N/A (first run of S1692)

## Reproduction Steps

1. Run `tsx spec-orchestrator.ts 1692` to implement Spec S1692 (user dashboard)
2. Features S1692.I1.F1, S1692.I1.F2, and S1692.I1.F3 complete successfully
3. Feature S1692.I1.F4 (Skeleton Loading) fails with PTY timeout error
4. Initiative S1692.I1 remains "in_progress" (3/4 features completed)
5. All features in I2, I3, I4 are blocked by dependency on S1692.I1
6. All three sandboxes enter "idle/waiting" state
7. The orchestrator UI hangs indefinitely at 10min 48s

## Expected Behavior

When a feature fails and blocks dependent features:
1. The orchestrator should detect the deadlock condition
2. Either retry the failed feature, or
3. Exit with a clear error message explaining what's blocking progress

## Actual Behavior

- All 3 sandboxes show status "idle" with `waiting_reason: "Waiting for dependencies (15 features blocked)"`
- All sandboxes report `blocked_by: ["S1692.I2.F1", "S1692.I2.F2", "S1692.I2.F3"]`
- The orchestrator work loop continues running but makes no progress
- UI appears frozen/hung with no clear indication of the problem

## Diagnostic Data

### Progress Files

```json
// sbx-a-progress.json
{
  "status": "idle",
  "phase": "waiting",
  "waiting_reason": "Waiting for dependencies (15 features blocked)",
  "blocked_by": ["S1692.I2.F1", "S1692.I2.F2", "S1692.I2.F3"]
}
```

### Manifest State

```json
// Key entries from spec-manifest.json
{
  "initiatives": [
    {
      "id": "S1692.I1",
      "status": "in_progress",
      "feature_count": 4,
      "features_completed": 3  // F1, F2, F3 completed, F4 failed
    },
    {
      "id": "S1692.I2",
      "status": "pending",
      "dependencies": ["S1692.I1"]  // BLOCKED
    }
    // I3, I4, I5 also blocked by I1
  ],
  "feature_queue": [
    { "id": "S1692.I1.F4", "status": "failed", "error": "PTY timeout..." },
    { "id": "S1692.I2.F1", "status": "pending", "dependencies": ["S1692.I1"] }
  ]
}
```

### Log Evidence

```
// sbx-a.log
[PTY] PTY timeout error: PTY timeout on sandbox i040xtkx2zni8f9uj3k4p: Progress file unavailable: exit status 1

// Feature F4 marked as failed
"error": "PTY timeout on sandbox i040xtkx2zni8f9uj3k4p: Progress file unavailable: exit status 1"
```

## Error Stack Traces

No stack traces - this is a logic deadlock, not an exception.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/work-queue.ts:139-156` - Dependency checking logic
  - `.ai/alpha/scripts/lib/orchestrator.ts:876-900` - Work loop exit conditions

- **Recent Changes**: None relevant
- **Suspected Functions**: `getNextAvailableFeature()`, work loop exit logic

## Related Issues & Context

### Direct Predecessors
None found - this appears to be a new failure mode.

### Related Infrastructure Issues
- #1567: Sandbox restart patterns (related to health checks)
- #1688: Stuck feature detection (related but different condition)
- #1767: PTY disconnect recovery (the PTY failure that triggered this)

### Similar Symptoms
None found.

### Same Component
- #1767: PTY timeout recovery - the original PTY failure

### Historical Context
This is the first run of Spec S1692. The deadlock is caused by the combination of:
1. A feature failure (S1692.I1.F4)
2. Initiative-level dependencies (I2, I3, I4 depend on I1)
3. The work-queue's inability to recognize this as a terminal state

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `getNextAvailableFeature()` function correctly identifies that no features are available (because all remaining features are blocked by incomplete initiative S1692.I1), but the work loop exit condition at line 876-900 doesn't recognize this as a deadlock when there are "failed" features that will never be retried due to their blocking effect on initiative completion.

**Detailed Explanation**:

1. **Dependency Chain**:
   - Features S1692.I2.F1, S1692.I2.F2, S1692.I2.F3 have `dependencies: ["S1692.I1"]` (the INITIATIVE)
   - Initiative S1692.I1 requires ALL 4 features (F1-F4) to be "completed" to mark the initiative as "completed"
   - Feature S1692.I1.F4 is "failed" (not "completed")
   - Therefore, Initiative S1692.I1 can NEVER become "completed"
   - Therefore, all I2/I3/I4 features can NEVER have their dependencies satisfied

2. **Work Queue Logic Issue** (`work-queue.ts:139-156`):
   ```typescript
   // Check if all dependencies are satisfied
   const depsComplete = feature.dependencies.every((depId) => {
     // Check if it's a completed feature
     if (completedFeatureIds.has(depId)) return true;
     // Check if it's a completed initiative
     if (completedInitiativeIds.has(depId)) return true;
     return false;
   });
   ```
   This correctly identifies that initiative dependencies aren't met, but doesn't consider "partial initiative completion" scenarios.

3. **Exit Logic Issue** (`orchestrator.ts:876-900`):
   ```typescript
   // Check for ANY retryable features (pending or failed), regardless of dependencies
   const retryableFeatures = manifest.feature_queue.filter(
     (f) => f.status === "pending" || f.status === "failed",
   );
   // Exit only if no retryable features exist
   if (retryableFeatures.length === 0) break;
   ```
   This sees F4 as "failed" (retryable) and F2.1, F2.2, etc. as "pending" (retryable), so it continues the loop. But F4 was already retried and failed again, and the pending features are permanently blocked.

4. **Missing Deadlock Detection**:
   - The system should detect when:
     a. All available sandboxes are idle
     b. No features can be assigned (all blocked or failed)
     c. Failed features have been retried the maximum number of times OR their failure blocks initiative completion
   - This is a **deadlock condition** that should trigger an exit with a clear error

**Supporting Evidence**:
- All 3 sandboxes in "idle" state with the same blocked_by list
- Feature F4 has status "failed" with error message
- Initiative I1 has 3/4 features completed (never reaches 4/4)
- Overall progress stuck at 2/19 features
- 10 minutes 48 seconds elapsed with no progress

### How This Causes the Observed Behavior

1. Orchestrator starts implementing S1692
2. F1, F2 complete successfully
3. F3 starts on sbx-a, assigned at 18:04:24 (per log)
4. F4 attempts on sbx-a at 18:04:57, fails with PTY timeout
5. F4 is retried at 18:05:30, fails again with "Progress file unavailable"
6. F4 is now marked as "failed" in manifest
7. Initiative I1 cannot be marked "completed" (only 3/4 features done)
8. All I2, I3, I4 features depend on I1 being "completed"
9. `getNextAvailableFeature()` returns null (all features blocked)
10. All sandboxes write idle status and wait
11. Work loop continues because "pending" and "failed" features exist
12. **Infinite loop**: No features available, but exit condition not met

### Confidence Level

**Confidence**: High

**Reasoning**:
- The manifest and progress files clearly show the state
- The code logic confirms the dependency checking behavior
- The exit conditions in the work loop explain why it doesn't terminate
- This is a clear logic bug, not a race condition or transient issue

## Fix Approach (High-Level)

Two complementary fixes are needed:

1. **Deadlock Detection** (orchestrator.ts work loop):
   - Add detection for: all sandboxes idle + no assignable features + blocked features exist
   - When detected, check if the blocking comes from failed features in dependency chain
   - If so, either force-retry the failed feature(s) or exit with clear error

2. **Failed Feature in Initiative Handling** (work-queue.ts):
   - When checking initiative-level dependencies, consider if the initiative can EVER complete
   - If an initiative has failed features that would prevent completion, surface this in blocked status

3. **Alternative: Automatic Retry with Backoff**:
   - Failed features blocking initiative completion should be automatically retried
   - Add a max retry count and exponential backoff
   - If max retries exceeded, mark initiative as "failed" rather than "in_progress"

## Diagnosis Determination

**Root Cause Confirmed**: The orchestrator enters an undetectable deadlock when:
1. A feature fails that is required for initiative completion
2. Other features depend on that initiative
3. The work loop's exit conditions don't recognize this as a terminal state

The fix requires adding explicit deadlock detection or changing how failed features in critical paths are handled.

## Additional Context

- The PTY timeout error that caused F4 to fail is a separate issue (already tracked in #1767)
- This diagnosis focuses on why the orchestrator doesn't gracefully handle the failure cascade
- The UI correctly shows sandbox status but doesn't indicate the deadlock to the user

---
*Generated by Claude Debug Assistant*
*Tools Used: Read (logs, manifest, progress files), Glob (find files), Bash (list directories)*
