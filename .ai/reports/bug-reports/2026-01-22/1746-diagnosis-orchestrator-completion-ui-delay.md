# Bug Diagnosis: Orchestrator completion screen delayed until review sandbox operations complete

**ID**: ISSUE-1746
**Created**: 2026-01-22T18:15:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator UI does not show the completion screen when all features finish. Instead, it remains stuck on the "IN PROGRESS" display with 100% progress for several minutes until all completion phase operations (killing sandboxes, creating review sandbox, starting dev server) complete. The user reported the UI being stuck for 13+ minutes after all tasks showed 100% completion.

## Environment

- **Application Version**: dev branch
- **Environment**: development
- **Node Version**: 22.x
- **Last Working**: Unknown (first report of this specific issue)

## Reproduction Steps

1. Run the Alpha Orchestrator with a small spec (e.g., S0000 debug spec with 1 feature, 2 tasks)
2. Wait for all features to complete (progress shows 100%)
3. Observe the UI remains stuck on "IN PROGRESS" status
4. The completion screen only appears after review sandbox creation and dev server startup complete

## Expected Behavior

The UI should transition to the completion screen immediately when `manifest.progress.status` is set to `"completed"`, while the completion phase operations (killing sandboxes, creating review sandbox, starting dev server) continue in the background.

## Actual Behavior

The UI remains stuck on the "IN PROGRESS" display with 100% progress:
- Sandbox sbx-a shows "Phase: completed" with ✅ status
- Overall Progress bar shows 100% with "1/1 Features, 2/2 Tasks"
- Recent Events show completion phase events (sandbox killing, review sandbox creating)
- But the status header still shows "IN PROGRESS" and elapsed time keeps ticking

The completion screen only appears after:
1. All sandboxes are killed
2. Review sandbox is created (up to 10 minute timeout)
3. Dev server starts (up to 200 second timeout)

## Diagnostic Data

### Timeline Analysis

From the spec-manifest.json and logs:
```
Feature completed:     17:50:24 UTC (sbx-a logs, PTY exit code 0)
completed_at set:      17:50:07.328 UTC (spec-manifest.json)
Completion phase:      17:50:07 UTC (sandbox killing events)
Last checkpoint:       18:00:29.399 UTC (overall-progress.json)
```

This shows a ~10 minute gap between feature completion and the final status update to overall-progress.json.

### Console Output
```
Overall Progress: 100%
Initiatives: 1/1
Features: 1/1
Tasks: 2/2

Recent Events:
12:50:24 [sbx-a] ✅ [S0000.I1.F1.T2] Create second marker file comp...
12:50:24 [sbx-a] 🎉 Feature completed on sbx-a
12:50:07 [orchestrator] 📦 Creating fresh review sandbox for dev server
12:50:07 [orchestrator] 🗑️ Killing implementation sandbox sbx-c
12:50:07 [orchestrator] 🗑️ Killing implementation sandbox sbx-b
12:50:07 [orchestrator] 🗑️ Killing implementation sandbox sbx-a
```

### Progress Files State During Bug

**overall-progress.json** (during the stuck period):
```json
{
  "specId": "S0",
  "status": "in_progress",  // <-- Should be "completed"
  "featuresCompleted": 1,
  "tasksCompleted": 2,
  ...
}
```

**spec-manifest.json** (same time):
```json
{
  "progress": {
    "status": "in_progress",  // <-- Set to "completed" in memory but not saved
    "completed_at": null,     // <-- Should have timestamp
    ...
  }
}
```

## Error Stack Traces

N/A - This is a logic error, not an exception.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/orchestrator.ts` (lines 1517-1709)
- **Recent Changes**: Bug fix #1720 attempted to address this by setting status "early"
- **Suspected Functions**: `orchestrate()` function completion phase

## Related Issues & Context

### Direct Predecessors

- #1720 (CLOSED): "Bug fix #1720: Status was previously set AFTER createReviewSandbox() and startDevServer()". The fix comment exists at line 1517-1521 but the implementation is incomplete.

### Similar Symptoms

- The comment mentions this was a previous issue where UI would freeze if sandbox creation hangs.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `saveManifest()` call that writes `status: "completed"` to `overall-progress.json` is placed AFTER all completion phase blocking operations instead of IMMEDIATELY after setting the status in memory.

**Detailed Explanation**:

The code at lines 1517-1526 sets the completion status:
```typescript
// Set completion status EARLY to prevent frozen UI if sandbox creation hangs.
// Bug fix #1720: Status was previously set AFTER createReviewSandbox() and startDevServer().
const failedFeatures = manifest.feature_queue.filter(
  (f) => f.status === "failed",
).length;
manifest.progress.status = failedFeatures === 0 ? "completed" : "partial";
manifest.progress.completed_at = new Date().toISOString();
```

However, `saveManifest()` is not called until line 1709 - AFTER these blocking operations:
1. Kill all sandboxes (lines 1544-1564)
2. Create review sandbox with 10-minute timeout (lines 1595-1599)
3. Start dev server with 200-second timeout (lines 1633-1637)

The UI polls `overall-progress.json` to detect completion (see `useProgressPoller.ts` line 885):
```typescript
status: overallProgressFile.status as OverallProgress["status"],
```

Since `saveManifest()` writes to `overall-progress.json`, the status change is invisible to the UI until after all completion phase operations complete.

**Supporting Evidence**:
1. Code path analysis shows `saveManifest()` is only called at line 1709
2. The `completed_at` timestamp in manifest (17:50:07) vs `lastCheckpoint` (18:00:29) shows ~10 minute delay
3. Bug fix #1720 comment explicitly states intent to set status early but doesn't call `saveManifest()`

### How This Causes the Observed Behavior

1. Work loop completes → all features are "completed" status
2. `manifest.progress.status = "completed"` is set in memory at line 1525
3. Completion phase starts: kill sandboxes, create review sandbox
4. UI polls `overall-progress.json` but still sees `status: "in_progress"` (old file)
5. Review sandbox creation takes 10 minutes (timeout or slow network)
6. Finally `saveManifest()` is called at line 1709
7. NOW the UI sees `status: "completed"` and shows completion screen

### Confidence Level

**Confidence**: High

**Reasoning**:
1. Direct code path analysis shows `saveManifest()` only called after blocking operations
2. Timeline data confirms the delay matches the completion phase operation timeouts
3. Bug fix #1720 comment explicitly acknowledges this was a known issue but the fix is incomplete

## Fix Approach (High-Level)

Add an immediate `saveManifest(manifest, undefined, runId)` call right after setting the completion status at lines 1525-1526, before the completion phase operations begin. This ensures the UI can detect the status change while sandboxes are being killed and review sandbox is being created.

The existing `saveManifest()` call at line 1709 should remain to update the `reviewUrls` once they're available.

```typescript
// At line 1526, add:
manifest.progress.status = failedFeatures === 0 ? "completed" : "partial";
manifest.progress.completed_at = new Date().toISOString();
// NEW: Save immediately so UI can detect completion
saveManifest(manifest, undefined, runId);  // <-- Add this line
```

## Diagnosis Determination

The root cause has been identified: `saveManifest()` is called too late in the completion phase, after blocking operations that can take 10+ minutes. The fix is straightforward - call `saveManifest()` immediately after setting the completion status.

## Additional Context

- The polling interval for the UI is 15 seconds (default), so even with the fix, there may be up to 15 seconds before the UI detects the status change.
- The fix #1720 comment suggests this was a known issue but the implementation was incomplete - the status was set "early" but not persisted to disk.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read (orchestrator.ts, manifest.ts, useProgressPoller.ts, spec-manifest.json, overall-progress.json), Grep, Glob*
