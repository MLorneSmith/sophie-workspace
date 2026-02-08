# Bug Diagnosis: Alpha Orchestrator Progress UI Mismatch and Stall Detection Failure

**ID**: ISSUE-1686
**Created**: 2026-01-20T12:00:00Z
**Reporter**: User
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha orchestrator UI exhibits multiple progress tracking issues: (1) The sandbox progress bars show different task counts than what's displayed in the "Next" section, (2) Events reference non-existent Task IDs like "T21", (3) The Overall Progress section shows completion (101/101 tasks) while sandbox-a shows 18/19 or 5/19, and (4) sandbox-a stalled with a 7+ minute old heartbeat but the completion screen was never shown.

## Environment

- **Application Version**: Alpha orchestrator v1.0 (spec-orchestrator.ts)
- **Environment**: Development (local)
- **Node Version**: N/A (tsx execution)
- **Last Working**: Unknown (first observed run)

## Reproduction Steps

1. Run `/alpha:spec` to create a spec
2. Decompose the spec through initiative, feature, and task decomposition
3. Run `pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts S1656`
4. Observe the UI as sandboxes work on features
5. Notice discrepancies between Overall Progress and individual sandbox columns
6. Observe sandbox-a stalling without completion screen appearing

## Expected Behavior

1. Overall Progress task count should match the sum of tasks from all sandbox columns
2. Sandbox column progress bars should show accurate task counts (X/Y) matching the current feature's tasks
3. Task events should reference valid task IDs from the current feature's tasks.json
4. When all features complete, the completion screen should be shown
5. Stalled sandboxes should be detected and handled

## Actual Behavior

1. Overall Progress showed 101/101 complete while sandbox-a showed 18/19 or 5/19
2. Progress bars in sandbox columns show counts unrelated to the current feature
3. Event log showed "Task T21" which doesn't exist in any tasks.json (max is T5 per feature)
4. Sandbox-a stalled with 7m+ heartbeat age but no recovery or completion screen
5. The spec implementation never completed

## Diagnostic Data

### Console Output
```
From sbx-a.log:
- Multiple features completed successfully (S1656.I4.F1, I4.F2, etc.)
- Final feature S1656.I4.F4 appears to be in progress
- Log shows normal operation until abrupt end
```

### Progress File Analysis

From `overall-progress.json`:
```json
{
  "specId": "S1656",
  "status": "in_progress",
  "initiativesCompleted": 3,
  "initiativesTotal": 4,
  "featuresCompleted": 12,
  "featuresTotal": 13,
  "tasksCompleted": 95,
  "tasksTotal": 101
}
```

From `sbx-a-progress.json`:
```json
{
  "feature": {
    "issue_number": "S1656.I4.F4",
    "title": "Error Handling & Fallback System"
  },
  "completed_tasks": ["S1656.I4.F4.T1", "S1656.I4.F4.T2", "S1656.I4.F4.T3", "S1656.I4.F4.T4"],
  "current_task": null
}
```

Key observation: `current_task` is null but there's still a Task T5 pending in S1656.I4.F4's tasks.json.

## Error Stack Traces

No explicit errors in logs. The failure mode is silent - the orchestrator simply stopped progressing without error.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts` - Progress polling and aggregation logic
  - `.ai/alpha/scripts/ui/components/SandboxColumn.tsx` - Sandbox display with progress bar
  - `.ai/alpha/scripts/ui/components/OverallProgress.tsx` - Overall progress display
  - `.ai/alpha/scripts/lib/manifest.ts:writeOverallProgress()` - Overall progress calculation
  - `.ai/alpha/scripts/lib/orchestrator.ts` - Orchestrator main loop and completion detection

- **Recent Changes**: N/A (first observed run)

- **Suspected Functions**:
  - `progressToSandboxState()` in useProgressPoller.ts:303-425
  - `aggregateProgress()` in useProgressPoller.ts:431-502
  - `writeOverallProgress()` in manifest.ts:818-886

## Related Issues & Context

### Direct Predecessors
None identified.

### Historical Context
First observed issue with the Alpha orchestrator UI implementation.

## Root Cause Analysis

### Issue A: Progress Bar Mismatch (Sandbox vs Overall)

**Root Cause**: **Dual source of truth with calculation mismatch**

The UI has **two separate sources** for progress data:

1. **Overall Progress (`overall-progress.json`)**: Written by `manifest.ts:writeOverallProgress()` which calculates `tasksCompleted` by summing from **completed features only** in the manifest (line 833-835):
   ```typescript
   const tasksCompleted = manifest.feature_queue
     .filter((f) => f.status === "completed")
     .reduce((sum, f) => sum + (f.tasks_completed || 0), 0);
   ```

2. **Sandbox Progress (`sbx-*-progress.json`)**: Written by the sandbox process, showing **current feature's in-progress task counts** including `completed_tasks` array length.

**The mismatch occurs because:**
- Overall Progress only counts tasks from features marked "completed" in the manifest
- It does NOT include in-progress task counts from active sandboxes
- The UI poller (`useProgressPoller.ts:867-887`) tries to add `inProgressTasks` but only for sandboxes with `status === "busy"`:
  ```typescript
  if (sandbox.status === "busy") {
    inProgressTasks += sandbox.tasksCompleted;
  }
  ```
- However, `sandbox.status` may be "ready" when there's no `currentTask` (null), even if the feature isn't complete

**Supporting Evidence:**
- `sbx-a-progress.json` shows `current_task: null` and 4 completed tasks
- But the feature has 5 tasks (T1-T5), with T5 still pending
- The sandbox is considered "ready" (not busy) because no current task
- So its 4 completed tasks aren't added to overall progress

### Issue B: Task T21 in Events

**Root Cause**: **Fallback ID generation creates misleading task IDs**

In `useProgressPoller.ts:364`, when a task doesn't have an explicit ID:
```typescript
const taskId = progress.current_task.id || `T${completedCount + 1}`;
```

This generates placeholder IDs like "T21" when `completedCount = 20`. This happens because:
1. The poller sees tasks from multiple features across the session
2. Each sandbox accumulates `completed_tasks` array across all features
3. When the 21st total task starts but has no ID, it generates "T21"

**Supporting Evidence:**
- Feature S1656.I4.F4 tasks have IDs like "S1656.I4.F4.T1" (semantic IDs)
- But if `progress.current_task.id` is missing/null, the fallback creates "T21"
- This is confusing because no feature has 21 tasks

### Issue C: 101/101 vs 18/19 Discrepancy

**Root Cause**: **Same as Issue A - calculation timing and source mismatch**

When all tasks in a feature are completed:
1. The sandbox marks 5/5 tasks complete in its progress file
2. But the feature isn't immediately marked "completed" in the manifest
3. Overall Progress reads from manifest (which still shows feature as "in_progress")
4. So the 5 tasks from the current feature aren't counted

Additionally, the UI poller calculates `tasksTotal` for each sandbox using this logic:
```typescript
const calculatedTotal = tasksCompleted + failedCount + (progress.current_task ? 1 : 0);
```

When `current_task` is null but tasks remain, `calculatedTotal` is just `completedCount`, missing the pending tasks.

### Issue D: Sandbox Stall Without Completion

**Root Cause**: **Race condition in completion detection and missing task pickup**

The orchestrator's completion check relies on:
1. All features being marked "completed" in the manifest
2. All sandboxes having `status === "completed"` or `status === "ready"`

**The stall occurs because:**
1. Sandbox-a finished Task T4 and wrote progress with `current_task: null`
2. Task T5 has dependencies (`blocked_by: ["S1656.I4.F4.T1", "S1656.I4.F4.T2", "S1656.I4.F4.T4"]`)
3. These dependencies ARE satisfied (T1, T2, T4 are complete)
4. But the sandbox never picked up T5 - it appears stuck waiting
5. The orchestrator sees the feature as "in_progress" (not all tasks done)
6. But sandbox has no work assigned, so it looks idle
7. Neither completion nor stall recovery triggers

**Evidence from tasks.json:**
```json
{
  "id": "S1656.I4.F4.T5",
  "name": "Wrap coaching page with error boundary",
  "dependencies": {
    "blocked_by": ["S1656.I4.F4.T1", "S1656.I4.F4.T2", "S1656.I4.F4.T4"]
  }
}
```

### Confidence Level

**Confidence**: High

**Reasoning**:
- Code analysis clearly shows the dual-source calculation logic
- Progress files confirm the state mismatch
- Task dependency logic and null current_task state explain the stall
- All symptoms are explained by these root causes

## Fix Approach (High-Level)

### Fix A: Unified Progress Calculation
Calculate `tasksCompleted` in `writeOverallProgress()` to include both:
1. Tasks from completed features (current logic)
2. Tasks from in-progress features using `tasks_completed` field from manifest

### Fix B: Remove Fallback Task ID Generation
Remove the `T${completedCount + 1}` fallback in `progressToSandboxState()`. If no task ID is available, use "Unknown" or don't generate events for tasks without IDs.

### Fix C: Fix tasksTotal Calculation
Include pending tasks from features in the sandbox's `tasksTotal` calculation by reading from tasks.json instead of inferring from current state.

### Fix D: Add Stuck Task Detection
Add logic to detect when a sandbox has no `current_task` but the assigned feature still has pending tasks with satisfied dependencies. Either:
- Re-query available tasks and assign
- Log warning and trigger recovery
- Mark feature as potentially stuck for operator intervention

### UI Refactor Recommendation

**Moderate refactor recommended:**

1. **Single Source of Truth**: Make `overall-progress.json` the authoritative source by having it updated more frequently with accurate real-time counts from all sandboxes.

2. **Simplify Sandbox Display**: Each sandbox column should show only its current feature's progress (e.g., "4/5 tasks") rather than trying to aggregate across the session.

3. **Better Event Identification**: Events should include the full semantic task ID (e.g., "S1656.I4.F4.T1") rather than short forms that can be ambiguous.

4. **Stall Recovery Loop**: The orchestrator needs an explicit "stuck work" detector that runs periodically to find features with incomplete tasks but no active sandbox work.

## Diagnosis Determination

The root causes have been positively identified through code analysis and progress file inspection. The issues stem from:

1. **Architectural issue**: Dual sources of truth (manifest vs sandbox progress files) with inconsistent aggregation logic
2. **Edge case**: Fallback ID generation creating confusing task references
3. **Race condition**: Feature completion requires all tasks done, but task pickup can fail silently
4. **Missing detection**: No mechanism to detect "feature has pending tasks but sandbox isn't working on any"

## Additional Context

The Alpha orchestrator is a new system and this is the first observed production run. The issues suggest the need for more robust state machine logic for feature/task lifecycle management, particularly around the transitions:
- Task complete -> Next task pickup
- Feature tasks all complete -> Feature complete
- All features complete -> Spec complete

---
*Generated by Claude Debug Assistant*
*Tools Used: Read (progress files, source code), Glob (file discovery), analysis of useProgressPoller.ts, SandboxColumn.tsx, OverallProgress.tsx, manifest.ts, orchestrator.ts*
