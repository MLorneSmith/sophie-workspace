# Bug Diagnosis: Alpha Orchestrator Hangs - Manifest Not Updated After Claude Code Crash

**ID**: ISSUE-pending
**Created**: 2026-01-27T16:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator hangs when a Claude Code session inside a sandbox crashes with `Error: No messages returned`. The error occurs but the orchestrator continues waiting on the PTY loop indefinitely. Despite sbx-b and sbx-c completing their features (based on log output), the manifest is never updated to mark features as `completed`, causing sbx-a to wait forever on unblocked dependencies.

## Environment

- **Application Version**: Current dev branch
- **Environment**: development
- **Node Version**: 20.x
- **Spec ID**: S1823 (user dashboard)
- **Run ID**: run-mkwr1nuj-1zl8
- **Last Working**: Unknown - first observed occurrence

## Reproduction Steps

1. Run the orchestrator: `tsx spec-orchestrator.ts S1823`
2. Let it run until a Claude Code session crashes with `Error: No messages returned`
3. Observe that the PTY wait loop continues despite the error
4. The manifest shows features as `in_progress` despite completion in logs
5. Other sandboxes become idle waiting for dependencies that never unlock

## Expected Behavior

When Claude Code crashes with an error, the orchestrator should:
1. Detect the crash from the PTY output or exit code
2. Mark the feature as `failed` in the manifest
3. Free the sandbox for new work
4. Allow the feature to be retried or mark as permanently failed

## Actual Behavior

1. Error appears in PTY output: `Error: No messages returned`
2. PTY wait loop continues: "Feature still running with recent heartbeat, continuing wait (iteration N)"
3. Feature remains `in_progress` in manifest indefinitely
4. Progress file shows `"status": "failed"` but manifest is never updated
5. Dependent features are blocked forever
6. Orchestrator appears hung at 64% progress

## Diagnostic Data

### Console Output (sbx-c.log lines 43-57)
```
This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). The promise rejected with the reason:
Error: No messages returned
    at LhK (file:///usr/lib/node_modules/@anthropic-ai/claude-code/cli.js:6009:73)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
[PTY] Feature still running with recent heartbeat, continuing wait (iteration 30)
[PTY] Feature still running with recent heartbeat, continuing wait (iteration 31)
...
[PTY] Feature still running with recent heartbeat, continuing wait (iteration 39)
Terminated
```

### Manifest State (spec-manifest.json)
```json
{
  "id": "S1823.I4.F1",
  "status": "in_progress",
  "assigned_sandbox": "sbx-c",
  "assigned_at": 1769470352933
}
```

### Progress File State (sbx-c-progress.json)
```json
{
  "status": "failed",
  "phase": "executing",
  "last_heartbeat": "2026-01-27T15:57:54.250564Z"
}
```

### Progress Summary
```
Initiatives: 3/5 completed
Features: 14/17 completed (but 2 stuck as in_progress)
Tasks: 75/117 completed
Sandboxes: sbx-a idle, sbx-b completed, sbx-c failed
```

## Error Stack Traces
```
Error: No messages returned
    at LhK (file:///usr/lib/node_modules/@anthropic-ai/claude-code/cli.js:6009:73)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
```

## Related Code
- **Affected Files**:
  - `.ai/alpha/scripts/lib/work-loop.ts` - Main orchestration loop
  - `.ai/alpha/scripts/lib/feature.ts` - Feature implementation handler
  - `.ai/alpha/scripts/lib/pty-wrapper.ts` - PTY timeout and recovery
  - `.ai/alpha/scripts/lib/promise-age-tracker.ts` - Promise timeout detection
- **Recent Changes**: Issues #1847, #1844, #1841 implemented timeout detection but this edge case still occurs
- **Suspected Functions**:
  - `waitWithTimeout()` in pty-wrapper.ts - doesn't detect Claude crash error
  - `monitorPromiseAges()` in work-loop.ts - timeout not triggered (heartbeat still updating)

## Related Issues & Context

### Direct Predecessors
- #1841 (CLOSED): "Promise timeout monitor for work loop recovery" - Added promise age tracking
- #1786 (CLOSED): "Event-driven heartbeat monitor" - Added heartbeat-based detection
- #1767 (CLOSED): "PTY timeout fallback recovery" - Added progress file fallback

### Related Infrastructure Issues
- #1844: "pnpm install timeout" - Different timeout issue
- #1847: "pnpm timeout in sandbox" - Different timeout issue

### Historical Context
This appears to be a gap in the error handling chain. Previous fixes (#1767, #1786, #1841) focused on:
- PTY timeouts (no output)
- Stale heartbeats (no activity)
- Promise age (too long)

But none handle the case where:
- Claude Code crashes with an error
- PTY is still outputting (error messages)
- Heartbeat was recently updated (before crash)
- The process terminated but exit wasn't captured cleanly

## Root Cause Analysis

### Identified Root Cause

**Summary**: When Claude Code crashes with `Error: No messages returned`, the error output is captured but the PTY process termination is not handled, causing the wait loop to continue indefinitely.

**Detailed Explanation**:
1. The `waitWithTimeout()` function in `pty-wrapper.ts` loops while `stillRunning` is true
2. `stillRunning` is determined by checking if the progress file heartbeat is recent
3. When Claude Code crashes, it outputs the error but may not cleanly exit
4. The sandbox shell (`bash`) may still be running, keeping the PTY alive
5. The progress file shows `"status": "failed"` but this status is not checked
6. The wait loop only checks heartbeat freshness, not the `status` field
7. The manifest is only updated when the PTY `wait()` promise resolves, which never happens

**Supporting Evidence**:
1. sbx-c.log shows error output at iteration 29, but loop continues to iteration 39
2. Progress file shows `"status": "failed"` but manifest shows `"status": "in_progress"`
3. Final log entry is "Terminated" followed by shell exit, but no "PTY completed" message
4. Promise timeout didn't trigger because heartbeat was recently updated before crash

### How This Causes the Observed Behavior

```
Claude Code starts
    ↓
Error occurs: "No messages returned"
    ↓
Error output to PTY (captured in logs)
    ↓
Claude Code process crashes
    ↓
Progress file updated with status="failed"
    ↓
BUT: Bash shell still running in PTY
    ↓
waitWithTimeout() checks heartbeat → recent
    ↓
stillRunning = true (heartbeat check passes)
    ↓
Loop continues indefinitely
    ↓
Eventually "Terminated" → shell exits
    ↓
BUT: manifest never updated
    ↓
Orchestrator hung waiting for locked features
```

### Confidence Level

**Confidence**: High

**Reasoning**:
1. Log evidence clearly shows error appearing but loop continuing
2. Progress file status vs manifest status mismatch is concrete
3. The heartbeat-only check in `isProgressFileStale()` explains why the loop doesn't exit
4. The code flow in `waitWithTimeout()` confirms it doesn't check `status` field

## Fix Approach (High-Level)

The fix requires two changes:

1. **Check progress file `status` field during wait loop**: In `pty-wrapper.ts` `waitWithTimeout()`, when checking if feature is still running, also check if `progressData.status === "failed"`. If status is `failed`, exit the loop and propagate the failure.

2. **Detect Claude Code crash from PTY output**: In `feature.ts` `onData` callback, watch for the `Error: No messages returned` pattern or similar crash indicators. When detected, set a flag that causes the wait loop to exit early and mark the feature as failed.

Example fix location in `pty-wrapper.ts`:
```typescript
// Current: only checks heartbeat freshness
if (progressResult.success && progressResult.data && !isProgressFileStale(progressResult.data)) {
  return { stillRunning: true, ... };
}

// Fix: also check if status indicates failure
if (progressResult.success && progressResult.data) {
  const data = progressResult.data;
  if (!isProgressFileStale(data)) {
    // NEW: Check if progress file indicates failure
    if (data.status === 'failed') {
      return { stillRunning: false, exitCode: 1, error: 'Progress file indicates failure' };
    }
    return { stillRunning: true, ... };
  }
}
```

## Diagnosis Determination

The orchestrator hangs because the PTY wait loop in `pty-wrapper.ts` only checks heartbeat freshness to determine if a feature is still running, but does not check the `status` field of the progress file. When Claude Code crashes with `Error: No messages returned`, the progress file is updated with `status: "failed"`, but the wait loop continues because the heartbeat was recently updated. The manifest is never updated because the PTY wait never resolves normally.

This is a gap in the error handling chain between the heartbeat-based stall detection (which works for silent hangs) and the error output detection (which is not implemented). The fix requires checking the progress file `status` field in addition to heartbeat freshness.

## Additional Context

- The issue only manifests when Claude Code crashes (not when it hangs silently)
- Previous fixes (#1767, #1786, #1841) focused on silent failures, not crash failures
- The promise timeout mechanism (#1841) didn't trigger because heartbeats were still fresh
- This issue blocked 64% completion of spec S1823

---
*Generated by Claude Debug Assistant*
*Tools Used: Read (logs, progress files, manifest, source code), Glob (file discovery)*
