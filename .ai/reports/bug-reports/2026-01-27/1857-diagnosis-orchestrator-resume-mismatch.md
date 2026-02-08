# Bug Diagnosis: Alpha Orchestrator Resume Fails - Stale Sandbox IDs and Missing Progress

**ID**: ISSUE-pending
**Created**: 2026-01-27T18:16:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

After stopping and resuming the Alpha orchestrator (spec S1823), only one sandbox appears to be doing anything but has not completed any work. The orchestrator is running (PID 458217) but sandboxes are idle or stuck. Investigation reveals a mismatch between manifest sandbox IDs and actual running E2B sandboxes, combined with stale heartbeat data.

## Environment

- **Application Version**: current dev branch
- **Environment**: development
- **Node Version**: v22.16.0
- **Database**: PostgreSQL (Supabase sandbox)
- **Last Working**: Prior to orchestrator stop/restart

## Reproduction Steps

1. Start Alpha orchestrator: `tsx spec-orchestrator.ts 1823`
2. Let it run until several features complete (13/17 features completed)
3. Stop the orchestrator (Ctrl+C or process kill)
4. Restart with same command: `tsx spec-orchestrator.ts 1823 --force-unlock --document`
5. Observe that sandboxes appear idle and no progress is made

## Expected Behavior

After resuming, the orchestrator should:
1. Reconnect to existing sandboxes OR create new sandboxes
2. Continue implementing remaining features (S1823.I4.F2, S1823.I4.F3, S1823.I5.F3, S1823.I5.F4)
3. Assign work to idle sandboxes
4. Make visible progress

## Actual Behavior

- Orchestrator process is running (PID 458217) but appears stuck
- Only 2 sandboxes are running (sbx-b: `imyb34rg6e1fzdc56nniy`, sbx-c: `iakyetn97ssbzmsj12z8h`)
- Manifest claims 3 sandbox IDs but they don't match the running sandboxes:
  - Manifest: `i0kp540vujamdrvzhnqwy`, `imyb34rg6e1fzdc56nniy`, `iakyetn97ssbzmsj12z8h`
  - Running: `imyb34rg6e1fzdc56nniy`, `iakyetn97ssbzmsj12z8h`
- sbx-c progress file shows heartbeat from 4+ minutes ago (`2026-01-27T18:12:02.524742Z`)
- Feature S1823.I4.F2 is marked `failed` with error "Sandbox is probably not running anymore"
- Feature S1823.I4.F3 is marked `failed` (dependency on failed S1823.I4.F2)
- Features S1823.I5.F3 and S1823.I5.F4 are `pending` but blocked by S1823.I4 initiative dependency
- sbx-b is in "idle" state waiting for dependencies

## Diagnostic Data

### Console Output
```
Process 458217 is running but UI shows no activity
sbx-c.log shows: "Feature still running with recent heartbeat, continuing wait (iteration 10)"
```

### Sandbox State Analysis
```
Manifest sandbox IDs (from spec-manifest.json):
  - i0kp540vujamdrvzhnqwy (sbx-a) - NOT FOUND in running sandboxes
  - imyb34rg6e1fzdc56nniy (sbx-b) - Running, state: "idle", waiting for dependencies
  - iakyetn97ssbzmsj12z8h (sbx-c) - Running

Actual running sandboxes (from e2b sandbox list):
  - imyb34rg6e1fzdc56nniy - Running since 1:04:28 PM, expires 2:04:28 PM
  - iakyetn97ssbzmsj12z8h - Running since 1:05:56 PM, expires 2:05:56 PM

MISMATCH: Sandbox i0kp540vujamdrvzhnqwy (sbx-a) is in manifest but NOT running
```

### Progress File Analysis
```json
// sbx-b-progress.json - IDLE, waiting for dependencies
{
  "sandbox_id": "imyb34rg6e1fzdc56nniy",
  "status": "idle",
  "phase": "waiting",
  "last_heartbeat": "2026-01-27T18:15:23.051Z",
  "waiting_reason": "Waiting for dependencies (2 features blocked)",
  "blocked_by": ["S1823.I5.F3", "S1823.I5.F4"]
}

// sbx-c-progress.json - STALE heartbeat (4+ minutes old)
{
  "sandbox_id": "i0kp540vujamdrvzhnqwy",  // NOTE: Different sandbox ID!
  "current_task": {
    "id": "S1823.I4.F2.T6",
    "status": "starting",
    "started_at": "2026-01-27T18:09:59+00:00"
  },
  "completed_tasks": ["T1", "T2", "T3", "T4", "T5", "T6"],  // 6 tasks completed
  "last_heartbeat": "2026-01-27T18:12:02.524742Z"  // 4+ minutes ago - STALE
}
```

### Manifest Feature State
```
S1823.I4.F2: status="failed", error="Sandbox is probably not running anymore"
S1823.I4.F3: status="failed" (blocked by failed S1823.I4.F2)
S1823.I5.F3: status="pending", blocked by [S1823.I4]
S1823.I5.F4: status="pending", blocked by [S1823.I5.F3]
```

## Error Stack Traces
No stack traces - the issue is a logic/state management problem, not an exception.

## Related Code
- **Affected Files**:
  - `.ai/alpha/scripts/lib/orchestrator.ts` - Sandbox reconnection logic (lines 586-629)
  - `.ai/alpha/scripts/lib/work-loop.ts` - Work assignment and deadlock detection
  - `.ai/alpha/scripts/lib/sandbox.ts` - `reconnectToStoredSandboxes()` function
  - `.ai/alpha/scripts/lib/deadlock-handler.ts` - Deadlock recovery logic
- **Recent Changes**: Bug fix #1786 (promise timeout detection), #1841 (work loop recovery)
- **Suspected Functions**:
  - `reconnectToStoredSandboxes()` - May not properly verify sandbox IDs match
  - `handleIdleState()` - May not detect or recover from missing sandbox scenario
  - `detectAndHandleDeadlock()` - May not handle the case where a feature is marked failed but could be retried

## Related Issues & Context

### Direct Predecessors
- Bug fix #1634: "Handle expired E2B sandboxes on restart" - Same reconnection issue
- Bug fix #1713: "Write idle progress immediately after restart"

### Related Infrastructure Issues
- Bug fix #1699: "E2B PTY Timeout Configuration"
- Bug fix #1767: "PTY timeout but recovered via progress file"
- Bug fix #1786: "Promise timeout detection"

### Same Component
- Bug fix #1816: "Refactor work loop into separate module"
- Bug fix #1841: "Promise timeout detection for work loop recovery"

### Historical Context
This appears to be a gap in the reconnection logic where:
1. A sandbox can die or expire
2. The manifest still references it
3. Resuming doesn't properly reconcile the mismatch
4. Features get marked failed instead of being reassigned

## Root Cause Analysis

### Identified Root Cause

**Summary**: The orchestrator's resume logic has multiple compounding failures: (1) sandbox ID mismatch between manifest and actual running sandboxes, (2) features marked as `failed` instead of `pending` when their sandbox dies, and (3) deadlock detection not recovering features blocked by failed features.

**Detailed Explanation**:

1. **Sandbox ID Mismatch**: The manifest contains `sandbox_ids: ["i0kp540vujamdrvzhnqwy", "imyb34rg6e1fzdc56nniy", "iakyetn97ssbzmsj12z8h"]` but `i0kp540vujamdrvzhnqwy` (sbx-a) is not running. The reconnection logic in `orchestrator.ts:586-629` checks `isSandboxExpired()` based on `created_at` timestamp but doesn't verify the sandbox IDs actually exist in E2B.

2. **Feature Marked Failed Instead of Pending**: When sandbox sbx-a died, feature S1823.I4.F2 was marked `failed` with error "Sandbox is probably not running anymore". However, this feature should have been reset to `pending` for reassignment to another sandbox. The error message suggests the health check or keepalive detected the dead sandbox but didn't properly reset the feature.

3. **Cascade Failure**: S1823.I4.F3 depends on S1823.I4.F2 and is also marked `failed`. But it never ran - it's blocked because its dependency failed.

4. **Deadlock Not Recovered**: The `detectAndHandleDeadlock()` function in `deadlock-handler.ts` should detect that:
   - sbx-b is idle waiting for S1823.I5.F3 and S1823.I5.F4
   - S1823.I5.F3 and F4 are blocked by S1823.I4 initiative completion
   - S1823.I4 can't complete because F2 and F3 are `failed`
   - The failed features should be retried

5. **`shouldRetryFailedFeature()` Not Called**: Looking at `work-queue.ts`, failed features can be retried up to `DEFAULT_MAX_RETRIES` times. But the deadlock handler only calls this for features it detects are retryable - it appears to skip features where dependencies are also failed.

**Supporting Evidence**:
- sbx-c progress shows `sandbox_id: i0kp540vujamdrvzhnqwy` but sbx-c log shows it's running in sandbox `iakyetn97ssbzmsj12z8h`
- The log shows "Feature still running with recent heartbeat, continuing wait (iteration 10)" indicating the PTY wait loop thinks the feature is healthy based on stale heartbeat data
- sbx-b is stuck waiting for S1823.I5.F3/F4 which are blocked by the failed S1823.I4 features

### How This Causes the Observed Behavior

1. User stops orchestrator → sbx-a sandbox times out and dies
2. User restarts orchestrator with `--force-unlock`
3. Orchestrator loads manifest with stale sandbox_ids including dead `i0kp540vujamdrvzhnqwy`
4. `reconnectToStoredSandboxes()` attempts to reconnect, some succeed (sbx-b, sbx-c), one fails (sbx-a)
5. Features on the dead sandbox (S1823.I4.F2) are marked `failed` instead of `pending`
6. Dependent feature S1823.I4.F3 is also marked `failed` (cascade)
7. Initiative S1823.I4 can never complete → S1823.I5.F3 and F4 stay blocked
8. sbx-b goes idle because no unblocked work exists
9. sbx-c may have reconnected mid-feature and is stuck in PTY wait loop
10. No progress is made - deadlock

### Confidence Level

**Confidence**: High

**Reasoning**: The evidence chain is clear:
1. E2B sandbox list confirms only 2 sandboxes running
2. Manifest confirms 3 sandbox IDs with one not matching
3. Feature states show failed features blocking others
4. Progress files show stale heartbeats and wrong sandbox IDs
5. The code path in orchestrator.ts shows reconnection doesn't verify sandbox existence

## Fix Approach (High-Level)

1. **Fix `reconnectToStoredSandboxes()`**: Add verification that each sandbox ID actually exists in E2B before considering reconnection successful. Use `e2b sandbox list` or SDK equivalent to validate.

2. **Fix feature failure handling**: When a sandbox dies and can't be reconnected, reset all `in_progress` features on that sandbox to `pending` (not `failed`) so they can be reassigned. Only mark as `failed` if max retries exceeded.

3. **Fix deadlock handler**: Add recovery for the scenario where failed features are blocking other work. If a `failed` feature has retries remaining, reset it to `pending`.

4. **Fix cascade failures**: When a feature fails, don't mark dependent features as `failed` - leave them `pending` and let the dependency check naturally block them.

5. **Clean up stale progress files**: On resume, clear progress files that reference non-existent sandbox IDs.

## Diagnosis Determination

The root cause is a multi-part failure in the resume/reconnection logic:
1. Sandbox ID validation missing during reconnection
2. Features marked `failed` instead of `pending` when sandbox dies
3. Deadlock handler not recovering retryable failed features
4. Progress files not cleared when sandbox IDs don't match

The orchestrator successfully reconnected to 2 of 3 sandboxes but didn't properly handle the missing sandbox, leading to a state where no forward progress is possible.

## Additional Context

- The spec is S1823 (user dashboard), not S1815 as originally mentioned
- 13/17 features were completed before the issue occurred
- The remaining work is S1823.I4.F2, S1823.I4.F3, S1823.I5.F3, S1823.I5.F4
- Manual intervention could recover by: killing running sandboxes, resetting failed features to pending in manifest, and restarting

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob, Bash (ps, npx e2b sandbox list), manual analysis*
