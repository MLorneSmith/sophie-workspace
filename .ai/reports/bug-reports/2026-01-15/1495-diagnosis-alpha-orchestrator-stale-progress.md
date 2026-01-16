# Bug Diagnosis: Alpha Orchestrator UI Shows Stale Progress After Session Recovery

**ID**: ISSUE-pending
**Created**: 2026-01-15T20:15:00Z
**Reporter**: User
**Severity**: high
**Status**: new
**Type**: bug

## Summary

When a Claude Code session is terminated mid-feature (due to token limit, crash, or manual termination) and the orchestrator restarts the feature, the UI progress file is never updated, causing the dashboard to display stale data (old heartbeat, wrong task status) even though the feature may complete successfully.

## Environment

- **Application Version**: Alpha Orchestrator (spec-orchestrator.ts)
- **Environment**: development
- **Node Version**: 22.16.0
- **Run ID**: run-mkfti9z9-zwju
- **Platform**: Linux (WSL2)

## Reproduction Steps

1. Start the Alpha Orchestrator with a spec (`tsx spec-orchestrator.ts 1362`)
2. Wait for a feature to begin implementation in a sandbox (e.g., sandbox-a)
3. Terminate the Claude Code session mid-feature (e.g., by reaching Claude Code token limit, or manually killing the process)
4. Observe that the orchestrator restarts the feature
5. Observe the UI dashboard - the sandbox shows a red status indicator with stale heartbeat ("19m ago")
6. Even if the feature completes successfully, the UI remains stale

## Expected Behavior

After a session recovery:
1. The UI should show the new session's progress
2. Heartbeat should update to reflect the new session's activity
3. Task completion status should be accurate

## Actual Behavior

1. UI shows stale heartbeat from the terminated session
2. Task status shows state from before termination
3. The red status indicator appears due to "stale heartbeat" detection
4. Feature may complete successfully in the manifest but UI never updates

## Diagnostic Data

### Evidence from Logs

```
================================================================================
Started: 2026-01-15T19:47:56.684Z  (FIRST ATTEMPT)
================================================================================
[PTY] Sending command: run-claude "/alpha:implement 1375"
Running Claude Code with prompt: /alpha:implement 1375
Terminated                                            <-- Session killed

================================================================================
Started: 2026-01-15T19:56:19.190Z  (SECOND ATTEMPT)
================================================================================
[PTY] Sending command: run-claude "/alpha:implement 1375"
Running Claude Code with prompt: /alpha:implement 1375
(no further output captured)                          <-- Progress not captured to UI
```

### Manifest State (Correct)

```json
{
  "id": 1375,
  "status": "completed",
  "tasks_completed": 12,
  "task_count": 12
}
```

### UI Progress File (Stale)

```json
{
  "status": "in_progress",
  "phase": "executing",
  "last_heartbeat": "2026-01-15T19:51:05.326836Z",  // 20+ minutes old
  "completed_tasks": 1,                              // Only T1
  "current_task": {
    "id": "T2",
    "status": "starting"
  }
}
```

### Timeline Analysis

| Time | Event |
|------|-------|
| 19:47:56 | First attempt started |
| 19:51:05 | Last heartbeat written (T1 complete, T2 starting) |
| ~19:51:xx | Session terminated (token limit) |
| 19:56:19 | Second attempt started |
| ~20:09:xx | Feature completed successfully |
| NOW | UI still shows 19:51:05 heartbeat as stale |

## Root Cause Analysis

### Identified Root Cause

**Summary**: The progress polling code skips stale heartbeat data but fails to update the UI progress file, leaving it in a permanently stale state.

**Detailed Explanation**:

The bug is in `.ai/alpha/scripts/lib/progress.ts` lines 332-338:

```typescript
// Skip stale progress data from previous sessions
if (progress.last_heartbeat) {
  const heartbeatTime = new Date(progress.last_heartbeat).getTime();
  const sessionStart = sessionStartTime.getTime() - 5 * 60 * 1000;
  if (heartbeatTime < sessionStart) {
    continue;  // <-- BUG: Skips writeUIProgress entirely
  }
}
```

**Causal chain**:

1. First session writes progress to sandbox (T1 complete, T2 starting)
2. Session terminated (token limit reached)
3. Second session starts with new `sessionStartTime`
4. Progress polling reads old `.initiative-progress.json` from sandbox
5. Old heartbeat (19:51:05) is older than `sessionStart - 5min`
6. `continue` statement skips the `writeUIProgress()` call
7. UI progress file (`sbx-a-progress.json`) is never updated
8. Feature completes successfully → manifest updated
9. UI displays stale data indefinitely

**Secondary issue**: Even when features complete normally, there's no final `writeUIProgress()` call in `feature.ts` to write a "completed" status to the sandbox progress file.

### Supporting Evidence

1. **Manifest shows completed**: Feature 1375 has `status: "completed"` with 12/12 tasks
2. **UI file shows stale**: Heartbeat from 19:51:05, only 1 task complete
3. **Log shows termination**: First attempt shows "Terminated", second attempt has no progress output
4. **Progress.ts code**: The `continue` statement bypasses `writeUIProgress()`

### Confidence Level

**Confidence**: High

**Reasoning**:
- The code path clearly shows the skip logic
- Timeline matches the stale heartbeat timestamp
- Manifest vs UI discrepancy is exactly what this bug would produce

## Fix Approach (High-Level)

Two changes needed:

1. **In progress.ts**: When skipping stale progress data, either:
   - Write a "recovering" or "restarting" status to the UI progress file
   - OR clear the UI progress file to indicate fresh session starting

   ```typescript
   if (heartbeatTime < sessionStart) {
     // Don't just skip - write a "recovering" status
     if (uiEnabled && instance) {
       writeUIProgress(sandboxLabel, null, instance, feature ?? null);
     }
     continue;
   }
   ```

2. **In feature.ts**: After feature completion, write final status to UI progress file:

   ```typescript
   // After saveManifest(manifest) on completion:
   if (uiEnabled) {
     writeUIProgress(instance.label, {
       status: 'completed',
       completed_tasks: [...],
       // ...final state
     }, instance, feature);
   }
   ```

## Related Issues & Context

### Similar Symptoms
- Health check marks sandbox as failed due to stale heartbeat
- The red status indicator in the UI is misleading when work is actually progressing

### Same Component
- Progress polling system
- UI progress file management
- Session recovery handling

## Additional Context

The orchestrator IS still running correctly - it updated the manifest and the feature completed successfully. The bug is isolated to the UI progress display layer, which shows incorrect state to the user.

This bug causes confusion because:
1. User sees red status indicator suggesting failure
2. Heartbeat shows "19m ago" suggesting a stall
3. But the actual work completed successfully in the background

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Bash, Grep, file analysis, log analysis*
