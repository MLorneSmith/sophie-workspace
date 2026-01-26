# Bug Diagnosis: Orchestrator UI Hangs Due to In-Progress Feature with Completed Tasks

**ID**: ISSUE-1780
**Created**: 2026-01-23T19:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator UI hangs at 18 minutes 9 seconds despite implementing Issue #1777 (deadlock detection). The root cause is a feature stuck in "in_progress" status (`S1692.I1.F3`) that has all 4 of its tasks completed (`tasks_completed: 4, task_count: 4`) but was never transitioned to "completed" status. This blocks Initiative `S1692.I1` from completing, which in turn blocks 15 dependent features.

## Environment

- **Application Version**: Alpha Orchestrator 0.1.x
- **Environment**: development
- **Node Version**: v22.x
- **Database**: PostgreSQL (Supabase sandbox)
- **Last Working**: Prior runs without this specific state

## Reproduction Steps

1. Start the orchestrator on spec S1692: `node .ai/alpha/scripts/spec-orchestrator.ts --spec S1692 --ui`
2. Wait for feature `S1692.I1.F3` to begin implementation
3. Feature completes all 4 tasks but manifest is not updated to `status: "completed"`
4. Observe UI hang - sandbox shows "idle" waiting for dependencies (15 features blocked)
5. Deadlock detection from #1777 does not trigger because there are no "failed" features

## Expected Behavior

When a feature completes all its tasks (`tasks_completed === task_count`), the feature status should be updated to `"completed"` and the manifest saved, allowing dependent features to proceed.

## Actual Behavior

Feature `S1692.I1.F3` remains `status: "in_progress"` with `tasks_completed: 4` out of `task_count: 4`. The sandbox shows "idle" state in `sbx-a-progress.json` with `waiting_reason: "Waiting for dependencies (15 features blocked)"`.

The deadlock detection implemented in #1777 does NOT trigger because:
1. It only checks for `status: "failed"` features blocking the queue
2. This feature has `status: "in_progress"` (not "failed")
3. The feature has no error field set

## Diagnostic Data

### Manifest State

```json
{
  "id": "S1692.I1.F3",
  "status": "in_progress",
  "dependencies": ["S1692.I1.F1"],
  "tasks_completed": 4,
  "task_count": 4
}
```

Initiative `S1692.I1` is stuck:
```json
{
  "id": "S1692.I1",
  "status": "in_progress",
  "features_completed": 3,
  "feature_count": 4
}
```

### Progress File State

`sbx-a-progress.json`:
```json
{
  "sandbox_id": "i0sfqql96ritm8ji9avqc",
  "status": "idle",
  "phase": "waiting",
  "last_heartbeat": "2026-01-23T18:59:07.794Z",
  "waiting_reason": "Waiting for dependencies (15 features blocked)",
  "blocked_by": ["S1692.I2.F1", "S1692.I2.F2", "S1692.I2.F3"]
}
```

### Why #1777 Doesn't Help

The deadlock detection in `detectAndHandleDeadlock()` (orchestrator.ts:422-541) checks:
1. All sandboxes idle: ✅ True
2. No features can be assigned: ✅ True
3. **Failed features exist**: ❌ False - feature is "in_progress", not "failed"

Since condition 3 is false, deadlock detection returns `{ shouldExit: false, retriedCount: 0 }` and the work loop continues infinitely waiting.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The PTY timeout recovery mechanism correctly detects completion via progress file but fails to update the manifest when the feature is still marked as `in_progress` in the work loop.

**Detailed Explanation**:

Looking at `orchestrator.ts:1088-1170` (PTY_FALLBACK logic in the work loop):

```typescript
// Bug fix #1767: Check if PTY timed out but progress file shows completion
if (sandboxInstance.status === "busy") {
  // ... checks progress file and updates manifest if completed
}
```

The PTY fallback only runs when `sandboxInstance.status === "busy"`. However, there's a timing issue:

1. `feature.ts` runs `runFeatureImplementation()` which:
   - Sets `instance.status = "busy"` at line 177
   - Waits for PTY to complete
   - On success, sets `instance.status = "ready"` at line 644

2. If the PTY completes but the manifest save at line 703 (`saveManifest(manifest)`) fails or is interrupted, the feature remains `in_progress` while the sandbox is `ready`.

3. The work loop's PTY_FALLBACK check at line 1108 only triggers when `sandboxInstance.status === "busy"`. Once the sandbox is `ready`, this fallback never runs.

4. The stuck feature detection at lines 1177-1206 checks for:
   ```typescript
   if (
     tasksRemaining > 0 &&  // ❌ False - 4-4=0 tasks remaining
     sandboxInstance.status !== "busy" &&
     assignedDuration > STUCK_TASK_THRESHOLD_MS
   )
   ```
   This detection fails because `tasksRemaining === 0` (all tasks completed).

**The Gap**: There's no detection for features where `tasks_completed === task_count` but `status !== "completed"`. This is a "phantom completion" state.

### How This Causes the Observed Behavior

1. Feature `S1692.I1.F3` completes all 4 tasks
2. PTY completes but manifest update is missed (race condition, signal interrupt, or error path)
3. Sandbox status becomes "ready"
4. Work loop checks for next feature - none available due to dependency on `S1692.I1`
5. Initiative `S1692.I1` cannot complete (only 3/4 features marked completed)
6. All 15 dependent features remain blocked
7. Deadlock detection doesn't trigger (no "failed" features)
8. UI hangs indefinitely

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The manifest clearly shows `tasks_completed: 4` and `task_count: 4` with `status: "in_progress"` - this is the exact phantom completion state
2. The code analysis shows no handler for this specific state
3. The #1777 deadlock detection explicitly requires `status: "failed"` which this feature doesn't have
4. The stuck task detection requires `tasksRemaining > 0` which is false here

## Fix Approach (High-Level)

Two complementary fixes needed:

### Fix 1: Detect "Phantom Completion" State

Add detection in the work loop for features where all tasks are completed but status is not "completed":

```typescript
// After stuck task detection (~line 1206):
// NEW: Detect phantom completion - tasks done but status not updated
if (
  feature.tasks_completed >= feature.task_count &&
  feature.status === "in_progress" &&
  sandboxInstance.status !== "busy"
) {
  log(`   🔧 [PHANTOM_COMPLETION] Feature #${feature.id} has all tasks done but status is in_progress`);
  feature.status = "completed";
  // ... update initiative, save manifest
}
```

### Fix 2: Extend Deadlock Detection

Modify `detectAndHandleDeadlock()` to also check for stuck "in_progress" features that aren't making progress (no sandbox busy, all tasks done):

```typescript
// In addition to failed features, check for in_progress features with completed tasks
const phantomCompletedFeatures = manifest.feature_queue.filter(
  (f) => f.status === "in_progress" &&
         f.tasks_completed >= f.task_count &&
         !instances.some(i => i.currentFeature === f.id)
);
```

## Secondary Issue: Slow Startup (10 minutes)

The user also reported ~10 minutes to implement the first task. From the code analysis:

1. **Sandbox Creation**: 60 second stagger delay between sandboxes (`SANDBOX_STAGGER_DELAY_MS`)
2. **Database Operations**: Parallelized but still takes time
3. **Git Operations**: Pull/fetch on each feature start
4. **Startup Retries**: Up to 3 retries with exponential backoff (5s, 10s, 30s)

This is within expected parameters for cold start with database seeding, but could be optimized by:
- Pre-warming the sandbox template with dependencies
- Caching git fetch operations
- Parallel database seeding (already implemented in PR #1707)

## Related Issues & Context

### Direct Predecessors
- #1777 (completed): "Deadlock detection and recovery" - Partially addressed but missed this state

### Related Infrastructure Issues
- #1767 (completed): "PTY timeout recovery via progress file" - The fallback mechanism
- #1699, #1701 (completed): "PTY timeout configuration" - PTY keepalive settings

### Same Component
- #1688: "Stuck features where sandbox has no current task" - Similar pattern but checked `tasksRemaining > 0`

### Historical Context
This is a regression gap in the deadlock detection implemented in #1777. The fix correctly handles failed features but missed the case where features complete their tasks without properly transitioning status.

## Additional Context

The fix should also add telemetry/logging when phantom completion is detected to track how often this edge case occurs. This helps determine if there's an upstream issue in `feature.ts` that should be fixed to prevent this state from occurring in the first place.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Bash (jq), Grep, code analysis*
