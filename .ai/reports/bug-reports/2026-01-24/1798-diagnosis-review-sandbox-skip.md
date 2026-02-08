# Bug Diagnosis: Review Sandbox Creation Skipped When All Features Complete

**ID**: ISSUE-pending
**Created**: 2026-01-24T17:45:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

When re-running the Alpha Orchestrator on a spec where all features are already completed, the review sandbox creation phase is skipped entirely. The orchestrator returns early at the "All features already completed!" message without proceeding to the completion phase where the review sandbox is created.

## Environment

- **Application Version**: Current dev branch
- **Environment**: development
- **Node Version**: v22.x
- **Last Working**: Unknown (likely never worked for resume case)

## Reproduction Steps

1. Run the orchestrator on spec S0000 (debug completion): `tsx spec-orchestrator.ts 0 --no-ui`
2. Let all features complete successfully
3. Run the orchestrator again: `tsx spec-orchestrator.ts 0 --no-ui --force-unlock`
4. Observe that the orchestrator exits with "All features already completed!" without creating the review sandbox

## Expected Behavior

When all features are completed (whether in this run or a previous run), the orchestrator should proceed to the completion phase to:
1. Create a fresh review sandbox
2. Start the dev server
3. Provide review URLs for manual inspection

## Actual Behavior

The orchestrator returns early with:
```
🎉 All features already completed!
🔓 Releasing orchestrator lock (finally block)...
🔓 Released orchestrator lock
```

No review sandbox is created, no dev server is started, and the manifest `sandbox_ids` array is empty.

## Diagnostic Data

### Console Output
```
══════════════════════════════════════════════════════════════════════
   ALPHA SPEC ORCHESTRATOR
   Run ID: run-mksl764w-q4bx
══════════════════════════════════════════════════════════════════════

🔒 Acquired orchestrator lock

📊 Checking sandbox database...
   📊 Sandbox database size: 21.8MB / 500MB
   ℹ️ Database fully seeded (1 payload user(s), 3 auth user(s))
   ✅ Database already seeded (warm start detected)

📊 Spec #S0: debug completion
Initiatives: 1
Features: 1
Tasks: 2
Progress: 1/1 features
Sandboxes: 3

🎉 All features already completed!
🔓 Releasing orchestrator lock (finally block)...
🔓 Released orchestrator lock
```

### Manifest State
```json
{
  "sandbox": {
    "sandbox_ids": [],
    "branch_name": "alpha/spec-S0",
    "created_at": "2026-01-24T17:12:13.964Z"
  }
}
```

Note: `sandbox_ids` is empty, indicating no review sandbox was created or tracked.

## Error Stack Traces

N/A - No error thrown, this is a control flow bug.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/orchestrator.ts` (lines 1638-1648)

- **Suspected Functions**:
  - `orchestrate()` - Early return before completion phase

### Code Path Analysis

```typescript
// Lines 1634-1648 in orchestrator.ts
// Check what's next
const nextFeature = getNextAvailableFeature(manifest, options.ui);
if (nextFeature) {
    log(`\n🎯 Next feature: #${nextFeature.id} - ${nextFeature.title}`);
} else if (
    manifest.progress.features_completed === manifest.progress.features_total
) {
    log("\n🎉 All features already completed!");
    if (uiManager) uiManager.stop();
    return;  // <-- BUG: Early return prevents completion phase
} else {
    log("\n⚠️ No features available (check dependencies)");
    if (uiManager) uiManager.stop();
    return;
}
```

The completion phase starts at line 1954:
```typescript
log("\n🔄 Starting completion phase...");
emitOrchestratorEvent(
    "completion_phase_start",
    "Completion phase started - cleaning up implementation sandboxes",
    { sandboxCount: instances.length },
);
```

The early return at line 1643 prevents this code from ever being reached when all features are already complete.

## Related Issues & Context

### Direct Predecessors
- Issue #1795 (CLOSED): "Bug Fix: E2B Sandbox Auth User Seeding Skipped on Warm Start" - Related seeding fix, but not the same issue

### Related Infrastructure Issues
- Issue #1727: "Complete lifecycle redesign for completion phase" - The completion phase was redesigned but the early exit wasn't addressed
- Issue #1746: "Two-phase manifest save approach" - Completion phase improvements
- Issue #1590: "Fresh sandbox for review after spec implementation" - Original review sandbox feature

### Historical Context
This bug appears to be a regression or oversight in the orchestrator's resume logic. The code path for "all features already completed" exits early without considering that the user may want to create a review sandbox for an already-completed spec.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `orchestrate()` function returns early when all features are completed, before reaching the completion phase code that creates the review sandbox.

**Detailed Explanation**:
When `getNextAvailableFeature()` returns null and all features are completed, the orchestrator logs "All features already completed!" and returns at line 1643. This was likely intended to prevent redundant work on restart, but it has the unintended consequence of skipping the completion phase entirely.

The completion phase (starting at line 1954) contains the code that:
1. Kills implementation sandboxes
2. Creates the review sandbox via `createReviewSandbox()`
3. Starts the dev server
4. Provides review URLs

This code is never reached when resuming a completed spec.

**Supporting Evidence**:
- Empty `sandbox_ids` array in manifest after successful completion
- No review URLs provided in orchestrator output
- `--skip-to-completion` flag exists but is unreachable (placed after the early return)
- Console output shows "All features already completed!" followed immediately by lock release

### How This Causes the Observed Behavior

1. User runs orchestrator → features complete successfully
2. User runs orchestrator again (to get review sandbox)
3. Orchestrator detects no pending features
4. Orchestrator checks: "all features completed?" → yes
5. Orchestrator logs message and **returns early**
6. Completion phase code is never executed
7. No review sandbox created
8. User has no way to review the completed work

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct code path analysis shows the early return
- Running with `--no-ui --force-unlock` confirms the behavior
- The `--skip-to-completion` flag being unreachable confirms the control flow issue
- The manifest state (empty sandbox_ids) confirms no review sandbox was created

## Fix Approach (High-Level)

The fix should modify the early return condition to proceed to the completion phase when all features are completed, rather than returning immediately. Two approaches:

**Option A (Recommended)**: Remove the early return and allow the orchestrator to reach the completion phase normally. The completion phase already handles the case where no sandbox instances exist.

**Option B**: Add a special code path that jumps directly to the completion phase when all features are already complete (similar to `--skip-to-completion` but automatic).

The fix would look something like:
```typescript
} else if (
    manifest.progress.features_completed === manifest.progress.features_total
) {
    log("\n🎉 All features already completed!");
    // Don't return early - proceed to completion phase
    // The completion phase will create review sandbox
}
```

## Diagnosis Determination

The root cause has been definitively identified: an early return statement in the `orchestrate()` function prevents the completion phase from running when all features are already completed. This is a control flow bug that can be fixed by modifying the conditional logic to allow progression to the completion phase.

## Additional Context

The `--skip-to-completion` debugging flag was intended to test the completion phase, but it's placed after the early return, making it unreachable. This suggests the early return was added later without considering the debugging use case or the need to create review sandboxes on resume.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash (tsx orchestrator runs), Git*
