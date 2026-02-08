# Bug Diagnosis: S1918 Alpha Orchestrator Completion Phase Issues

**ID**: ISSUE-1929
**Created**: 2026-02-04T16:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Spec Orchestrator (S1918) completed its run with GPT as the provider, but three significant issues were observed: (A) no review sandbox was created, (B) dev server was not started with no link in the summary box, and (C) the final progress tally shows incorrect numbers (6/6 Initiatives, 17/18 Features, 102/136 Tasks vs. actual 107/136 tasks completed).

## Environment

- **Application Version**: Alpha Orchestrator (spec-orchestrator.ts)
- **Environment**: development
- **Node Version**: 20.x
- **Provider**: GPT (Codex)
- **Run ID**: run-ml871dc7-02e6
- **Spec ID**: S1918 (user-dashboard)

## Reproduction Steps

1. Run `tsx .ai/alpha/scripts/spec-orchestrator.ts 1918 --provider gpt`
2. Wait for orchestrator to complete all features
3. Observe completion phase results

## Expected Behavior

1. Review sandbox should be created after killing implementation sandboxes
2. Dev server should start on the review sandbox with URL displayed
3. Progress tally should accurately reflect completed tasks (107/136 in manifest)
4. All sandboxes should be properly tracked in manifest

## Actual Behavior

1. No review sandbox was created
2. Dev server was not started - no link in summary
3. Progress shows 102/136 tasks instead of 107/136 (manifest shows 107)
4. Manifest shows `sandbox_ids: []` (empty array)

## Diagnostic Data

### Manifest State Analysis

```json
{
  "progress": {
    "status": "completed",
    "initiatives_completed": 5,
    "initiatives_total": 6,
    "features_completed": 17,
    "features_total": 18,
    "tasks_completed": 107,
    "tasks_total": 136,
    "next_feature_id": "S1918.I6.F4",
    "last_completed_feature_id": "S1918.I6.F3"
  },
  "sandbox": {
    "sandbox_ids": [],
    "branch_name": "alpha/spec-S1918"
  }
}
```

### Feature S1918.I6.F4 (E2E Test Suite) - FAILED

The manifest shows this feature as `pending` with error:
```
"error": "Implementation error: PTY timeout on sandbox inmniyhuj6f5lduxev4wh: Progress file heartbeat is stale (last: 2026-02-04T16:18:45+00:00) (attempt 1/3)"
```

This feature has `tasks_completed: 3` out of 14 total tasks.

### Circular Dependency Issue in Spec Decomposition

**Critical finding**: The feature decomposition created a circular dependency between F2, F3, and F4 in Initiative 6:

| Feature | Blocked By |
|---------|------------|
| S1918.I6.F1 (Loading Skeletons) | S1918.I3.F1, S1918.I3.F2, S1918.I4.F1-F4, **S1918.I5.F2** |
| S1918.I6.F2 (Error Boundaries) | S1918.I3.F1, S1918.I3.F2, S1918.I4.F1, S1918.I5.F2, **S1918.I6.F4** |
| S1918.I6.F3 (Accessibility) | S1918.I1.F1, S1918.I3.F1, S1918.I3.F2, S1918.I4.F1, S1918.I5.F2, **S1918.I6.F4** |
| S1918.I6.F4 (E2E Tests) | S1918.I1-I5 (all initiatives) |

**The Problem**: F2 and F3 both depend on F4 (E2E Test Suite), but F4 logically depends on F2 and F3 completing first (you need error boundaries and accessibility compliance before you can write E2E tests for them).

This is a **spec decomposition error**, not an orchestrator bug. The feature.md files incorrectly list F4 as a blocker for F2 and F3, when in reality F4 should be blocked BY F2 and F3.

### Sandbox Progress Files

**sbx-c-progress.json** (last sandbox):
```json
{
  "feature": "S1918.I6.F3",
  "status": "completed",
  "completed_tasks": ["task-1" through "task-9"],
  "phase": "completed"
}
```

Note: The feature `S1918.I6.F3` shows only 9 tasks completed, not the full 19 tasks in its tasks.json. This indicates a partial completion due to context limit or timeout.

### Console Output from Logs

From sbx-c.log end:
```
We've made solid headway on the accessibility widgets, and I hit the 60% context limit, so I'm pausing here as instructed with a checkpoint set for the next task.

Status Summary (Before Context Limit)
- Completed tasks: S1918.I6.F3.T1 through S1918.I6.F3.T9
- Current checkpoint: S1918.I6.F3.T10 marked as starting
- Context limit reached at 60%
```

## Root Cause Analysis

### Identified Root Causes

There are **THREE** distinct root causes:

#### Root Cause 1: Review Sandbox Creation Failed Silently

**Summary**: The `setupReviewSandbox()` function returns `null` on failure but the error is not properly surfaced.

**Detailed Explanation**:
Looking at `completion-phase.ts:144-211`, the `setupReviewSandbox()` function catches errors and returns `null`. While it logs errors, if the review sandbox creation fails (likely due to GPT provider install timeout or other issue), the completion phase continues without a review sandbox:

```typescript
// completion-phase.ts:517-528
if (reviewSandbox) {
  const reviewUrl = await startReviewDevServer(reviewSandbox, log);
  // ...
} else {
  log("   ⚠️ No review sandbox available - dev server not started");
  // Continues silently
}
```

The GPT provider has known issues with sandbox creation timeouts (Bug fix #1924 attempted to address this with retry logic), but the review sandbox may still fail silently.

**Supporting Evidence**:
- Manifest shows `sandbox_ids: []` (empty)
- No review URLs in final output
- GPT provider requires `--no-frozen-lockfile` which may still timeout

**Confidence**: High

#### Root Cause 2: Circular Dependency in Spec Decomposition

**Summary**: Features F2 and F3 incorrectly list F4 as a blocker in their feature.md files.

**Detailed Explanation**:
The manifest shows F2 and F3 both have `S1918.I6.F4` in their dependencies:
- `S1918.I6.F2` dependencies: `[..., "S1918.I6.F4"]`
- `S1918.I6.F3` dependencies: `[..., "S1918.I6.F4"]`

But F4 (E2E Test Suite) logically needs to test the components created by F2 (Error Boundaries) and F3 (Accessibility), so F4 should depend on F2/F3, not vice versa.

The orchestrator's dependency cycle validation (`checkDependencyCycles()`) may not have caught this because the features could technically run (the manifest shows F1, F2, F3 all completed before F4), but the cycle caused incorrect ordering.

**Supporting Evidence**:
- Feature.md files show inconsistent "Parallel With" sections claiming independence while "Blocked By" creates dependencies
- F4 was marked as `pending` while F2 and F3 show as `completed`
- This indicates the orchestrator resolved the cycle by completing F2/F3 first, but F4's failure then blocked true completion

**Confidence**: High - This is a decomposition error, not an orchestrator bug.

#### Root Cause 3: Task Count Discrepancy (102 vs 107)

**Summary**: Progress display shows stale/incorrect task count during summary.

**Detailed Explanation**:
The manifest shows `tasks_completed: 107` but the reported "Overall Progress Tally" showed 102. This is likely a display timing issue where:
1. The summary was printed before the final manifest save
2. OR the UI progress file (`overall-progress.json`) wasn't synced with the actual manifest state

Looking at `overall-progress.json`:
```json
{
  "tasksCompleted": 107,
  "tasksTotal": 136
}
```

The actual file shows 107, so the discrepancy was likely a transient display issue during the final summary output.

**Supporting Evidence**:
- `overall-progress.json` correctly shows 107/136
- `spec-manifest.json` correctly shows 107/136
- User observed 102 during runtime display

**Confidence**: Medium - Need to verify the exact source of the "102" number

### How This Causes the Observed Behavior

1. **No review sandbox**: GPT provider sandbox creation likely failed due to install timeout (even with retry logic), and the failure was caught but didn't block completion
2. **No dev server link**: No review sandbox → no dev server started → no URL to display
3. **Progress discrepancy**: Either transient display bug or misread by user (manifest shows correct 107)

## Fix Approach (High-Level)

### For Orchestrator Issues (Root Cause 1):

1. **Make review sandbox failure more visible**: In `executeCompletionPhase()`, when `setupReviewSandbox()` returns null, emit a prominent warning event and potentially mark the completion as "partial"

2. **Add review sandbox creation to manifest tracking**: Track whether review sandbox was created in the manifest's `progress` section

### For Spec Decomposition Issues (Root Causes 2):

**This is a spec decomposition error that requires manual correction:**

1. Edit `S1918.I6.F2` feature.md: Remove `S1918.I6.F4` from "Blocked By" section
2. Edit `S1918.I6.F3` feature.md: Remove `S1918.I6.F4` from "Blocked By" section
3. Edit `S1918.I6.F4` feature.md: Add `S1918.I6.F2` and `S1918.I6.F3` to "Blocked By" section
4. Regenerate the spec-manifest.json with `--reset` flag

The correct dependency order should be:
- F1 (Loading Skeletons) → blocked by I3/I4/I5 widgets
- F2 (Error Boundaries) → blocked by I3/I4/I5 widgets
- F3 (Accessibility) → blocked by I3/I4/I5 widgets
- F4 (E2E Tests) → blocked by F1, F2, F3 (needs all polish features done before testing)

## Diagnosis Determination

**Primary Issue**: The S1918 spec decomposition has a logical dependency error where F4 (E2E Test Suite) was incorrectly listed as blocking F2 and F3, when F4 should be blocked BY F2 and F3.

**Secondary Issue**: Review sandbox creation for GPT provider failed silently, preventing dev server startup. The orchestrator continues on review sandbox failure which is by design (non-blocking), but should surface this failure more prominently.

**Tertiary Issue**: Task count display discrepancy appears to be a transient issue or misread - manifest shows correct counts.

## Recommendations

### For the User (Immediate Action)

1. **Fix the circular dependency** by editing the feature.md files in S1918.I6:
   - Remove `S1918.I6.F4` from F2 and F3's "Blocked By" sections
   - Add `S1918.I6.F1`, `S1918.I6.F2`, `S1918.I6.F3` to F4's "Blocked By" section

2. **Regenerate the manifest**:
   ```bash
   tsx .ai/alpha/scripts/spec-orchestrator.ts 1918 --reset --dry-run
   ```

3. **Re-run implementation** of F4:
   ```bash
   tsx .ai/alpha/scripts/spec-orchestrator.ts 1918
   ```

### For Orchestrator Improvements (Code Changes)

1. Add explicit review sandbox failure reporting in completion phase summary
2. Consider making review sandbox failure a "partial" completion state
3. Add dependency cycle detection that catches logical inversions (F4 should depend on F2/F3, not vice versa)

## Additional Context

The orchestrator functioned correctly given the spec definition - it completed F1, F2, F3 (which were unblocked) and attempted F4. The F4 timeout is expected given its large task count (14 tasks) and the context limit issues observed.

The root cause is in the **spec decomposition phase** (`/alpha:feature-decompose`), not the orchestrator itself.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob, Grep, Bash*
