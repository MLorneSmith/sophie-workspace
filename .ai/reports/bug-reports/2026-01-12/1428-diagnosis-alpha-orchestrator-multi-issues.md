# Bug Diagnosis: Alpha Orchestrator Multiple Issues (UI output, progress counts, sandbox management)

**ID**: ISSUE-1428
**Created**: 2026-01-12T16:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Spec Orchestrator has four distinct but related issues that prevent reliable operation:

1. **Issue A**: UI output display frozen - sandbox columns only show initial "Using OAuth authentication..." and "Running Claude Code with..." messages and never update
2. **Issue B**: Progress calculations are incorrect - showing values like 18/13 features completed, 261/110 tasks completed (impossible counts exceeding totals)
3. **Issue C**: Too many sandboxes created (>15) - should only maintain 3 concurrent sandboxes
4. **Issue D**: Multiple sandboxes assigned to the same feature (#1367) - race condition in feature assignment

## Environment

- **Application Version**: dev branch
- **Environment**: development
- **Node Version**: v22.x
- **Platform**: Linux (WSL2)
- **Last Working**: Unknown (new feature)

## Reproduction Steps

1. Run `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
2. Observe the UI dashboard
3. Notice output columns remain static after initial messages
4. Notice progress bars showing >100% completion
5. Check `spec-manifest.json` for sandbox_ids array showing 15+ entries
6. Observe multiple sandboxes working on feature #1367 simultaneously

## Expected Behavior

- UI output should update in real-time showing Claude's progress
- Progress counts should never exceed totals (0-100% only)
- Only 3 sandboxes should exist concurrently
- Each feature should only be assigned to one sandbox at a time

## Actual Behavior

### Issue A: Frozen UI Output
```
Output:
Using OAuth authenticatio...
Running Claude Code with ...
```
Never updates beyond these initial two lines.

### Issue B: Impossible Progress Counts
```json
{
  "featuresCompleted": 18,
  "featuresTotal": 13,
  "tasksCompleted": 261,
  "tasksTotal": 110
}
```

### Issue C: Excessive Sandbox Creation
```json
"sandbox_ids": [
  "i0l8h1pzd41euclc77hvl",
  "i5z6ib8b8rfzwz79q9bbz",
  ... (15 total sandbox IDs)
]
```

### Issue D: Duplicate Feature Assignment
Multiple sandboxes (sbx-a, sbx-b, sbx-c) all showed feature #1367 in their progress displays.

## Diagnostic Data

### Evidence from spec-manifest.json

```json
{
  "progress": {
    "features_completed": 18,
    "features_total": 13,
    "tasks_completed": 261,
    "tasks_total": 110,
    "initiatives_completed": 0,
    "initiatives_total": 4
  },
  "sandbox": {
    "sandbox_ids": [15 entries]
  },
  "initiatives": [
    {"id": 1363, "features_completed": 14, "feature_count": 4}
  ]
}
```

### Evidence from sandbox progress files

sbx-a-progress.json, sbx-b-progress.json both show feature 1369 (Quick Actions Panel)
sbx-c-progress.json also shows feature 1369 as completed

## Root Cause Analysis

### Issue A Root Cause: Output Never Reaches UI Progress Files

**Summary**: The `recentOutput` array is populated via `onStdout` callback but rarely reaches the UI progress files due to polling timing.

**Detailed Explanation**:

The output flow has three stages:
1. **Collection**: In `feature.ts:225-248`, stdout callback captures output and pushes to `recentOutput` array
2. **Progress Polling**: In `progress.ts:320-328`, the `writeUIProgress()` function is called with `outputTracker` to include recent output
3. **UI Reading**: In `useProgressPoller.ts:760-771`, the UI reads `recent_output` from JSON files

The bug is that the progress file polling in the sandbox (`progress.ts:301-303`) reads `.initiative-progress.json` from the **sandbox filesystem**, not the local `outputTracker`. The `outputTracker` is only included when `writeUIProgress()` is explicitly called during progress polling.

**Critical Issue**: Claude Code's output comes through the `onStdout` callback, but this is NOT connected to the `.initiative-progress.json` file that Claude Code writes inside the sandbox. The orchestrator's `onStdout` callback collects output, but the sandbox's `.initiative-progress.json` doesn't contain this output.

**Root Cause**: The `.initiative-progress.json` file written by Claude Code's `/alpha:implement` command does NOT include stdout output. The orchestrator writes `recent_output` to the UI progress files only when polling detects changes, but the progress file inside the sandbox never contains the stdout.

**File**: `.ai/alpha/scripts/lib/progress.ts:186`

### Issue B Root Cause: Cumulative Progress Increments Without Bounds Checking

**Summary**: Progress counters are incremented on every feature completion without checking if they've already been counted.

**Detailed Explanation**:

In `feature.ts:334-366`, when a feature completes:
```typescript
if (status === "completed") {
  manifest.progress.features_completed++;  // Line 335
  // ...
  initiative.features_completed++;  // Line 343
}
// ...
manifest.progress.tasks_completed += tasksCompleted;  // Line 366
```

The problem is that:
1. A feature can fail, be retried, and complete multiple times
2. Each completion increments the counter again
3. The code checks `status === "completed"` but not whether this specific feature was already counted
4. There's no capping of progress to the total

**Evidence**: Initiative 1363 has `features_completed: 14` but only `feature_count: 4`.

**Root Cause**: Missing idempotency check - should check if `feature.tasks_completed` was already added or use set-based counting instead of increments.

**File**: `.ai/alpha/scripts/lib/feature.ts:335, 343, 366`

### Issue C Root Cause: Sandbox IDs Accumulated Without Cleanup

**Summary**: New sandbox IDs are added to `sandbox_ids` array on every restart without removing old ones.

**Detailed Explanation**:

In `orchestrator.ts:370-372` (keepalive restart) and `orchestrator.ts:440-445` (expiration restart):
```typescript
if (!manifest.sandbox.sandbox_ids.includes(newInstance.id)) {
  manifest.sandbox.sandbox_ids.push(newInstance.id);
}
```

This only checks if the NEW ID exists, but never removes the OLD ID that was replaced. Over time, with multiple restarts due to:
- Preemptive restarts at 50 minutes age
- Expiration restarts
- Health check restarts

The array accumulates all historical sandbox IDs.

**Evidence**: 15 sandbox IDs in the array despite only ever having 3 concurrent sandboxes.

**Root Cause**: Missing removal of replaced sandbox ID from the array when restarting.

**File**: `.ai/alpha/scripts/lib/orchestrator.ts:370-372, 440-445`

### Issue D Root Cause: Race Condition in Feature Assignment Despite Safeguards

**Summary**: The `assignFeatureToSandbox()` function's timestamp-based conflict detection is insufficient for parallel async operations.

**Detailed Explanation**:

The assignment logic in `work-queue.ts:138-175`:
```typescript
export function assignFeatureToSandbox(
  feature: FeatureEntry,
  sandboxLabel: string,
): boolean {
  const now = Date.now();

  // Check if already assigned
  if (feature.assigned_sandbox && feature.assigned_sandbox !== sandboxLabel) {
    return false;  // Lost race
  }

  // Check if recently assigned (30 second window)
  if (feature.assigned_at && timeSinceAssignment < ASSIGNMENT_CONFLICT_WINDOW_MS) {
    return false;
  }

  // Claim the feature
  feature.status = "in_progress";
  feature.assigned_sandbox = sandboxLabel;
  feature.assigned_at = now;
  return true;
}
```

The problem is this is NOT atomic across the async work loop. Multiple sandboxes can:
1. All call `getNextAvailableFeature()` and get the same feature (#1367)
2. All reach `assignFeatureToSandbox()` before any has written the manifest
3. All pass the check `!feature.assigned_sandbox` (it's still undefined)
4. All claim the feature and return `true`
5. All start working on it

**Root Cause**: The check and assignment are not truly atomic. The `saveManifest()` call happens AFTER `assignFeatureToSandbox()` returns, so other sandboxes see stale state.

**File**: `.ai/alpha/scripts/lib/work-queue.ts:138-175` and `.ai/alpha/scripts/lib/orchestrator.ts:514-524`

## Confidence Level

**Confidence**: High

**Reasoning**:
- Direct evidence from spec-manifest.json showing impossible counts
- Code analysis clearly shows the increment/append patterns without bounds checking
- The assignment race condition is a classic TOCTOU (time-of-check-time-of-use) bug
- Output tracking code path shows disconnect between onStdout and sandbox progress file

## Fix Approach (High-Level)

### Issue A Fix
The UI progress files need to include the `recent_output` captured from the `onStdout` callback. The fix should:
1. Call `writeUIProgress()` more frequently during feature execution (not just on progress file changes)
2. Or: Have a separate interval that writes the output tracker to UI progress files
3. Or: Change the polling to prioritize the local `outputTracker` over sandbox progress file

### Issue B Fix
Change from increment-based to set-based counting:
1. Calculate `features_completed` by counting features with `status === "completed"` in the queue
2. Calculate `tasks_completed` by summing `tasks_completed` from all features
3. Or: Add idempotency check using feature ID tracking
4. Add bounds checking: `Math.min(calculated, total)`

### Issue C Fix
When replacing a sandbox, remove the old ID from the array:
```typescript
const oldIdIndex = manifest.sandbox.sandbox_ids.indexOf(instance.id);
if (oldIdIndex !== -1) {
  manifest.sandbox.sandbox_ids.splice(oldIdIndex, 1);
}
manifest.sandbox.sandbox_ids.push(newInstance.id);
```

### Issue D Fix
Make assignment truly atomic by:
1. Move `saveManifest()` call inside `assignFeatureToSandbox()` function
2. Or: Use a synchronous lock around the check-assign-save sequence
3. Add retry loop in orchestrator when assignment fails

## Affected Files

- `.ai/alpha/scripts/lib/progress.ts` - Output not reaching UI
- `.ai/alpha/scripts/lib/feature.ts` - Progress increment logic (lines 335, 343, 366)
- `.ai/alpha/scripts/lib/orchestrator.ts` - Sandbox ID management (lines 370-372, 440-445, 514-524)
- `.ai/alpha/scripts/lib/work-queue.ts` - Feature assignment (lines 138-175)
- `.ai/alpha/scripts/lib/manifest.ts` - Progress calculation (writeOverallProgress)

## Related Issues & Context

### Direct Predecessors
- #1426 (CLOSED): "React is not defined in Alpha Orchestrator UI" - Different bug, UI startup crash
- #1427 (CLOSED): "Bug Fix: React is not defined in Alpha Orchestrator UI" - Fix for #1426

### Similar Symptoms
None found - this is a new class of issues specific to the orchestrator runtime behavior.

## Additional Context

The spec #1362 has:
- 4 initiatives
- 13 features
- 110 total tasks

The manifest shows evidence of multiple feature retries (features with `error: "signal: terminated"` but `status: "completed"`), which exacerbates the counting bugs.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (for GitHub CLI)*
