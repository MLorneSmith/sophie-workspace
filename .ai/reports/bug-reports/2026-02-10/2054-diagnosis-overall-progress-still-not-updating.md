# Bug Diagnosis: Overall Progress Still Shows 0 Tasks During Execution (Regression from #2050 Fix)

**ID**: ISSUE-2054
**Created**: 2026-02-10T17:15:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: regression

## Summary

The "Overall Progress" section still shows 0 of 99 tasks complete during S2045 execution with GPT provider, despite sandbox progress files showing active task completion (sbx-a: 3/3 group tasks, sbx-b: 3/3 group tasks). This is the same symptom as #2049, indicating the #2050 fix was incomplete.

## Environment

- **Application Version**: dev branch (commit 7c43abfaa)
- **Environment**: development
- **Node Version**: 22.x
- **Provider**: GPT (Codex)
- **Spec**: S2045 (user dashboard, 14 features, 99 tasks)
- **Last Working**: Never fully worked (regression from #2050 incomplete fix)

## Reproduction Steps

1. Run `tsx spec-orchestrator.ts 2045 --provider gpt`
2. Wait for sandboxes to start executing features
3. Observe `overall-progress.json` stays at `tasksCompleted: 0`
4. Observe `sbx-a-progress.json` shows 3 completed tasks
5. Observe `sbx-b-progress.json` shows 3 completed tasks

## Expected Behavior

`overall-progress.json` should update `tasksCompleted` in real-time as sandboxes complete tasks (~every 30 seconds).

## Actual Behavior

`overall-progress.json` stays frozen at `tasksCompleted: 0` for the entire duration of feature execution. It only updates when a feature completes or fails (state transition).

## Diagnostic Data

### Evidence from Progress Files

**overall-progress.json** (stale):
```json
{
  "tasksCompleted": 0,
  "tasksTotal": 99,
  "lastCheckpoint": "2026-02-10T16:00:53.555Z"
}
```

**sbx-a-progress.json** (current):
```json
{
  "completed_tasks": ["S2045.I1.F1.T1", "S2045.I1.F1.T2", "S2045.I1.F1.T3"],
  "last_heartbeat": "2026-02-10T16:06:11+00:00"
}
```

**sbx-b-progress.json** (current):
```json
{
  "completed_tasks": ["S2045.I1.F2.T1", "S2045.I1.F2.T2", "S2045.I1.F2.T3"],
  "last_heartbeat": "2026-02-10T16:06:11+00:00"
}
```

**spec-manifest.json** features (stale):
```json
{ "id": "S2045.I1.F1", "status": "in_progress", "tasks_completed": 0 }
{ "id": "S2045.I1.F2", "status": "in_progress", "tasks_completed": 0 }
```

### Timing Analysis

- Manifest last_checkpoint: `2026-02-10T16:00:53.555Z` (startup)
- Sandbox heartbeats: `2026-02-10T16:06:11+00:00` (6+ minutes later)
- **Gap: 6+ minutes with no overall progress update**

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/work-loop.ts` (missing periodic writeOverallProgress call)
  - `.ai/alpha/scripts/lib/manifest.ts` (syncSandboxProgressToManifest + writeOverallProgress)
  - `.ai/alpha/scripts/lib/feature.ts` (only sets tasks_completed on completion)
- **Recent Changes**: #2050 fix (commit a80f752cb) added syncSandboxProgressToManifest
- **Suspected Functions**: WorkLoop.mainLoop() - no periodic progress sync

## Related Issues & Context

### Direct Predecessors
- #2049 (CLOSED): "Bug Diagnosis: Overall Progress shows 0 tasks during active feature execution" - Same exact symptom
- #2050 (CLOSED): "Bug Fix: Overall Progress Shows 0 Tasks During Feature Execution" - Incomplete fix

### Same Component
- #1688 (CLOSED): "Bug Fix: Alpha Orchestrator Progress UI Mismatch" - Original fix that moved to manifest-authoritative counts
- #1510 (CLOSED): "Bug Fix: Orchestrator UI shows wrong progress totals" - Related UI progress issue

### Historical Context
This is the third iteration of the same progress tracking bug. #1688 moved to manifest-authoritative counts (correct), #2050 added sync from sandbox files to manifest (correct), but neither ensured the sync runs **periodically during execution**.

## Root Cause Analysis

### Identified Root Cause

**Summary**: `writeOverallProgress()` is never called periodically during steady-state feature execution - it only fires on state transitions.

**Detailed Explanation**:
The #2050 fix correctly added `syncSandboxProgressToManifest()` at the start of `writeOverallProgress()`, which reads real-time task counts from sandbox progress files. However, `writeOverallProgress()` is only called from `saveManifest()`, which is only triggered by state transitions:

1. Feature status changes (start, complete, fail) via `transitionFeatureStatus()`
2. Sandbox restarts via `updateManifestAfterRestart()`
3. Health check state changes

During normal feature execution (10-30+ minutes), there are **zero state transitions**, so `writeOverallProgress()` is never called, and `overall-progress.json` stays frozen.

**Data flow during execution**:
```
Progress poller → reads sandbox progress → writes sbx-{label}-progress.json ✓
                                         → does NOT call writeOverallProgress() ✗
Work loop → sleeps 30s → wakes up → checks health, stuck tasks, deadlock
                                   → does NOT call writeOverallProgress() ✗
```

**Supporting Evidence**:
- `overall-progress.json` lastCheckpoint frozen at startup time for 6+ minutes
- Sandbox progress files have current data (heartbeat 6 min after startup)
- `saveManifest()` call sites: only on state transitions, never periodic

### How This Causes the Observed Behavior

1. Orchestrator starts → `saveManifest()` called → `writeOverallProgress()` writes `tasksCompleted: 0`
2. Sandboxes start executing → progress files update in real-time
3. Work loop wakes every 30s → checks health/stuck/deadlock → sleeps again
4. **No one calls `writeOverallProgress()` during this entire time**
5. User sees `0/99 tasks` for the entire execution duration

### Confidence Level

**Confidence**: High

**Reasoning**: Direct code path analysis confirms `writeOverallProgress()` is never called between feature assignment and feature completion. The `lastCheckpoint` timestamp in `overall-progress.json` proves it was only written once at startup.

## Fix Approach (High-Level)

Add a `writeOverallProgress(this.manifest)` call in the WorkLoop's `mainLoop()` method, executing on each iteration (~every 30 seconds). This is a one-line fix in the loop body, before the `Promise.race` sleep. The function already handles sandbox-to-manifest sync via #2050's `syncSandboxProgressToManifest()`.

## Fix Implementation

**Already implemented** in this diagnosis session:

1. Added `writeOverallProgress` import to `work-loop.ts`
2. Added `writeOverallProgress(this.manifest)` call in `mainLoop()` before monitoring checks
3. Updated test mocks in `work-loop.test.ts` and `work-loop-promise-timeout.spec.ts`
4. All 53 tests pass, typecheck clean

## Diagnosis Determination

The root cause is confirmed: `writeOverallProgress()` was never called periodically during feature execution. The #2050 fix correctly added the sync mechanism but missed adding the periodic trigger. The fix is a single `writeOverallProgress()` call in the work loop's main cycle.

## Additional Context

- This is the same issue as #2049 because the #2050 fix was architecturally correct but missed the execution trigger
- The fix ensures progress updates every ~30 seconds (HEALTH_CHECK_INTERVAL_MS)
- No risk of double-counting: `syncSandboxProgressToManifest()` only updates if sandbox count > manifest count

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (gh issue view), Edit*
