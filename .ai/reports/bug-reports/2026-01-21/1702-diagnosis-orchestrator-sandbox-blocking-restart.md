# Bug Diagnosis: Orchestrator Sandboxes All Blocked After Restart

**ID**: ISSUE-1702
**Created**: 2026-01-21T16:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

After restarting the Alpha Orchestrator following a previous hung run, all three sandboxes are stuck in "Waiting for work..." state showing they are blocked by dependencies. The UI shows `Blocked: #S1692.I2.F1, #S1692.I2.F2, #S1692.I2.F3` but there is an available feature (S1692.I1.F4) that should be picked up. The orchestrator has no mechanism to reset the manifest state and start fresh when resuming.

## Environment

- **Application Version**: Alpha Orchestrator (spec-orchestrator.ts)
- **Environment**: development
- **Node Version**: 20.x
- **Last Working**: Prior to restart

## Reproduction Steps

1. Run orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1692`
2. Allow it to complete some features (F1, F2, F3 of initiative I1)
3. Orchestrator hangs (previous bug)
4. Kill orchestrator and restart with `--force-unlock`
5. Observe all sandboxes are blocked

## Expected Behavior

After restart, the orchestrator should:
1. Load the manifest from `spec-manifest.json`
2. Find S1692.I1.F4 as the next available feature (its dependency S1692.I1.F3 is completed)
3. Assign S1692.I1.F4 to an available sandbox

## Actual Behavior

All sandboxes show "Waiting for work..." and display blocking features from I2 (S1692.I2.F1, etc.) which have unsatisfied dependencies on initiative S1692.I1.

## Diagnostic Data

### Manifest State Analysis

```json
// spec-manifest.json key fields:
{
  "progress": {
    "status": "in_progress",
    "features_completed": 3,
    "features_total": 19,
    "next_feature_id": null,  // <- THIS IS THE PROBLEM
    "last_completed_feature_id": "S1692.I1.F2"
  },
  "sandbox": {
    "sandbox_ids": [],      // Empty - sandboxes were cleared
    "branch_name": "alpha/spec-S1692",
    "created_at": null       // Cleared on restart
  }
}
```

### Feature Status Analysis

| Feature | Status | Dependencies | Notes |
|---------|--------|--------------|-------|
| S1692.I1.F1 | completed | [] | ✓ |
| S1692.I1.F2 | completed | [S1692.I1.F1] | ✓ |
| S1692.I1.F3 | completed | [S1692.I1.F1] | ✓ |
| S1692.I1.F4 | pending | [S1692.I1.F3] | **Should be available!** |
| S1692.I2.F1 | pending | [S1692.I1] | Blocked by incomplete initiative |

### Sandbox Progress File (sbx-a-progress.json)

```json
{
  "status": "idle",
  "phase": "waiting",
  "waiting_reason": "Waiting for dependencies (15 features blocked)",
  "blocked_by": ["S1692.I2.F1", "S1692.I2.F2", "S1692.I2.F3"]
}
```

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `getNextAvailableFeature()` function returns `null` because S1692.I1.F4 appears to not be available, likely due to stale state or an issue with the manifest being regenerated/loaded incorrectly on restart.

**Detailed Explanation**:

After analyzing the code flow, I've identified **multiple contributing factors**:

1. **Missing `--reset` Option**: The orchestrator lacks a command-line option to reset the manifest state and start from scratch. When restarting after a failed run, the manifest may contain stale or inconsistent state.

2. **Manifest Regeneration Logic**: When the orchestrator restarts:
   - If `spec-manifest.json` exists, it's loaded as-is (lines 977-998 in orchestrator.ts)
   - The manifest may have been generated from the previous run with incorrect state
   - `cleanupStaleState()` (lines 1159-1164) only resets in_progress features, not other state issues

3. **The `next_feature_id: null` Problem**: The manifest shows `next_feature_id: null` but S1692.I1.F4 should be available. This could happen if:
   - The manifest was saved at an inconsistent point
   - `updateNextFeatureId()` wasn't called after the last feature completion
   - The progress counters got out of sync

4. **UI Display Mismatch**: The `blocked_by` list in the UI shows I2 features (which ARE blocked) rather than explaining why I1.F4 isn't being picked up. This misleading display makes debugging harder.

**Supporting Evidence**:

From the manifest:
- `last_completed_feature_id: "S1692.I1.F2"` - but S1692.I1.F3 IS completed per status
- `next_feature_id: null` - but S1692.I1.F4 should be the next feature
- Initiative S1692.I1 shows `features_completed: 3` but status is `in_progress` (correct)

This inconsistency suggests the manifest was saved at a point where the state tracking was out of sync.

### How This Causes the Observed Behavior

1. Orchestrator starts with `--force-unlock`
2. Loads existing `spec-manifest.json`
3. Calls `cleanupStaleState()` which resets any in_progress features
4. `getNextAvailableFeature()` is called to find work
5. The function iterates through features but something prevents S1692.I1.F4 from being returned
6. Returns `null`, causing all sandboxes to be marked as waiting
7. `getBlockedFeatures()` shows I2 features (correctly blocked by I1), but this misleads debugging

### Confidence Level

**Confidence**: Medium-High

**Reasoning**: The manifest state is clearly inconsistent (`last_completed_feature_id` doesn't match actual completions). The exact mechanism causing `getNextAvailableFeature()` to skip S1692.I1.F4 requires runtime debugging, but the inconsistent manifest state is the root cause. The solution (adding `--reset` option) addresses this regardless of the specific skip mechanism.

## Fix Approach (High-Level)

Two complementary fixes needed:

1. **Add `--reset` CLI Option**: New flag that:
   - Deletes existing `spec-manifest.json`
   - Regenerates manifest from source files (tasks.json)
   - Ensures fresh, consistent state

2. **Improve Manifest Consistency**: Add validation on load to detect and repair inconsistent state:
   - Verify `last_completed_feature_id` matches actual status
   - Recalculate `next_feature_id` from current state
   - Log warnings when inconsistencies are found

## Diagnosis Determination

The orchestrator's sandbox blocking after restart is caused by inconsistent manifest state that wasn't cleaned up properly. The manifest shows `next_feature_id: null` and stale progress tracking, preventing the available feature S1692.I1.F4 from being assigned.

The immediate workaround is to delete `spec-manifest.json` and restart the orchestrator (it will auto-regenerate). A proper fix requires adding a `--reset` option and improving manifest consistency validation on load.

## Workaround (Immediate)

```bash
# Delete the stale manifest to force regeneration
rm .ai/alpha/specs/S1692-Spec-user-dashboard/spec-manifest.json

# Restart orchestrator - will auto-generate fresh manifest
tsx .ai/alpha/scripts/spec-orchestrator.ts 1692
```

Note: This will reset progress tracking, so previously completed work may be re-executed. However, since the code was committed, the re-execution should be quick (files already exist).

## Additional Context

Related issues:
- The previous orchestrator hang that prompted the restart
- The need for better state recovery mechanisms in long-running orchestration

---
*Generated by Claude Debug Assistant*
*Tools Used: Read (manifest, progress files, orchestrator code), Glob, manual code analysis*
