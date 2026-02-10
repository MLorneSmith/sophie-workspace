# Bug Diagnosis: Overall Progress shows 0 tasks during active feature execution

**ID**: ISSUE-2049
**Created**: 2026-02-10T16:00:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The "Overall Progress" section of the Alpha Orchestrator UI shows 0 tasks completed even though sandboxes are actively executing tasks (sbx-a completed 1 task, sbx-b completed 3 tasks). The root cause is that `overall-progress.json` calculates `tasksCompleted` from `manifest.feature_queue[*].tasks_completed`, but this field is only updated **after** a feature finishes execution (at `feature.ts:750`). During execution, it stays at `0`. The individual sandbox progress files correctly show real-time progress, but the overall aggregate does not.

## Environment

- **Application Version**: Alpha Orchestrator (post-refactor Issues #1955-1962)
- **Environment**: Development (local orchestrator + E2B sandboxes)
- **Node Version**: N/A (tsx runtime)
- **Database**: N/A (orchestrator state issue)
- **Last Working**: Never worked correctly during execution (gap introduced when #1688 fix moved to manifest-authoritative counts)

## Reproduction Steps

1. Run `tsx spec-orchestrator.ts 2045 --provider gpt`
2. Wait for sandboxes to start executing features
3. Observe the "Overall Progress" section in the UI
4. After 8+ minutes, it still shows `0/99 tasks completed`
5. Meanwhile, individual sandbox progress files (`sbx-a-progress.json`, `sbx-b-progress.json`) show real task completion (1 and 3 tasks respectively)

## Expected Behavior

Overall Progress should show real-time task completion counts that aggregate across all sandbox progress files during execution.

## Actual Behavior

Overall Progress shows `tasksCompleted: 0` throughout the entire feature execution phase. It only updates after a feature fully completes and the manifest is saved with the updated `tasks_completed` count.

## Diagnostic Data

### Evidence from Progress Files

**`overall-progress.json`** (stale - shows 0):
```json
{
  "tasksCompleted": 0,
  "tasksTotal": 99,
  "lastCheckpoint": "2026-02-10T15:08:25.688Z"
}
```

**`sbx-a-progress.json`** (correct - shows 1 completed):
```json
{
  "completed_tasks": ["S2045.I1.F1.T1"],
  "current_task": { "id": "S2045.I1.F1.T2", "status": "in_progress" },
  "phase": "verifying"
}
```

**`sbx-b-progress.json`** (correct - shows 3 completed):
```json
{
  "completed_tasks": ["S2045.I1.F2.T1", "S2045.I1.F2.T2", "S2045.I1.F2.T3"],
  "current_task": { "id": "S2045.I1.F2.T3", "status": "completed" },
  "phase": "executing"
}
```

**`spec-manifest.json`** (stale - shows 0 for both in_progress features):
```json
{
  "feature_queue": [
    { "id": "S2045.I1.F1", "status": "in_progress", "tasks_completed": 0 },
    { "id": "S2045.I1.F2", "status": "in_progress", "tasks_completed": 0 }
  ]
}
```

### Code Path Analysis

1. **`writeOverallProgress()`** (`manifest.ts:933-1005`): Calculates `tasksCompleted` by summing `feature_queue[*].tasks_completed`:
   ```typescript
   const tasksCompleted = manifest.feature_queue.reduce(
     (sum, f) => sum + (f.tasks_completed || 0),
     0,
   );
   ```

2. **`feature.tasks_completed` update** (`feature.ts:750`): Only set AFTER feature execution completes:
   ```typescript
   // Line 750 - only reached after runFeatureImplementation() finishes
   feature.tasks_completed = tasksCompleted;
   ```

3. **`saveManifest()`** (`manifest.ts:876-891`): Calls `writeOverallProgress()` but the manifest still has `tasks_completed: 0` for in-progress features.

4. **UI Progress Poller** (`useProgressPoller.ts:881-895`): Reads `overall-progress.json` directly and trusts its `tasksCompleted` value (which is 0 during execution).

### Historical Context

The comment at `useProgressPoller.ts:875-879` explains why:
```typescript
// FIXED (Issue #1699, #1701): The manifest's writeOverallProgress() now calculates
// tasksCompleted by summing tasks_completed from ALL features (completed + in-progress).
// Previously, we added sandbox inProgressTasks on top, causing double-counting.
// Now we use the manifest's authoritative counts directly.
```

The fix for #1688/#1699/#1701 (double-counting) removed the sandbox-level aggregation that previously provided real-time counts. The fix correctly prevented double-counting for **completed** features, but introduced this regression for **in-progress** features where `tasks_completed` is always 0 in the manifest.

## Related Issues & Context

### Direct Predecessors
- #1688 (CLOSED): "Overall Progress tasks_completed mismatch" - Original fix that moved to manifest-authoritative counts
- #1699 (CLOSED): "Alpha Orchestrator Progress Count Mismatch" - PTY timeout causing UI hang
- #1701 (CLOSED): "UI Hang" - Related PTY timeout fix

### Same Component
- #1955 (CLOSED): "Centralize feature status transitions" - Recent refactor of status management
- #1957 (CLOSED): "Runtime validation for progress file status values" - Progress file validation
- #1952 (CLOSED): "GPT agent 'blocked' status" - Status contract mismatch

### Historical Context
The removal of sandbox-level task aggregation in the UI poller (to fix double-counting from #1688) created this gap where in-progress task counts are never reflected in overall progress. The individual sandbox progress files are accurate but that data never flows up to the aggregate.

## Root Cause Analysis

### Identified Root Cause

**Summary**: `overall-progress.json` only reads `tasks_completed` from the manifest's `feature_queue`, but `feature.tasks_completed` is only written after feature execution completes. During execution it is always `0`.

**Detailed Explanation**:

The data flow has a gap:

```
Sandbox .initiative-progress.json  →  sbx-{a,b,c}-progress.json  (✅ real-time, correct)
                                         │
                                         ╳  (NO connection to overall-progress.json during execution)
                                         │
manifest feature_queue.tasks_completed  →  overall-progress.json  (❌ stale during execution)
```

1. The sandbox progress poller (`progress.ts:startProgressPolling`) reads `.initiative-progress.json` from the sandbox every 30s and writes to `sbx-{label}-progress.json`. This is real-time and correct.

2. `writeOverallProgress()` reads `manifest.feature_queue[*].tasks_completed` to calculate the aggregate. But this field is only set at `feature.ts:750` **after** `runFeatureImplementation()` completes.

3. The UI poller removed sandbox-level aggregation (fix for #1688 double-counting) and now trusts `overall-progress.json` exclusively.

**Supporting Evidence**:
- `overall-progress.json` shows `tasksCompleted: 0` while `sbx-b-progress.json` shows 3 completed tasks
- `spec-manifest.json` shows `tasks_completed: 0` for both in-progress features
- `feature.ts:750` is the only place `feature.tasks_completed` gets set during normal execution

### How This Causes the Observed Behavior

1. Orchestrator starts, assigns features to sandboxes
2. Sandboxes execute tasks, updating `.initiative-progress.json` inside the sandbox
3. Progress poller writes accurate per-sandbox progress files locally
4. `overall-progress.json` is written by `saveManifest()` which reads from manifest
5. Manifest's `feature_queue[*].tasks_completed` is still 0 (only updated on completion)
6. UI reads `overall-progress.json` and displays 0 tasks completed

### Confidence Level

**Confidence**: High

**Reasoning**: Direct evidence from the running S2045 execution: sandbox progress files show 1 and 3 completed tasks while overall-progress.json shows 0. The code path clearly shows `tasks_completed` is only set at `feature.ts:750` after execution, and `writeOverallProgress()` reads from this field.

## Fix Approach (High-Level)

Two complementary approaches:

**Option A (Recommended): Update manifest `tasks_completed` during progress polling**
In `progress.ts:startProgressPolling()`, after reading and parsing sandbox progress, update the corresponding `feature.tasks_completed` in the manifest with the count from `progress.completed_tasks.length`. Then call `writeOverallProgress()` (or just `saveManifest()`). This makes the manifest reflect real-time progress.

**Option B: Aggregate from sandbox progress files in the UI poller**
In `useProgressPoller.ts`, after reading `overall-progress.json` and sandbox progress files, compute `inProgressTasks` from sandbox completed_tasks and add to the overall count. This was the approach before #1688 but needs careful handling to avoid double-counting completed features.

Option A is preferred because it keeps the manifest as the single source of truth and fixes the gap at the source rather than patching it in the UI layer.

## Diagnosis Determination

The root cause is definitively identified: `manifest.feature_queue[*].tasks_completed` is not updated during feature execution, only after completion. This creates a gap where `writeOverallProgress()` computes 0 tasks for all in-progress features. The fix is to propagate real-time task counts from sandbox progress polling into the manifest during execution.

## Additional Context

- This only affects the "Overall Progress" aggregate display. Individual sandbox progress panels show correct real-time data.
- The bug was likely introduced when the #1688 fix moved to manifest-authoritative counts and removed sandbox-level aggregation from the UI poller.
- This affects both Claude and GPT provider modes equally.
- The S2045 run with GPT provider is the first run after the comprehensive refactoring (#1955-1962), making this the first opportunity to observe the bug post-refactor.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob, Grep, Task (Bash agent for GitHub issues)*
